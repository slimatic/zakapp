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
 * Adding a collection means updating every list that enumerates collections.
 *
 * There is no single source of truth for "the collections", so the same set is
 * written out in several places, each for a different job:
 *
 *   - db/index.ts         what exists
 *   - SyncService         what replicates to CouchDB
 *   - VaultRekey          what gets re-encrypted when the password changes
 *   - useDataCleanup      what "clear all data" removes
 *
 * Each omission fails differently, and only the first is loud:
 *
 *   - Sync: history stays on one device while its asset syncs to all of them.
 *   - Rekey: history stays encrypted with the PREVIOUS vault key, so it is
 *     unreadable forever after a password change. Silent, and unrecoverable.
 *   - Cleanup: history rows outlive the assets they describe.
 *
 * That rekey case is why this file exists. It is the same failure mode as the
 * vault-key incident: a value that survives structurally but cannot be read.
 *
 * Read the real lists rather than hardcoding a copy, so this fails when the code
 * changes and is not merely a second place to keep in sync.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (rel: string) => readFileSync(resolve(__dirname, '../../../', rel), 'utf8');

/** Collection keys listed in a source file, in first-seen order. */
function listedKeys(rel: string, pattern: RegExp): string[] {
  const found: string[] = [];
  for (const m of read(rel).matchAll(pattern)) {
    if (!found.includes(m[1])) found.push(m[1]);
  }
  return found;
}

const KEY = /'([a-z_]+)'/g;

describe('every collection list stays in step with the schema set', () => {
  // db/index.ts is the source of truth: what addCollections actually creates.
  //
  // Matched as `key: { schema: XSchema` rather than `key: {`, because
  // `migrationStrategies: migrationStrategiesV4 }` also contains `strategies: {`
  // and would otherwise be collected as a collection named "strategies".
  const schemaKeys = listedKeys(
    'src/db/index.ts',
    /([a-z_]+):\s*\{\s*schema:\s*[A-Za-z]+Schema/g
  );

  it('the schema set is discoverable (guards against this test silently passing)', () => {
    // If this parsing breaks, every comparison below would compare empty lists
    // and pass. Assert a floor so that cannot happen.
    expect(schemaKeys.length).toBeGreaterThanOrEqual(5);
    expect(schemaKeys).toContain('assets');
    expect(schemaKeys).toContain('asset_amount_events');
  });

  it('SyncService replicates every collection', () => {
    const declared = read('src/services/SyncService.ts')
      .match(/SYNC_COLLECTIONS[\s\S]*?=\s*\[([\s\S]*?)\]/)![1];
    const synced = [...declared.matchAll(KEY)].map((m) => m[1]);
    expect(synced.sort()).toEqual([...schemaKeys].sort());
  });

  it('VaultRekey re-encrypts every collection', () => {
    // A collection missed here keeps the old key after a password change and
    // becomes permanently unreadable. Nothing else in the app will notice.
    const declared = read('src/services/VaultRekey.ts')
      .match(/const COLLECTIONS\s*=\s*\[([\s\S]*?)\]/)![1];
    const rekeyed = [...declared.matchAll(KEY)].map((m) => m[1]);
    for (const key of schemaKeys) {
      expect(rekeyed, `${key} is missing from VaultRekey.COLLECTIONS`).toContain(key);
    }
  });

  it('clear-all-data covers every financial collection', () => {
    const src = read('src/hooks/useDataCleanup.ts');
    const declared = src.match(/const collections = \[([\s\S]*?)\]/)![1];
    const cleared = [...declared.matchAll(/db\.([a-z_]+)/g)].map((m) => m[1]);
    // user_settings is deliberately preserved ("clean up the data, not the account").
    const expected = schemaKeys.filter((k) => k !== 'user_settings');
    expect(cleared.sort()).toEqual([...expected].sort());
  });

  it('the new collection declares encrypted fields, so the lists matter', () => {
    // If amount were not encrypted, missing from VaultRekey would be harmless.
    const schema = read('src/db/schema/assetAmountEvent.schema.ts');
    expect(schema).toMatch(/amount:\s*\{[\s\S]*?encrypted:\s*true/);
  });
});
