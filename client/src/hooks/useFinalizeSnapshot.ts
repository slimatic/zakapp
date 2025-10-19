/**
 * useFinalizeSnapshot Hook - T052
 * Mutation hook for finalizing snapshots (making them immutable)
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import type { YearlySnapshot } from '@zakapp/shared/types/tracking';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

interface FinalizeSnapshotResponse {
  snapshot: YearlySnapshot;
  message: string;
}

/**
 * Finalizes a yearly snapshot, making it immutable
 * @returns Mutation hook for finalizing snapshots
 */
export function useFinalizeSnapshot(): UseMutationResult<
  FinalizeSnapshotResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshotId: string) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/tracking/snapshots/${snapshotId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to finalize snapshot' }));
        throw new Error(error.error?.message || error.message || 'Failed to finalize snapshot');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, snapshotId) => {
      // Invalidate specific snapshot query
      queryClient.invalidateQueries({ queryKey: ['snapshot', snapshotId] });
      // Invalidate snapshots list
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
      // Invalidate analytics that depend on snapshot data
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });
}
