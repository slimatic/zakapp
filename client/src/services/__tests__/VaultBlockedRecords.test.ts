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

import { describe, it, expect, vi } from 'vitest';

/**
 * A blocked password change must name what is blocking it.
 *
 * The behaviour this pins: a refusal that reports only a COUNT leaves the user
 * with no way forward. The reported experience was "1 encrypted value could not
 * be read with that password" — true, unactionable, and the only route out was
 * to export the whole vault to JSON, delete everything, and re-import.
 *
 * These tests cover the identification, not the encryption: `identifyRecord`
 * reads fields that were never encrypted, which is exactly why they are still
 * available when the key is wrong.
 */

// VaultRekey pulls the DB and crypto layers in at module scope; neither is
// reached by the pure helpers under test.
vi.mock('../../db', () => ({ getDb: async () => ({}) }));
vi.mock('../CryptoService', () => ({ cryptoService: {} }));
vi.mock('../../utils/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { describeBlockedRecords, VaultBlockedError } = await import('../VaultRekey');

describe('describeBlockedRecords', () => {
    it('names the record, not just the count', () => {
        const [line] = describeBlockedRecords([
            {
                collection: 'assets',
                collectionLabel: 'Asset',
                id: 'asset_123',
                fields: ['name', 'value'],
                identity: [
                    { label: 'type', value: 'gold' },
                    { label: 'currency', value: 'USD' },
                    { label: 'acquired', value: '2024-03-01' },
                ],
            },
        ]);

        expect(line).toContain('Asset');
        expect(line).toContain('type: gold');
        expect(line).toContain('currency: USD');
        expect(line).toContain('2024-03-01');
        // Which fields failed, so "the name is unreadable" is distinguishable
        // from "the value is unreadable" — they lead to different next steps.
        expect(line).toContain('name');
        expect(line).toContain('value');
    });

    it('falls back to the id when nothing identifiable is readable', () => {
        const [line] = describeBlockedRecords([
            {
                collection: 'assets',
                collectionLabel: 'Asset',
                id: 'asset_abc',
                fields: ['name'],
                identity: [],
            },
        ]);
        expect(line).toContain('asset_abc');
    });
});

describe('VaultBlockedError', () => {
    const blocked = [
        {
            collection: 'liabilities',
            collectionLabel: 'Liability',
            id: 'liab_1',
            fields: ['amount'],
            identity: [{ label: 'type', value: 'mortgage' }],
        },
    ];

    it('carries the records so the caller can offer a way forward', () => {
        const err = new VaultBlockedError(blocked, 1);
        expect(err.blocked).toHaveLength(1);
        expect(err.blocked[0].id).toBe('liab_1');
        expect(err.unreadableCount).toBe(1);
    });

    it('states plainly that the password did NOT change', () => {
        // The user must not be left unsure whether the change half-applied.
        expect(new VaultBlockedError(blocked, 1).message).toMatch(/NOT changed/i);
    });

    it('is a real Error subclass, so `instanceof` works in the caller', () => {
        // The caller branches on `instanceof VaultBlockedError` to decide whether
        // to show the actionable panel. That branch silently never fires if the
        // prototype is lost in transpilation.
        const err = new VaultBlockedError(blocked, 1);
        expect(err).toBeInstanceOf(VaultBlockedError);
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('VaultBlockedError');
    });

    it('pluralises honestly rather than saying "1 values"', () => {
        expect(new VaultBlockedError(blocked, 1).message).toContain('1 encrypted value ');
        expect(new VaultBlockedError(blocked, 3).message).toContain('3 encrypted values');
    });
});
