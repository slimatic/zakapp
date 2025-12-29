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
 * useUpdateSnapshot Hook - T051
 * Mutation hook for updating existing yearly snapshots (draft only)
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import type { UpdateYearlySnapshotDto, YearlySnapshot } from '@zakapp/shared/types/tracking';
import { API_BASE_URL } from '../services/api'; // Adjust path if needed
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
