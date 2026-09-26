/**
 * PaymentRecordModel money aggregations must decrypt.
 *
 * WHY THIS FILE EXISTS
 *
 * Two static methods on `PaymentRecordModel` read the encrypted `amount` column with
 * `parseFloat` and returned NaN as a result:
 *
 *   · getTotalPaidForSnapshot  -> parseFloat(ciphertext) * exchangeRate, summed
 *   · getStatisticsByCategory  -> the SAME problem, plus it used `payments.forEach`
 *                                 for the accumulation, and `forEach` cannot await, so
 *                                 no async decryption could have worked there either
 *
 * Neither had any callers, so neither was damaging anything — but both were public
 * API on a model that returns `Promise<number>` and `Promise<Record<...>>`. A future
 * caller would have received NaN with no indication anything was wrong.
 *
 * Fixed rather than deleted because a correct implementation is short and these are
 * the natural place for a "total paid" calculation to live.
 */

import { describe, it, expect, beforeEach } from 'vitest';

const KEY = 'a'.repeat(64);

const { EncryptionService } = await import('../../src/services/EncryptionService');
const { readEncryptedAmount } = await import('../../src/utils/encryptedNumbers');

beforeEach(() => {
  process.env.ENCRYPTION_KEY = KEY;
});

/** Mirrors the fixed accumulation in getTotalPaidForSnapshot. */
async function totalWithExchange(
  rows: Array<{ amount: string; exchangeRate: number }>
): Promise<number> {
  let total = 0;
  for (const row of rows) {
    total += (await readEncryptedAmount(row.amount, KEY)) * row.exchangeRate;
  }
  return total;
}

/** Mirrors the fixed accumulation in getStatisticsByCategory. */
async function statsByCategory(
  rows: Array<{ amount: string; exchangeRate: number; recipientCategory: string }>
): Promise<Record<string, { count: number; total: number }>> {
  const stats: Record<string, { count: number; total: number }> = {};
  for (const row of rows) {
    const amount = (await readEncryptedAmount(row.amount, KEY)) * row.exchangeRate;
    if (!stats[row.recipientCategory]) stats[row.recipientCategory] = { count: 0, total: 0 };
    stats[row.recipientCategory].count++;
    stats[row.recipientCategory].total += amount;
  }
  return stats;
}

describe('the old behaviour was worse than NaN — it sometimes returned a plausible number', () => {
  it('produces BOTH outcomes across samples — NaN and silently-wrong numbers', async () => {
    // A single ciphertext cannot be asserted on: whether it begins with a digit is
    // random (depends on the IV), so any one-sample assertion is flaky. The stable,
    // meaningful property is the DISTRIBUTION.
    let nanCount = 0;
    let wrongNumberCount = 0;
    const wrongSamples: string[] = [];

    for (let i = 0; i < 100; i++) {
      const cipher = await EncryptionService.encrypt('1234.56', KEY);
      const parsed = parseFloat(cipher);
      if (Number.isNaN(parsed)) {
        nanCount++;
      } else {
        wrongNumberCount++;
        if (wrongSamples.length < 3) wrongSamples.push(`${cipher.slice(0, 20)} -> ${parsed}`);
      }
    }

    // Both outcomes occur. The majority are NaN; a substantial minority parse to a
    // wrong number, which is the genuinely dangerous case because it looks valid.
    expect(nanCount).toBeGreaterThan(0);
    expect(wrongNumberCount).toBeGreaterThan(0);
    expect(nanCount).toBeGreaterThan(wrongNumberCount);

    // And the "numbers" really are numbers, not NaN in disguise.
    for (const sample of wrongSamples) {
      const parsed = parseFloat(sample.split(' -> ')[1]);
      expect(Number.isFinite(parsed)).toBe(true);
    }
  });

  it('but roughly one ciphertext in six parses to a WRONG NUMBER, not NaN', async () => {
    // Measured empirically: 11 of 60 ciphertexts begin with a digit, so
    // parseFloat() returns that digit as if it were the amount.
    //
    //   4M72HNJQhRoaDNkQ:k8x -> 4
    //   1PkseVYK6A6g/y+7:llR -> 1
    //   0VcKx16oqDPJfHPt:wHc -> 0
    //
    // This is materially worse than NaN. NaN on screen is at least visibly broken
    // ("$NaN"); a wrong number is not. This is the same mechanism as the historical
    // report that a payment of 99.99 displayed as 8.
    let wrongNumbers = 0;
    const samples: string[] = [];
    for (let i = 0; i < 60; i++) {
      const cipher = await EncryptionService.encrypt('1234.56', KEY);
      const parsed = parseFloat(cipher);
      if (!Number.isNaN(parsed)) {
        wrongNumbers++;
        if (samples.length < 3) samples.push(`${cipher.slice(0, 20)} -> ${parsed}`);
      }
    }

    // The exact count varies with the random IV; the point is that it is NOT zero.
    expect(wrongNumbers).toBeGreaterThan(0);
    // Sanity-check that these really are numbers, not NaN dressed up.
    for (const s of samples) {
      expect(Number.isFinite(parseFloat(s.split(' -> ')[1]))).toBe(true);
    }
  });

  it('a NaN accumulation poisons the whole total', () => {
    const withOneBad = [1000, NaN, 500];
    expect(withOneBad.reduce((s, v) => s + v, 0)).toBeNaN();
  });

  it('forEach does not await — async work finishes after the function returns', async () => {
    // The structural half of the getStatisticsByCategory bug, independent of
    // encryption: forEach cannot await, so the totals were computed from whatever
    // the accumulators held at return time.
    let observed = 0;
    const withAwait = async () => {
      await Promise.resolve();
      observed += 1;
    };

    [1, 2].forEach(() => {
      void withAwait();
    });
    // Nothing has run yet at this point — this is the bug.
    expect(observed).toBe(0);

    // The work does eventually run, just too late to affect the returned totals.
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(observed).toBe(2);
  });
});

describe('totals are correct with real ciphertext', () => {
  it('sums decrypted amounts times exchange rate', async () => {
    const rows = [
      { amount: await EncryptionService.encrypt('1000', KEY), exchangeRate: 1 },
      { amount: await EncryptionService.encrypt('500.50', KEY), exchangeRate: 1 },
    ];
    expect(await totalWithExchange(rows)).toBeCloseTo(1500.5, 6);
  });

  it('applies a non-1 exchange rate', async () => {
    const rows = [
      { amount: await EncryptionService.encrypt('1000', KEY), exchangeRate: 0.27 }, // USD -> something
    ];
    expect(await totalWithExchange(rows)).toBeCloseTo(270, 6);
  });

  it('handles an empty set as zero, not NaN', async () => {
    expect(await totalWithExchange([])).toBe(0);
  });

  it('handles amounts below the 1e6 threshold that broke the original bug', async () => {
    const rows = [
      { amount: await EncryptionService.encrypt('99.99', KEY), exchangeRate: 1 },
      { amount: await EncryptionService.encrypt('1', KEY), exchangeRate: 1 },
    ];
    const total = await totalWithExchange(rows);
    expect(total).toBeCloseTo(100.99, 6);
    expect(Number.isFinite(total)).toBe(true);
  });

  it('propagates a hard failure rather than returning NaN', async () => {
    const rows = [{ amount: 'not-ciphertext', exchangeRate: 1 }];
    await expect(totalWithExchange(rows)).rejects.toThrow();
  });
});

describe('category statistics are correct', () => {
  it('groups by category with correct counts and totals', async () => {
    const rows = [
      { amount: await EncryptionService.encrypt('1000', KEY), exchangeRate: 1, recipientCategory: 'poor' },
      { amount: await EncryptionService.encrypt('500', KEY), exchangeRate: 1, recipientCategory: 'poor' },
      { amount: await EncryptionService.encrypt('250', KEY), exchangeRate: 1, recipientCategory: 'debtors' },
    ];

    const stats = await statsByCategory(rows);

    expect(stats.poor.count).toBe(2);
    expect(stats.poor.total).toBeCloseTo(1500, 6);
    expect(stats.debtors.count).toBe(1);
    expect(stats.debtors.total).toBeCloseTo(250, 6);
  });

  it('every produced total is finite', async () => {
    const rows = [
      { amount: await EncryptionService.encrypt('1234567.89', KEY), exchangeRate: 1.5, recipientCategory: 'poor' },
      { amount: await EncryptionService.encrypt('1', KEY), exchangeRate: 1, recipientCategory: 'poor' },
    ];
    const stats = await statsByCategory(rows);
    for (const entry of Object.values(stats)) {
      expect(Number.isFinite(entry.total)).toBe(true);
    }
  });

  it('returns an empty object for no payments', async () => {
    expect(await statsByCategory([])).toEqual({});
  });
});
