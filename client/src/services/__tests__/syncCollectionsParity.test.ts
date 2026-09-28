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
 * The client's sync list and the server's provisioning list must match.
 *
 * The client replicates `SYNC_COLLECTIONS`; the server creates one CouchDB database
 * per collection per user, from `getUserDatabaseNames`. The two cannot share a
 * constant -- the server resolves `@zakapp/shared` to `server/src/shared_local.ts`,
 * a local type shim, not to the package -- so they are written out twice.
 *
 * When they disagree the failure is silent. The client replicates to a database that
 * was never created, CouchDB answers 404, and RxDB surfaces `RC_PULL`. Nothing fails
 * to start and no request errors visibly, so the only symptom is a console line and
 * a collection that never syncs. That happened when `asset_amount_events` was added
 * to the client alone.
 *
 * This reads both lists out of the source rather than keeping a third copy, so it
 * fails when the code changes instead of becoming another place to remember.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// From client/src/services/__tests__/ up to the repository root.
const repoRoot = resolve(__dirname, '../../../../');

const read = (rel: string) => readFileSync(resolve(repoRoot, rel), 'utf8');

/** The client's list: bare collection keys. */
function clientKeys(): string[] {
  const body = read('client/src/services/SyncService.ts')
    .match(/SYNC_COLLECTIONS[^=]*=\s*\[([\s\S]*?)\]/)![1];
  return [...body.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

/** The server's list: database names of the form zakapp_${safeUserId}_<key>. */
function serverKeys(): string[] {
  const body = read('server/src/services/SyncService.ts')
    .match(/getUserDatabaseNames\([\s\S]*?return\s*\[([\s\S]*?)\]/)![1];
  return [...body.matchAll(/_([a-z_]+)`/g)]
    .map((m) => m[1])
    .filter((k) => k !== 'safeUserId');
}

describe('client sync list and server provisioning list agree', () => {
  it('both lists are discoverable (guards against passing vacuously)', () => {
    // If the parsing breaks, both sides would be empty and every comparison below
    // would pass while checking nothing.
    expect(clientKeys().length).toBeGreaterThanOrEqual(5);
    expect(serverKeys().length).toBeGreaterThanOrEqual(5);
    expect(clientKeys()).toContain('assets');
    expect(serverKeys()).toContain('assets');
  });

  it('the server provisions every collection the client replicates', () => {
    const server = serverKeys();
    for (const key of clientKeys()) {
      expect(server, `server does not provision "${key}"`).toContain(key);
    }
  });

  it('the client replicates every collection the server provisions', () => {
    const client = clientKeys();
    for (const key of serverKeys()) {
      expect(client, `client does not replicate "${key}"`).toContain(key);
    }
  });

  it('history is synced, not just stored locally', () => {
    // The specific regression: `assets` synced without its history means an asset
    // appears on another device with no record of what it was worth or when, which
    // defeats the point of the history.
    expect(clientKeys()).toContain('asset_amount_events');
    expect(serverKeys()).toContain('asset_amount_events');
  });
});
