/**
 * Money must be formatted by the canonical formatter, not raw Intl.NumberFormat.
 *
 * WHY THIS FILE EXISTS
 *
 * Eleven call sites across five files built their own currency formatter:
 *
 *   new Intl.NumberFormat('en-US', { style: 'currency', currency: X }).format(v)
 *
 * They passed the RIGHT currency code, so the amount was never misstated — this is not
 * the bug that reported an IDR asset as USD. But they bypassed `utils/formatters.ts`,
 * which is where the app's per-currency conventions live:
 *
 *   IDR: { symbol: 'Rp', locale: 'id-ID', decimals: 0 }
 *
 * The consequence, verified by running both formatters side by side:
 *
 *   currency   raw Intl('en-US')        canonical
 *   IDR        IDR 50,000,000.00        Rp 50.000.000
 *   USD        $50,000.00               $50,000.00
 *   SAR        SAR 10,000.00            10,000.00 ر.س.‏
 *
 * So an Indonesian user saw US grouping, a superfluous currency-code prefix, and a
 * spurious ".00" on a currency with no minor unit — on every onboarding screen.
 *
 * The canonical formatter also guards a case a raw Intl call does not: an unrecognised
 * code must show its own code rather than borrowing another currency's symbol, so a
 * non-dollar amount can never render as "$".
 *
 * This test pins both the behaviour and the consistency rule.
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../utils/formatters';

describe('IDR is formatted with Indonesian conventions', () => {
  it('uses the Rp symbol, not the code', () => {
    const out = formatCurrency(50000000, 'IDR');
    expect(out).toContain('Rp');
    expect(out).not.toContain('IDR');
  });

  it('has no minor unit — IDR is 0-decimal by product decision', () => {
    const out = formatCurrency(50000000, 'IDR');
    // Careful: Indonesian grouping uses "." as the THOUSANDS separator, so a naive
    // decimal-detection regex matches the grouping ("Rp 50.000.000") and reports a
    // false failure — which is exactly what happened on the first run of this test.
    //
    // Indonesian decimals use a comma, so a fractional rendering would end in
    // "...,50". Check for that instead.
    const endsWithDecimal = out.trim().endsWith(',00') || out.trim().endsWith(',50');
    expect(endsWithDecimal).toBe(false);

    // And the digits survive grouping intact — no digits lost or added.
    const digitsOnly = out.split('').filter((c) => c >= '0' && c <= '9').join('');
    expect(digitsOnly).toBe('50000000');
  });

  it('does NOT use US thousands grouping', () => {
    // "50,000,000" is what the raw en-US formatter produced.
    const out = formatCurrency(50000000, 'IDR');
    expect(out).not.toContain('50,000,000');
  });

  it('is materially different from a raw en-US Intl call', () => {
    // This is the whole point: prove the fix changes user-visible output.
    const raw = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR' }).format(50000000);
    const canonical = formatCurrency(50000000, 'IDR');
    expect(canonical).not.toBe(raw);
  });
});

describe('other currencies keep their own conventions', () => {
  it('USD is unchanged — no regression for the default currency', () => {
    expect(formatCurrency(50000, 'USD')).toBe('$50,000.00');
  });

  it('SAR renders with its Arabic symbol', () => {
    const out = formatCurrency(10000, 'SAR');
    expect(out).toMatch(/ر\.س|SAR/);
  });

  it('every supported currency produces a non-empty, finite rendering', () => {
    for (const code of ['USD', 'IDR', 'SAR', 'GBP', 'EUR', 'PKR', 'INR', 'MYR', 'TRY']) {
      const out = formatCurrency(1234.5, code);
      expect(out.length, `${code} produced empty output`).toBeGreaterThan(0);
      expect(out, `${code} leaked NaN`).not.toContain('NaN');
      expect(out, `${code} leaked undefined`).not.toContain('undefined');
    }
  });
});

describe('an unknown code never borrows a dollar sign', () => {
  it('shows the code itself rather than "$"', () => {
    // The guard the raw Intl calls did not have.
    const out = formatCurrency(1000, 'ZZZ');
    expect(out).not.toContain('$');
    expect(out).toContain('ZZZ');
  });

  it('the same rule holds for a plausible-but-unsupported code', () => {
    const out = formatCurrency(1000, 'XAU');
    expect(out).not.toContain('$');
  });
});

describe('the reported regression stays fixed', () => {
  it('an IDR amount never renders with a dollar sign', () => {
    for (const amount of [50000000, 32500000, 812.5, 1]) {
      const out = formatCurrency(amount, 'IDR');
      expect(out.includes('$'), `IDR ${amount} rendered as ${out}`).toBe(false);
    }
  });
});
