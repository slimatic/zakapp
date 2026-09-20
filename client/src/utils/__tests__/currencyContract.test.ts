/**
 * Canonical currency formatting contract.
 *
 * This file is the migration pack for the currency consolidation (#424). Both
 * canonical paths must agree exactly:
 *
 *   utils/formatters.formatCurrency(amount, code)   — pure helper
 *   hooks/useDisplayCurrency().formatCurrency(...)  — same, plus privacy mask
 *
 * The rules pinned here, and the reasoning, since several are judgement calls
 * rather than obvious defaults:
 *
 *   1. STRICT per-currency decimals. A currency has one decimal count, not a
 *      0–2 range. IDR always shows 0; USD always shows 2.
 *   2. LATIN digits always. Rendering SAR with ar-SA produced Arabic-Indic
 *      digits (١٬٢٣٤٫٥٦), unreadable in an English UI. en-US everywhere.
 *   3. IDR = 0 decimals is a DELIBERATE divergence from ISO 4217 / Intl, which
 *      both say 2 (sen). Sen is not used in practice. Do not "fix" this.
 *   4. Unknown/unusable codes NEVER borrow another currency's symbol. The code
 *      is shown instead (`USDT 1,000.00`). Displaying `$` for non-dollars would
 *      misstate the amount.
 *   5. Unsupported codes must not throw — a stored currency from a newer ISO
 *      revision must not break rendering.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import {
  formatCurrency,
  getCurrencyDecimals,
  getSupportedCurrencies,
  getCurrencySymbol,
} from '../../utils/formatters';

/**
 * The decimals declared in CURRENCY_CONFIG. Mirrored here so the IDR test can
 * assert on the configured value without depending on the runtime's ICU data.
 */
const CURRENCY_CONFIG_DECIMALS: Record<string, number> = {
  USD: 2, EUR: 2, GBP: 2, SAR: 2, AED: 2, PKR: 2,
  INR: 2, MYR: 2, IDR: 0, TRY: 2, EGP: 2,
};

// ── Rule 1: strict per-currency decimals ────────────────────────────────────

describe('currency contract: strict decimals', () => {
  it('USD always shows exactly 2 decimals (no trailing-zero trimming)', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatCurrency(1234, 'USD')).toBe('$1,234.00');
  });

  it('IDR shows exactly 0 decimals (Indonesian grouping preserved)', () => {
    const out = formatCurrency(1500000, 'IDR');
    // Indonesian locale groups with '.' — Rp 1.500.000, not IDR 1,500,000.
    expect(out).toContain('Rp');
    expect(out).toMatch(/1\.500\.000/);
    expect(out).not.toMatch(/\d[,.]\d{2}$/); // no decimals
  });

  it('JPY (0-decimal, outside CURRENCY_CONFIG) resolves via Intl, not to 2', () => {
    expect(getCurrencyDecimals('JPY')).toBe(0);
    expect(formatCurrency(1234, 'JPY' as never)).not.toMatch(/\.\d/);
  });

  it('KWD (3-decimal) resolves to 3, not 2', () => {
    expect(getCurrencyDecimals('KWD')).toBe(3);
  });

  it('every supported currency has a single decimals value, not a range', () => {
    for (const code of getSupportedCurrencies()) {
      const d = getCurrencyDecimals(code);
      expect(Number.isInteger(d)).toBe(true);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(3);
    }
  });
});

// ── Rule 2: Latin digits always ─────────────────────────────────────────────

describe('currency contract: digits are always Latin', () => {
  const ARABIC_INDIC = /[\u0660-\u0669\u06F0-\u06F9]/;

  it('SAR renders Latin digits, never Arabic-Indic', () => {
    const out = formatCurrency(1234.56, 'SAR');
    expect(ARABIC_INDIC.test(out)).toBe(false);
    expect(out).toContain('1,234.56');
  });

  it('EGP renders Latin digits, never Arabic-Indic', () => {
    const out = formatCurrency(1234.56, 'EGP');
    expect(ARABIC_INDIC.test(out)).toBe(false);
    expect(out).toContain('1,234.56');
  });

  it('no supported currency emits non-Latin digits', () => {
    for (const code of getSupportedCurrencies()) {
      const out = formatCurrency(1234.56, code);
      expect(ARABIC_INDIC.test(out), `${code} produced ${out}`).toBe(false);
    }
  });
});

// ── Rule 3: the deliberate IDR divergence ───────────────────────────────────

describe('currency contract: IDR divergence is deliberate', () => {
  it('IDR is pinned to 0 decimals by our config, not derived from Intl', () => {
    // The point of this test is that CURRENCY_CONFIG is authoritative for
    // supported codes — the value must not be derived from the runtime's ICU.
    // ICU data varies by Node version: some report IDR as 2 (ISO 4217, for sen),
    // others as 0. Either way our config wins, so the rendered output is stable
    // across environments.
    //
    // IDR = 0 matches how rupiah is actually written; sen is not used in
    // practice. Do not "correct" this to 2.
    expect(getCurrencyDecimals('IDR')).toBe(0);
    expect(CURRENCY_CONFIG_DECIMALS.IDR).toBe(0);

    // And it renders with no decimals, whatever ICU thinks.
    expect(formatCurrency(1500000, 'IDR')).toMatch(/Rp/);
    expect(formatCurrency(1500000, 'IDR')).not.toMatch(/[,.]\d{1,2}$/);
  });
});

// ── Rule 4: unknown codes never borrow a symbol ─────────────────────────────

describe('currency contract: unknown codes', () => {
  it('never renders "$" for a non-USD code', () => {
    for (const code of ['XYZ', 'USDT', 'RMB', ''] as string[]) {
      const out = formatCurrency(1000, code as never);
      expect(out, `code ${code} → ${out}`).not.toContain('$');
    }
  });

  it('names the currency code when the symbol is unknown', () => {
    const out = formatCurrency(1000, 'USDT' as never);
    expect(out).toContain('USDT');
    expect(out).toContain('1,000');
  });

  it('falls back to 2 decimals for a code Intl rejects', () => {
    expect(getCurrencyDecimals('USDT')).toBe(2);
    expect(getCurrencyDecimals('')).toBe(2);
  });

  it('does not throw for any of these', () => {
    for (const code of ['XYZ', 'USDT', 'RMB', '', 'usd'] as string[]) {
      expect(() => formatCurrency(1000, code as never)).not.toThrow();
    }
  });
});

// ── Rule 5 / behaviour preserved from before ────────────────────────────────

describe('currency contract: existing behaviour preserved', () => {
  it('EUR uses the € symbol and not $', () => {
    const out = formatCurrency(100000, 'EUR');
    expect(out).toContain('€');
    expect(out).not.toContain('$');
  });

  it('SAR never falls back to $', () => {
    expect(formatCurrency(50000, 'SAR')).not.toContain('$');
  });

  it('all 11 supported currencies still format without throwing', () => {
    const codes = getSupportedCurrencies();
    expect(codes).toHaveLength(11);
    for (const code of codes) {
      expect(() => formatCurrency(1000, code)).not.toThrow();
    }
  });

  it('symbols are unchanged', () => {
    expect(getCurrencySymbol('IDR')).toBe('Rp');
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  it('compact notation still works for large values', () => {
    const out = formatCurrency(1500000, 'USD', true, true);
    // Strict decimals apply to compact output too: $1.50M, not $1.5M.
    expect(out).toMatch(/\$1\.50M/);
  });

  it('showSymbol=false yields a plain number', () => {
    const out = formatCurrency(1234.56, 'USD', false);
    expect(out).not.toContain('$');
    expect(out).toContain('1,234.56');
  });
});

// ── The two canonical paths must agree ──────────────────────────────────────

describe('currency contract: both canonical paths agree', () => {
  const mocks = vi.hoisted(() => ({
    mockMask: vi.fn((v: string) => v),
    mockSettingsRepo: vi.fn(),
    mockUseAuth: vi.fn(),
  }));

  vi.mock('../../contexts/AuthContext', () => ({ useAuth: mocks.mockUseAuth }));
  vi.mock('../../contexts/PrivacyContext', () => ({
    useMaskedCurrency: () => mocks.mockMask,
  }));
  vi.mock('../../hooks/useUserSettingsRepository', () => ({
    useUserSettingsRepository: mocks.mockSettingsRepo,
  }));

  it('useDisplayCurrency matches formatCurrency for the same code and amount', async () => {
    const { useDisplayCurrency } = await import('../../hooks/useDisplayCurrency');
    mocks.mockSettingsRepo.mockReturnValue({ settings: { baseCurrency: 'USD' } });
    mocks.mockUseAuth.mockReturnValue({ user: null });
    mocks.mockMask.mockImplementation((v: string) => v);

    const { result } = renderHook(() => useDisplayCurrency());

    for (const [amount, code] of [
      [1234.56, 'USD'],
      [1500000, 'IDR'],
      [999.5, 'EUR'],
      [1234.56, 'SAR'],
    ] as [number, string][]) {
      expect(
        result.current.formatCurrency(amount, code),
        `mismatch for ${code}`
      ).toBe(formatCurrency(amount, code as never));
    }
  });
});
