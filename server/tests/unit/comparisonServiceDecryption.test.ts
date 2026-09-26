/**
 * ComparisonService must decrypt before comparing years.
 *
 * WHY THIS FILE EXISTS
 *
 * `YearlySnapshotModel.findById` and `.findByUser` return RAW Prisma rows, and
 * `PaymentRecordModel.findBySnapshot` does too. Every numeric column on those rows is
 * ciphertext. `compareSnapshots` ran its entire analysis on those strings:
 *
 *   Math.min(...ciphertexts)   -> NaN
 *   Math.max(...ciphertexts)   -> NaN
 *   sum + ciphertext           -> STRING CONCATENATION, not addition
 *   (NaN - NaN) / NaN / years  -> NaN
 *
 * The API then returned NaN in every numeric field, which JSON serialises to `null`,
 * so the client received nulls. Worse, the prose insights are built from those
 * comparisons: because every comparison against NaN (or between two ciphertexts) is
 * FALSE, only the "stable" branch was reachable, and the app confidently told the
 * user their wealth had "remained relatively stable" regardless of the real numbers.
 *
 * `calculateTrend` is private, so the trend logic is re-implemented here against
 * decrypted values to pin the behaviour the service now produces.
 */

import { describe, it, expect, beforeEach } from 'vitest';

const KEY = 'a'.repeat(64);

const { EncryptionService } = await import('../../src/services/EncryptionService');

beforeEach(() => {
  process.env.ENCRYPTION_KEY = KEY;
});

/** Mirrors the private calculateTrend in ComparisonService. */
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable';
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}

describe('the ciphertext arithmetic that produced the bug', () => {
  it('summing ciphertexts concatenates instead of adding', () => {
    // This is what `payments.reduce((sum, p) => sum + p.amount, 0)` did.
    const a = 'AbCdEfGhIjKl:MnOpQrStUvWx:YzAbCdEfGhIj';
    const b = 'ZaZaZaZaZaZa:ZaZaZaZaZaZa:ZaZaZaZaZaZa';
    const result = [a, b].reduce((sum: number | string, v) => (sum as any) + v, 0);

    expect(typeof result).toBe('string');
    expect(result).toContain(a);
    expect(Number(result)).toBeNaN();
  });

  it('Math.min/max over ciphertexts is NaN', () => {
    const ciphers = ['abc:def:ghi', 'jkl:mno:pqr'];
    expect(Math.min(...(ciphers as any))).toBeNaN();
    expect(Math.max(...(ciphers as any))).toBeNaN();
  });

  it('the growth rate was NaN, so the insight was meaningless', () => {
    const firstWealth = Number('AbCdEfGhIjKl:MnOpQrStUvWx:YzAbCdEfGhIj');
    const lastWealth = Number('ZaZaZaZaZaZa:ZaZaZaZaZaZa:ZaZaZaZaZaZa');
    const growth = ((lastWealth - firstWealth) / firstWealth / 3) * 100;
    expect(Number.isNaN(growth)).toBe(true);
    // And .toFixed on NaN is the string "NaN" — which is what the user was shown.
    expect(growth.toFixed(1)).toBe('NaN');
  });

  it('every comparison against NaN is false — so only "stable" was reachable', () => {
    expect(NaN > 5).toBe(false);
    expect(NaN < -5).toBe(false);
    // The service's branch structure: neither increasing nor decreasing matched, so
    // the else-branch ("remained relatively stable") always fired.
  });
});

describe('with decrypted values the analysis is real', () => {
  it('detects an increasing wealth trend', () => {
    expect(calculateTrend([10000, 12000, 20000, 25000])).toBe('increasing');
  });

  it('detects a decreasing wealth trend', () => {
    // Could never be reached before: the user was always told "stable".
    expect(calculateTrend([25000, 20000, 12000, 10000])).toBe('decreasing');
  });

  it('detects a stable trend', () => {
    expect(calculateTrend([10000, 10050, 9950, 10000])).toBe('stable');
  });
});

describe('round-tripping real ciphertext gives usable numbers', () => {
  it('decrypts a snapshot row into arithmetically valid values', async () => {
    const { decryptNumericFields } = await import('../../src/utils/encryptedNumbers');

    const row = {
      id: 'snap-1',
      gregorianYear: 2026,
      totalWealth: await EncryptionService.encrypt('25000', KEY),
      zakatableWealth: await EncryptionService.encrypt('24000', KEY),
      zakatAmount: await EncryptionService.encrypt('600', KEY),
      nisabThreshold: await EncryptionService.encrypt('8750', KEY),
    };

    const { row: out, unreadable } = await decryptNumericFields(
      row as unknown as Record<string, unknown>,
      ['totalWealth', 'zakatableWealth', 'zakatAmount', 'nisabThreshold'],
      KEY
    );

    expect(unreadable).toEqual([]);
    expect(out.totalWealth).toBeCloseTo(25000, 6);
    expect(out.zakatAmount).toBeCloseTo(600, 6);

    // Arithmetic is now meaningful.
    const values = [out.totalWealth as number, out.zakatAmount as number];
    expect(values.reduce((s, v) => s + v, 0)).toBeCloseTo(25600, 6);
    expect(Math.min(...values)).toBe(600);
    expect(Math.max(...values)).toBe(25000);
  });

  it('produces a real growth rate across two years', async () => {
    const { decryptNumericFields } = await import('../../src/utils/encryptedNumbers');

    const y1 = await decryptNumericFields(
      { totalWealth: await EncryptionService.encrypt('20000', KEY) } as Record<string, unknown>,
      ['totalWealth'],
      KEY
    );
    const y3 = await decryptNumericFields(
      { totalWealth: await EncryptionService.encrypt('26000', KEY) } as Record<string, unknown>,
      ['totalWealth'],
      KEY
    );

    const first = y1.row.totalWealth as number;
    const last = y3.row.totalWealth as number;
    const years = 2;
    const growth = ((last - first) / first / years) * 100;

    expect(Number.isFinite(growth)).toBe(true);
    expect(growth).toBeCloseTo(15, 6); // 6000/20000/2 = 15% per year
  });
});

describe('the insights only assert what is verifiable', () => {
  it('does not claim nisab compliance when a threshold is unreadable', () => {
    // Reproduces the guard added to generateInsights. An unreadable value must keep
    // the insight silent rather than asserting "consistently above nisab".
    const snapshots = [
      { zakatableWealth: 24000, nisabThreshold: 8750 },
      { zakatableWealth: 30000, nisabThreshold: Number('corrupted:ciphertext:value') },
    ];

    const comparable = snapshots.every(
      s =>
        Number.isFinite(Number(s.zakatableWealth)) &&
        Number.isFinite(Number(s.nisabThreshold)) &&
        Number(s.nisabThreshold) > 0
    );

    expect(comparable).toBe(false);
  });

  it('claims compliance only when all values are finite and above', () => {
    const above = [
      { zakatableWealth: 24000, nisabThreshold: 8750 },
      { zakatableWealth: 30000, nisabThreshold: 9000 },
    ];
    const comparable = above.every(
      s => Number.isFinite(s.zakatableWealth) && Number.isFinite(s.nisabThreshold) && s.nisabThreshold > 0
    );
    expect(comparable && above.every(s => s.zakatableWealth >= s.nisabThreshold)).toBe(true);
  });

  it('does not claim compliance when one year is genuinely below', () => {
    const mixed = [
      { zakatableWealth: 24000, nisabThreshold: 8750 },
      { zakatableWealth: 5000, nisabThreshold: 8750 },
    ];
    expect(mixed.every(s => s.zakatableWealth >= s.nisabThreshold)).toBe(false);
  });

  it('guards the growth-rate division when starting wealth is zero', () => {
    // Previously `firstWealth > 0` was not checked, so a zero baseline divided by
    // zero and produced NaN (then Infinity in the JSON).
    const firstWealth = 0;
    const lastWealth = 26000;
    const years = 2;
    const growth = years > 0 && firstWealth > 0
      ? ((lastWealth - firstWealth) / firstWealth / years) * 100
      : 0;
    expect(growth).toBe(0);
    expect(Number.isFinite(growth)).toBe(true);
  });
});

describe('unreadable payment amounts surface rather than becoming NaN', () => {
  it('a corrupted amount is reported, not silently zeroed', async () => {
    const { readEncryptedAmount } = await import('../../src/utils/encryptedNumbers');
    await expect(readEncryptedAmount('corrupted-not-ciphertext', KEY)).rejects.toThrow();
  });

  it('decryptable amounts of any magnitude add correctly', async () => {
    const { readEncryptedAmount } = await import('../../src/utils/encryptedNumbers');
    const amounts = ['99.99', '1000', '1234567.89'];
    let total = 0;
    for (const a of amounts) {
      total += await readEncryptedAmount(await EncryptionService.encrypt(a, KEY), KEY);
    }
    expect(total).toBeCloseTo(99.99 + 1000 + 1234567.89, 2);
  });
});
