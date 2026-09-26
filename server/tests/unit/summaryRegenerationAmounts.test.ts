/**
 * The summary regeneration job must read encrypted amounts, not stringify them.
 *
 * WHY THIS FILE EXISTS
 *
 * `regenerateSummaries` runs daily at 4 AM and rewrites `AnnualSummary` totals for
 * recently-updated finalized snapshots. It read amounts with a bare
 * `Number(payment.amount)`.
 *
 * But `PaymentRecord.amount`, `YearlySnapshot.zakatAmount` and
 * `YearlySnapshot.nisabThreshold` are all `String // Encrypted` in the schema, and
 * production holds real ciphertext:
 *
 *   "HWXQ098Y/CRwFrkCo2j/Og==:7aqR3gmgwjBIlBBwiCNWJQ=="
 *
 * `Number()` of that is `NaN`. `NaN` propagates through every sum, so the job would
 * have written the literal string "NaN" into totalZakatPaid, totalZakatCalculated and
 * outstandingZakat, and `null` into nisabInfo.threshold (because JSON.stringify
 * renders NaN as null).
 *
 * It was not yet damaging production only because no snapshot had reached
 * `finalized` — the job filters on that status and found zero rows. It would have
 * corrupted the first user to finalize one.
 *
 * This is the 0.16.7 payment-NaN defect reached from the scheduled-job side instead
 * of the API. Same root cause, different entry point.
 *
 * These tests use the REAL EncryptionService with real ciphertext. A test that fed
 * plain numbers through would pass against the broken code and prove nothing.
 */

import { describe, it, expect, beforeEach } from 'vitest';

const KEY = 'a'.repeat(64);

const { EncryptionService } = await import('../../src/services/EncryptionService');
const { readEncryptedAmount } = await import('../../src/jobs/regenerateSummaries');

beforeEach(() => {
  process.env.ENCRYPTION_KEY = KEY;
});

describe('real ciphertext is decrypted, not stringified', () => {
  it('recovers the amount from GCM ciphertext', async () => {
    const cipher = await EncryptionService.encrypt('1875.50', KEY);
    // Guard the premise: this must genuinely be ciphertext, not the number.
    expect(cipher).not.toContain('1875');
    expect(Number(cipher)).toBeNaN(); // the old code's path

    expect(await readEncryptedAmount(cipher, KEY)).toBeCloseTo(1875.5, 6);
  });

  it('would have produced NaN under the old Number() call', async () => {
    const cipher = await EncryptionService.encrypt('425.00', KEY);
    // Documenting the defect: this is exactly what the job used to compute.
    const oldBehaviour = Number(cipher);
    expect(Number.isNaN(oldBehaviour)).toBe(true);

    // And what it computes now.
    expect(await readEncryptedAmount(cipher, KEY)).toBeCloseTo(425, 6);
  });

  it('handles SHORT amounts — the case isEncrypted() misreports', async () => {
    // A plaintext shorter than 7 characters produces a ciphertext body under 12
    // base64 chars, which isEncrypted() reports as NOT encrypted. Content-based
    // detection is why this still works.
    for (const short of ['1', '50', '500', '9.99']) {
      const cipher = await EncryptionService.encrypt(short, KEY);
      expect(EncryptionService.isEncrypted(cipher)).toBe(false);
      expect(await readEncryptedAmount(cipher, KEY)).toBeCloseTo(parseFloat(short), 6);
    }
  });

  it('handles the large amounts that dominated the old bug report', async () => {
    const cipher = await EncryptionService.encrypt('1234567.89', KEY);
    expect(await readEncryptedAmount(cipher, KEY)).toBeCloseTo(1234567.89, 2);
  });

  it('handles unicode-adjacent and high-precision values', async () => {
    const cipher = await EncryptionService.encrypt('0.025', KEY);
    expect(await readEncryptedAmount(cipher, KEY)).toBeCloseTo(0.025, 9);
  });
});

describe('plain values still work — the upgrade path must not break existing rows', () => {
  it('reads a plain numeric string', async () => {
    expect(await readEncryptedAmount('1875.50', KEY)).toBeCloseTo(1875.5, 6);
  });

  it('reads a plain number', async () => {
    expect(await readEncryptedAmount(1875.5, KEY)).toBeCloseTo(1875.5, 6);
  });

  it('reads an integer zero without falling through to decryption', async () => {
    expect(await readEncryptedAmount('0', KEY)).toBe(0);
    expect(await readEncryptedAmount(0, KEY)).toBe(0);
  });

  it('reads a negative value', async () => {
    expect(await readEncryptedAmount('-5', KEY)).toBe(-5);
  });
});

describe('unreadable values fail loudly rather than becoming NaN', () => {
  it('throws instead of returning NaN for undecryptable data', async () => {
    // A job that cannot read an amount must report a failure. Returning NaN would
    // silently persist "NaN" into a user's summary.
    await expect(readEncryptedAmount('not-ciphertext-at-all', KEY)).rejects.toThrow();
  });

  it('throws for ciphertext encrypted under a DIFFERENT key', async () => {
    const cipher = await EncryptionService.encrypt('1875.50', 'b'.repeat(64));
    await expect(readEncryptedAmount(cipher, KEY)).rejects.toThrow();
  });

  it('never returns a non-finite number', async () => {
    const attempts = ['garbage', '', '   ', 'NaN', 'Infinity'];
    for (const attempt of attempts) {
      let result: number | null = null;
      try {
        result = await readEncryptedAmount(attempt, KEY);
      } catch {
        continue; // throwing is acceptable
      }
      // If it did return, it must be finite.
      expect(Number.isFinite(result)).toBe(true);
    }
  });

  it('treats null and undefined as zero, not as an error', async () => {
    // An optional column may legitimately be absent; that is not a failure.
    expect(await readEncryptedAmount(null, KEY)).toBe(0);
    expect(await readEncryptedAmount(undefined, KEY)).toBe(0);
  });
});

describe('the aggregate the job computes stays finite', () => {
  it('sums decrypted payments without producing NaN', async () => {
    // This mirrors what the job does with snapshot.payments.
    const amounts = ['1875.50', '425.00', '99.99', '1'];
    const ciphers: string[] = [];
    for (const a of amounts) {
      ciphers.push(await EncryptionService.encrypt(a, KEY));
    }

    const decrypted: number[] = [];
    for (const c of ciphers) {
      decrypted.push(await readEncryptedAmount(c, KEY));
    }

    const total = decrypted.reduce((s, n) => s + n, 0);
    const expected = amounts.reduce((s, a) => s + parseFloat(a), 0);

    expect(Number.isFinite(total)).toBe(true);
    expect(total).toBeCloseTo(expected, 6);

    // And the old path shows the contrast.
    const oldTotal = ciphers.reduce((s, c) => s + Number(c), 0);
    expect(Number.isNaN(oldTotal)).toBe(true);
  });

  it('computes outstanding zakat correctly from decrypted values', async () => {
    const zakatCipher = await EncryptionService.encrypt('2500', KEY);
    const paidCiphers = await Promise.all([
      EncryptionService.encrypt('1000', KEY),
      EncryptionService.encrypt('500', KEY),
    ]);

    const zakatAmount = await readEncryptedAmount(zakatCipher, KEY);
    const paid: number[] = [];
    for (const c of paidCiphers) paid.push(await readEncryptedAmount(c, KEY));
    const totalPaid = paid.reduce((s, n) => s + n, 0);

    const outstanding = Math.max(0, zakatAmount - totalPaid);
    expect(outstanding).toBeCloseTo(1000, 6);
    expect(Number.isFinite(outstanding)).toBe(true);
  });

  it('does not report outstanding when overpaid', async () => {
    const zakat = await readEncryptedAmount(await EncryptionService.encrypt('100', KEY), KEY);
    const paid = await readEncryptedAmount(await EncryptionService.encrypt('250', KEY), KEY);
    expect(Math.max(0, zakat - paid)).toBe(0);
  });
});

describe('the nisab threshold survives JSON serialisation', () => {
  it('does not serialise to null', async () => {
    // JSON.stringify(NaN) is "null" — the old code silently lost the threshold
    // rather than erroring, which is why the failure was invisible.
    const cipher = await EncryptionService.encrypt('8750.00', KEY);
    const correct = JSON.stringify({ threshold: await readEncryptedAmount(cipher, KEY) });
    const broken = JSON.stringify({ threshold: Number(cipher) });

    expect(JSON.parse(correct).threshold).toBeCloseTo(8750, 6);
    expect(JSON.parse(broken).threshold).toBeNull();
  });
});
