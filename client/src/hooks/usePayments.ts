/**
 * usePayments Hook - T054
 * Fetches payment records with filtering support
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

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
