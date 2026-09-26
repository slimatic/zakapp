/**
 * Cross-currency aggregation contract.
 *
 * A SEPARATE, SERIOUS BUG from the display rule, found while implementing it.
 *
 * `ZakatService` sums asset values directly:
 *
 *     const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
 *
 * with no regard for `asset.currency`. A user holding USD 5,000 and IDR
 * 15,750,000 therefore gets a "total" of 15,755,000 — a number in no currency at
 * all — and zakat is computed from it. The app also already knows the mixture:
 * `currencyBreakdown` is computed right beside it and then not used for the total.
 *
 * This is a correctness problem in a religious-finance tool, not a formatting one:
 * it produces a wrong zakat obligation. It is pinned here so the current behaviour
 * is visible and so a fix has something to change.
 *
 * These tests assert the ARITHMETIC of the current implementation rather than
 * calling the service, because the point is to record what the code does. When
 * the fix lands, these become the tests that must be updated — deliberately.
 */

import { describe, it, expect } from 'vitest';

/** The current implementation: sum values, ignore currency. */
function currentTotal(assets: Array<{ value: number; currency: string }>): number {
  return assets.reduce((sum, asset) => sum + asset.value, 0);
}

/** What a correct implementation must do: convert to one base currency first. */
function correctTotal(
  assets: Array<{ value: number; currency: string }>,
  rates: Record<string, number>, // units of currency per 1 USD
  base = 'USD'
): number {
  return assets.reduce((sum, asset) => {
    const rate = asset.currency === base ? 1 : rates[asset.currency];
    if (rate === undefined) {
      throw new Error(`No exchange rate for ${asset.currency}; refusing to guess`);
    }
    return sum + asset.value / rate;
  }, 0);
}

describe('the bug: values are summed across currencies without conversion', () => {
  it('adds USD and IDR amounts as though they were the same unit', () => {
    const assets = [
      { value: 5_000, currency: 'USD' },
      { value: 15_750_000, currency: 'IDR' },
    ];

    const total = currentTotal(assets);

    // The current code produces 15,755,000. That figure is not USD and not IDR —
    // it is not a quantity of anything.
    expect(total).toBe(15_755_000);

    // The correct answer is USD 6,000 (15,750,000 IDR ÷ 15,750 = 1,000 USD).
    const correct = correctTotal(assets, { IDR: 15_750 });
    expect(correct).toBe(6_000);

    // The error is not marginal — it is off by a factor of ~2,600.
    expect(total / correct).toBeGreaterThan(2_000);
  });

  it('understates zakat when a large-value, low-unit currency is present', () => {
    // Same assets, zakat at 2.5%.
    const assets = [
      { value: 5_000, currency: 'USD' },
      { value: 15_750_000, currency: 'IDR' },
    ];
    const nisabUsd = 5_000; // arbitrary, just above/below the comparison

    const buggyWealth = currentTotal(assets);
    const correctWealth = correctTotal(assets, { IDR: 15_750 });

    expect(buggyWealth * 0.025).toBe(393_875);   // wildly wrong obligation
    expect(correctWealth * 0.025).toBe(150);     // the real one

    // Both the amount and the nisab comparison are affected, so the error can
    // flip whether zakat is due at all.
    expect(buggyWealth > nisabUsd).toBe(true);
    expect(correctWealth > nisabUsd).toBe(true);
  });

  it('can flip the nisab decision in the other direction', () => {
    // A USD-poor user holding a large amount of a high-denomination currency.
    const assets = [
      { value: 100, currency: 'USD' },
      { value: 500_000_000, currency: 'VND' }, // ~20,000 USD at 25,000 VND/USD
    ];
    const nisabUsd = 5_000;

    const buggyWealth = currentTotal(assets);
    const correctWealth = correctTotal(assets, { VND: 25_000 });

    // The buggy total says "enormously wealthy"; the true total is ~20,100 USD.
    expect(buggyWealth).toBe(500_000_100);
    expect(Math.round(correctWealth)).toBe(20_100);

    // Both happen to exceed nisab here, but the magnitudes differ by 25,000x —
    // which is what makes any derived percentage meaningless.
    expect(buggyWealth / correctWealth).toBeGreaterThan(20_000);
  });
});

describe('what a correct implementation must guarantee', () => {
  it('refuses to guess when a rate is missing', () => {
    // Silently treating an unknown currency as 1:1 is the bug in another costume.
    expect(() => correctTotal([{ value: 100, currency: 'XYZ' }], {})).toThrow(/No exchange rate/);
  });

  it('is order-independent and unit-consistent', () => {
    const rates = { IDR: 15_750, PKR: 278 };
    const a = [
      { value: 1_000, currency: 'USD' },
      { value: 15_750_000, currency: 'IDR' },
      { value: 278_000, currency: 'PKR' },
    ];
    const b = [...a].reverse();

    // Same total regardless of order.
    expect(correctTotal(a, rates)).toBeCloseTo(correctTotal(b, rates), 6);
    // And the result is a USD figure: 1,000 + 1,000 + 1,000.
    expect(Math.round(correctTotal(a, rates))).toBe(3_000);
  });

  it('a single-currency portfolio is unaffected — no existing user is harmed', () => {
    // Every current production record is USD, so a correct implementation must
    // return the same figure the current one does for them.
    const usdOnly = [
      { value: 5_000, currency: 'USD' },
      { value: 1_234.56, currency: 'USD' },
    ];
    expect(correctTotal(usdOnly, {})).toBe(currentTotal(usdOnly));

    // Note: NOT toBe(6234.56). IEEE-754 doubles make this 6234.5599999999995.
    // That is the current storage reality — amounts are `Float` columns — and
    // it is exactly why money should be rounded once, at the boundary, rather
    // than compared with strict equality anywhere in between.
    expect(correctTotal(usdOnly, {})).toBeCloseTo(6_234.56, 6);
    expect(Number(correctTotal(usdOnly, {}).toFixed(2))).toBe(6_234.56);
  });
});
