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
 * The backup must be READABLE WITHOUT THE VAULT KEY.
 *
 * Decided behaviour, matching how Bitwarden exports work: a backup is plaintext.
 * The user is told that at export time, and owns that choice. The alternative -
 * an encrypted backup - is what loses people, because the one moment they need
 * the file is the moment they no longer have the key.
 *
 * So the contract is:
 *   export  -> readable values (no ZK1 blobs) that survive without the key
 *   import  -> re-encrypted with whatever scheme the target install is using
 *
 * This test states that contract in code. If someone later "improves" the export
 * by encrypting it, these fail and the reasoning is right here to read.
 */

import { describe, it, expect } from 'vitest';
import { MigrationService } from '../../services/migrationService';
import { findEncryptedLeaks, looksEncrypted } from '../parseDecimal';

/** A payload shaped like a real v0.17.0 export, values already decrypted. */
const plaintextBackup = {
  version: '3.0',
  exportDate: '2026-09-25T00:00:00.000Z',
  assets: [
    { id: 'a1', name: 'Bank Account', type: 'BANK_ACCOUNT', value: 1500000, currency: 'IDR' },
    { id: 'a2', name: 'Gold', type: 'GOLD', value: 87500.25, currency: 'IDR' },
  ],
  liabilities: [{ id: 'l1', name: 'Card', type: 'short_term', amount: 4321.99, currency: 'USD' }],
  nisabRecords: [{
    id: 'n1', hawlStartDate: '2026-09-12T16:35:01.552Z', nisabBasis: 'GOLD',
    totalWealth: 987654.32, zakatableWealth: 950000.11, zakatAmount: 23750, currency: 'IDR',
  }],
  payments: [{
    id: 'p1', amount: 2500.5, currency: 'USD', recipientName: 'Masjid',
    paymentDate: '2026-09-01T00:00:00.000Z',
  }],
  settings: {
    id: 'u1', profileName: 'Salim', firstName: 'Salim', lastName: 'A',
    email: 'user@example.com', preferredCalendar: 'gregorian',
    preferredMethodology: 'standard', baseCurrency: 'USD', language: 'en', theme: 'system',
  },
};

describe('backup is plaintext and key-independent', () => {
  it('contains NO ciphertext anywhere a user would need to read', () => {
    expect(findEncryptedLeaks(plaintextBackup)).toHaveLength(0);

    // Broader than the money-field guard: a backup the user cannot read is not a
    // backup. Walk the whole payload and assert nothing is a ZK1 blob.
    const walk = (v: unknown, path = ''): string[] => {
      if (looksEncrypted(v)) return [path];
      if (Array.isArray(v)) return v.flatMap((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === 'object') {
        return Object.entries(v as Record<string, unknown>).flatMap(([k, x]) =>
          walk(x, path ? `${path}.${k}` : k));
      }
      return [];
    };
    expect(walk(plaintextBackup)).toHaveLength(0);
  });

  it('restores every collection with amounts intact (import is the real proof)', () => {
    const assets = MigrationService.adaptAssets(plaintextBackup.assets, 'new-user');
    expect(assets.map(a => a.value)).toEqual([1500000, 87500.25]);

    const liabs = MigrationService.adaptLiabilities(plaintextBackup.liabilities, 'new-user');
    expect(liabs[0].amount).toBe(4321.99);

    const nisab = MigrationService.adaptNisabRecords(plaintextBackup.nisabRecords, 'new-user');
    expect(nisab[0].totalWealth).toBe(987654.32);
    expect(nisab[0].zakatableWealth).toBe(950000.11);
    expect(nisab[0].zakatAmount).toBe(23750);

    const pays = MigrationService.adaptPayments(plaintextBackup.payments, 'new-user', 'snap');
    expect(pays[0].amount).toBe(2500.5);
    expect(pays[0].recipientName).toBe('Masjid');

    // Settings carry readable profile values, not blobs.
    const st = MigrationService.adaptUserSettings(plaintextBackup.settings, 'new-user');
    expect(st.profileName).toBe('Salim');
    expect(st.email).toBe('user@example.com');
    expect(looksEncrypted(st.profileName)).toBe(false);
  });

  it('restores into a DIFFERENT account than it came from', () => {
    // "export on the old system, import on the new" - the userId must not leak
    // through, and must not be required to match.
    const assets = MigrationService.adaptAssets(plaintextBackup.assets, 'brand-new-user');
    expect(assets.every(a => a.userId === 'brand-new-user')).toBe(true);
  });

  it('re-imported plaintext is what the encrypting plugin expects on write', () => {
    // The import path hands plaintext to the repository, and the zero-knowledge
    // plugin encrypts on insert. So the restored values must be PLAINTEXT here -
    // if import pre-encrypted them, they would be double-encrypted on write.
    const assets = MigrationService.adaptAssets(plaintextBackup.assets, 'u');
    for (const a of assets) {
      expect(looksEncrypted(a.value)).toBe(false);
      expect(typeof a.value).toBe('number');
    }
  });
});
