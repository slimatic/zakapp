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

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

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
async function fetchNisabThreshold(currency: string = 'USD'): Promise<NisabThresholdData> {
  // Note: This endpoint should be available on the backend
  // GET /api/zakat/nisab?currency=USD&basis=GOLD
  // Returns: { nisabAmount, currency, nisabBasis, goldPrice, silverPrice, fetchedAt }
  
  const response = await fetch(`/api/zakat/nisab?currency=${currency}&basis=GOLD`, {
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

  const fetchedAt = new Date(data.data.fetchedAt);
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceUpdate > 7; // Stale if >7 days old

  return {
    ...data.data,
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
 * if (isStale) return <WarningBanner>Prices are {daysPerformingSince} days old</WarningBanner>;
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
    refetch,
  } = useQuery({
    queryKey: ['nisab-threshold', currency, nisabBasis],
    queryFn: () => fetchNisabThreshold(currency),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 5000,
  });

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
 * Simplified version for checking if data is >7 days old
 */
export function useNisabPriceStale(currency: string = 'USD'): boolean {
  const { isStale } = useNisabThreshold(currency);
  return isStale;
}

/**
 * Hook to get days since last price update
 * Useful for displaying "Updated X days ago" message
 */
export function useDaysSincePriceUpdate(currency: string = 'USD'): number | undefined {
  const { daysSinceUpdate } = useNisabThreshold(currency);
  return daysSinceUpdate;
}

/**
 * Hook to trigger price refresh
 * Useful for manual "Refresh prices" button
 */
export function useRefreshNisabPrices(currency: string = 'USD') {
  const { refetch } = useNisabThreshold(currency);
  
  return {
    refreshPrices: () => refetch(),
  };
}
