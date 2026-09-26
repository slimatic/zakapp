/**
 * Reading numeric values out of encrypted columns.
 *
 * WHY THIS FILE EXISTS
 *
 * Thirteen columns across the schema are `String // Encrypted` but semantically
 * numeric — money and thresholds. Reading one without decrypting does not crash; it
 * produces NaN, and NaN is quiet:
 *
 *   sum + NaN        -> NaN            (totals become "NaN")
 *   x < NaN          -> false          (a branch silently never runs)
 *   JSON.stringify   -> {"a":null}     (the value disappears from a payload)
 *
 * That defect has been found THREE times in this codebase in three different layers:
 * the payment API (0.16.7), the daily summary job, and the live Hawl tracking path.
 * These tests cover the shared helper those paths now use.
 *
 * They deliberately assert against the REAL EncryptionService with REAL ciphertext.
 * A test that fed plain numbers through would pass against the broken code and prove
 * nothing.
 */

import { describe, it, expect, beforeEach } from 'vitest';

const KEY = 'a'.repeat(64);

const { EncryptionService } = await import('../../src/services/EncryptionService');
const { readEncryptedAmount, tryReadEncryptedAmount, decryptNumericFields } = await import(
  '../../src/utils/encryptedNumbers'
);

beforeEach(() => {
  process.env.ENCRYPTION_KEY = KEY;
});

describe('the ordering trap that causes the bug', () => {
  it('isEncrypted() misreports the ciphertext of a short plaintext', async () => {
    // A GCM ciphertext is ivB64:bodyB64:tagB64 and isEncrypted() requires every
    // group to be >= 12 chars. A plaintext shorter than 7 characters encrypts to a
    // body under that, so isEncrypted() says "not encrypted" — and code that trusts
    // it then runs parseFloat() on the ciphertext.
    for (const short of ['1', '50', '500', '1234']) {
      const cipher = await EncryptionService.encrypt(short, KEY);
      expect(EncryptionService.isEncrypted(cipher)).toBe(false);
      // …and yet it IS ciphertext, and must be read as such.
      expect(await readEncryptedAmount(cipher, KEY)).toBeCloseTo(parseFloat(short), 6);
    }
  });

  it('reads correctly whether or not isEncrypted() agrees', async () => {
    for (const value of ['1', '500', '1234.56', '1234567.89']) {
      const cipher = await EncryptionService.encrypt(value, KEY);
      expect(await readEncryptedAmount(cipher, KEY)).toBeCloseTo(parseFloat(value), 6);
    }
  });
});

describe('NaN is what the old code produced', () => {
  it('Number() of ciphertext is NaN — the raw defect', async () => {
    const cipher = await EncryptionService.encrypt('2500', KEY);
    expect(Number.isNaN(Number(cipher))).toBe(true);
    // The fix returns the real value instead.
    expect(await readEncryptedAmount(cipher, KEY)).toBeCloseTo(2500, 6);
  });

  it('a NaN comparison silently takes one branch — the invisible part', () => {
    // This is why the Hawl interruption check never fired: `wealth < NaN` is false,
    // so the "wealth dropped to zero" branch was unreachable.
    expect(0 < NaN).toBe(false);
    expect(999999 < NaN).toBe(false);
    expect(NaN >= 0).toBe(false);
  });

  it('NaN disappears from JSON, which hides the value entirely', () => {
    expect(JSON.parse(JSON.stringify({ threshold: NaN })).threshold).toBeNull();
  });
});

describe('plain values keep working — no regression for existing rows', () => {
  it('reads plain numeric strings and numbers', async () => {
    expect(await readEncryptedAmount('1875.50', KEY)).toBeCloseTo(1875.5, 6);
    expect(await readEncryptedAmount(1875.5, KEY)).toBeCloseTo(1875.5, 6);
  });

  it('reads zero, negatives and high precision', async () => {
    expect(await readEncryptedAmount('0', KEY)).toBe(0);
    expect(await readEncryptedAmount(0, KEY)).toBe(0);
    expect(await readEncryptedAmount('-5', KEY)).toBe(-5);
    expect(await readEncryptedAmount('0.025', KEY)).toBeCloseTo(0.025, 9);
  });

  it('treats null/undefined as zero', async () => {
    expect(await readEncryptedAmount(null, KEY)).toBe(0);
    expect(await readEncryptedAmount(undefined, KEY)).toBe(0);
  });
});

describe('unreadable values never become a silent NaN', () => {
  it('readEncryptedAmount throws', async () => {
    await expect(readEncryptedAmount('not-ciphertext', KEY)).rejects.toThrow();
  });

  it('throws for ciphertext under a different key', async () => {
    const cipher = await EncryptionService.encrypt('2500', 'b'.repeat(64));
    await expect(readEncryptedAmount(cipher, KEY)).rejects.toThrow();
  });

  it('tryReadEncryptedAmount returns null, NOT zero', async () => {
    // Zero is a real amount. Returning it for an unreadable value would present
    // "could not read this" as "this is zero" — the same class of quiet wrongness.
    const result = await tryReadEncryptedAmount('garbage', KEY);
    expect(result).toBeNull();
    expect(result).not.toBe(0);
  });
});

describe('decryptNumericFields reports what it could not read', () => {
  it('decrypts the named fields and leaves others alone', async () => {
    const row = {
      id: 'snap-1',
      status: 'DRAFT',
      nisabThresholdAtStart: await EncryptionService.encrypt('8750', KEY),
      totalWealth: await EncryptionService.encrypt('25000', KEY),
    };

    const { row: out, unreadable } = await decryptNumericFields(
      row,
      ['nisabThresholdAtStart', 'totalWealth'],
      KEY
    );

    expect(out.nisabThresholdAtStart).toBeCloseTo(8750, 6);
    expect(out.totalWealth).toBeCloseTo(25000, 6);
    // Untouched fields survive.
    expect(out.id).toBe('snap-1');
    expect(out.status).toBe('DRAFT');
    expect(unreadable).toEqual([]);
  });

  it('lists unreadable fields instead of hiding them', async () => {
    const row = {
      totalWealth: await EncryptionService.encrypt('25000', KEY),
      nisabThresholdAtStart: 'corrupted-value',
    };

    const { row: out, unreadable } = await decryptNumericFields(
      row,
      ['totalWealth', 'nisabThresholdAtStart'],
      KEY
    );

    expect(out.totalWealth).toBeCloseTo(25000, 6);
    expect(unreadable).toEqual(['nisabThresholdAtStart']);
    // The raw value is left in place rather than replaced with a plausible number.
    expect(out.nisabThresholdAtStart).toBe('corrupted-value');
  });

  it('does not mutate the caller’s object', async () => {
    const cipher = await EncryptionService.encrypt('25000', KEY);
    const row = { totalWealth: cipher };
    await decryptNumericFields(row, ['totalWealth'], KEY);
    // The caller may still need the original (e.g. to write it back).
    expect(row.totalWealth).toBe(cipher);
  });

  it('ignores absent and null fields', async () => {
    const { unreadable } = await decryptNumericFields(
      { totalWealth: null, other: 'x' },
      ['totalWealth', 'notPresent'],
      KEY
    );
    expect(unreadable).toEqual([]);
  });
});

describe('the live Hawl panel can now be computed', () => {
  it('reports ABOVE_NISAB for a user genuinely above the threshold', async () => {
    // Reproduces what calculateLiveHawlData does after decryption. Under the old
    // code currentWealth >= NaN was always false, so this always read BELOW_NISAB.
    const record = {
      nisabThresholdAtStart: await EncryptionService.encrypt('8750', KEY),
      totalWealth: await EncryptionService.encrypt('25000', KEY),
    };
    const currentWealth = 25000;

    const { row: dec } = await decryptNumericFields(record, Object.keys(record), KEY);
    const threshold = Number(dec.nisabThresholdAtStart);

    expect(currentWealth >= threshold).toBe(true);
    const percentageOfNisab = (currentWealth / threshold) * 100;
    expect(percentageOfNisab).toBeCloseTo(285.71, 1);
    expect(Number.isFinite(percentageOfNisab)).toBe(true);
  });

  it('reports BELOW_NISAB correctly when genuinely below', async () => {
    const record = { nisabThresholdAtStart: await EncryptionService.encrypt('8750', KEY) };
    const { row: dec } = await decryptNumericFields(record, Object.keys(record), KEY);
    const threshold = Number(dec.nisabThresholdAtStart);

    // Now the comparison is meaningful in BOTH directions — the old code could only
    // ever return false, so it never actually distinguished these cases.
    expect(2500 >= threshold).toBe(false);
    expect(25000 >= threshold).toBe(true);
  });

  it('does not divide by zero when the threshold is missing', () => {
    const nisabThreshold = 0;
    const percentageOfNisab = nisabThreshold > 0 ? (25000 / nisabThreshold) * 100 : 0;
    expect(Number.isFinite(percentageOfNisab)).toBe(true);
    expect(percentageOfNisab).toBe(0);
  });
});
