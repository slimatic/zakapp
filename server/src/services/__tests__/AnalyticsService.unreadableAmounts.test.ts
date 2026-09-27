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
 * The payment-distribution metric must not be built from amounts it could not read.
 *
 * The previous decrypt was a hand-rolled branch:
 *
 *   const decryptedAmount = amountStr.includes(':')
 *     ? await EncryptionService.decrypt(amountStr, this.encryptionKey)
 *     : amountStr;
 *   return { ...p, amount: parseFloat(decryptedAmount) || 0 };
 *   // catch: return { ...p, amount: 0 };
 *
 * `EncryptionService.decrypt` FAILS OPEN: on a wrong key it returns its input rather
 * than throwing. So `parseFloat` ran on ciphertext — and `parseFloat("8d3RTKu...")`
 * returns 8, a plausible amount that is completely wrong. `|| 0` swallowed the NaN
 * cases, and the catch fabricated more zeros. Every path yielded a number, so the
 * result was cached and served as if it were real.
 *
 * These tests use a REAL encrypt/decrypt round-trip, because a stubbed helper would
 * not exercise the fail-open behaviour that caused the bug.
 */
import { vi, type Mock, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptionService } from '../../services/EncryptionService';

vi.mock('../../models/AnalyticsMetric');
vi.mock('../../models/YearlySnapshot');
vi.mock('../../models/PaymentRecord');

import { AnalyticsService } from '../../services/AnalyticsService';
import { AnalyticsMetricModel } from '../../models/AnalyticsMetric';
import { PaymentRecordModel } from '../../models/PaymentRecord';

const KEY = 'test-encryption-key-for-analytics-service';
const USER = 'user-1';
const START = new Date('2024-01-01');
const END = new Date('2024-12-31');

const payment = (id: string, encryptedAmount: string, category = 'poor') => ({
    id,
    userId: USER,
    amount: encryptedAmount,
    recipientCategory: category,
    paymentDate: new Date('2024-06-01'),
});

describe('AnalyticsService.getPaymentDistribution — unreadable amounts', () => {
    let service: AnalyticsService;

    beforeEach(() => {
        process.env.ENCRYPTION_KEY = KEY;
        service = new AnalyticsService();
        vi.clearAllMocks();
        (AnalyticsMetricModel.findCached as Mock).mockResolvedValue(null);
        (AnalyticsMetricModel.createOrUpdate as Mock).mockResolvedValue({});
    });

    afterEach(() => {
        delete process.env.ENCRYPTION_KEY;
    });

    it('sums real encrypted amounts correctly', async () => {
        const [a, b] = [await EncryptionService.encrypt('100', KEY), await EncryptionService.encrypt('250', KEY)];
        (PaymentRecordModel.findByUser as Mock).mockResolvedValue({
            data: [payment('p1', a), payment('p2', b)],
            total: 2,
        });

        await service.getPaymentDistribution(USER, START, END);

        // Assert what was COMPUTED (the write payload), independent of how the mocked
        // model echoes it back. 100 + 250 = 350, not a ciphertext-parsed artefact.
        const payload = (AnalyticsMetricModel.createOrUpdate as Mock).mock.calls[0][2].calculatedValue;
        expect(payload.totalAmount).toBe(350);
        expect(payload.distribution).toHaveLength(1);
        expect(payload.distribution[0].percentage).toBe(100);
    });

    it('REFUSES to compute rather than treat an unreadable amount as zero', async () => {
        (PaymentRecordModel.findByUser as Mock).mockResolvedValue({
            data: [
                payment('p1', await EncryptionService.encrypt('100', KEY)),
                payment('p2', 'not-a-real-ciphertext'),
            ],
            total: 2,
        });

        // The old code returned a distribution totalling 100 and cached it — reporting
        // a partial sum as if complete, and telling the user they had paid far less
        // than they had.
        await expect(service.getPaymentDistribution(USER, START, END)).rejects.toThrow(
            /could not be read/
        );
    });

    it('caches nothing when it refuses, so the bad figure is not served afterwards', async () => {
        (PaymentRecordModel.findByUser as Mock).mockResolvedValue({
            data: [payment('p1', 'not-a-real-ciphertext')],
            total: 1,
        });

        await expect(service.getPaymentDistribution(USER, START, END)).rejects.toThrow();

        // A cached wrong number would outlive the data being fixed.
        expect(AnalyticsMetricModel.createOrUpdate).not.toHaveBeenCalled();
    });

    it('still returns an empty distribution for a user with no payments', async () => {
        (PaymentRecordModel.findByUser as Mock).mockResolvedValue({ data: [], total: 0 });

        await service.getPaymentDistribution(USER, START, END);

        const payload = (AnalyticsMetricModel.createOrUpdate as Mock).mock.calls[0][2].calculatedValue;
        expect(payload.totalAmount).toBe(0);
        expect(payload.distribution).toEqual([]);
    });
});
