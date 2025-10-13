/**
 * useDeleteSnapshot Hook - T053
 * Mutation hook for deleting yearly snapshots
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

interface DeleteSnapshotResponse {
  message: string;
}

/**
 * Deletes a yearly snapshot
 * @returns Mutation hook for deleting snapshots
 */
export function useDeleteSnapshot(): UseMutationResult<
  DeleteSnapshotResponse,
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

      const response = await fetch(`${API_BASE_URL}/tracking/snapshots/${snapshotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete snapshot' }));
        throw new Error(error.error?.message || error.message || 'Failed to delete snapshot');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate snapshots list
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
      // Invalidate analytics that depend on snapshots
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      // Invalidate comparison data
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
    }
  });
}
