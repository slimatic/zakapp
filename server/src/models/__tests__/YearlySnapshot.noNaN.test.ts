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
 * The literal string "NaN" must never reach the encrypted `zakatableWealth` column.
 *
 * `totalWealth`, `totalLiabilities` and `zakatableWealth` are all `String // Encrypted`
 * in `schema.prisma`, and `YearlySnapshotService` encrypts the DTO *before* handing it
 * to the model — so by the time the model does arithmetic, both operands are
 * CIPHERTEXT. `ciphertext - ciphertext` is NaN and `String(NaN)` is `"NaN"`, which is
 * what got written. `zakatableWealth` is optional on the DTO, so that branch runs
 * whenever a caller omits it.
 *
 * These tests use a REAL encrypt/decrypt round-trip. A stubbed helper would have
 * made the broken version pass: with `encrypt` mocked to the identity function the
 * operands are plain numbers and the subtraction works. Only real ciphertext shows
 * the bug. `prisma` is mocked — the assertion is about what this model persists.
 */
import { vi, type Mock, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../utils/prisma', () => ({
  prisma: {
    yearlySnapshot: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../../utils/prisma';
import { YearlySnapshotModel } from '../YearlySnapshot';
import { EncryptionService } from '../../services/EncryptionService';

const KEY = 'test-encryption-key-for-yearly-snapshot';

const encrypt = (value: number) => EncryptionService.encrypt(String(value), KEY);
const decrypt = async (ciphertext: string) =>
  Number(await EncryptionService.decrypt(ciphertext, KEY));

/** A stored row as Prisma returns it: every money column still ciphertext. */
const storedRow = async (overrides: Record<string, unknown> = {}) => ({
  id: 'snap-1',
  userId: 'user-1',
  status: 'draft',
  totalWealth: await encrypt(1000),
  totalLiabilities: await encrypt(250),
  zakatableWealth: await encrypt(750),
  zakatAmount: await encrypt(25),
  nisabThreshold: await encrypt(500),
  ...overrides,
});

describe('YearlySnapshotModel never persists "NaN" (#regression)', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = KEY;
    vi.clearAllMocks();
    (prisma.yearlySnapshot.findFirst as Mock).mockResolvedValue(null);
    (prisma.yearlySnapshot.create as Mock).mockImplementation(async ({ data }) => data);
    (prisma.yearlySnapshot.update as Mock).mockImplementation(async ({ data }) => data);
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('create', () => {
    it('derives zakatableWealth from ciphertext instead of persisting "NaN"', async () => {
      // zakatableWealth deliberately omitted — the DTO field is optional.
      await YearlySnapshotModel.create('user-1', {
        calculationDate: new Date('2024-06-15'),
        gregorianYear: 2024,
        hijriYear: 1446,
        totalWealth: await encrypt(1000),
        totalLiabilities: await encrypt(250),
        zakatAmount: await encrypt(25),
        nisabThreshold: 500,
        nisabType: 'silver',
        methodologyUsed: 'Standard',
      } as any);

      const written = (prisma.yearlySnapshot.create as Mock).mock.calls[0][0].data;

      expect(written.zakatableWealth).not.toBe('NaN');
      // The round-trip is the assertion that matters: it proves the value stored is
      // real ciphertext of the right number, not a plausible-looking string.
      expect(await decrypt(written.zakatableWealth)).toBe(750);
    });

    it('stores a supplied zakatableWealth without double-encrypting it', async () => {
      const supplied = await encrypt(750);

      await YearlySnapshotModel.create('user-1', {
        calculationDate: new Date('2024-06-15'),
        gregorianYear: 2024,
        hijriYear: 1446,
        totalWealth: await encrypt(1000),
        totalLiabilities: await encrypt(250),
        zakatableWealth: supplied,
        zakatAmount: await encrypt(25),
        nisabThreshold: 500,
        nisabType: 'silver',
        methodologyUsed: 'Standard',
      } as any);

      const written = (prisma.yearlySnapshot.create as Mock).mock.calls[0][0].data;

      // Already ciphertext from the service layer — re-encrypting would make this
      // undecryptable and silently unreadable by every reader of the column.
      expect(written.zakatableWealth).toBe(supplied);
      expect(await decrypt(written.zakatableWealth)).toBe(750);
    });
  });

  describe('update', () => {
    it('recalculates zakatableWealth from encrypted values, not ciphertext arithmetic', async () => {
      (prisma.yearlySnapshot.findFirst as Mock).mockResolvedValue(await storedRow());

      await YearlySnapshotModel.update('snap-1', 'user-1', {
        totalWealth: await encrypt(2000),
      } as any);

      const written = (prisma.yearlySnapshot.update as Mock).mock.calls[0][0].data;

      expect(written.zakatableWealth).not.toBe('NaN');
      // totalLiabilities is not in the update, so it comes off the stored row —
      // which is ciphertext too, and the other half of the original NaN.
      expect(await decrypt(written.zakatableWealth)).toBe(1750);
    });

    it('refuses the write when a stored amount cannot be read, rather than writing "NaN"', async () => {
      (prisma.yearlySnapshot.findFirst as Mock).mockResolvedValue(
        await storedRow({ totalLiabilities: 'not-a-real-ciphertext' })
      );

      await expect(
        YearlySnapshotModel.update('snap-1', 'user-1', { totalWealth: await encrypt(2000) } as any)
      ).rejects.toThrow();

      // An unreadable operand must fail the write. Substituting 0 would persist a
      // fabricated zakatableWealth — silent wrongness in a money column.
      expect(prisma.yearlySnapshot.update).not.toHaveBeenCalled();
    });
  });
});
