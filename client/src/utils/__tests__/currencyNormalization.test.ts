/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Issue #310 (round 4) regression tests — mixed-currency normalization.
 *
 * QA found: a USD seed asset + an IDR car (50,000,000) summed raw into
 * "$50,000,500.00" on the Dashboard. These tests pin the normalization
 * contract: convert EVERY amount into the display currency BEFORE summing.
 */

import { describe, it, expect } from 'vitest';
import {
  getAssetCurrency,
  toDisplayCurrency,
  sumAssetsInCurrency,
  sumLiabilitiesInCurrency,
  normalizeAssetsToCurrency,
  normalizeLiabilitiesToCurrency,
  FxRates,
} from '../currencyNormalization';

// USD-based rates, as served by GET /api/zakat/fx-rates (rates[X] = 1 USD in X)
const RATES: FxRates = { USD: 1, IDR: 15800, EUR: 0.92, GBP: 0.79 };

describe('getAssetCurrency', () => {
  it('returns the asset currency when valid', () => {
    expect(getAssetCurrency({ currency: 'idr' })).toBe('IDR');
  });

  it('falls back when the currency is missing or malformed', () => {
    expect(getAssetCurrency({})).toBe('USD');
    expect(getAssetCurrency({ currency: 'us' })).toBe('USD');
    expect(getAssetCurrency({ currency: 'DOLLARS' })).toBe('USD');
    expect(getAssetCurrency(undefined, 'EUR')).toBe('EUR');
  });
});

describe('toDisplayCurrency', () => {
  it('converts across currencies via USD-based rates', () => {
    // 50,000,000 IDR = 50,000,000 / 15800 = 3164.5569620253164 USD
    expect(toDisplayCurrency(50_000_000, 'IDR', 'USD', RATES)).toBeCloseTo(3164.56, 2);
  });

  it('converts to a non-USD display currency', () => {
    // 100 USD → IDR: 100 / 1 * 15800 = 1,580,000
    expect(toDisplayCurrency(100, 'USD', 'IDR', RATES)).toBe(1_580_000);
  });

  it('returns the value unchanged for same-currency', () => {
    expect(toDisplayCurrency(1234.5, 'USD', 'USD', RATES)).toBe(1234.5);
    // No rates at all + same currency → unchanged
    expect(toDisplayCurrency(1234.5, 'USD', 'USD')).toBe(1234.5);
  });

  it('never zeroes or NaNs when rates are unavailable', () => {
    // Missing rates → raw value (callers check `converted` before trusting)
    expect(toDisplayCurrency(500, 'IDR', 'USD')).toBe(500);
    expect(toDisplayCurrency(500, 'IDR', 'USD', { USD: 1 })).toBe(500);
    expect(Number.isFinite(toDisplayCurrency(500, 'IDR', 'USD', {}))).toBe(true);
  });
});

describe('sumAssetsInCurrency', () => {
  it('normalizes mixed currencies before summing (the QA repro)', () => {
    // The exact v0.15.1 production repro: USD seed 500 + IDR car 50,000,000
    const assets = [
      { value: 500, currency: 'USD' },
      { value: 50_000_000, currency: 'IDR' },
    ];
    const result = sumAssetsInCurrency(assets, 'USD', RATES);
    expect(result.total).toBeCloseTo(500 + 3164.56, 2);
    expect(result.mixed).toBe(true);
    expect(result.currencies).toEqual(['IDR', 'USD']);
    expect(result.converted).toBe(true);
  });

  it('handles single-currency lists matching the display currency', () => {
    const result = sumAssetsInCurrency(
      [{ value: 100, currency: 'USD' }, { value: 200, currency: 'USD' }],
      'USD',
      RATES
    );
    expect(result.total).toBe(300);
    expect(result.mixed).toBe(false);
  });

  it('flags missing-rate conversions as not converted', () => {
    const result = sumAssetsInCurrency(
      [{ value: 100, currency: 'USD' }, { value: 5_000_000, currency: 'JPY' }],
      'USD',
      RATES
    );
    expect(result.converted).toBe(false);
  });

  it('treats an empty list as zero', () => {
    const result = sumAssetsInCurrency([], 'USD', RATES);
    expect(result.total).toBe(0);
    expect(result.converted).toBe(true);
    expect(result.mixed).toBe(false);
  });

  it('does NOT raw-sum when rates are absent (prevents the $ apples+oranges bug)', () => {
    // The v0.15.1 bug: raw sum 500 + 50,000,000 = 50,000,500 displayed as USD.
    // Without rates the caller must not display a total at all; the util
    // still returns a number, but `converted === false` is the contract.
    const result = sumAssetsInCurrency(
      [{ value: 500, currency: 'USD' }, { value: 50_000_000, currency: 'IDR' }],
      'USD',
      undefined
    );
    expect(result.converted).toBe(false);
  });
});

describe('sumLiabilitiesInCurrency', () => {
  it('uses the amount key for liabilities', () => {
    const result = sumLiabilitiesInCurrency(
      [{ amount: 1000, currency: 'USD' }, { amount: 15_800_000, currency: 'IDR' }],
      'USD',
      RATES
    );
    // 15,800,000 IDR = 1000 USD
    expect(result.total).toBeCloseTo(2000, 2);
  });
});

describe('normalizeAssetsToCurrency', () => {
  it('rewrites every asset into the display currency, preserving other fields', () => {
    const assets = [
      { id: 'a1', name: 'Cash', value: 100, currency: 'USD', type: 'CASH', zakatEligible: true },
      { id: 'a2', name: 'Car', value: 15_800_000, currency: 'IDR', type: 'OTHER', zakatEligible: false },
    ];
    const normalized = normalizeAssetsToCurrency(assets, 'USD', RATES);
    expect(normalized[0].value).toBe(100);
    expect(normalized[0].currency).toBe('USD');
    expect(normalized[1].value).toBeCloseTo(1000, 6);
    expect(normalized[1].currency).toBe('USD');
    // Originals untouched (immutability)
    expect(assets[1].value).toBe(15_800_000);
    expect(assets[1].currency).toBe('IDR');
    // Extra fields preserved for downstream calculators
    expect((normalized[1] as any).type).toBe('OTHER');
    expect((normalized[1] as any).zakatEligible).toBe(false);
  });

  it('round-trips calculateWealth totals via normalization', () => {
    // Simulate the Records-page flow: normalize → sum.
    const assets = [
      { value: 12_464.15, currency: 'USD' },
      { value: 50_000_000, currency: 'IDR' },
    ];
    const normalized = normalizeAssetsToCurrency(assets, 'USD', RATES);
    const total = normalized.reduce((s, a) => s + (a.value || 0), 0);
    expect(total).toBeCloseTo(12_464.15 + 3164.5569620253164, 4);
  });
});

describe('normalizeLiabilitiesToCurrency', () => {
  it('rewrites liability amounts into the display currency', () => {
    const liabilities = [{ amount: 7_900_000, currency: 'IDR', name: 'Loan' }];
    const normalized = normalizeLiabilitiesToCurrency(liabilities, 'USD', RATES);
    expect(normalized[0].amount).toBeCloseTo(500, 6);
    expect(normalized[0].currency).toBe('USD');
    expect((normalized[0] as any).name).toBe('Loan');
  });
});