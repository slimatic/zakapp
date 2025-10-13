/**
 * useSnapshots Hook - T049
 * Fetches yearly snapshots with pagination support
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { YearlySnapshot } from '../../../shared/types/tracking';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

interface UseSnapshotsOptions {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  status?: 'draft' | 'finalized' | 'all';
  year?: number;
  enabled?: boolean;
}

interface SnapshotsResponse {
  snapshots: YearlySnapshot[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Fetches yearly snapshots with pagination
 * @param options - Query options including pagination parameters
 * @returns React Query result with snapshots data
 */
export function useSnapshots(
  options: UseSnapshotsOptions = {}
): UseQueryResult<SnapshotsResponse, Error> {
  const {
    page = 1,
    limit = 10,
    sortOrder = 'desc',
    status,
    year,
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['snapshots', { page, limit, sortOrder, status, year }],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortOrder
      });

      if (status) params.append('status', status);
      if (year) params.append('year', year.toString());

      const response = await fetch(
        `${API_BASE_URL}/tracking/snapshots?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch snapshots' }));
        throw new Error(error.error?.message || error.message || 'Failed to fetch snapshots');
      }

      const result = await response.json();
      return result.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (formerly cacheTime)
  });
}
