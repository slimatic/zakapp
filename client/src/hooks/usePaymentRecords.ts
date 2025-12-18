import { useMutation, useQuery, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { apiService, ApiResponse } from '../services/api';
import { ZakatPayment } from '../types';

/**
 * Filter options for payment records queries.
 */
export interface PaymentFilters {
  year?: number;
  status?: 'completed' | 'pending' | 'cancelled';
  page?: number;
  limit?: number;
}

interface PaymentListResponse {
  payments: ZakatPayment[];
  hasNextPage?: boolean;
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * React Query hooks for Zakat payment records management.
 * Provides comprehensive hooks for CRUD operations on payment records
 * with pagination, filtering, and optimistic updates.
 */

/**
 * Hook for fetching payment records with pagination and filtering.
 * Uses infinite query for efficient pagination support.
 *
 * @param filters - Optional filters for year and status
 * @returns Infinite query result with payment records
 */
export const usePaymentRecords = (filters?: PaymentFilters) => {
  return useInfiniteQuery({
    queryKey: ['payments', filters],
    queryFn: ({ pageParam }) =>
      apiService.getZakatPayments({
        ...filters,
        page: pageParam as number,
        limit: filters?.limit || 20
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ApiResponse<PaymentListResponse>, pages) => {
      // Assuming the API returns pagination info
      const hasNextPage = lastPage.data?.hasNextPage || lastPage.data?.payments?.length === (filters?.limit || 20);
      return hasNextPage ? pages.length + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for fetching a single payment record by ID.
 * Useful for detailed payment views and editing.
 *
 * @param paymentId - Payment record identifier
 * @returns Query result with single payment data
 */
export const usePaymentRecord = (paymentId: string) => {
  return useQuery({
    queryKey: ['payments', paymentId],
    queryFn: () => apiService.getPayment(paymentId),
    enabled: !!paymentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for creating new payment records.
 * Includes optimistic updates and invalidates related queries.
 *
 * @returns Mutation result for payment creation
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData: {
      calculationId: string;
      amount: number;
      date: string;
      recipient: string;
      notes?: string;
    }) => apiService.recordPayment(paymentData),
    onSuccess: (newPayment) => {
      // Invalidate payment queries to refetch
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      // Invalidate calculation queries since payment affects zakat status
      queryClient.invalidateQueries({ queryKey: ['zakat'] });
      queryClient.invalidateQueries({ queryKey: ['calculations'] });

      // Show success notification
      // toast.success('Payment recorded successfully');
    },
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook for updating existing payment records.
 * Supports optimistic updates with rollback on failure.
 *
 * @returns Mutation result for payment updates
 */
export const useUpdatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, updates }: {
      paymentId: string;
      updates: Partial<Pick<ZakatPayment, 'amount' | 'date' | 'recipient' | 'notes'>>
    }) => apiService.updatePayment(paymentId, updates),
    onMutate: async ({ paymentId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['payments'] });
      await queryClient.cancelQueries({ queryKey: ['payments', paymentId] });

      // Snapshot previous values
      const previousPayments = queryClient.getQueryData(['payments']);
      const previousPayment = queryClient.getQueryData(['payments', paymentId]);

      // Optimistically update the payment record
      queryClient.setQueryData(['payments', paymentId], (old: ZakatPayment) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      // Optimistically update in the payments list
      queryClient.setQueryData(['payments'], (old: InfiniteData<ApiResponse<PaymentListResponse>> | undefined) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              payments: page.data?.payments?.map((payment: ZakatPayment) =>
                payment.id === paymentId ? { ...payment, ...updates } : payment
              ) || []
            }
          }))
        };
      });

      return { previousPayments, previousPayment };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPayments) {
        queryClient.setQueryData(['payments'], context.previousPayments);
      }
      if (context?.previousPayment) {
        queryClient.setQueryData(['payments', variables.paymentId], context.previousPayment);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', variables.paymentId] });

      // Invalidate calculation queries since payment affects zakat status
      queryClient.invalidateQueries({ queryKey: ['zakat'] });
      queryClient.invalidateQueries({ queryKey: ['calculations'] });

      // Show success notification
      // toast.success('Payment updated successfully');
    },
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook for deleting payment records.
 * Supports soft delete with optimistic updates.
 *
 * @returns Mutation result for payment deletion
 */
export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => apiService.deletePayment(paymentId),
    onMutate: async (paymentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['payments'] });
      await queryClient.cancelQueries({ queryKey: ['payments', paymentId] });

      // Snapshot previous values
      const previousPayments = queryClient.getQueryData(['payments']);
      const previousPayment = queryClient.getQueryData(['payments', paymentId]);

      // Optimistically remove from the payments list
      queryClient.setQueryData(['payments'], (old: InfiniteData<ApiResponse<PaymentListResponse>> | undefined) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              payments: page.data?.payments?.filter((payment: ZakatPayment) =>
                payment.id !== paymentId
              ) || []
            }
          }))
        };
      });

      // Remove the individual payment record
      queryClient.removeQueries({ queryKey: ['payments', paymentId] });

      return { previousPayments, previousPayment };
    },
    onError: (err, paymentId, context) => {
      // Rollback on error
      if (context?.previousPayments) {
        queryClient.setQueryData(['payments'], context.previousPayments);
      }
      if (context?.previousPayment) {
        queryClient.setQueryData(['payments', paymentId], context.previousPayment);
      }
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      // Invalidate calculation queries since payment affects zakat status
      queryClient.invalidateQueries({ queryKey: ['zakat'] });
      queryClient.invalidateQueries({ queryKey: ['calculations'] });

      // Show success notification
      // toast.success('Payment deleted successfully');
    },
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook for deleting payment records stored against a snapshot (`/payments/:id`).
 * This is used by the Nisab Year Records UI which queries `/payments?snapshotId=...`.
 */
export const useDeleteSnapshotPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => apiService.deleteSnapshotPayment(paymentId),
    onMutate: async (paymentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['payments'] });
      await queryClient.cancelQueries({ queryKey: ['payments', paymentId] });

      const previousPayments = queryClient.getQueryData(['payments']);
      const previousPayment = queryClient.getQueryData(['payments', paymentId]);

      queryClient.setQueryData(['payments'], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              payments: page.data?.payments?.filter((p: any) => p.id !== paymentId) || []
            }
          }))
        };
      });

      queryClient.removeQueries({ queryKey: ['payments', paymentId] });

      return { previousPayments, previousPayment };
    },
    onError: (err, paymentId, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(['payments'], context.previousPayments);
      }
      if (context?.previousPayment) {
        queryClient.setQueryData(['payments', paymentId], context.previousPayment);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['zakat'] });
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook for fetching payment summary statistics.
 * Useful for dashboard displays and payment tracking.
 *
 * @param year - Optional year filter for summary
 * @returns Query result with payment summary data
 */
export const usePaymentSummary = (year?: number) => {
  return useQuery({
    queryKey: ['payments', 'summary', year],
    queryFn: () => apiService.getPaymentSummary(year),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};