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
 * useFinalizeSnapshot Hook - T052
 * Mutation hook for finalizing snapshots (making them immutable)
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import type { YearlySnapshot } from '@zakapp/shared/types/tracking';
import { getApiBaseUrl } from '../config';

const API_BASE_URL = getApiBaseUrl();

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
