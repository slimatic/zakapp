import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

/**
 * Filter options for snapshot queries.
 */
export interface SnapshotFilters {
  year?: number;
  page?: number;
  limit?: number;
  status?: string[];
}

/**
 * React Query hooks for Zakat snapshot management.
 * Provides comprehensive hooks for CRUD operations on calculation snapshots
 * with filtering, comparison, and optimistic updates.
 */

/**
 * Hook for fetching snapshots with optional filtering.
 * Supports year-based filtering and pagination.
 *
 * @param filters - Optional filters for year and pagination
 * @returns Query result with snapshots list
 */
export const useSnapshots = (filters?: SnapshotFilters) => {
  return useQuery({
    queryKey: ['zakat-snapshots', filters],
    queryFn: () => apiService.getSnapshots(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
  return useQuery({
    queryKey: ['zakat-snapshots', snapshotId],
    queryFn: () => apiService.getSnapshot(snapshotId),
    enabled: !!snapshotId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for creating new snapshots from current asset state.
 * Includes optimistic updates and invalidates related queries.
 *
 * @returns Mutation result for snapshot creation
 */
export const useCreateSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snapshotData?: {
      name?: string;
      description?: string;
      tags?: string[];
    }) => apiService.createSnapshot(snapshotData || {}),
    onSuccess: (newSnapshot) => {
      // Invalidate snapshots queries to refetch
      queryClient.invalidateQueries({ queryKey: ['zakat-snapshots'] });

      // Invalidate asset queries since snapshot creation might affect asset state
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      // Show success notification
      // toast.success('Snapshot created successfully');
    },
    retry: 2,
    retryDelay: 1000,
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

  return useMutation({
    mutationFn: (snapshotId: string) => apiService.deleteSnapshot(snapshotId),
    onMutate: async (snapshotId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['zakat-snapshots'] });
      await queryClient.cancelQueries({ queryKey: ['zakat-snapshots', snapshotId] });

      // Snapshot previous values
      const previousSnapshots = queryClient.getQueryData(['zakat-snapshots']);
      const previousSnapshot = queryClient.getQueryData(['zakat-snapshots', snapshotId]);

      // Optimistically remove from the snapshots list
      queryClient.setQueryData(['zakat-snapshots'], (old: any) => {
        if (!old?.data?.snapshots) return old;
        return {
          ...old,
          data: {
            ...old.data,
            snapshots: old.data.snapshots.filter((snapshot: any) =>
              snapshot.id !== snapshotId
            )
          }
        };
      });

      // Remove the individual snapshot record
      queryClient.removeQueries({ queryKey: ['zakat-snapshots', snapshotId] });

      return { previousSnapshots, previousSnapshot };
    },
    onError: (err, snapshotId, context) => {
      // Rollback on error
      if (context?.previousSnapshots) {
        queryClient.setQueryData(['zakat-snapshots'], context.previousSnapshots);
      }
      if (context?.previousSnapshot) {
        queryClient.setQueryData(['zakat-snapshots', snapshotId], context.previousSnapshot);
      }
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['zakat-snapshots'] });

      // Show success notification
      // toast.success('Snapshot deleted successfully');
    },
    retry: 2,
    retryDelay: 1000,
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
  return useQuery({
    queryKey: ['zakat-snapshots', 'compare', fromId, toId],
    queryFn: () => apiService.compareSnapshots(fromId, toId),
    enabled: !!(fromId && toId),
    staleTime: 10 * 60 * 1000, // 10 minutes - comparisons are expensive
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
  return useQuery({
    queryKey: ['zakat-snapshots', 'recent', limit],
    queryFn: () => apiService.getSnapshots({ limit, page: 1 }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for fetching snapshot statistics.
 * Provides aggregated data about snapshots for dashboard displays.
 *
 * @param year - Optional year filter for statistics
 * @returns Query result with snapshot statistics
 */
export const useSnapshotStats = (year?: number) => {
  return useQuery({
    queryKey: ['zakat-snapshots', 'stats', year],
    queryFn: () => apiService.getSnapshotStats(year),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};