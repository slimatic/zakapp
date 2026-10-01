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
 * Guard for the v7 user-settings migration (#536).
 *
 * `preferredNisabStandard` was a preference the calculation never consulted — the
 * nisab basis follows the selected school (`getNisabSource`). It was still written
 * by onboarding, patched on profile update, and passed to a modal that ignored it,
 * so it survived as a field that *looked* authoritative. That is the trap: the next
 * person to touch nisab logic finds it and trusts it.
 *
 * These tests fail if the field, or its migration, comes back.
 *
 * The strategy object is imported rather than reconstructed because the whole point
 * is to test the code that actually runs — a hand-rolled copy would pass while the
 * real migration regressed.
 */
import { describe, it, expect } from 'vitest';
import { UserSettingsSchema } from '../schema/userSettings.schema';
import { migrationStrategiesV7 } from '../index';

describe('user settings no longer carry a nisab standard (#536)', () => {
    it('the schema does not declare the field', () => {
        const properties = (UserSettingsSchema as any).properties as Record<string, unknown>;
        expect(properties).not.toHaveProperty('preferredNisabStandard');
    });

    it('the v7 migration strips the field from stored documents', () => {
        const legacy = {
            id: 'settings-1',
            preferredNisabStandard: 'GOLD',
            preferredMethodology: 'hanafi',
            baseCurrency: 'USD',
        };

        const migrated = (migrationStrategiesV7 as any)[7](legacy);

        expect(migrated).not.toHaveProperty('preferredNisabStandard');
        // Data a person actually gave the app must survive the migration.
        expect(migrated.preferredMethodology).toBe('hanafi');
        expect(migrated.baseCurrency).toBe('USD');
        expect(migrated.id).toBe('settings-1');
    });

    it('the v7 migration is safe for documents that never had the field', () => {
        const clean = { id: 'settings-2', preferredMethodology: 'standard' };
        const migrated = (migrationStrategiesV7 as any)[7](clean);

        expect(migrated).toEqual(clean);
    });

    it('the v6 step still exists, so documents at v5 can still migrate', () => {
        // Removing a from-version key silently breaks the chain for anything
        // still sitting on the previous version.
        expect(typeof (migrationStrategiesV7 as any)[6]).toBe('function');
    });
});
