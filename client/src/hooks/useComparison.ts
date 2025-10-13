/**
 * useComparison Hook - T056
 * Fetches comparison data for multiple snapshots
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { YearlySnapshot } from '../../../shared/types/tracking';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

interface ComparisonSummary {
  totalZakat: number;
  averageGrowth: number;
  wealthTrend: 'increasing' | 'decreasing' | 'stable';
  zakatTrend: 'increasing' | 'decreasing' | 'stable';
}

interface UseComparisonOptions {
  snapshotIds: string[];
  enabled?: boolean;
}

interface ComparisonResponse {
  snapshots: YearlySnapshot[];
  summary?: ComparisonSummary;
  notes?: string[];
  insights?: string[];
  totalWealth?: {
    min: number;
    max: number;
    average: number;
    current: number;
  };
  totalZakat?: {
    min: number;
    max: number;
    average: number;
    current: number;
  };
}

/**
 * Compares multiple yearly snapshots
 * @param options - Query options including snapshot IDs to compare
 * @returns React Query result with comparison data
 */
export function useComparison(
  options: UseComparisonOptions
): UseQueryResult<ComparisonResponse, Error> {
  const { snapshotIds, enabled = true } = options;

  return useQuery({
    queryKey: ['comparison', { snapshotIds: snapshotIds.sort() }], // Sort for consistent cache key
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (snapshotIds.length < 2) {
        throw new Error('At least 2 snapshots are required for comparison');
      }

      const params = new URLSearchParams();
      snapshotIds.forEach(id => params.append('snapshotIds', id));

      const response = await fetch(
        `${API_BASE_URL}/tracking/comparison?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch comparison' }));
        throw new Error(error.error?.message || error.message || 'Failed to fetch comparison');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: enabled && snapshotIds.length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000 // 15 minutes
  });
}
