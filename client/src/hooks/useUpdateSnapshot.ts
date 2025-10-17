/**
 * useUpdateSnapshot Hook - T051
 * Mutation hook for updating existing yearly snapshots (draft only)
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import type { UpdateYearlySnapshotDto, YearlySnapshot } from '@zakapp/shared/types/tracking';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

interface UpdateSnapshotParams {
  id: string;
  data: UpdateYearlySnapshotDto;
}

interface UpdateSnapshotResponse {
  snapshot: YearlySnapshot;
}

/**
 * Updates an existing yearly snapshot (only if not finalized)
 * @returns Mutation hook for updating snapshots
 */
export function useUpdateSnapshot(): UseMutationResult<
  UpdateSnapshotResponse,
  Error,
  UpdateSnapshotParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateSnapshotParams) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/tracking/snapshots/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update snapshot' }));
        throw new Error(error.error?.message || error.message || 'Failed to update snapshot');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific snapshot query
      queryClient.invalidateQueries({ queryKey: ['snapshot', variables.id] });
      // Invalidate snapshots list
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    }
  });
}
