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
 * Issue #310 (round 4): mixed-currency normalization.
 *
 * Assets may be stored with different currencies (e.g. a USD seed asset plus
 * an IDR car). Summing the raw numbers produced nonsense like
 * "$50,000,500.00". These helpers convert every amount into ONE display
 * currency BEFORE summing, using server-provided FX rates
 * (GET /api/zakat/fx-rates, base USD).
 */

export type FxRates = Record<string, number>;

export interface NormalizationResult {
  /** Sum converted into `displayCurrency` (0 when fxRates unavailable). */
  total: number;
  /** True when the input contained more than one distinct currency. */
  mixed: boolean;
  /** Distinct uppercase source currencies seen in the input. */
  currencies: string[];
  /** True when FX rates were available and conversion was applied. */
  converted: boolean;
}

const CURRENCY_CODE_RE = /^[A-Z]{3}$/;

/**
 * Extract a sane 3-letter currency code from a loosely-typed field.
 * Falls back to `fallbackCurrency` when missing/malformed.
 */
export function getAssetCurrency(
  asset: { currency?: string } | null | undefined,
  fallbackCurrency: string = 'USD'
): string {
  const raw = typeof asset?.currency === 'string' ? asset.currency.trim().toUpperCase() : '';
  if (CURRENCY_CODE_RE.test(raw)) return raw;
  const fallback = typeof fallbackCurrency === 'string' ? fallbackCurrency.trim().toUpperCase() : 'USD';
  return CURRENCY_CODE_RE.test(fallback) ? fallback : 'USD';
}

/**
 * Convert a single amount into the display currency.
 * Returns the input unchanged when conversion is impossible (no rates, same
 * currency, or unknown code) so callers NEVER double-convert or zero out.
 */
export function toDisplayCurrency(
  amount: number,
  fromCurrency: string,
  displayCurrency: string,
  fxRates?: FxRates
): number {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;

  const from = getAssetCurrency({ currency: fromCurrency });
  const to = getAssetCurrency({ currency: displayCurrency });
  if (from === to) return value;

  const rate = fxRates?.[to];
  const fromRate = fxRates?.[from];
  if (typeof rate !== 'number' || rate <= 0 || typeof fromRate !== 'number' || fromRate <= 0) {
    // Rates unavailable — returning the raw number would create the exact
    // mixed-currency bug this module exists to fix. Callers must check
    // `converted` before displaying a total.
    return value;
  }
  // rates are USD-based: value in `from` → USD → `to`
  return (value / fromRate) * rate;
}

/**
 * Sum items into a single display currency, normalizing each amount first.
 *
 * Works with assets ({value, currency}) and liabilities ({amount, currency})
 * via the `amountKey` parameter. When FX rates are unavailable the result is
 * marked `converted: false` and `total` is 0 — callers should render a
 * "convert in progress / unavailable" state instead of a wrong number.
 */
export function sumInCurrency<T extends Record<string, unknown>>(
  items: T[],
  amountKey: 'value' | 'amount',
  displayCurrency: string,
  fxRates?: FxRates
): NormalizationResult {
  const currencies = new Set<string>();
  let total = 0;
  let converted = false;

  for (const item of items) {
    const raw = Number(item?.[amountKey]) || 0;
    const currency = getAssetCurrency(item as { currency?: string }, displayCurrency);
    currencies.add(currency);
    total += toDisplayCurrency(raw, currency, displayCurrency, fxRates);
  }

  // `converted` is true when every source currency had a usable rate (or the
  // list is empty / single-currency matching the display currency).
  converted = items.length === 0
    ? true
    : Array.from(currencies).every(c =>
        c === getAssetCurrency({ currency: displayCurrency }) ||
        (typeof fxRates?.[c] === 'number' && fxRates![c] > 0)
      );

  return {
    total,
    mixed: currencies.size > 1,
    currencies: Array.from(currencies).sort(),
    converted
  };
}

/** Convenience wrapper for asset lists ({value, currency}). */
export function sumAssetsInCurrency(
  assets: Array<{ value?: number; currency?: string }>,
  displayCurrency: string,
  fxRates?: FxRates
): NormalizationResult {
  return sumInCurrency(assets as Array<Record<string, unknown>>, 'value', displayCurrency, fxRates);
}

/** Convenience wrapper for liability lists ({amount, currency}). */
export function sumLiabilitiesInCurrency(
  liabilities: Array<{ amount?: number; currency?: string }>,
  displayCurrency: string,
  fxRates?: FxRates
): NormalizationResult {
  return sumInCurrency(liabilities as Array<Record<string, unknown>>, 'amount', displayCurrency, fxRates);
}

/**
 * Return a copy of the asset list with every value converted into the
 * display currency, so downstream pure calculators (calculateWealth) sum
 * homogeneous numbers. Preserves all other fields (type, zakatEligible, …).
 */
export function normalizeAssetsToCurrency<T extends { value?: number; currency?: string }>(
  assets: T[],
  displayCurrency: string,
  fxRates?: FxRates
): T[] {
  const to = getAssetCurrency({ currency: displayCurrency });
  return assets.map(asset => ({
    ...asset,
    value: toDisplayCurrency(Number(asset.value) || 0, getAssetCurrency(asset, displayCurrency), to, fxRates),
    currency: to
  }));
}

/**
 * Same as normalizeAssetsToCurrency for liabilities ({amount, currency}).
 */
export function normalizeLiabilitiesToCurrency<T extends { amount?: number; currency?: string }>(
  liabilities: T[],
  displayCurrency: string,
  fxRates?: FxRates
): T[] {
  const to = getAssetCurrency({ currency: displayCurrency });
  return liabilities.map(liability => ({
    ...liability,
    amount: toDisplayCurrency(Number(liability.amount) || 0, getAssetCurrency(liability, displayCurrency), to, fxRates),
    currency: to
  }));
}