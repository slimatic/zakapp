import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { ZakatCalculationRequest, ZakatCalculationResult } from '../../../shared/src/types';

/**
 * Hook for Zakat calculation operations
 *
 * Provides a mutation for calculating Zakat with proper error handling,
 * caching, and query invalidation.
 *
 * @returns Mutation object with loading state, error handling, and calculation trigger
 */
export const useCalculateZakat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: ZakatCalculationRequest): Promise<ZakatCalculationResult> => {
      const response = await apiService.calculateZakat(options);

      if (!response.success) {
        throw new Error(response.error || 'Zakat calculation failed');
      }

      return response.data;
    },
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for validation errors
      if (failureCount >= 3) return false;

      // Don't retry validation errors (4xx status codes)
      if (error instanceof Error && error.message.includes('validation')) {
        return false;
      }

      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onSuccess: (data) => {
      // Cache the calculation result for 10 minutes
      queryClient.setQueryData(
        ['zakat', 'calculation', data.result.calculationId],
        data,
        { staleTime: 10 * 60 * 1000 } // 10 minutes
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['zakat', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
    onError: (error) => {
      console.error('Zakat calculation failed:', error);
    },
  });
};

/**
 * Hook for optimistic Zakat calculation updates
 *
 * Provides optimistic updates for better UX during calculation
 *
 * @returns Enhanced mutation with optimistic updates
 */
export const useCalculateZakatOptimistic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: ZakatCalculationRequest): Promise<ZakatCalculationResult> => {
      const response = await apiService.calculateZakat(options);

      if (!response.success) {
        throw new Error(response.error || 'Zakat calculation failed');
      }

      return response.data;
    },
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      if (error instanceof Error && error.message.includes('validation')) {
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async (options) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['zakat', 'calculation'] });

      // Snapshot the previous value
      const previousCalculation = queryClient.getQueryData(['zakat', 'calculation']);

      // Optimistically update with loading state
      queryClient.setQueryData(['zakat', 'calculation'], {
        ...previousCalculation,
        isCalculating: true,
        calculationOptions: options,
      });

      return { previousCalculation };
    },
    onSuccess: (data, variables, context) => {
      // Update with actual result
      queryClient.setQueryData(['zakat', 'calculation'], {
        ...data,
        isCalculating: false,
      });

      // Cache the result
      queryClient.setQueryData(
        ['zakat', 'calculation', data.result.calculationId],
        data,
        { staleTime: 10 * 60 * 1000 }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['zakat', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousCalculation) {
        queryClient.setQueryData(['zakat', 'calculation'], context.previousCalculation);
      }

      console.error('Zakat calculation failed:', error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['zakat', 'calculation'] });
    },
  });
};