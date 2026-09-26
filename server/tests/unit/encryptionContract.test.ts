/**
 * EncryptionService — round-trip, confidentiality, and integrity contract.
 *
 * The existing suites cover ZK1 format DETECTION (12 tests) and a few
 * decryption-tolerance cases (3). Neither covers what actually matters for user
 * data at rest: that a value survives a round trip, that it is unreadable without
 * the key, and that tampering is not silently accepted.
 *
 * Everything here runs against the real implementation — nothing is mocked,
 * because the point is real AES-256-GCM behaviour.
 *
 * THE HEADLINE: the encryption primitives are correct (AES-256-GCM, 12-byte IV,
 * 16-byte tag, fresh IV per operation — all verified below). But the service
 * layer FAILS OPEN. Three distinct weaknesses are pinned here as executable
 * documentation, each in its own describe block, each asserting ACTUAL behaviour.
 * If any of them is ever fixed, these tests are where the change must show up.
 */

import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../../src/services/EncryptionService';
import crypto from 'crypto';

// A valid 32-character key (the service asserts exactly this length).
const KEY = 'test-encryption-key-32-chars-ok!';
const KEY_B = 'another-encryption-key-32-chars!!';

describe('round trip: data survives encryption and decryption', () => {
  it('recovers the exact plaintext for an async string round trip', async () => {
    const plaintext = 'Zakat due: 1234.56 USD';
    const ciphertext = await EncryptionService.encrypt(plaintext, KEY);
    expect(await EncryptionService.decrypt(ciphertext, KEY)).toBe(plaintext);
  });

  it.each([
    ['a single space', ' '],
    ['unicode / arabic', 'زكاة ١٢٣٤٫٥٦'],
    ['emoji', 'zakat 🕌 due'],
    ['long text', 'x'.repeat(50_000)],
    ['json', JSON.stringify({ amount: 1234.56, currency: 'USD' })],
    ['newlines and tabs', 'line1\nline2\ttabbed'],
  ])('round-trips %s', async (_label, plaintext) => {
    const ciphertext = await EncryptionService.encrypt(plaintext, KEY);
    expect(await EncryptionService.decrypt(ciphertext, KEY)).toBe(plaintext);
  });

  it('produces a different ciphertext each time (unique IV, no reuse)', async () => {
    const plaintext = 'same value every time';
    const a = await EncryptionService.encrypt(plaintext, KEY);
    const b = await EncryptionService.encrypt(plaintext, KEY);

    expect(a).not.toBe(b);
    expect(await EncryptionService.decrypt(a, KEY)).toBe(plaintext);
    expect(await EncryptionService.decrypt(b, KEY)).toBe(plaintext);
  });

  it('uses a fresh 12-byte IV per encryption, and it is never all-zeros', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 25; i++) {
      const ct = await EncryptionService.encrypt(`value-${i}`, KEY);
      const iv = Buffer.from(ct.split(':')[0], 'base64');
      expect(iv.length).toBe(12);
      expect(iv.equals(Buffer.alloc(12))).toBe(false);
      seen.add(ct.split(':')[0]);
    }
    expect(seen.size).toBe(25);
  });

  it('round-trips structured asset data in canonical field order', async () => {
    // Canonical order matters — see the checksum block below.
    const asset = { type: 'cash', value: 1234.56, currency: 'USD', metadata: { bank: 'x' } };
    const ciphertext = await EncryptionService.encryptAssetData(asset, KEY);
    const recovered = await EncryptionService.decryptAssetData(ciphertext, KEY);
    expect(recovered).toMatchObject(asset);
  });
});

describe('confidentiality: the key is genuinely required', () => {
  it('never returns the plaintext when the wrong key is used', async () => {
    const secret = 'sensitive balance 98765';
    const ciphertext = await EncryptionService.encrypt(secret, KEY);

    // NOTE: it does not throw — it returns the ciphertext (see the fail-open
    // block). What matters here is that the SECRET is not disclosed.
    let out: unknown;
    try {
      out = await EncryptionService.decrypt(ciphertext, KEY_B);
    } catch {
      out = '<threw>';
    }
    expect(String(out)).not.toContain(secret);
  });

  it('the ciphertext does not contain the plaintext', async () => {
    const secret = 'SUPER-SECRET-VALUE-98765';
    const ciphertext = await EncryptionService.encrypt(secret, KEY);
    const decoded = Buffer.from(ciphertext.replace(/:/g, ''), 'base64').toString('binary');
    expect(ciphertext).not.toContain(secret);
    expect(decoded).not.toContain(secret);
  });

  it('different keys produce different ciphertext for the same input', async () => {
    expect(await EncryptionService.encrypt('same', KEY)).not.toBe(
      await EncryptionService.encrypt('same', KEY_B)
    );
  });

  it('does not leak plaintext through the IV or the tag', async () => {
    const secret = 'leak-check-abcdef';
    const [iv, , tag] = (await EncryptionService.encrypt(secret, KEY)).split(':');
    expect(Buffer.from(iv, 'base64').toString('utf8')).not.toContain(secret);
    expect(Buffer.from(tag, 'base64').toString('utf8')).not.toContain(secret);
  });
});

describe('the format is what it claims to be', () => {
  it('emits iv:ciphertext:tag, all base64, 12-byte IV and 16-byte tag', async () => {
    const ct = await EncryptionService.encrypt('format check', KEY);
    const parts = ct.split(':');
    expect(parts).toHaveLength(3);

    const [iv, body, tag] = parts;
    expect(Buffer.from(iv, 'base64').length).toBe(12);
    expect(Buffer.from(tag, 'base64').length).toBe(16);
    expect(body.length).toBeGreaterThan(0);
    for (const p of parts) expect(p).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('ciphertext length grows with plaintext length', async () => {
    const small = await EncryptionService.encrypt('a', KEY);
    const large = await EncryptionService.encrypt('a'.repeat(1000), KEY);
    expect(large.length).toBeGreaterThan(small.length);
  });

  it('isEncrypted recognises its own output', async () => {
    expect(EncryptionService.isEncrypted(await EncryptionService.encrypt('detect me', KEY))).toBe(
      true
    );
  });

  it('uses AES-256-GCM — the ciphertext body is exactly plaintext-length for GCM', async () => {
    // GCM is a stream cipher: body length == plaintext length. CBC would differ.
    // This distinguishes the two and pins the mode.
    const plaintext = 'exactly-twenty-chars';
    const body = Buffer.from((await EncryptionService.encrypt(plaintext, KEY)).split(':')[1], 'base64');
    expect(body.length).toBe(Buffer.byteLength(plaintext, 'utf8'));
  });
});

describe('key handling', () => {
  it('accepts a base64-encoded 32-byte key', async () => {
    const b64 = crypto.randomBytes(32).toString('base64');
    const ct = await EncryptionService.encrypt('base64 key test', b64);
    expect(await EncryptionService.decrypt(ct, b64)).toBe('base64 key test');
  });

  it('generateKey produces a usable key', async () => {
    const k = EncryptionService.generateKey();
    const ct = await EncryptionService.encrypt('generated key test', k);
    expect(await EncryptionService.decrypt(ct, k)).toBe('generated key test');
  });

  it('normalizeKey silently pads or truncates an off-length key rather than rejecting it', async () => {
    // The constructor enforces 32 chars for ENCRYPTION_KEY, but normalizeKey
    // pads short keys and truncates long ones. So a short key is accepted here.
    // Documented, not endorsed: a silently padded key is easy to get wrong across
    // environments.
    const ct = await EncryptionService.encrypt('short key value', 'short-key');
    expect(await EncryptionService.decrypt(ct, 'short-key')).toBe('short key value');
  });
});

describe('KNOWN DEFECT 1: decrypt FAILS OPEN on unencrypted input', () => {
  /**
   * `decrypt` returns the input unchanged when it parses as JSON but is not an
   * encrypted-object shape (line ~175), and JSON.stringify(input) for a
   * non-encrypted object (line ~153). So input that was NEVER encrypted comes
   * back as "successfully decrypted".
   *
   * Consequence: a caller cannot tell "this was never encrypted" from "this
   * decrypted correctly". A bug that stores plaintext would be invisible.
   */
  it('returns a JSON string input unchanged instead of failing', async () => {
    const plainJson = JSON.stringify({ amount: 100, currency: 'USD' });
    expect(await EncryptionService.decrypt(plainJson, KEY)).toBe(plainJson);
  });

  it('returns a non-encrypted object as its JSON representation', async () => {
    const obj = { amount: 100, currency: 'USD' };
    expect(await EncryptionService.decrypt(obj, KEY)).toBe(JSON.stringify(obj));
  });

  it('cannot distinguish "never encrypted" from "decrypted fine"', async () => {
    const plainJson = JSON.stringify({ amount: 100 });
    const reallyDecrypted = await EncryptionService.decrypt(
      await EncryptionService.encrypt(plainJson, KEY),
      KEY
    );
    const passedThrough = await EncryptionService.decrypt(plainJson, KEY);

    // Identical results from an encrypted and an unencrypted input. The whole
    // hazard in one assertion.
    expect(passedThrough).toBe(reallyDecrypted);
  });

  it('plain text with no separators DOES throw — the fail-open is JSON-specific', async () => {
    // Precise boundary of the weakness: the permissive paths are the JSON-shaped
    // branch and the non-encrypted-object branch. A bare string with no separator
    // and no JSON shape fails the format regex and throws. So this is NOT a general
    // "anything decrypts" hole — it is specifically structured input that passes
    // through unverified.
    await expect(EncryptionService.decrypt('just some plain text', KEY)).rejects.toThrow(
      /invalid encrypted data format/i
    );
  });
});

describe('KNOWN DEFECT 2: tampering is NOT reported to the caller', () => {
  /**
   * AES-256-GCM authenticates ciphertext, and the primitive DOES detect tampering
   * — verified: a modified body makes crypto throw "Unsupported state or unable to
   * authenticate data".
   *
   * But decrypt's format attempts are wrapped in nested try/catch, and the last
   * resort is `return String(ed)` (line ~237). So the authentication failure is
   * swallowed and the raw input is returned as though decryption succeeded.
   *
   * `decryptObject` compounds this: its catch returns a stringified form of the
   * original input "so callers can avoid crashing". Integrity is therefore not
   * enforced anywhere in the decryption path — corrupted data is served silently.
   */
  it('a modified ciphertext body is returned as-is instead of raising', async () => {
    const ct = await EncryptionService.encrypt('original amount 100', KEY);
    const [iv, body, tag] = ct.split(':');
    const buf = Buffer.from(body, 'base64');
    buf[Math.floor(buf.length / 2)] ^= 0xff;
    const tampered = `${iv}:${buf.toString('base64')}:${tag}`;

    const out = await EncryptionService.decrypt(tampered, KEY);
    // No throw. The tampered input comes back out.
    expect(out).toBe(tampered);
    expect(out).not.toBe('original amount 100');
  });

  it('the GCM primitive itself DOES detect it — the service discards that fact', () => {
    // Direct crypto, same key/format: authentication failure is real.
    const key = Buffer.from(KEY.slice(0, 32), 'utf8');
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', key, iv);
    const bodyBuf = Buffer.concat([c.update('original amount 100', 'utf8'), c.final()]);
    const tag = c.getAuthTag();

    bodyBuf[0] ^= 0xff;
    const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(tag);
    expect(() => Buffer.concat([d.update(bodyBuf), d.final()])).toThrow();
  });

  it('a swapped authentication tag is also returned as-is', async () => {
    const ctA = await EncryptionService.encrypt('value A', KEY);
    const ctB = await EncryptionService.encrypt('value B', KEY);
    const [ivA, bodyA] = ctA.split(':');
    const tagB = ctB.split(':')[2];
    const frankenstein = `${ivA}:${bodyA}:${tagB}`;

    // Silently accepted rather than rejected.
    expect(await EncryptionService.decrypt(frankenstein, KEY)).toBe(frankenstein);
  });

  it('a modified IV is also returned as-is', async () => {
    const ct = await EncryptionService.encrypt('value', KEY);
    const [, body, tag] = ct.split(':');
    const badIv = Buffer.alloc(12, 7).toString('base64');
    const mutated = `${badIv}:${body}:${tag}`;
    expect(await EncryptionService.decrypt(mutated, KEY)).toBe(mutated);
  });

  it('decryptObject also fails open rather than throwing', async () => {
    // The comment in the source is explicit: "do not throw from this helper...
    // so callers can inspect/parse it (and avoid crashing endpoints like /me)".
    const result = await EncryptionService.decryptObject<{ amount: number }>(
      'not-encrypted-at-all',
      KEY
    );
    expect(result).toBe('not-encrypted-at-all');
  });
});

describe('KNOWN DEFECT 3: the asset checksum is order-sensitive', () => {
  /**
   * `encryptAssetData` computes `hash(JSON.stringify(assetData))` — key order is
   * whatever the object literal happened to have.
   *
   * `decryptAssetData` recomputes `hash(JSON.stringify({ type, value, currency,
   * metadata }))` — a FIXED order.
   *
   * The two only agree when the caller happens to pass canonical order. Any
   * caller that constructs the object differently gets a spurious "integrity
   * check failed" on data that is perfectly intact.
   *
   * This works today only because there are no callers outside the service yet:
   * `encryptAssetData`/`decryptAssetData` are not referenced anywhere else in the
   * codebase. So this is a latent landmine, not an active bug — pinned before a
   * caller is written.
   */
  it('succeeds when the caller uses canonical order', async () => {
    const ct = await EncryptionService.encryptAssetData(
      { type: 'cash', value: 100, currency: 'USD' },
      KEY
    );
    await expect(EncryptionService.decryptAssetData(ct, KEY)).resolves.toBeDefined();
  });

  it('FAILS with a false integrity error when the caller reorders the same fields', async () => {
    // Identical data, different construction order.
    const ct = await EncryptionService.encryptAssetData(
      { value: 100, type: 'cash', currency: 'USD' },
      KEY
    );

    // Nothing is corrupt. The checksum simply does not match, because
    // JSON.stringify preserved the insertion order used at encryption time.
    await expect(EncryptionService.decryptAssetData(ct, KEY)).rejects.toThrow(
      /integrity check failed/i
    );
  });

  it('proves the data itself is intact — only the checksum disagrees', async () => {
    const reordered = { value: 100, type: 'cash', currency: 'USD' };
    const ct = await EncryptionService.encryptAssetData(reordered, KEY);

    // Decrypting the raw payload succeeds and yields every field correctly.
    const raw = await EncryptionService.decryptObject<Record<string, unknown>>(ct, KEY);
    expect(raw).toMatchObject(reordered);

    // ...yet the public helper rejects it. The failure is in the check, not the data.
    await expect(EncryptionService.decryptAssetData(ct, KEY)).rejects.toThrow();
  });

  it('JSON.stringify key order is what drives it (the mechanism)', () => {
    expect(JSON.stringify({ type: 'a', value: 1 })).not.toBe(JSON.stringify({ value: 1, type: 'a' }));
  });
});

describe('KNOWN DEFECT 4: validateConfiguration() always returns false', () => {
  /**
   * It discards `cipher.update(...)`'s return value and only uses `cipher.final()`.
   * In GCM, `final()` for a 20-byte input returns 0 bytes (the stream cipher
   * already emitted everything), so the ciphertext is empty, decryption fails, and
   * the method returns false.
   *
   * Verified by direct reproduction: cipher.final() length 0, decryption throws
   * "Unsupported state or unable to authenticate data".
   *
   * Impact is currently low because the method is DEAD CODE — it is not called
   * anywhere in src/ (the only other `validateConfiguration` is an unrelated
   * method on JWTService). But as written it can never validate anything, so it
   * must not be wired into a startup health check as-is.
   */
  it('returns false in a correctly configured environment', () => {
    // A false negative: configuration is fine (the round trips above all pass),
    // yet the validator reports failure.
    expect(EncryptionService.validateConfiguration()).toBe(false);
  });

  it('the cause is a discarded update() — final() alone returns no ciphertext', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const data = 'test_encryption_data';

    const c = crypto.createCipheriv('aes-256-gcm', key, iv);
    c.update(data, 'utf8'); // return value discarded — the exact bug
    const truncated = c.final();
    expect(truncated.length).toBe(0);

    const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(c.getAuthTag());
    expect(() => Buffer.concat([d.update(truncated), d.final()])).toThrow();

    // Correct construction round-trips the data.
    const c2 = crypto.createCipheriv('aes-256-gcm', key, iv);
    const full = Buffer.concat([c2.update(data, 'utf8'), c2.final()]);
    const d2 = crypto.createDecipheriv('aes-256-gcm', key, iv);
    d2.setAuthTag(c2.getAuthTag());
    expect(Buffer.concat([d2.update(full), d2.final()]).toString()).toBe(data);
  });
});
