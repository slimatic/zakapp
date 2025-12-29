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
 * useCreateSnapshot Hook - T050
 * Mutation hook for creating new yearly snapshots
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import type { CreateYearlySnapshotDto, YearlySnapshot } from '@zakapp/shared/types/tracking';
import { getApiBaseUrl } from '../config';

const API_BASE_URL = getApiBaseUrl();

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
