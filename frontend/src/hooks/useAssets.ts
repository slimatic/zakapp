import { useState, useEffect, useCallback } from 'react';
import { AssetCategoryType } from '@zakapp/shared';
import { assetService, AssetStatistics } from '../services/assetService';

// Generate empty statistics for fallback
const generateEmptyStatistics = (): AssetStatistics => ({
  totalAssets: 0,
  totalValue: 0,
  totalZakatEligible: 0,
  assetsByCategory: {},
  assetsByCurrency: {},
});

// Generate empty grouped assets for fallback
const generateEmptyGroupedAssets = (): Record<string, never> => ({});

// Hook for loading states
export const useAsync = <T>(
  asyncFunction: () => Promise<T>,
  deps: unknown[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedAsyncFunction = useCallback(asyncFunction, deps);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await memoizedAsyncFunction();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [memoizedAsyncFunction]);

  return { data, loading, error, refetch: () => setLoading(true) };
};

// Hook for asset statistics with fallback
export const useAssetStatistics = () => {
  return useAsync(async () => {
    try {
      return await assetService.getAssetStatistics();
    } catch (error) {
      // Return empty statistics when API fails
      console.warn('API failed, returning empty statistics:', error);
      return generateEmptyStatistics();
    }
  });
};

// Hook for grouped assets with fallback
export const useGroupedAssets = () => {
  return useAsync(async () => {
    try {
      return await assetService.getGroupedAssets();
    } catch (error) {
      // Return empty grouped assets when API fails
      console.warn('API failed, returning empty grouped assets:', error);
      return generateEmptyGroupedAssets();
    }
  });
};

// Hook for all user assets with fallback
export const useUserAssets = () => {
  return useAsync(async () => {
    try {
      return await assetService.getUserAssets();
    } catch (error) {
      // Return empty array when API fails
      console.warn('API failed, returning empty assets:', error);
      return [];
    }
  });
};

// Hook for assets by category with fallback
export const useAssetsByCategory = (category: AssetCategoryType) => {
  return useAsync(async () => {
    try {
      return await assetService.getAssetsByCategory(category);
    } catch (error) {
      // Return empty array when API fails
      console.warn(
        'API failed, returning empty assets for category:',
        category,
        error
      );
      return [];
    }
  }, [category]);
};
