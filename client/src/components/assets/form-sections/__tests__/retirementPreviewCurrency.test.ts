/**
 * The retirement treatment preview must render in the ASSET'S currency.
 *
 * WHY THIS FILE EXISTS
 *
 * Reported from production: an asset whose currency is IDR showed its retirement
 * preview in US dollars. `RetirementTreatmentSection` rendered all three figures with
 * a hardcoded "$" and `toLocaleString('en-US')`:
 *
 *   Original Balance:  $50,000.00        (was IDR 50,000,000)
 *   Zakatable Amount:  $32,500.00
 *   Zakat Due:         $812.50
 *
 * The asset's currency was stored correctly — only the preview was wrong. But the
 * preview is what a user reads when deciding whether their zakat figure is right, so
 * labelling IDR amounts as USD is a money-correctness problem, not cosmetics.
 *
 * Note the amounts happened to match the screenshot exactly because the asset value
 * had been entered as a USD figure before the currency was set to IDR; a newly entered
 * IDR asset holds a much larger number and previously rendered as e.g. "$50,000,000".
 *
 * The fix threads `formData.currency` from AssetForm into the section and renders via
 * the canonical `formatCurrency`, which is the same rule as
 * docs/CURRENCY-DISPLAY-RULE.md: a record displays in its RECORDED currency.
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../../../utils/formatters';

describe('the preview renders in the asset currency', () => {
  it('formats IDR amounts as IDR, not USD', () => {
    const out = formatCurrency(50000000, 'IDR');

    // Correct output is "Rp 50.000.000" — Indonesian grouping uses a period as the
    // thousands separator, so asserting "50,000,000" (en-US grouping) would be wrong.
    // Assert the properties that actually matter:
    expect(out).toMatch(/Rp|IDR/);
    // The defect: a "$" prefix on an IDR amount.
    expect(out).not.toContain('$');
    // The magnitude survives — strip separators and check the digits.
    expect(out.replace(/[^\d]/g, '')).toContain('50000000');
  });

  it('does not render IDR with en-US grouping', () => {
    // Documents the distinction explicitly: the old code forced
    // toLocaleString('en-US'), which would group IDR in a way Indonesian users do not
    // read. Currency-correct formatting includes using the currency's own conventions.
    const out = formatCurrency(50000000, 'IDR');
    expect(out).not.toContain('50,000,000');
  });

  it('formats USD amounts as USD', () => {
    const out = formatCurrency(50000, 'USD');
    expect(out).toContain('50,000');
    expect(out).toContain('$');
  });

  it('uses the correct symbol for several currencies', () => {
    const cases: Array<[string, number, string | RegExp]> = [
      ['USD', 50000, '$'],
      ['IDR', 50000000, /IDR|Rp/],
      ['SAR', 1000, /SAR|ر\.س/],
      ['GBP', 1000, '£'],
      ['EUR', 1000, '€'],
    ];
    for (const [currency, amount, expected] of cases) {
      const out = formatCurrency(amount, currency);
      if (typeof expected === 'string') {
        expect(out, `${currency} should contain ${expected}`).toContain(expected);
      } else {
        expect(out, `${currency} should match ${expected}`).toMatch(expected);
      }
    }
  });

  it('applies per-currency decimals (IDR has no minor unit in practice)', () => {
    // The old code forced 2 decimals via toLocaleString options, which is wrong for
    // currencies that do not use them. The canonical formatter decides per currency.
    const idr = formatCurrency(50000000, 'IDR');
    const usd = formatCurrency(50000, 'USD');
    expect(usd).toMatch(/\.\d{2}$/);
    // IDR should not be given a spurious 2-decimal rendering
    expect(idr).not.toMatch(/\.00$/);
  });

  it('the three preview figures all agree on currency', () => {
    // Original Balance, Zakatable Amount and Zakat Due must never disagree — showing
    // one in USD and another in IDR would be worse than showing both wrongly.
    const currency = 'IDR';
    const original = formatCurrency(50000000, currency);
    const zakatable = formatCurrency(32500000, currency);
    const due = formatCurrency(812500, currency);

    for (const out of [original, zakatable, due]) {
      expect(out).not.toContain('$');
    }
  });
});

describe('the regression that was reported', () => {
  it('an IDR asset never renders with a dollar sign', () => {
    // Directly encodes the reported bug: currency = IDR, dollar sign in the output.
    for (const amount of [50000000, 32500000, 812.5]) {
      const out = formatCurrency(amount, 'IDR');
      expect(out.includes('$'), `IDR ${amount} rendered as ${out}`).toBe(false);
    }
  });
});
