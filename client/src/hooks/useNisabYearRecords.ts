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

import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { NisabYearRecord } from '../types/nisabYearRecord';

export interface NisabYearRecordFilters {
  year?: number;
  page?: number;
  limit?: number;
  status?: string | string[];
}

export interface NisabYearRecordListResult {
  records: NisabYearRecord[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  pagination: {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    hasMore: boolean;
  };
  raw?: Record<string, unknown>;
}

export interface UseNisabYearRecordOptions {
  enabled?: boolean;
}

export const useNisabYearRecords = (
  filters?: NisabYearRecordFilters,
  options?: UseNisabYearRecordOptions
) => {
  return useQuery({
    queryKey: ['nisab-year-records', filters],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<NisabYearRecordListResult> => {
      const normalizedFilters = filters ? { ...filters } : undefined;
      const requestFilters = normalizedFilters
        ? {
            year: normalizedFilters.year,
            page: normalizedFilters.page,
            limit: normalizedFilters.limit,
            status: typeof normalizedFilters.status === 'string'
              ? [normalizedFilters.status]
              : normalizedFilters.status,
          }
        : undefined;

      const response = await apiService.getNisabYearRecords(requestFilters);
      const payload = (response?.data ?? {}) as Record<string, unknown>;

      const recordsFromPayload = (payload.records as NisabYearRecord[] | undefined)
        ?? (payload.snapshots as NisabYearRecord[] | undefined)
        ?? [];
      const records = Array.isArray(recordsFromPayload) ? recordsFromPayload : [];

      const limitFromResponse = typeof payload.limit === 'number' ? (payload.limit as number) : undefined;
      const limitFromFilters = normalizedFilters?.limit;
      const derivedLimit = records.length > 0 ? records.length : undefined;
      const limit = limitFromResponse ?? limitFromFilters ?? derivedLimit ?? 0;

      const offsetFromResponse = typeof payload.offset === 'number' ? (payload.offset as number) : undefined;
      const page = normalizedFilters?.page ?? 1;
      const offset = offsetFromResponse ?? (limit ? (page - 1) * limit : 0);

      const total = typeof payload.total === 'number' ? (payload.total as number) : records.length;
      const hasMore = typeof payload.hasMore === 'boolean'
        ? (payload.hasMore as boolean)
        : offset + limit < total;

      return {
        records,
        total,
        limit,
        offset,
        hasMore,
        pagination: {
          totalItems: total,
          pageSize: limit,
          currentPage: page,
          hasMore,
        },
        raw: payload,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
