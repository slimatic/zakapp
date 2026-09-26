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
 * Backup round-trip contract.
 *
 * The point of a backup is that a user can lose everything and get it back. For
 * v1.0 every user is asked to export BEFORE upgrading, so this path is the only
 * thing standing between them and permanent loss. It has to be provably correct,
 * not probably correct.
 *
 * These tests pin the round trip through the REAL adapters - MigrationService is
 * what an imported file actually passes through, so testing the shape it emits is
 * what matters, not testing a hand-built object that happens to look right.
 *
 * The failure mode being guarded is SILENT: a wrong value that still imports
 * "successfully" is worse than an error, because the user believes they are safe.
 * `Number('ZK1:...') || 0` produces exactly that - no exception, value quietly
 * becomes 0.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MigrationService } from '../../services/migrationService';
import { cryptoService } from '../../services/CryptoService';

describe('backup round trip (MigrationService is the real import path)', () => {
  beforeAll(async () => {
    // The adapters must not depend on a logged-in session; if they do, an import
    // into a fresh install (the exact disaster-recovery case) would fail.
  });

  it('preserves exact asset amounts through export -> import', () => {
    // Decimal precision matters: a rounding loss on a 1.2M portfolio is real money.
    const exported = [
      { id: 'a1', name: 'Cash', type: 'CASH', value: 1234567.89, currency: 'IDR',
        acquisitionDate: '2026-02-08T00:00:00.000Z', description: '', isActive: true,
        isPassiveInvestment: false, isRestrictedAccount: false, calculationModifier: 1 },
    ];
    const [out] = MigrationService.adaptAssets(exported, 'user-1');
    expect(out.value).toBe(1234567.89);
    expect(typeof out.value).toBe('number');
    expect(out.name).toBe('Cash');
    expect(out.currency).toBe('IDR');
  });

  it('preserves the ID so a re-import does not duplicate data', () => {
    const id = '21041083-4cc8-4f66-b76e-8ba0b9bb8d17';
    const [out] = MigrationService.adaptAssets([{ id, name: 'x', value: 1 }], 'user-1');
    expect(out.id).toBe(id);
  });

  it('preserves nisab record wealth amounts exactly', () => {
    const exported = [{
      id: 'n1', hawlStartDate: '2026-09-12T16:35:01.552Z', hawlCompletionDate: '2027-09-01T16:35:01.552Z',
      hijriYear: 1448, nisabBasis: 'GOLD', totalWealth: 987654.32, zakatableWealth: 950000.11,
      zakatAmount: 23750.0, currency: 'IDR', status: 'DRAFT',
    }];
    const [out] = MigrationService.adaptNisabRecords(exported, 'user-1');
    expect(out.totalWealth).toBe(987654.32);
    expect(out.zakatableWealth).toBe(950000.11);
    expect(out.zakatAmount).toBe(23750.0);
    expect(out.nisabBasis).toBe('GOLD');
    expect(out.hijriYear).toBe(1448);
  });

  it('preserves liability amounts and payment amounts exactly', () => {
    const [liab] = MigrationService.adaptLiabilities(
      [{ id: 'l1', name: 'Card', type: 'short_term', amount: 4321.99, currency: 'USD' }], 'user-1');
    expect(liab.amount).toBe(4321.99);

    const [pay] = MigrationService.adaptPayments(
      [{ id: 'p1', amount: 2500.5, currency: 'USD', recipientName: 'Masjid', paymentDate: '2026-09-01T00:00:00.000Z' }],
      'user-1', 'snap-1');
    expect(pay.amount).toBe(2500.5);
    expect(pay.recipientName).toBe('Masjid');
  });

  /**
   * THE DATA-LOSS GUARD.
   *
   * If a backup ever contains a raw ciphertext blob where a number belongs - which
   * happens when the export path reads a collection that decrypts lazily, or when a
   * decryption fails and the field is passed through untouched - `Number()` yields
   * NaN and `|| 0` silently writes ZERO. The user sees a successful import and a
   * portfolio worth nothing.
   *
   * This must throw. A loud failure is recoverable; a silent zero is not.
   */
  it('REJECTS a ciphertext blob instead of silently importing it as 0', () => {
    const corrupted = [{
      id: 'a1', name: 'ZK1:xG9kLm2nPq:8fJ2kL9mQ3vX', type: 'CASH',
      value: 'ZK1:xG9kLm2nPq:8fJ2kL9mQ3vX', currency: 'USD',
    }];
    expect(() => MigrationService.adaptAssets(corrupted, 'user-1')).toThrow(/encrypted|ZK1/i);
  });

  it('REJECTS a ciphertext blob in a nisab record instead of zeroing the zakat due', () => {
    const corrupted = [{
      id: 'n1', nisabBasis: 'GOLD',
      totalWealth: 'ZK1:w/kIeOUde4z8dwg6:pCN56WiJRTnN7YDx', zakatableWealth: 'ZK1:gslwrxCHfhXCPL57:Ftz',
      zakatAmount: 'ZK1:abcd1234efgh:ZZZZ', currency: 'USD',
    }];
    expect(() => MigrationService.adaptNisabRecords(corrupted, 'user-1')).toThrow(/encrypted|ZK1/i);
  });

  it('REJECTS a non-numeric amount rather than turning it into 0', () => {
    // e.g. a formatted string from a pre-#428 export, or a corrupted field.
    expect(() => MigrationService.adaptAssets(
      [{ id: 'a1', name: 'x', value: 'not-a-number' }], 'user-1')).toThrow();
  });

  it('still accepts a legitimate 0', () => {
    // 0 is a real value and must not be mistaken for a failure.
    const [out] = MigrationService.adaptAssets([{ id: 'a1', name: 'Empty', value: 0 }], 'user-1');
    expect(out.value).toBe(0);
  });
});
