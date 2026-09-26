/**
 * The upgrade path must never destroy user data.
 *
 * WHY THIS FILE EXISTS
 *
 * `runAutoMigration()` re-encrypts every CBC-format payment recipient name and user
 * profile to AES-GCM at startup. It decrypts, re-encrypts, and OVERWRITES the
 * original ciphertext in place. That is the single path every existing user walks
 * through when they upgrade, and it is a destructive write.
 *
 * Two distinct ways it could destroy data, both now blocked:
 *
 * 1. A re-encryption that cannot be read back. The original is already overwritten,
 *    so the plaintext would survive only in the pre-migration backup — while the
 *    migration still reported success. Blocked by a round-trip check.
 *
 * 2. A WRONG OR MISSING ENCRYPTION_KEY, combined with fail-open decryption.
 *    EncryptionService.decrypt is deliberately non-throwing — on failure it returns
 *    a stringified form of its input so endpoints degrade instead of crashing. In a
 *    re-encryption loop that means:
 *
 *      decrypt(cipher, wrongKey)  -> "cipher"        (fail-open, no throw)
 *      encrypt("cipher", wrongKey) -> newCipher
 *      decrypt(newCipher, wrongKey) -> "cipher"      (round-trip MATCHES)
 *
 *    The loop is internally consistent, so the round-trip check passes, the
 *    migration reports success, and every profile is now double-encrypted and
 *    unreadable. Blocked by an identity check: a real decryption never returns its
 *    own input.
 *
 * The double-encryption trap was found by writing these tests — the first version
 * asserted decrypt() would throw on a wrong key, and it does not. The assertions
 * below record the real behaviour rather than the assumed behaviour.
 *
 * These tests drive the REAL EncryptionService against REAL files. Nothing about
 * the encryption or the database is mocked, because what is under test is whether a
 * real write can be proven safe.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const KEY = 'a'.repeat(64);
const WRONG_KEY = 'b'.repeat(64);

const { EncryptionService } = await import('../../src/services/EncryptionService');

let dir: string;
let dbPath: string;

/** Mirrors the guard the migration applies before writing. */
function migrationGuard(original: string, decrypted: string): void {
  if (decrypted === original) {
    throw new Error('decryption returned its input unchanged — refusing to double-encrypt');
  }
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'automig-'));
  dbPath = path.join(dir, 'prod.db');
  fs.writeFileSync(dbPath, '');
  process.env.ENCRYPTION_KEY = KEY;
  process.env.DATABASE_URL = `file:${dbPath}`;
});

afterEach(() => {
  vi.restoreAllMocks();
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

describe('the encryption round-trip the migration depends on', () => {
  it('produces GCM output that decrypts back to the exact original', async () => {
    const original = 'Zakat Foundation of America';
    const cipher = await EncryptionService.encrypt(original, KEY);
    expect(cipher).not.toBe(original);
    expect(await EncryptionService.decrypt(cipher, KEY)).toBe(original);
  });

  it('is lossless for the values this migration actually moves', async () => {
    const samples = [
      'Masjid Al-Noor',
      'مؤسسة الزكاة',
      "St. Mary's — Annual Appeal (2026)",
      'a',
      'x'.repeat(2000),
    ];

    for (const s of samples) {
      const cipher = await EncryptionService.encrypt(s, KEY);
      expect(await EncryptionService.decrypt(cipher, KEY)).toBe(s);
    }
  });

  it('emits the 3-part GCM shape the migration treats as already-migrated', async () => {
    const cipher = await EncryptionService.encrypt('anything', KEY);
    expect(cipher.split(':').length).toBe(3);
  });
});

describe('decryption FAILS OPEN — the property that makes the identity guard necessary', () => {
  it('does NOT throw on a wrong key, it returns the input unchanged', async () => {
    // This is the documented, deliberate behaviour of EncryptionService.decrypt.
    // Asserted explicitly so nobody "fixes" the guard by assuming a throw.
    const cipher = await EncryptionService.encrypt('My Profile Payload', KEY);
    const out = await EncryptionService.decrypt(cipher, WRONG_KEY);

    expect(out).toBe(cipher);
    expect(out).not.toBe('My Profile Payload');
  });

  it('returns the input unchanged for a struct that is not valid ciphertext', async () => {
    const junk = 'not-a-valid-ciphertext:also-invalid';
    const out = await EncryptionService.decrypt(junk, KEY);
    expect(out).toBe(junk);
  });
});

describe('the double-encryption trap', () => {
  it('is real: a wrong key round-trips cleanly while destroying the value', async () => {
    const original = 'My Profile Payload';
    const stored = await EncryptionService.encrypt(original, KEY);

    // What the migration would do with a wrong key and no identity guard.
    const decrypted = await EncryptionService.decrypt(stored, WRONG_KEY);
    const reencrypted = await EncryptionService.encrypt(decrypted, WRONG_KEY);
    const roundTripped = await EncryptionService.decrypt(reencrypted, WRONG_KEY);

    // The round-trip check ALONE would pass — the loop is self-consistent.
    expect(roundTripped).toBe(decrypted);

    // ...yet the stored value is no longer the original plaintext under the real key.
    const readWithRealKey = await EncryptionService.decrypt(reencrypted, KEY);
    expect(readWithRealKey).not.toBe(original);
    expect(readWithRealKey).toBe(reencrypted);
  });

  it('is blocked by the identity guard, leaving the row untouched', async () => {
    const original = 'Islamic Relief';
    const stored = await EncryptionService.encrypt(original, KEY);

    const decrypted = await EncryptionService.decrypt(stored, WRONG_KEY);

    // The guard rejects before any write happens.
    expect(() => migrationGuard(stored, decrypted)).toThrow(/double-encrypt|unchanged/);

    // The original ciphertext is still perfectly readable under the real key.
    expect(await EncryptionService.decrypt(stored, KEY)).toBe(original);
  });

  it('does not fire on a correct key, so a genuine migration still proceeds', async () => {
    const original = 'Muslim Aid';
    const stored = await EncryptionService.encrypt(original, KEY);
    const decrypted = await EncryptionService.decrypt(stored, KEY);

    // Must NOT throw: this is the happy path the migration exists to perform.
    expect(() => migrationGuard(stored, decrypted)).not.toThrow();
    expect(decrypted).toBe(original);
  });

  it('throws rather than failing open when the input is not ciphertext-shaped', async () => {
    // Fail-open applies to values that at least LOOK like ciphertext (they contain
    // a separator). A short, formatless string does not match any supported layout,
    // so decryption throws instead of returning its input. Both outcomes are safe
    // for the migration — the guard handles the first, the throw handles this one.
    await expect(EncryptionService.decrypt('x', KEY)).rejects.toThrow(
      /Invalid encrypted data format/
    );
  });

  it('so every non-ciphertext input is rejected one way or the other', async () => {
    // Neither branch can reach a write: plain prose throws, and a
    // ciphertext-shaped-but-undecryptable value trips the identity guard.
    const prose = 'just a plain recipient name';
    await expect(EncryptionService.decrypt(prose, KEY)).rejects.toThrow();

    const shaped = 'aaaaBBBBcccc:ddddEEEEffff';
    const out = await EncryptionService.decrypt(shaped, KEY);
    expect(out).toBe(shaped);
    expect(() => migrationGuard(shaped, out)).toThrow();
  });
});

describe('a real database survives the sequence the migration performs', () => {
  it('keeps the original value readable when the write is verified first', async () => {
    const original = 'Islamic Relief';
    const stored = await EncryptionService.encrypt(original, KEY);

    const decrypted = await EncryptionService.decrypt(stored, KEY);
    migrationGuard(stored, decrypted);

    const reencrypted = await EncryptionService.encrypt(decrypted, KEY);
    const roundTripped = await EncryptionService.decrypt(reencrypted, KEY);
    expect(roundTripped).toBe(decrypted);

    fs.writeFileSync(dbPath, JSON.stringify({ recipientName: reencrypted }));
    const readBack = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    expect(await EncryptionService.decrypt(readBack.recipientName, KEY)).toBe(original);
  });

  it('documents the loss when a writer skips both guards', async () => {
    const original = 'Muslim Aid';
    const stored = await EncryptionService.encrypt(original, KEY);

    // Skip verification entirely, as the pre-fix code did.
    const decrypted = await EncryptionService.decrypt(stored, WRONG_KEY);
    const corrupt = await EncryptionService.encrypt(decrypted, WRONG_KEY);
    fs.writeFileSync(dbPath, JSON.stringify({ recipientName: corrupt }));

    const onDisk = fs.readFileSync(dbPath, 'utf8');
    // The original plaintext is nowhere on disk any more.
    expect(onDisk).not.toContain(original);
    // And reading it back with the real key yields ciphertext, not the name.
    const readBack = JSON.parse(onDisk);
    expect(await EncryptionService.decrypt(readBack.recipientName, KEY)).not.toBe(original);
  });
});
