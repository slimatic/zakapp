/**
 * useAnalytics Hook - T055
 * Fetches analytics metrics with client-side caching
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { AnalyticsMetric } from '@zakapp/shared/types/tracking';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export type AnalyticsMetricType =
  | 'wealth_trend'
  | 'zakat_trend'
  | 'payment_distribution'
  | 'asset_composition'
  | 'yearly_comparison'
  | 'nisab_compliance'
  | 'payment_consistency';

interface UseAnalyticsOptions {
  metricType: AnalyticsMetricType;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

interface AnalyticsResponse {
  metric: AnalyticsMetric;
}

/**
 * Fetches analytics metrics with caching
 * @param options - Query options including metric type and date range
 * @returns React Query result with analytics data
 */
export function useAnalytics(
  options: UseAnalyticsOptions
): UseQueryResult<AnalyticsResponse, Error> {
  const { metricType, startDate, endDate, enabled = true } = options;

  return useQuery({
    queryKey: ['analytics', { metricType, startDate, endDate }],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({ metricType });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${API_BASE_URL}/tracking/analytics/metrics?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch analytics' }));
        throw new Error(error.error?.message || error.message || 'Failed to fetch analytics');
      }

      const result = await response.json();
      return result.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - matches backend cache TTL
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}
