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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDb } from '../db';
import { useAuth } from '../contexts/AuthContext';
import type { NisabYearRecord } from '../types/nisabYearRecord';

/**
 * Filter options for snapshot queries.
 */
export interface SnapshotFilters {
  year?: number;
  page?: number;
  limit?: number;
  status?: string | string[];
}

export interface SnapshotListResult {
  snapshots: NisabYearRecord[];
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

/**
 * React Query hooks for Zakat snapshot management.
 * Provides comprehensive hooks for CRUD operations on calculation snapshots
 * with filtering, comparison, and optimistic updates.
 *
 * REFACTORED: Now uses local RxDB (nisab_year_records) for Offline-First mode.
 */

/**
 * Hook for fetching snapshots with optional filtering.
 * Supports year-based filtering and pagination.
 *
 * @param filters - Optional filters for year and pagination
 * @returns Query result with snapshots list
 */
export const useSnapshots = (
  filters?: SnapshotFilters,
  options?: {
    enabled?: boolean;
  }
) => {
  const db = useDb();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['zakat-snapshots', filters],
    enabled: !!db && (options?.enabled ?? true),
    queryFn: async (): Promise<SnapshotListResult> => {
      if (!db) throw new Error('Database not initialized');

      const query: any = {};
      if (user && user.id) {
        query.userId = user.id;
      }

      if (filters?.year) {
        // Handle year filtering (gregorianYear or parsing date)
        query.gregorianYear = filters.year;
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query.status = { $in: filters.status };
        } else {
          query.status = filters.status;
        }
      }

      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const offset = (page - 1) * limit;

      const results = await db.nisab_year_records.find({
        selector: query,
        sort: [{ hawlStartDate: 'desc' }],
        limit: limit,
        skip: offset
      }).exec();

      const totalResults = await db.nisab_year_records.find({
        selector: query
      }).exec();

      const snapshots = results.map(doc => doc.toJSON());

      return {
        snapshots,
        total: totalResults.length,
        limit,
        offset,
        hasMore: offset + limit < totalResults.length,
        pagination: {
          totalItems: totalResults.length,
          pageSize: limit,
          currentPage: page,
          hasMore: offset + limit < totalResults.length,
        }
      };
    },
    staleTime: 5000, // Reduced staleTime for local DB
  });
};

/**
 * Hook for fetching a single snapshot by ID.
 * Useful for detailed snapshot views and editing.
 *
 * @param snapshotId - Snapshot identifier
 * @returns Query result with single snapshot data
 */
export const useSnapshot = (snapshotId: string) => {
  const db = useDb();

  return useQuery({
    queryKey: ['zakat-snapshots', snapshotId],
    enabled: !!db && !!snapshotId,
    queryFn: async () => {
      if (!db) throw new Error('Database not initialized');
      const doc = await db.nisab_year_records.findOne(snapshotId).exec();
      if (!doc) throw new Error('Snapshot not found');
      return { success: true, data: doc.toJSON() };
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for creating new snapshots from current asset state.
 * REFACTORED: Now uses RxDB.
 */
export const useCreateSnapshot = () => {
  const queryClient = useQueryClient();
  const db = useDb();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (snapshotData: any = {}) => {
      if (!db) throw new Error('Database not initialized');
      if (!user || !user.id) throw new Error('User not authenticated');

      const newRecord = {
        ...snapshotData,
        id: crypto.randomUUID(),
        userId: user.id,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const doc = await db.nisab_year_records.insert(newRecord);
      return doc.toJSON();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zakat-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

/**
 * Hook for deleting snapshots.
 * Supports optimistic updates with rollback on failure.
 *
 * @returns Mutation result for snapshot deletion
 */
export const useDeleteSnapshot = () => {
  const queryClient = useQueryClient();
  const db = useDb();

  return useMutation({
    mutationFn: async (snapshotId: string) => {
      if (!db) throw new Error('Database not initialized');
      const doc = await db.nisab_year_records.findOne(snapshotId).exec();
      if (doc) {
        await doc.remove();
      }
      return { success: true };
    },
    onMutate: async (snapshotId) => {
      await queryClient.cancelQueries({ queryKey: ['zakat-snapshots'] });
      const previousSnapshots = queryClient.getQueryData(['zakat-snapshots']);

      queryClient.setQueryData(['zakat-snapshots'], (old: any) => {
        if (!old?.snapshots) return old;
        return {
          ...old,
          snapshots: old.snapshots.filter((s: any) => s.id !== snapshotId)
        };
      });

      return { previousSnapshots };
    },
    onError: (err, snapshotId, context) => {
      if (context?.previousSnapshots) {
        queryClient.setQueryData(['zakat-snapshots'], context.previousSnapshots);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zakat-snapshots'] });
    },
  });
};

/**
 * Hook for comparing two snapshots.
 * Useful for tracking wealth changes and Zakat calculation differences over time.
 *
 * @param fromId - Source snapshot ID for comparison
 * @param toId - Target snapshot ID for comparison
 * @returns Query result with comparison data
 */
export const useCompareSnapshots = (fromId: string, toId: string) => {
  // TODO: Implement local comparison logic if needed, or keep partial API for heavy computational comparisons
  // For now, redirecting to a safe empty state or mock
  return useQuery({
    queryKey: ['zakat-snapshots', 'compare', fromId, toId],
    queryFn: async () => {
      return { success: true, data: { differences: [] } };
    },
    enabled: !!(fromId && toId),
  });
};

/**
 * Hook for fetching snapshots by year.
 * Convenience hook for year-based filtering.
 *
 * @param year - Year to filter snapshots by
 * @returns Query result with year-filtered snapshots
 */
export const useSnapshotsByYear = (year: number) => {
  return useSnapshots({ year, limit: 50 }); // Default limit for year view
};

/**
 * Hook for fetching recent snapshots.
 * Useful for dashboard displays showing recent activity.
 *
 * @param limit - Maximum number of recent snapshots to fetch
 * @returns Query result with recent snapshots
 */
export const useRecentSnapshots = (limit: number = 5) => {
  return useSnapshots({ limit, page: 1 });
};

/**
 * Hook for fetching snapshot statistics.
 * Provides aggregated data about snapshots for dashboard displays.
 *
 * @param year - Optional year filter for statistics
 * @returns Query result with snapshot statistics
 */
export const useSnapshotStats = (year?: number) => {
  const db = useDb();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['zakat-snapshots', 'stats', year],
    enabled: !!db,
    queryFn: async () => {
      if (!db) throw new Error('Database not initialized');

      const query: any = {};
      if (user && user.id) {
        query.userId = user.id;
      }
      if (year) {
        query.gregorianYear = year;
      }

      const docs = await db.nisab_year_records.find({ selector: query }).exec();
      const records = docs.map(d => d.toJSON());

      return {
        success: true,
        data: {
          totalRecords: records.length,
          totalZakat: records.reduce((sum, r) => sum + (parseFloat(String(r.zakatAmount || 0))), 0),
          completedRecords: records.filter(r => r.status === 'FINALIZED').length,
        }
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};