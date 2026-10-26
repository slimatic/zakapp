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
 * The database opens every collection the map declares.
 *
 * A database from an earlier app version is missing the collections added
 * since. One hand-written branch per collection (the shape that existed here)
 * only ever filled the newest gap: with two gaps, one stayed missing silently
 * — asset_amount_events itself was such a branch. The map + gap computation
 * is the shape that cannot leave a gap behind.
 */
import { describe, it, expect } from 'vitest';
import { COLLECTION_CREATORS, missingCollections } from '../index';

describe('collection creation fills every gap in one pass', () => {
    it('a database that has only assets is missing the other five', () => {
        const missing = missingCollections({ assets: {} });
        expect(new Set(missing)).toEqual(
            new Set(['liabilities', 'nisab_year_records', 'payment_records', 'user_settings', 'asset_amount_events'])
        );
    });

    it('a zero-collection database is missing all of them', () => {
        expect(missingCollections(undefined).sort()).toEqual([...Object.keys(COLLECTION_CREATORS)].sort());
    });

    it('a fully-current database requests nothing', () => {
        const present = Object.fromEntries(Object.keys(COLLECTION_CREATORS).map(key => [key, {}]));
        expect(missingCollections(present)).toEqual([]);
    });

    it('every declared collection can be created from the map alone', () => {
        // The creator entries carry a schema, which is the shape the
        // collectionLists guard parses on this same file.
        for (const creator of Object.values(COLLECTION_CREATORS)) {
            expect(typeof creator.schema).toBe('object');
            expect(creator.migrationStrategies).toBeTypeOf('object');
        }
    });
});