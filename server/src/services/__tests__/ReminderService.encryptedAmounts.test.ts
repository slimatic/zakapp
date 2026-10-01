/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * The incomplete-payment reminder must never be built from a number it could not read.
 *
 * `PaymentRecordModel.findBySnapshot` returns raw Prisma rows, so `amount` and the
 * snapshot's `zakatAmount` are still CIPHERTEXT — both columns are `String // Encrypted`
 * in `schema.prisma`. The previous code did:
 *
 *   const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
 *   const zakatAmount = primarySnapshot.zakatAmount;
 *   if (totalPaid < zakatAmount) { ...percentage... }
 *
 * `sum + ciphertext` is string concatenation and `ciphertext < ciphertext` is a
 * lexicographic comparison, so "X% of your Zakat obligation remains unpaid" was
 * computed from two meaningless orderings.
 *
 * These tests use a REAL encrypt/decrypt round-trip rather than a stubbed helper, so
 * they fail if the read path regresses to trusting the raw column.
 */
import { vi, type Mock, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptionService } from '../../services/EncryptionService';

vi.mock('../../models/ReminderEvent');
vi.mock('../../models/YearlySnapshot');

import { ReminderService } from '../../services/ReminderService';
import { ReminderEventModel } from '../../models/ReminderEvent';
import { YearlySnapshotModel } from '../../models/YearlySnapshot';
import { PaymentRecordModel } from '../../models/PaymentRecord';

const KEY = 'test-encryption-key-for-reminder-service';

const encrypt = (value: string) => EncryptionService.encrypt(value, KEY);

/** A finalized snapshot as `findPrimaryByYear` returns it: raw, still encrypted. */
const finalizedSnapshot = (zakatAmount: string) => ({
    id: 'snapshot-1',
    userId: 'user-1',
    status: 'finalized',
    zakatAmount,
    // Far in the future so the anniversary branch stays inert and these tests
    // isolate the incomplete-payment path only.
    calculationDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
});

describe('ReminderService incomplete-payment reminder (#regression)', () => {
    let service: ReminderService;
    let findBySnapshotSpy: any;

    beforeEach(() => {
        process.env.ENCRYPTION_KEY = KEY;
        service = new ReminderService();
        vi.clearAllMocks();
        (ReminderEventModel.findByUser as Mock).mockResolvedValue({ data: [] });
        (YearlySnapshotModel.findByUser as Mock).mockResolvedValue({ data: [] });
        (ReminderEventModel.create as Mock).mockResolvedValue({ id: 'r-1' });
    });

    afterEach(() => {
        delete process.env.ENCRYPTION_KEY;
        findBySnapshotSpy?.mockRestore?.();
    });

    it('reads the encrypted amounts and does not raise a reminder when the obligation is met', async () => {
        (YearlySnapshotModel.findPrimaryByYear as Mock).mockResolvedValue(
            finalizedSnapshot(await encrypt('1000'))
        );
        findBySnapshotSpy = vi
            .spyOn(PaymentRecordModel, 'findBySnapshot')
            .mockResolvedValue([{ amount: await encrypt('1000') }] as any);

        await service.triggerAutomaticReminders('user-1');

        // 1000 paid of 1000 owed -> nothing outstanding, so no payment reminder.
        const types = (ReminderEventModel.create as Mock).mock.calls.map(c => c[1].eventType);
        expect(types).not.toContain('payment_incomplete');
    });

    it('raises a reminder when the encrypted amounts show a genuine shortfall', async () => {
        (YearlySnapshotModel.findPrimaryByYear as Mock).mockResolvedValue(
            finalizedSnapshot(await encrypt('1000'))
        );
        findBySnapshotSpy = vi
            .spyOn(PaymentRecordModel, 'findBySnapshot')
            .mockResolvedValue([{ amount: await encrypt('100') }] as any);

        await service.triggerAutomaticReminders('user-1');

        // 100 of 1000 -> 90% remaining, above the 10% threshold.
        // Assert the FIGURE, not just that a reminder appeared: ciphertext ordering
        // happens to take this branch too, so only the number proves the amounts were
        // actually decrypted rather than compared as strings.
        expect(ReminderEventModel.create).toHaveBeenCalled();
        const message = (ReminderEventModel.create as Mock).mock.calls[0][1].message as string;
        expect(message).toContain('90.0%');
    });

    it('stays silent when a payment amount cannot be read, rather than reporting a full obligation', async () => {
        (YearlySnapshotModel.findPrimaryByYear as Mock).mockResolvedValue(
            finalizedSnapshot(await encrypt('1000'))
        );
        // Undecryptable under this key.
        findBySnapshotSpy = vi
            .spyOn(PaymentRecordModel, 'findBySnapshot')
            .mockResolvedValue([{ amount: 'not-a-real-ciphertext' }] as any);

        await service.triggerAutomaticReminders('user-1');

        // An unreadable amount must not become 0. Substituting 0 would read as
        // "nothing was paid" and tell the user they owe the whole obligation.
        expect(ReminderEventModel.create).not.toHaveBeenCalled();
    });

    it('stays silent when the zakat amount itself cannot be read', async () => {
        (YearlySnapshotModel.findPrimaryByYear as Mock).mockResolvedValue(
            finalizedSnapshot('not-a-real-ciphertext')
        );
        findBySnapshotSpy = vi
            .spyOn(PaymentRecordModel, 'findBySnapshot')
            .mockResolvedValue([{ amount: await encrypt('100') }] as any);

        await service.triggerAutomaticReminders('user-1');

        expect(ReminderEventModel.create).not.toHaveBeenCalled();
    });
});
