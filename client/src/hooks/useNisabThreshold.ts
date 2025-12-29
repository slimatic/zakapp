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

export interface NisabThresholdData {
  nisabAmount: number;
  currency: string;
  nisabBasis: 'GOLD' | 'SILVER';
  goldPrice?: number;
  silverPrice?: number;
  metalType?: string;
  fetchedAt: Date;
  isStale: boolean;
  daysSinceUpdate: number;
}

/**
 * Get current Nisab threshold from API
 * Implemented via call to /api/zakat/nisab endpoint
 */
async function fetchNisabThreshold(
  currency: string = 'USD',
  nisabBasis: 'GOLD' | 'SILVER' = 'GOLD'
): Promise<NisabThresholdData> {
  // Call the existing /api/zakat/nisab endpoint using full API_BASE_URL
  const response = await fetch(`${API_BASE_URL}/zakat/nisab`, {
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
  const nisabAmount = nisabBasis === 'GOLD' ? goldPrice.nisabValue : silverPrice.nisabValue;
  const fetchedAt = new Date(data.data.lastUpdated || data.data.effectiveDate);
  
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceUpdate > 7; // Stale if >7 days old

  return {
    nisabAmount,
    currency,
    nisabBasis,
    goldPrice: goldPrice.pricePerGram,
    silverPrice: silverPrice.pricePerGram,
    metalType: nisabBasis === 'GOLD' ? 'gold' : 'silver',
    fetchedAt,
    isStale,
    daysSinceUpdate,
  };
}

export interface UseNisabThresholdResult {
  // Data
  nisabAmount: number | undefined;
  currency: string;
  nisabBasis: 'GOLD' | 'SILVER';
  metalType?: string;
  
  // Timestamps
  fetchedAt: Date | undefined;
  daysSinceUpdate: number | undefined;
  isStale: boolean;
  
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
  nisabBasis: 'GOLD' | 'SILVER' = 'GOLD'
): UseNisabThresholdResult {
  const {
    data,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['nisab-threshold', currency, nisabBasis],
    queryFn: () => fetchNisabThreshold(currency, nisabBasis),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 30 * 60 * 1000, // 30 minutes before garbage collection
    retry: 2,
    retryDelay: 5000,
  });

  const refetch = useCallback(() => {
    refetchQuery();
  }, [refetchQuery]);

  // Memoize result
  const result = useMemo(
    () => ({
      nisabAmount: data?.nisabAmount,
      currency: data?.currency || currency,
      nisabBasis: data?.nisabBasis || nisabBasis,
      metalType: data?.metalType,
      fetchedAt: data?.fetchedAt,
      daysSinceUpdate: data?.daysSinceUpdate,
      isStale: data?.isStale ?? false,
      isLoading,
      error: error as Error | null,
      refetch,
    }),
    [data, currency, nisabBasis, isLoading, error, refetch]
  );

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
