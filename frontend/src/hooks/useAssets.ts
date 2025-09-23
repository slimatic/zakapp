import { useState, useEffect, useCallback } from 'react';
import { AssetCategoryType } from '@zakapp/shared';
import { assetService } from '../services/assetService';
import {
  generateMockStatistics,
  generateMockGroupedAssets,
} from '../data/mockData';

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
      // Only use mock data as fallback when API fails (not when returns empty data)
      console.warn('API failed, using mock statistics:', error);
      return generateMockStatistics([]);
    }
  });
};

// Hook for grouped assets with fallback
export const useGroupedAssets = () => {
  return useAsync(async () => {
    try {
      return await assetService.getGroupedAssets();
    } catch (error) {
      // Only use mock data as fallback when API fails (not when returns empty data)
      console.warn('API failed, using mock grouped assets:', error);
      return generateMockGroupedAssets([]);
    }
  });
};

// Hook for all user assets with fallback
export const useUserAssets = () => {
  return useAsync(async () => {
    try {
      return await assetService.getUserAssets();
    } catch (error) {
      // Only use mock data as fallback when API fails (not when returns empty data)
      console.warn('API failed, using mock assets:', error);
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
      // Only use mock data as fallback when API fails (not when returns empty data)
      console.warn(
        'API failed, using empty assets for category:',
        category,
        error
      );
      return [];
    }
  }, [category]);
};
