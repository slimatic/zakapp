import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { MethodologyInfo } from '@zakapp/shared';

/**
 * React Query hooks for Zakat methodology management.
 * Provides comprehensive hooks for fetching, updating, and managing
 * Zakat calculation methodologies with proper caching and error handling.
 */

/**
 * Hook for fetching all available methodologies (fixed and custom).
 * Methodologies are cached for 1 hour since they rarely change.
 *
 * @returns Query result with methodologies data
 */
export const useMethodologies = () => {
  return useQuery({
    queryKey: ['methodologies'],
    queryFn: () => apiService.getMethodologies(),
    staleTime: 60 * 60 * 1000, // 1 hour - methodologies don't change often
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for fetching a specific methodology by ID.
 * Useful for displaying detailed methodology information.
 *
 * @param id - Methodology identifier
 * @returns Query result with single methodology data
 */
export const useMethodology = (id: string) => {
  return useQuery({
    queryKey: ['methodologies', id],
    queryFn: () => apiService.getMethodology(id),
    enabled: !!id,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for updating methodology configurations.
 * Supports optimistic updates and proper error handling.
 *
 * @returns Mutation result for methodology updates
 */
export const useUpdateMethodology = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MethodologyInfo> }) =>
      apiService.updateMethodology(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['methodologies'] });
      await queryClient.cancelQueries({ queryKey: ['methodologies', id] });

      // Snapshot the previous values
      const previousMethodologies = queryClient.getQueryData(['methodologies']);
      const previousMethodology = queryClient.getQueryData(['methodologies', id]);

      // Optimistically update the methodologies list
      queryClient.setQueryData(['methodologies'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          custom: old.custom?.map((methodology: MethodologyInfo) =>
            methodology.id === id ? { ...methodology, ...updates } : methodology
          ) || []
        };
      });

      // Optimistically update the specific methodology
      queryClient.setQueryData(['methodologies', id], (old: MethodologyInfo) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      return { previousMethodologies, previousMethodology };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMethodologies) {
        queryClient.setQueryData(['methodologies'], context.previousMethodologies);
      }
      if (context?.previousMethodology) {
        queryClient.setQueryData(['methodologies', variables.id], context.previousMethodology);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['methodologies'] });
      queryClient.invalidateQueries({ queryKey: ['methodologies', variables.id] });

      // Show success notification (assuming toast system exists)
      // toast.success('Methodology updated successfully');
    },
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook for creating custom methodologies.
 * Adds the new methodology to the cache on success.
 *
 * @returns Mutation result for methodology creation
 */
export const useCreateMethodology = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (methodologyData: Omit<MethodologyInfo, 'id'>) =>
      apiService.createMethodology(methodologyData),
    onSuccess: (newMethodology) => {
      // Add the new methodology to the cached list
      queryClient.setQueryData(['methodologies'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          custom: [...(old.custom || []), newMethodology]
        };
      });

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['methodologies'] });

      // Show success notification
      // toast.success('Custom methodology created successfully');
    },
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook for deleting custom methodologies.
 * Removes the methodology from cache and handles optimistic updates.
 *
 * @returns Mutation result for methodology deletion
 */
export const useDeleteMethodology = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteMethodology(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['methodologies'] });

      // Snapshot previous value
      const previousMethodologies = queryClient.getQueryData(['methodologies']);

      // Optimistically remove from the list
      queryClient.setQueryData(['methodologies'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          custom: old.custom?.filter((methodology: MethodologyInfo) => methodology.id !== id) || []
        };
      });

      return { previousMethodologies };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousMethodologies) {
        queryClient.setQueryData(['methodologies'], context.previousMethodologies);
      }
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['methodologies'] });

      // Show success notification
      // toast.success('Methodology deleted successfully');
    },
    retry: 2,
    retryDelay: 1000,
  });
};