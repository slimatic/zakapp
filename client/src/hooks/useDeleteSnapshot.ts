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
 * useDeleteSnapshot Hook - T053
 * Mutation hook for deleting yearly snapshots
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getApiBaseUrl } from '../config';

const API_BASE_URL = getApiBaseUrl();

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
