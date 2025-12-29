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
 * useComparison Hook - T056
 * Fetches comparison data for multiple snapshots
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { YearlySnapshot } from '@zakapp/shared/types/tracking';
import { getApiBaseUrl } from '../config';

const API_BASE_URL = getApiBaseUrl();

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
