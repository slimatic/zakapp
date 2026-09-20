/**
 * Backup integrity contract.
 *
 * Regression guard for a hole found during the data-retention audit: the
 * pre-migration backup copied the .db file and compared only file SIZES.
 *
 * WHY THIS MATTERS, measured rather than assumed:
 *
 * In WAL mode, committed data lives in the `-wal` sidecar until a checkpoint. A
 * copy of just the .db file is therefore not a partial backup — it can be an
 * EMPTY one. Measured with a live connection open (which is the real situation,
 * since the backend holds a connection pool while the startup backup runs):
 *
 *     live.db         4,096 bytes      <- header only
 *     live.db-wal    82,432 bytes      <- all 5,000 committed rows
 *
 *     copyFileSync(live.db, backup) -> 4,096 bytes
 *     sqlite3 backup: "no such table: payments"
 *
 * And because the original and the copy are the SAME 4,096 bytes, the old
 * size comparison PASSED and logged a successful backup. Silent, and total.
 *
 * A note on reproducing this: closing the last connection to a WAL database
 * triggers an automatic checkpoint, which folds the WAL in and hides the bug. So
 * these tests keep a connection open across the copy.
 *
 * These tests build real SQLite databases on disk. They do not mock the
 * filesystem, because the whole point is what the filesystem actually does.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

let tmpDir: string;

function py(code: string): string {
  return execFileSync('python3', ['-c', code]).toString().trim();
}

function pyJson<T>(code: string): T {
  return JSON.parse(py(code));
}

function sha256(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zakapp-backup-'));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('WAL: a naive single-file copy can be an EMPTY backup', () => {
  it('copies a header-only file while every row sits in the sidecar', () => {
    const live = path.join(tmpDir, 'wal-live.db');
    const naive = path.join(tmpDir, 'wal-naive.db');

    const r = pyJson<{
      dbBytes: number; walBytes: number; liveRows: number;
      copyBytes: number; copyError: string | null;
    }>(`
import sqlite3, shutil, os, json
live, naive = ${JSON.stringify(live)}, ${JSON.stringify(naive)}
def sz(p): return os.path.getsize(p) if os.path.exists(p) else 0

c = sqlite3.connect(live)
c.execute("PRAGMA journal_mode=WAL")
c.execute("CREATE TABLE payments (id INTEGER PRIMARY KEY, amount REAL)")
c.executemany("INSERT INTO payments (amount) VALUES (?)", [(i*1.5,) for i in range(1, 5001)])
c.commit()

db_bytes  = sz(live)
wal_bytes = sz(live + "-wal")
live_rows = c.execute("SELECT COUNT(*) FROM payments").fetchone()[0]

# What the old code did: copy the .db, nothing else, while the pool is live.
shutil.copyfile(live, naive)
copy_bytes = sz(naive)

try:
    n = sqlite3.connect(naive)
    n.execute("SELECT COUNT(*) FROM payments").fetchone()
    n.close()
    copy_error = None
except Exception as e:
    copy_error = str(e)

c.close()
print(json.dumps({"dbBytes": db_bytes, "walBytes": wal_bytes, "liveRows": live_rows,
                  "copyBytes": copy_bytes, "copyError": copy_error}))
`);

    // All 5,000 committed rows are readable by the live connection.
    expect(r.liveRows).toBe(5000);

    // Yet the main file is a fraction of the sidecar — nearly everything is WAL.
    expect(r.walBytes).toBeGreaterThan(r.dbBytes * 10);

    // The copy is the same size as the original, so a size check sees nothing
    // wrong...
    expect(r.copyBytes).toBe(r.dbBytes);

    // ...while the copy does not even contain the table.
    expect(r.copyError).not.toBeNull();
    expect(String(r.copyError)).toMatch(/no such table/i);
  });

  it('after TRUNCATE checkpoint the same copy is complete', () => {
    const live = path.join(tmpDir, 'ckpt-live.db');
    const copy = path.join(tmpDir, 'ckpt-copy.db');

    const r = pyJson<{ walBefore: number; walAfter: number; liveRows: number; copyRows: number }>(`
import sqlite3, shutil, os, json
live, copy = ${JSON.stringify(live)}, ${JSON.stringify(copy)}
def sz(p): return os.path.getsize(p) if os.path.exists(p) else 0

c = sqlite3.connect(live)
c.execute("PRAGMA journal_mode=WAL")
c.execute("CREATE TABLE payments (id INTEGER PRIMARY KEY, amount REAL)")
c.executemany("INSERT INTO payments (amount) VALUES (?)", [(i*1.5,) for i in range(1, 5001)])
c.commit()
wal_before = sz(live + "-wal")

# The fix: fold the WAL into the main file and empty it, then copy.
c.execute("PRAGMA wal_checkpoint(TRUNCATE)")
wal_after = sz(live + "-wal")
shutil.copyfile(live, copy)
live_rows = c.execute("SELECT COUNT(*) FROM payments").fetchone()[0]
c.close()

n = sqlite3.connect(copy)
copy_rows = n.execute("SELECT COUNT(*) FROM payments").fetchone()[0]
n.close()
print(json.dumps({"walBefore": wal_before, "walAfter": wal_after,
                  "liveRows": live_rows, "copyRows": copy_rows}))
`);

    expect(r.walBefore).toBeGreaterThan(0); // the sidecar held everything
    expect(r.walAfter).toBe(0);             // the checkpoint emptied it
    expect(r.liveRows).toBe(5000);
    expect(r.copyRows).toBe(5000);          // and the copy is now complete
    expect(sha256(copy)).toBe(sha256(live));
  });
});

describe('content verification catches what a size check cannot', () => {
  it('detects same-size, different-content files', () => {
    const a = path.join(tmpDir, 'a.db');
    const b = path.join(tmpDir, 'b.db');
    for (const f of [a, b]) {
      py(`
import sqlite3
c = sqlite3.connect(${JSON.stringify(f)})
c.execute("CREATE TABLE payments (id INTEGER PRIMARY KEY, amount REAL)")
c.executemany("INSERT INTO payments (amount) VALUES (?)", [(i*1.5,) for i in range(1, 101)])
c.commit()
c.close()
`);
    }

    const bufA = fs.readFileSync(a);
    const bufB = Buffer.from(bufA);
    bufA[bufA.length - 1] ^= 0xff;
    bufB[bufB.length - 1] ^= 0xaa;
    fs.writeFileSync(a, bufA);
    fs.writeFileSync(b, bufB);

    // Lengths agree...
    expect(fs.statSync(a).size).toBe(fs.statSync(b).size);
    // ...checksums do not. That is the check that matters.
    expect(sha256(a)).not.toBe(sha256(b));
  });

  it('confirms a faithful copy matches byte-for-byte', () => {
    const src = path.join(tmpDir, 'src.db');
    const dst = path.join(tmpDir, 'dst.db');
    py(`
import sqlite3
c = sqlite3.connect(${JSON.stringify(src)})
c.execute("CREATE TABLE payments (id INTEGER PRIMARY KEY, amount REAL)")
c.executemany("INSERT INTO payments (amount) VALUES (?)", [(i*1.5,) for i in range(1, 251)])
c.commit()
c.close()
`);
    fs.copyFileSync(src, dst);

    expect(sha256(src)).toBe(sha256(dst));
  });
});

describe('integrity_check distinguishes restorable from merely present', () => {
  it('returns ok for a healthy database', () => {
    const good = path.join(tmpDir, 'good.db');
    py(`
import sqlite3
c = sqlite3.connect(${JSON.stringify(good)})
c.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT)")
c.executemany("INSERT INTO users (email) VALUES (?)", [("u%d@example.com" % i,) for i in range(1, 30)])
c.commit()
c.close()
`);
    expect(py(`
import sqlite3
c = sqlite3.connect(${JSON.stringify(good)})
print(c.execute("PRAGMA integrity_check").fetchone()[0])
c.close()
`)).toBe('ok');
  });

  it('does not return ok for a same-size but corrupted file', () => {
    const bad = path.join(tmpDir, 'bad.db');
    py(`
import sqlite3
c = sqlite3.connect(${JSON.stringify(bad)})
c.execute("CREATE TABLE payments (id INTEGER PRIMARY KEY, amount REAL)")
c.executemany("INSERT INTO payments (amount) VALUES (?)", [(i*1.5,) for i in range(1, 5001)])
c.commit()
c.close()
`);

    const sizeBefore = fs.statSync(bad).size;
    const buf = fs.readFileSync(bad);
    for (let i = 512; i < buf.length - 512; i++) buf[i] = 0xff;
    fs.writeFileSync(bad, buf);

    const out = py(`
import sqlite3
try:
    c = sqlite3.connect(${JSON.stringify(bad)})
    print(c.execute("PRAGMA integrity_check").fetchone()[0])
    c.close()
except Exception as e:
    print("error: %s" % e)
`);

    expect(fs.statSync(bad).size).toBe(sizeBefore); // same size...
    expect(out).not.toBe('ok');                     // ...but provably corrupt
  });
});
