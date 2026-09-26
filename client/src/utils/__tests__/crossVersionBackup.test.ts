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
 * Cross-version backup compatibility: v0.17.0 (production) -> v1.0.
 *
 * This is the exact flow every user is being asked to follow before upgrading:
 * export from the current production build, then import into the new one. If this
 * file ever fails, every user who followed that instruction loses their data.
 *
 * The fixture is shaped from the real v0.17.0 export payload (version "2.5", flat
 * collections, no `.data` wrapper), NOT from what v1.0 happens to emit - testing a
 * file the new code produced proves nothing about a file produced by the old code.
 *
 * The important asymmetry: production's assets/liabilities/payments decrypt on
 * read, so amounts arrive as plain numbers. Its `user_settings` repository NEVER
 * decrypts, so the profile block arrives as `ZK1:` ciphertext. A v1.0 import has
 * to accept both shapes.
 */

import { describe, it, expect } from 'vitest';
import { MigrationService } from '../../services/migrationService';
import { looksEncrypted } from '../parseDecimal';

/**
 * A v0.17.0 production export, verbatim in shape.
 *
 * Note `settings` carrying ciphertext: that is what production actually writes,
 * because its user-settings repository does not decrypt. Do not "clean" this
 * fixture - the ciphertext is the point of the test.
 */
const v017Export = {
  version: '2.5',
  exportDate: '2026-09-25T10:00:00.000Z',
  stats: {
    assets: 2, payments: 1, nisabRecords: 1, liabilities: 1,
    calculations: 0, hasSettings: true,
  },
  assets: [
    {
      id: '21041083-4cc8-4f66-b76e-8ba0b9bb8d17', userId: 'cmjvgcwfj0000qm3hdbkv5ygp',
      name: 'Bank Account', type: 'BANK_ACCOUNT', value: 1500000, currency: 'IDR',
      description: '', acquisitionDate: '2015-09-05T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      isActive: true, isPassiveInvestment: false, isRestrictedAccount: false, calculationModifier: 1,
    },
    {
      id: '6fa9606c-b979-4da1-b39c-9dbd5161cc76', userId: 'cmjvgcwfj0000qm3hdbkv5ygp',
      name: 'Retirement', type: 'RETIREMENT', value: 87500.25, currency: 'IDR',
      description: '', acquisitionDate: '2026-09-20T00:00:00.000Z',
      createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-20T00:00:00.000Z',
      isActive: true, isPassiveInvestment: false, isRestrictedAccount: false, calculationModifier: 1,
    },
  ],
  liabilities: [
    {
      id: 'l1', userId: 'cmjvgcwfj0000qm3hdbkv5ygp', name: 'Card', type: 'short_term',
      amount: 4321.99, currency: 'USD', description: '', isActive: true,
      dueDate: '2026-12-01T00:00:00.000Z', creditor: 'Bank', notes: '',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  nisabRecords: [
    {
      id: '12409bec-cef0-4cfe-aebf-b9b4c45b9452', userId: 'cmjvgcwfj0000qm3hdbkv5ygp',
      hawlStartDate: '2026-09-12T16:35:01.552Z', hawlCompletionDate: '2027-09-01T16:35:01.552Z',
      hijriYear: 1448, nisabBasis: 'GOLD', totalWealth: 1587500.25, zakatableWealth: 1540000.11,
      zakatAmount: 38500, currency: 'IDR', status: 'DRAFT',
      createdAt: '2026-09-12T16:35:01.552Z', updatedAt: '2026-09-12T16:35:01.552Z',
    },
  ],
  payments: [
    {
      id: 'p1', userId: 'cmjvgcwfj0000qm3hdbkv5ygp', snapshotId: '12409bec-cef0-4cfe-aebf-b9b4c45b9452',
      amount: 2500.5, currency: 'USD', paymentDate: '2026-09-01T00:00:00.000Z',
      recipientName: 'Masjid', recipientType: 'organization', recipientCategory: 'fakir',
      paymentMethod: 'cash', status: 'recorded', exchangeRate: 1,
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    },
  ],
  // Production never decrypts these, so they arrive as ciphertext.
  settings: {
    id: 'cmjvgcwfj0000qm3hdbkv5ygp',
    profileName: 'ZK1:aBcD1234efGh:9xY8zW7vU6tS5rQ4pO3nM2lK1jI0hG9fE8dC7bA6',
    firstName: 'ZK1:qQ11wW22:ZZyyXXwwVVuuTTssRRqqPPooNNmmLLkkJJiiHHggFF',
    lastName: 'ZK1:zZ99yY88:MMnnBBvvCCxxZZaaSSddFFggHHjjKKllPPooIIuuYYtt',
    email: 'ZK1:mM55nN66:RRttYYuuIIooPPaaSSddFFggHHjjKKllZZxxCCvvBBnn',
    preferredCalendar: 'gregorian', preferredMethodology: 'standard',
    baseCurrency: 'IDR', language: 'en', theme: 'system', isSetupCompleted: true,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-09-25T00:00:00.000Z',
  },
};

describe('v0.17.0 production export -> v1.0 import', () => {
  it('reads the flat v2.5 payload (no .data wrapper)', () => {
    // v1.0's own export writes the same flat shape, so `rawData` is the parsed root.
    const rawData = (v017Export as any).data && !Array.isArray((v017Export as any).data)
      ? (v017Export as any).data
      : v017Export;
    expect(Array.isArray(rawData.assets)).toBe(true);
    expect(rawData.assets).toHaveLength(2);
  });

  it('imports every asset amount exactly - no zeros, no drift', () => {
    const out = MigrationService.adaptAssets(v017Export.assets, 'new-user');
    expect(out.map(a => a.value)).toEqual([1500000, 87500.25]);
    expect(out.map(a => a.currency)).toEqual(['IDR', 'IDR']);
    // IDs preserved so a re-import does not duplicate the user's rows.
    expect(out[0].id).toBe('21041083-4cc8-4f66-b76e-8ba0b9bb8d17');
  });

  it('imports liabilities, nisab records and payments exactly', () => {
    const l = MigrationService.adaptLiabilities(v017Export.liabilities, 'new-user');
    expect(l[0].amount).toBe(4321.99);

    const n = MigrationService.adaptNisabRecords(v017Export.nisabRecords, 'new-user');
    expect(n[0].totalWealth).toBe(1587500.25);
    expect(n[0].zakatableWealth).toBe(1540000.11);
    expect(n[0].zakatAmount).toBe(38500);
    expect(n[0].nisabBasis).toBe('GOLD');
    expect(n[0].hijriYear).toBe(1448);

    const p = MigrationService.adaptPayments(v017Export.payments, 'new-user', undefined);
    expect(p[0].amount).toBe(2500.5);
    // The v0.17.0 file supplied snapshotId, so the fallback must not override it.
    expect(p[0].snapshotId).toBe('12409bec-cef0-4cfe-aebf-b9b4c45b9452');
    expect(p[0].recipientName).toBe('Masjid');
  });

  it('carries the production ciphertext profile block through without corrupting it', () => {
    const s = MigrationService.adaptUserSettings(v017Export.settings, 'new-user');
    // Still ciphertext, still structurally valid - NOT zeroed and NOT blanked.
    // v1.0's settings repository decrypts on read, so this becomes readable again
    // once the user unlocks with the password that produced it.
    expect(looksEncrypted(s.profileName)).toBe(true);
    expect(s.profileName).toBe(v017Export.settings.profileName);
    expect(s.email).toBe(v017Export.settings.email);
    // Non-encrypted settings must survive as plain values.
    expect(s.baseCurrency).toBe('IDR');
    expect(s.preferredCalendar).toBe('gregorian');
  });

  it('does NOT reject the file for being version 2.5 when v1.0 emits 3.0', () => {
    // There is deliberately no version gate: the shape is additive, so an older
    // file imports unchanged. A gate would be the one thing that could turn this
    // whole upgrade plan into data loss.
    expect(() => MigrationService.adaptAssets(v017Export.assets, 'u')).not.toThrow();
    expect(() => MigrationService.adaptNisabRecords(v017Export.nisabRecords, 'u')).not.toThrow();
    expect(() => MigrationService.adaptLiabilities(v017Export.liabilities, 'u')).not.toThrow();
    expect(() => MigrationService.adaptPayments(v017Export.payments, 'u', undefined)).not.toThrow();
    expect(() => MigrationService.adaptUserSettings(v017Export.settings, 'u')).not.toThrow();
  });

  it('assigns everything to the importing user, not the exporting one', () => {
    const assets = MigrationService.adaptAssets(v017Export.assets, 'brand-new-user');
    expect(assets.every(a => a.userId === 'brand-new-user')).toBe(true);
    // The v0.17.0 userId must not leak through.
    expect(assets.some(a => a.userId === 'cmjvgcwfj0000qm3hdbkv5ygp')).toBe(false);
  });

  it('an empty collection does not abort the whole import', () => {
    // A user with no payments yet still has a valid backup.
    expect(MigrationService.adaptPayments([], 'u', undefined)).toEqual([]);
    expect(MigrationService.adaptLiabilities([], 'u')).toEqual([]);
  });
});
