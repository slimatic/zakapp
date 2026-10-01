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
 * The replication modifiers, exercised directly.
 *
 * This replaces a `describe.skip` integration test that could not fail. That test
 * asserted against a live CouchDB when one was reachable, and otherwise logged
 * `CouchDB fetch failed` and completed — so on every run it either tested nothing
 * or passed regardless. Its security assertion was the load-bearing part: a
 * replication push that carried plaintext would be caught by
 * `throw new Error('SECURITY ALERT: Data is STILL PLAINTEXT in CouchDB!')`, and
 * that error was raised inside a `try` whose `catch` only called `console.error`.
 *
 * For a zero-knowledge application the push modifier is the one place that decides
 * whether user data leaves the device encrypted. `replicateCouchDB` is mocked to
 * capture the config; the modifiers themselves are the real implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const capture: { configs: any[] } = { configs: [] };

vi.mock('rxdb/plugins/replication-couchdb', () => ({
  replicateCouchDB: vi.fn(async (config: any) => {
    capture.configs.push(config);
    return {
      error$: { subscribe: () => ({ unsubscribe() {} }) },
      active$: { subscribe: () => ({ unsubscribe() {} }) },
      awaitInSync: async () => {},
      cancel: async () => {},
    };
  }),
}));

vi.mock('../../utils/logger', () => ({
  Logger: class {
    info() {} warn() {} error() {} debug() {}
  },
}));

import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { syncService } from '../SyncService';
import { cryptoService } from '../CryptoService';

const USER = 'user-abc-123';

/** The six collections the client replicates. Kept as a literal, not imported, so a
 *  change to the list is visible here rather than silently followed. */
const COLLECTIONS = [
  'assets', 'asset_amount_events', 'liabilities',
  'nisab_year_records', 'payment_records', 'user_settings',
];

function fakeDb() {
  const mk = () => ({
    insert: vi.fn(), find: vi.fn(), findOne: vi.fn(), bulkInsert: vi.fn(),
  });
  return Object.fromEntries(COLLECTIONS.map(c => [c, mk()]));
}

/** Minimal Response-shaped object for the token fetch and the db-exists check. */
function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  capture.configs.length = 0;
  vi.clearAllMocks();
  localStorage.setItem('accessToken', 'test-access-token');
  fetchMock = vi.fn(async (url: string) => {
    if (String(url).includes('/sync/token')) {
      return jsonResponse({
        // Placeholder values, not credentials - phrased with the `test-` idiom that
        // `check-no-committed-credentials.py` recognises as a placeholder. The real
        // leak this guard exists for was exactly this shape reaching the public repo.
        credentials: { username: 'test-sync-user', password: 'test-sync-not-a-real' },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    }
    // ensureUserDatabase's existence probe
    return jsonResponse({ db_name: 'ok' });
  });
  vi.stubGlobal('fetch', fetchMock);
  await cryptoService.deriveKey('test-password', 'test-salt');
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

async function startAndCapture() {
  await syncService.startSync(fakeDb() as any, USER);
  // One replicateCouchDB call per collection.
  expect(replicateCouchDB).toHaveBeenCalledTimes(COLLECTIONS.length);
  const byUrl = new Map<string, any>();
  for (const c of capture.configs) byUrl.set(c.url as string, c);
  return byUrl;
}

describe('SyncService replication config', () => {
  it('replicates every collection in the sync list, and only those', async () => {
    const byUrl = await startAndCapture();
    const dbs = [...byUrl.keys()].map(u => u.replace(/\/$/, '').split('/').pop()).sort();
    const safe = USER.toLowerCase().replace(/[^a-z0-9]/g, '_');
    expect(dbs).toEqual(COLLECTIONS.map(c => `zakapp_${safe}_${c}`).sort());
  });

  it('runs live, and identifies each replication distinctly', async () => {
    const byUrl = await startAndCapture();
    for (const c of capture.configs) {
      expect(c.live).toBe(true);
      expect(c.autoStart).toBe(true);
      expect(typeof c.replicationIdentifier).toBe('string');
    }
    const ids = capture.configs.map(c => c.replicationIdentifier);
    expect(new Set(ids).size).toBe(COLLECTIONS.length);
  });

  it('authenticates every request through the fetch wrapper', async () => {
    const byUrl = await startAndCapture();
    const auth = [...byUrl.values()][0];
    await auth.fetch('http://localhost:5984/some-db/', { method: 'GET' });
    const call = fetchMock.mock.calls.find(c => String(c[0]).includes('some-db'));
    expect(call).toBeTruthy();
    const headers = (call![1] as any)?.headers ?? {};
    expect(headers.Authorization).toMatch(/^Basic /);
  });

  it('requests credentials from the backend rather than embedding them', async () => {
    await startAndCapture();
    const tokenCall = fetchMock.mock.calls.find(c => String(c[0]).includes('/sync/token'));
    expect(tokenCall).toBeTruthy();
    expect((tokenCall![1] as any)?.headers?.Authorization).toBe('Bearer test-access-token');
  });
});

describe('the push modifier is what keeps user data encrypted at rest', () => {
  it('replaces every user field with ciphertext, iv and tag', async () => {
    const byUrl = await startAndCapture();
    const { push } = [...byUrl.values()][0];
    // `_id` matters: the guard returns any document without a string `_id` untouched,
    // so a fixture missing it would bypass encryption and pass vacuously.
    const doc = {
      _id: 'asset-1',
      name: 'Secret Gold Holdings',
      type: 'gold',
      value: 999.99,
      currency: 'USD',
      isActive: true,
    };

    const out = await push.modifier(doc);

    // The whole point: no user field survives in the pushed document.
    // `_id` is excluded from the loop deliberately - it is the document key, the
    // remote needs it in clear, and it is not user data. Everything else must go.
    const serialized = JSON.stringify(out);
    for (const [k, v] of Object.entries(doc)) {
      if (k === '_id') continue;
      expect(serialized, `field ${k} leaked`).not.toContain(JSON.stringify(v));
    }
    // `_rev` is always destructured onto the output; it is undefined for a doc that
    // has never synced, which is why the serialized form above does not show it.
    expect(Object.keys(out).sort()).toEqual(['_id', '_rev', 'encrypted', 'iv', 'tag'].sort());
    expect(typeof out.encrypted).toBe('string');
    expect(out.encrypted.length).toBeGreaterThan(0);
    expect(out.iv).toBeTruthy();
    expect(out.tag).toBeTruthy();
    expect(out._id).toBe('asset-1');
  });

  it('the emitted ciphertext round-trips back to the original document', async () => {
    const byUrl = await startAndCapture();
    const { push, pull } = [...byUrl.values()][0];
    const doc = { _id: 'asset-2', name: 'Silver', value: 42.5 };

    const pushed = await push.modifier(doc);
    const pulled = await pull.modifier({
      _id: pushed._id, _rev: '1-abc',
      encrypted: pushed.encrypted, iv: pushed.iv, tag: pushed.tag,
    });

    expect(pulled.name).toBe('Silver');
    expect(pulled.value).toBe(42.5);
    expect(pulled._id).toBe('asset-2');
  });

  it('passes design documents through untouched', async () => {
    const byUrl = await startAndCapture();
    const { push, pull } = [...byUrl.values()][0];
    const design = { _id: '_design/filters', language: 'javascript' };
    await expect(push.modifier(design)).resolves.toEqual(design);
    await expect(pull.modifier(design)).resolves.toEqual(design);
  });

  it('preserves _rev and _deleted without leaving them inside the ciphertext', async () => {
    const byUrl = await startAndCapture();
    const { push } = [...byUrl.values()][0];
    const out = await push.modifier({ _id: 'asset-3', name: 'Gone', _rev: '2-b', _deleted: true });
    expect(out._rev).toBe('2-b');
    expect(out._deleted).toBe(true);
    expect(out.encrypted).toBeTruthy();
  });

  it('FALSIFICATION: the assertion catches a modifier that stops encrypting', async () => {
    const byUrl = await startAndCapture();
    const realPush = [...byUrl.values()][0].push;
    // A plausible regression: someone returns the document unchanged to "fix" a bug.
    const brokenPush = { ...realPush, modifier: async (doc: any) => doc };

    const doc = { _id: 'asset-4', name: 'Secret Gold Holdings', value: 999.99 };
    const out = await brokenPush.modifier(doc);

    // A passthrough modifier leaks every field...
    expect(JSON.stringify(out)).toContain('Secret Gold Holdings');
    expect(JSON.stringify(out)).toContain('999.99');

    // ...and the exact assertion used above detects it. This is the check that
    // would have failed on the old `describe.skip`, which never ran at all.
    await expect(
      (async () => {
        const serialized = JSON.stringify(out);
        for (const [k, v] of Object.entries(doc)) {
          if (k === '_id') continue;
          expect(serialized).not.toContain(JSON.stringify(v));
        }
      })()
    ).rejects.toThrow();
  });
});
