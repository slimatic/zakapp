/**
 * useCreateSnapshot Hook - T050
 * Mutation hook for creating new yearly snapshots
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import type { CreateYearlySnapshotDto, YearlySnapshot } from '@zakapp/shared/types/tracking';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

interface CreateSnapshotResponse {
  snapshot: YearlySnapshot;
}

/**
 * Creates a new yearly snapshot
 * @returns Mutation hook for creating snapshots
 */
export function useCreateSnapshot(): UseMutationResult<
  CreateSnapshotResponse,
  Error,
  CreateYearlySnapshotDto
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshotData: CreateYearlySnapshotDto) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/tracking/snapshots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(snapshotData)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create snapshot' }));
        throw new Error(error.error?.message || error.message || 'Failed to create snapshot');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate snapshots list to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    }
  });
}
