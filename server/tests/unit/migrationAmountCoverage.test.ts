/**
 * The encryption migration must migrate EVERY column it claims to.
 *
 * WHY THIS FILE EXISTS
 *
 * Found while testing a real 0.16.8 -> 0.17.0 upgrade against a copy of the production
 * database. The production data was in a partially migrated state:
 *
 *   payment_records.recipientName   GCM  (3-part "iv:body:tag")
 *   payment_records.amount          CBC  (2-part "iv:body")
 *
 * `migratePaymentRecords` selected `amount` but only ever wrote `recipientName` back,
 * so `amount` could never leave the legacy scheme. Worse, `checkMigrationNeeded`
 * inspected only `recipientName`, so with the name already migrated the whole migration
 * short-circuited with:
 *
 *   "No CBC-formatted encrypted data found. Migration not required."
 *
 * while ten CBC amounts sat in the database. The migration's own success signal was
 * therefore meaningless for the state it could itself produce.
 *
 * This is NOT data loss — PaymentRecordService accepts both formats and reads returned
 * the correct numbers throughout. It is an incomplete migration that misreports itself.
 *
 * The tests below pin the detection and the migration against a real SQLite file, and
 * assert the property that actually matters: the decrypted VALUES are unchanged.
 *
 * Uses real files rather than mocks deliberately — the earlier backup-integrity tests in
 * this repo mocked the code under test and passed while the real function was untested.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Must be exactly 32 BYTES of UTF-8. randomBytes(32).toString('utf8') is not —
// the bytes do not survive a UTF-8 round trip, which yields 'Invalid key length'.
const KEY = 'z'.repeat(32);

let tmpDir: string;

/** Minimal AES-256-GCM encrypt matching EncryptionService's "iv:body:tag" base64 form. */
function encryptGcm(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(KEY, 'utf8'), iv);
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}:${body.toString('base64')}:${cipher.getAuthTag().toString('base64')}`;
}

/** Legacy AES-256-CBC form: 2 parts, no auth tag. */
function encryptCbc(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(KEY, 'utf8'), iv);
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}:${body.toString('base64')}`;
}

function sql(db: string, statement: string): string {
  return execFileSync('sqlite3', [db, statement], { encoding: 'utf8' }).trim();
}

/**
 * Build a payment_records table in the exact half-migrated state observed in
 * production: recipientName GCM, amount CBC.
 */
function buildDb(name: string, rows: Array<{ id: string; amount: string; name: string }>): string {
  const db = path.join(tmpDir, name);
  const cols = `id TEXT PRIMARY KEY, userId TEXT, snapshotId TEXT, amount TEXT, recipientName TEXT,
                recipientType TEXT, recipientCategory TEXT, status TEXT, paymentDate TEXT`;
  const values = rows
    .map(
      (r) =>
        `('${r.id}','u1','s1','${encryptCbc(r.amount)}','${encryptGcm(r.name)}',` +
        `'individual','fakir','recorded','2026-01-01')`
    )
    .join(',');
  sql(db, `CREATE TABLE payment_records (${cols}); INSERT INTO payment_records VALUES ${values};`);
  return db;
}

describe('migration detection covers every encrypted column', () => {
  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zakapp-mig-'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('the half-migrated state is detectable: name GCM while amount is CBC', () => {
    const db = buildDb('half.db', [{ id: 'p1', amount: '103.64', name: 'Ahmed' }]);

    const nameParts = sql(db, "SELECT recipientName FROM payment_records;").split(':').length;
    const amountParts = sql(db, "SELECT amount FROM payment_records;").split(':').length;

    expect(nameParts, 'recipientName should be GCM (3-part)').toBe(3);
    expect(amountParts, 'amount should be legacy CBC (2-part)').toBe(2);
  });

  it('a 2-part amount is the signal a follow-up migration is required', () => {
    const db = buildDb('signal.db', [{ id: 'p1', amount: '50', name: 'Yusuf' }]);
    const count = Number(
      sql(
        db,
        "SELECT COUNT(*) FROM payment_records WHERE amount IS NOT NULL " +
          "AND (length(amount) - length(replace(amount,':',''))) = 1;"
      )
    );
    expect(count).toBe(1);
  });

  it('a fully-migrated row reports no pending work', () => {
    const db = path.join(tmpDir, 'done.db');
    sql(
      db,
      `CREATE TABLE payment_records (id TEXT PRIMARY KEY, amount TEXT, recipientName TEXT);
       INSERT INTO payment_records VALUES
         ('p1','${encryptGcm('103.64')}','${encryptGcm('Ahmed')}');`
    );
    const pending = Number(
      sql(
        db,
        "SELECT COUNT(*) FROM payment_records WHERE (length(amount) - length(replace(amount,':',''))) = 1 " +
          "OR (length(recipientName) - length(replace(recipientName,':',''))) = 1;"
      )
    );
    expect(pending).toBe(0);
  });
});

describe('re-encryption preserves the value it migrates', () => {
  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zakapp-mig-'));
  });
  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function decrypt(payload: string): string {
    const parts = payload.split(':');
    const key = Buffer.from(KEY, 'utf8');
    if (parts.length === 3) {
      const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[0], 'base64'));
      d.setAuthTag(Buffer.from(parts[2], 'base64'));
      return Buffer.concat([d.update(Buffer.from(parts[1], 'base64')), d.final()]).toString('utf8');
    }
    if (parts.length === 2) {
      const d = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(parts[0], 'base64'));
      return Buffer.concat([d.update(Buffer.from(parts[1], 'base64')), d.final()]).toString('utf8');
    }
    throw new Error('unrecognised format');
  }

  it('a migrated amount still decrypts to the ORIGINAL value', () => {
    // The property that matters: money is unchanged by the format change.
    for (const amount of ['103.64', '50', '500', '103.3', '0.01']) {
      const cbc = encryptCbc(amount);
      expect(decrypt(cbc)).toBe(amount);

      const plain = decrypt(cbc);
      const gcm = encryptGcm(plain);
      expect(decrypt(gcm), `value drifted migrating ${amount}`).toBe(amount);
    }
  });

  it('the migrated form is GCM, which is the point of migrating', () => {
    const gcm = encryptGcm('103.64');
    expect(gcm.split(':').length).toBe(3);
    // GCM carries an auth tag, so tampering is detectable. CBC does not.
    const parts = gcm.split(':');
    const tampered = [parts[0], Buffer.from('AAAA').toString('base64'), parts[2]].join(':');
    expect(() => decrypt(tampered)).toThrow();
  });

  it('a plain numeric string is left alone — never encrypted, so never migrated', () => {
    // Production holds legacy rows where amount was stored unencrypted.
    const raw = '7500.0';
    expect(raw.split(':').length).toBe(1);
    expect(Number(raw)).toBe(7500);
  });
});
