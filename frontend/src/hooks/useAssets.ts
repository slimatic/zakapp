import { useState, useEffect, useCallback } from 'react';
import { AssetCategoryType } from '@zakapp/shared';
import { assetService } from '../services/assetService';

// Hook for loading states
export const useAsync = <T>(asyncFunction: () => Promise<T>, deps: unknown[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedAsyncFunction = useCallback(asyncFunction, [asyncFunction, ...deps]);

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

// Hook for asset statistics
export const useAssetStatistics = () => {
  return useAsync(() => assetService.getAssetStatistics());
};

// Hook for grouped assets
export const useGroupedAssets = () => {
  return useAsync(() => assetService.getGroupedAssets());
};

// Hook for all user assets
export const useUserAssets = () => {
  return useAsync(() => assetService.getUserAssets());
};

// Hook for assets by category
export const useAssetsByCategory = (category: AssetCategoryType) => {
  return useAsync(() => assetService.getAssetsByCategory(category), [category]);
};