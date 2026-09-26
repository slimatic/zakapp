/**
 * autoMigration backup verification — tested against the REAL function.
 *
 * WHY THIS FILE EXISTS
 *
 * `tests/unit/backupIntegrity.test.ts` (added in #456) asserts against temp files
 * and reimplements the verification logic. It never imports `autoMigration.ts` —
 * verified: zero references to the module — so it would pass even if the real
 * function were deleted or broken. It documents intent; it does not test the code.
 * That was a genuine mistake and this file corrects it.
 *
 * Everything here calls the real exported `verifyBackupIntegrity` against real
 * SQLite databases built on disk. No mocks of the unit under test.
 *
 * The property that matters: a backup must FAIL CLOSED. A backup that silently
 * reports success when it is empty, truncated, or corrupt is worse than no backup,
 * because it is trusted during an upgrade that then loses the user's data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyBackupIntegrity } from '../../src/startup/autoMigration';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import os from 'os';
import path from 'path';

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zakapp-verify-'));
});

afterAll(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

/** Build a real, valid SQLite database with a users table at `file`. */
async function makeValidDb(file: string, userCount: number): Promise<void> {
  const client = new PrismaClient({ datasources: { db: { url: `file:${file}` } } });
  try {
    // NOTE: use $queryRawUnsafe for PRAGMA — it returns a row, and
    // $executeRawUnsafe rejects any statement that produces results.
    await client.$queryRawUnsafe('PRAGMA journal_mode=DELETE');
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    for (let i = 0; i < userCount; i++) {
      await client.$executeRawUnsafe(
        `INSERT OR REPLACE INTO users (id, email, username, password_hash) VALUES (?,?,?,?)`,
        `u-${i}`,
        `user${i}@example.com`,
        `user${i}`,
        'x'
      );
    }
  } finally {
    await client.$disconnect();
  }
}

describe('a valid backup is accepted, with its real row count', () => {
  it('reports ok and the correct number of users', async () => {
    const file = path.join(tmpDir, 'valid-3.db');
    await makeValidDb(file, 3);

    const result = await verifyBackupIntegrity(file);

    expect(result.ok).toBe(true);
    expect(result.userCount).toBe(3);
  });

  it('reports ok with zero users — an empty-but-valid database is not a corruption', async () => {
    const file = path.join(tmpDir, 'valid-0.db');
    await makeValidDb(file, 0);

    const result = await verifyBackupIntegrity(file);
    expect(result.ok).toBe(true);
    // The caller decides whether zero users is acceptable; the verifier reports
    // the truth rather than inventing a failure.
    expect(result.userCount).toBe(0);
  });

  it('counts are exact, not approximate', async () => {
    const file = path.join(tmpDir, 'valid-37.db');
    await makeValidDb(file, 37);
    const result = await verifyBackupIntegrity(file);
    expect(result.ok).toBe(true);
    expect(result.userCount).toBe(37);
  });
});

describe('THE POINT: it fails closed', () => {
  it('REJECTS a missing file', async () => {
    const result = await verifyBackupIntegrity(path.join(tmpDir, 'does-not-exist.db'));
    expect(result.ok).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('REJECTS a zero-byte file — the exact WAL-stub failure #456 was about', async () => {
    // In WAL mode a live connection can leave the main .db as a stub while real
    // data sits in the -wal sidecar. A size check calls that "fine". This must not.
    const file = path.join(tmpDir, 'zero-byte.db');
    fs.writeFileSync(file, '');

    const result = await verifyBackupIntegrity(file);
    expect(result.ok).toBe(false);
  });

  it('REJECTS a file that is not a database at all', async () => {
    const file = path.join(tmpDir, 'not-a-db.db');
    fs.writeFileSync(file, 'this is plainly not sqlite, just text pretending');

    const result = await verifyBackupIntegrity(file);
    expect(result.ok).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('REJECTS a truncated database rather than reading partial data', async () => {
    const file = path.join(tmpDir, 'truncated.db');
    await makeValidDb(file, 5);

    const buf = fs.readFileSync(file);
    // Keep the header (so it still looks like SQLite) but cut the body in half.
    fs.writeFileSync(file, buf.subarray(0, Math.floor(buf.length / 2)));

    const result = await verifyBackupIntegrity(file);
    // Either the integrity check or the read fails; both are a rejection.
    expect(result.ok).toBe(false);
  });

  it('REJECTS a database whose data pages were corrupted', async () => {
    // Realistic volume matters here. With only a handful of tiny rows the file is
    // mostly FREE pages, and corrupting free space damages no data — SQLite
    // correctly still reports the database as intact. So this fixture writes
    // enough rows to occupy real data pages before corrupting them.
    const file = path.join(tmpDir, 'corrupted.db');
    const client = new PrismaClient({ datasources: { db: { url: `file:${file}` } } });
    try {
      await client.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, email TEXT NOT NULL, username TEXT NOT NULL,
          password_hash TEXT NOT NULL, note TEXT
        )
      `);
      for (let i = 0; i < 40; i++) {
        await client.$executeRawUnsafe(
          `INSERT OR REPLACE INTO users (id,email,username,password_hash,note) VALUES (?,?,?,?,?)`,
          `u-${i}`, `u${i}@example.com`, `u${i}`, 'x', 'N'.repeat(200)
        );
      }
    } finally {
      await client.$disconnect();
    }

    const buf = fs.readFileSync(file);
    for (let i = Math.floor(buf.length * 0.4); i < Math.floor(buf.length * 0.6); i++) {
      buf[i] = 0x5a;
    }
    fs.writeFileSync(file, buf);

    const result = await verifyBackupIntegrity(file);
    // Verified in isolation: this produces "database disk image is malformed".
    expect(result.ok).toBe(false);
  });

  /**
   * NOT ASSERTED HERE, but worth recording for whoever maintains this:
   *
   * `verifyBackupIntegrity` checks that the database's DATA is intact and
   * readable, not that every byte is pristine. Corruption confined to unused
   * (free) pages is therefore legitimately not reported as a failure, and whether
   * a given byte range is "free" depends on page layout and row volume.
   *
   * Measured, for reference:
   *   small db (4 tiny rows, 12KB), middle 40-60% overwritten -> ok: true
   *   large db (40 rows x 200 chars, 24KB), last 512B overwritten -> ok: true
   *   large db (40 rows x 200 chars, 24KB), middle 40-60% overwritten -> ok: false
   *     ("database disk image is malformed")
   *
   * That is the correct contract — a false alarm on an intact backup is its own
   * failure mode, because it trains an operator to ignore the check. It is
   * deliberately NOT pinned as a test, because asserting it would encode page
   * layout as a contract and break on unrelated fixture changes.
   */

  it('REJECTS a valid SQLite database that has no users table', async () => {
    // Structurally valid, but not a ZakApp database. Accepting it during an
    // upgrade would silently replace real data with nothing.
    const file = path.join(tmpDir, 'no-users-table.db');
    const client = new PrismaClient({ datasources: { db: { url: `file:${file}` } } });
    try {
      await client.$executeRawUnsafe('CREATE TABLE unrelated (id TEXT PRIMARY KEY)');
    } finally {
      await client.$disconnect();
    }

    const result = await verifyBackupIntegrity(file);
    expect(result.ok).toBe(false);
  });
});

describe('every rejection carries a reason, so an operator can act', () => {
  it('failures are never silent or empty-string', async () => {
    const cases = [
      path.join(tmpDir, 'missing-2.db'),
      path.join(tmpDir, 'empty-2.db'),
    ];
    fs.writeFileSync(cases[1], '');

    for (const c of cases) {
      const r = await verifyBackupIntegrity(c);
      expect(r.ok).toBe(false);
      expect(typeof r.reason).toBe('string');
      expect((r.reason ?? '').length).toBeGreaterThan(0);
    }
  });
});

describe('it does not leave the backup open or mutate it', () => {
  it('leaves the file byte-identical after verification', async () => {
    const file = path.join(tmpDir, 'immutable.db');
    await makeValidDb(file, 2);
    const before = fs.readFileSync(file);

    await verifyBackupIntegrity(file);

    const after = fs.readFileSync(file);
    expect(after.equals(before)).toBe(true);
  });

  it('can be called repeatedly on the same file (connection is released)', async () => {
    const file = path.join(tmpDir, 'repeat.db');
    await makeValidDb(file, 6);

    for (let i = 0; i < 3; i++) {
      const r = await verifyBackupIntegrity(file);
      expect(r.ok).toBe(true);
      expect(r.userCount).toBe(6);
    }
  });

  it('verifies multiple backups independently', async () => {
    const a = path.join(tmpDir, 'multi-a.db');
    const b = path.join(tmpDir, 'multi-b.db');
    await makeValidDb(a, 11);
    await makeValidDb(b, 22);

    expect((await verifyBackupIntegrity(a)).userCount).toBe(11);
    expect((await verifyBackupIntegrity(b)).userCount).toBe(22);
  });
});
