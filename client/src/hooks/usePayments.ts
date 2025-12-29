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
 * @deprecated This hook is deprecated. Use usePaymentRepository instead.
 * This file is kept for backward compatibility but will be removed in future versions.
 * 
 * Migration Guide:
 * - Replace `usePayments()` with `usePaymentRepository()` 
 * - The new hook returns `{ payments, isLoading, error, addPayment, removePayment, updatePayment, bulkAddPayments }`
 * - All data is now sourced from local RxDB for privacy and offline-first functionality
 */

import { usePaymentRepository } from './usePaymentRepository';

/**
 * @deprecated Use usePaymentRepository instead
 */
export function usePayments(options: { snapshotId?: string; category?: string; enabled?: boolean } = {}) {
  console.warn('[DEPRECATED] usePayments is deprecated. Please use usePaymentRepository instead.');

  const { payments, isLoading, error } = usePaymentRepository();

  // Filter by snapshotId if provided
  const filteredPayments = options.snapshotId
    ? payments.filter(p => p.snapshotId === options.snapshotId)
    : payments;

  return {
    data: { payments: filteredPayments },
    isLoading,
    error,
    refetch: () => Promise.resolve()
  };
}

/**
 * @deprecated Use usePaymentRepository().addPayment instead
 */
export function useCreatePayment() {
  console.warn('[DEPRECATED] useCreatePayment is deprecated. Please use usePaymentRepository().addPayment instead.');
  const { addPayment } = usePaymentRepository();

  return {
    mutateAsync: addPayment,
    mutate: addPayment
  };
}

/**
 * @deprecated Use usePaymentRepository().updatePayment instead
 */
export function useUpdatePayment() {
  console.warn('[DEPRECATED] useUpdatePayment is deprecated. Please use usePaymentRepository().updatePayment instead.');
  const { updatePayment } = usePaymentRepository();

  return {
    mutateAsync: ({ id, data }: any) => updatePayment(id, data),
    mutate: ({ id, data }: any) => updatePayment(id, data)
  };
}
