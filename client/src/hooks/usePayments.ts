/**
 * usePayments Hook - T054
 * Fetches payment records with filtering support and mutations
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import { getApiBaseUrl } from '../config';

const API_BASE_URL = getApiBaseUrl();

interface UsePaymentsOptions {
  snapshotId?: string;
  category?: string;
  enabled?: boolean;
}

interface PaymentsResponse {
  payments: PaymentRecord[];
}

/**
 * Fetches payment records for a specific snapshot or all payments
 * @param options - Query options including snapshotId and category filters
 * @returns React Query result with payments data
 */
export function usePayments(
  options: UsePaymentsOptions = {}
): UseQueryResult<PaymentsResponse, Error> {
  const { snapshotId, category, enabled = true } = options;

  return useQuery({
    queryKey: ['payments', { snapshotId, category }],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      let url = `${API_BASE_URL}/tracking/snapshots/${snapshotId}/payments`;
      
      if (category) {
        const params = new URLSearchParams({ category });
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch payments' }));
        throw new Error(error.error?.message || error.message || 'Failed to fetch payments');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: enabled && !!snapshotId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}

interface CreatePaymentData {
  snapshotId: string;
  amount: number;
  paymentDate: string;
  recipientName: string;
  recipientType: 'individual' | 'charity' | 'organization' | 'institution';
  recipientCategory: 'fakir' | 'miskin' | 'amil' | 'muallaf' | 'riqab' | 'gharimin' | 'fisabilillah' | 'ibnus_sabil';
  paymentMethod: string;
  receiptReference?: string;
  notes?: string;
  status?: string;
  currency?: string;
  exchangeRate?: number;
}

interface UpdatePaymentData {
  amount?: number;
  paymentDate?: string;
  recipientName?: string;
  recipientType?: 'individual' | 'charity' | 'organization' | 'institution';
  recipientCategory?: string;
  paymentMethod?: string;
  receiptReference?: string;
  notes?: string;
}

/**
 * Creates a new payment record
 */
export function useCreatePayment(): UseMutationResult<PaymentRecord, Error, CreatePaymentData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_BASE_URL}/tracking/snapshots/${data.snapshotId}/payments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create payment' }));
        throw new Error(error.error?.message || error.message || 'Failed to create payment');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate payments query to refetch
      queryClient.invalidateQueries({ 
        queryKey: ['payments', { snapshotId: variables.snapshotId }] 
      });
      // Also invalidate snapshot to update payment totals
      queryClient.invalidateQueries({ 
        queryKey: ['snapshots', variables.snapshotId] 
      });
    }
  });
}

/**
 * Updates an existing payment record
 */
export function useUpdatePayment(): UseMutationResult<
  PaymentRecord, 
  Error, 
  { id: string; snapshotId: string; data: UpdatePaymentData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, snapshotId, data }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_BASE_URL}/tracking/snapshots/${snapshotId}/payments/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update payment' }));
        throw new Error(error.error?.message || error.message || 'Failed to update payment');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate payments query to refetch
      queryClient.invalidateQueries({ 
        queryKey: ['payments', { snapshotId: variables.snapshotId }] 
      });
      // Also invalidate snapshot to update payment totals
      queryClient.invalidateQueries({ 
        queryKey: ['snapshots', variables.snapshotId] 
      });
    }
  });
}
