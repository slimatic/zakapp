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
 * useNisabThreshold Hook (T059)
 * 
 * Fetches and caches current Nisab threshold
 * Features:
 * - 24-hour cache TTL
 * - React Query caching
 * - Stale price warning if >7 days old
 * - Support for GOLD or SILVER basis
 */

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../services/api';
import {
  DEFAULT_NISAB_DATA,
  DEFAULT_NISAB_STANDARD,
  getNisabStandard,
  readPricePerGram,
  type ServerPrice,
} from '../core/calculations/nisab';

export interface NisabThresholdData {
  nisabAmount: number;
  currency: string;
  nisabBasis: 'GOLD' | 'SILVER';
  /** Which gram convention produced `nisabAmount` — see NISAB_STANDARDS. */
  nisabStandard: string;
  goldPrice?: number;
  silverPrice?: number;
  metalType?: string;
  fetchedAt: Date;
  isStale: boolean;
  daysSinceUpdate: number;
  /**
   * True when the API could not be reached and the threshold came from the bundled
   * fallback prices. Those are stale by construction, so this is ALWAYS true
   * alongside `isStale` — callers must label such a figure rather than present it as
   * a live rate. The app is local-first, so an unreachable server must still produce
   * a usable threshold instead of an error state.
   */
  isFallback: boolean;
}

/**
 * A threshold from the bundled fallback prices, for when the API cannot be reached.
 *
 * The prices are stale by construction (see DEFAULT_NISAB_DATA), so the result is
 * marked `isFallback` and `isStale` and never presented as live. The grams still
 * follow the user's chosen standard: being offline is no reason to silently apply a
 * different convention than the one they selected.
 */
function buildFallbackThreshold(
  currency: string,
  nisabBasis: 'GOLD' | 'SILVER',
  nisabStandard: string
): NisabThresholdData {
  const selected = getNisabStandard(nisabStandard);
  const gold = DEFAULT_NISAB_DATA.goldPrice;
  const silver = DEFAULT_NISAB_DATA.silverPrice;

  return {
    nisabAmount:
      nisabBasis === 'GOLD'
        ? gold * selected.goldGrams
        : silver * selected.silverGrams,
    currency,
    nisabBasis,
    nisabStandard: selected.id,
    goldPrice: gold,
    silverPrice: silver,
    metalType: nisabBasis === 'GOLD' ? 'gold' : 'silver',
    fetchedAt: new Date(),
    isStale: true,
    daysSinceUpdate: 0,
    isFallback: true,
  };
}

/**
 * Get current Nisab threshold from API
 * Implemented via call to /api/zakat/nisab endpoint
 */
async function fetchNisabThreshold(
  currency: string = 'USD',
  nisabBasis: 'GOLD' | 'SILVER' = 'GOLD',
  nisabStandard: string = DEFAULT_NISAB_STANDARD
): Promise<NisabThresholdData> {
  // Call the existing /api/zakat/nisab endpoint using full API_BASE_URL.
  // Issue #310 (user regression report, v0.15.2): the currency param was in
  // the query key but never sent — the server always resolved via auth prefs
  // and non-synced clients got USD, breaking cross-currency comparison
  // against locally-stored (IDR etc.) totals.
  const params = new URLSearchParams({ currency });
  const response = await fetch(`${API_BASE_URL}/zakat/nisab?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Nisab threshold');
  }

  const data = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Invalid Nisab threshold response');
  }

  // Extract data from the response
  const { goldPrice, silverPrice } = data.data;
  const selected = getNisabStandard(nisabStandard);

  // Multiply here rather than reading the server's `nisabValue`.
  //
  // The endpoint returns BOTH a `pricePerGram` and a pre-multiplied `nisabValue`,
  // and the multiplication is where the gram convention enters. The server bakes in
  // its own (87.48/612.36), so reading `nisabValue` would make the user's choice of
  // standard silently ineffective — the app would offer two thresholds and always
  // produce the first. Price is convention-free; only the grams are not, so the
  // client owns this step.
  //
  // Falls back to the server's figure only if no usable per-gram price came back,
  // which keeps a flat/legacy payload working instead of producing NaN.
  const goldPerGram = readPricePerGram(goldPrice);
  const silverPerGram = readPricePerGram(silverPrice);
  const goldNisabValue = goldPerGram !== null
    ? goldPerGram * selected.goldGrams
    : (goldPrice?.nisabValue ?? 0);
  const silverNisabValue = silverPerGram !== null
    ? silverPerGram * selected.silverGrams
    : (silverPrice?.nisabValue ?? 0);
  const nisabAmount = nisabBasis === 'GOLD' ? goldNisabValue : silverNisabValue;
  const fetchedAt = new Date(data.data.lastUpdated || data.data.effectiveDate);

  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceUpdate > 7; // Stale if >7 days old

  return {
    nisabAmount,
    currency,
    nisabBasis,
    nisabStandard: selected.id,
    goldPrice: goldPerGram ?? undefined,
    silverPrice: silverPerGram ?? undefined,
    metalType: nisabBasis === 'GOLD' ? 'gold' : 'silver',
    fetchedAt,
    isStale,
    daysSinceUpdate,
    isFallback: false,
  };
}

export interface UseNisabThresholdResult {
  // Data
  nisabAmount: number | undefined;
  currency: string;
  nisabBasis: 'GOLD' | 'SILVER';
  /** Which gram convention produced the threshold. */
  nisabStandard: string;
  metalType?: string;
  goldPrice?: number;
  silverPrice?: number;

  // Timestamps
  fetchedAt: Date | undefined;
  daysSinceUpdate: number | undefined;
  isStale: boolean;
  /**
   * True when the figure came from the bundled fallback prices because the API could
   * not be reached. `nisabAmount` is usable, but is NOT a live rate — label it as an
   * estimate and offer a retry rather than presenting it as current.
   */
  isFallback: boolean;

  // State
  isLoading: boolean;
  error: Error | null;

  // Actions
  refetch: () => void;
}

/**
 * Hook to fetch and cache Nisab threshold
 * 
 * @param currency - Currency code (default: USD)
 * @param nisabBasis - Nisab basis GOLD or SILVER (default: GOLD)
 * @param nisabStandard - Gram convention: 'tola' (87.48/612.36, default) or
 *   'aaoifi' (85/595). See NISAB_STANDARDS.
 * @returns Nisab threshold data and status
 * 
 * @example
 * const { nisabAmount, isStale, isLoading, error } = useNisabThreshold('USD');
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (isStale) return <WarningBanner>Prices are {daysSinceUpdate} days old</WarningBanner>;
 * 
 * return <div>Nisab: {nisabAmount} {currency}</div>;
 */
export function useNisabThreshold(
  currency: string = 'USD',
  nisabBasis: 'GOLD' | 'SILVER' = 'GOLD',
  nisabStandard: string = DEFAULT_NISAB_STANDARD
): UseNisabThresholdResult {
  const {
    data,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    // `nisabStandard` is in the key: it changes `nisabAmount`, and a cached threshold
    // for the other convention would otherwise be served after the user switches.
    queryKey: ['nisab-threshold', currency, nisabBasis, nisabStandard],
    queryFn: () => fetchNisabThreshold(currency, nisabBasis, nisabStandard),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 30 * 60 * 1000, // 30 minutes before garbage collection
    // Retry for a momentary blip, not to wait out an outage. `retryDelay` was 5000,
    // so a user who is simply offline waited 2 x 5 s before the fallback prices
    // appeared — 10 s of a calculator that could not compute nisab. A transient
    // failure recovers well inside this.
    retry: 2,
    retryDelay: 1500,
  });

  const refetch = useCallback(() => {
    refetchQuery();
  }, [refetchQuery]);

  // Memoize result
  const result = useMemo(() => {
    // An unreachable API must not leave the app unable to compute nisab: the app is
    // local-first, and `DEFAULT_NISAB_DATA` exists for exactly this. Substituted here
    // rather than via React Query's `placeholderData`, which would also apply while the
    // request is in flight — during loading the UI should show its loading state, not
    // stale prices.
    const source = data ?? (error ? buildFallbackThreshold(currency, nisabBasis, nisabStandard) : null);

    return {
      nisabAmount: source?.nisabAmount,
      currency: source?.currency || currency,
      nisabBasis: source?.nisabBasis || nisabBasis,
      nisabStandard: source?.nisabStandard || nisabStandard,
      metalType: source?.metalType,
      goldPrice: source?.goldPrice,
      silverPrice: source?.silverPrice,
      fetchedAt: source?.fetchedAt,
      daysSinceUpdate: source?.daysSinceUpdate,
      isStale: source?.isStale ?? false,
      // Reported separately from `error`: the figure is usable, but it is not live and
      // callers should say so rather than print it as a current rate.
      isFallback: source?.isFallback ?? false,
      isLoading,
      error: error as Error | null,
      refetch,
    };
  }, [data, currency, nisabBasis, nisabStandard, isLoading, error, refetch]);

  return result;
}

/**
 * Hook to check if Nisab prices are stale
 * Simplified variant that only checks staleness
 */
export function useNisabPriceStale(currency: string = 'USD'): boolean {
  const { isStale } = useNisabThreshold(currency);
  return isStale;
}

/**
 * Hook to get days since Nisab price was last updated
 * Simplified variant for displaying age of price data
 */
export function useDaysSincePriceUpdate(currency: string = 'USD'): number | undefined {
  const { daysSinceUpdate } = useNisabThreshold(currency);
  return daysSinceUpdate;
}

/**
 * Hook to refresh Nisab prices manually
 * Useful for "Refresh Prices" button functionality
 */
export function useRefreshNisabPrices(currency: string = 'USD'): () => void {
  const { refetch } = useNisabThreshold(currency);
  return refetch;
}
