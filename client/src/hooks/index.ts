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

export { useCalculateZakat, useCalculateZakatOptimistic } from './useZakatCalculation';
export {
  useMethodologies,
  useMethodology,
  useUpdateMethodology,
  useCreateMethodology,
  useDeleteMethodology
} from './useMethodologies';
export {
  usePaymentRecords,
  usePaymentRecord,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  usePaymentSummary
} from './usePaymentRecords';
export type { PaymentFilters } from './usePaymentRecords';
export {
  useSnapshots,
  useSnapshot,
  useCreateSnapshot,
  useDeleteSnapshot,
  useCompareSnapshots,
  useSnapshotsByYear,
  useRecentSnapshots,
  useSnapshotStats
} from './useZakatSnapshots';

export { useNisabYearRecords } from './useNisabYearRecords';
export type { SnapshotFilters } from './useZakatSnapshots';
export { useComparison } from './useComparison';
export { useLiabilityRepository } from './useLiabilityRepository';

export { useUserSettingsRepository } from './useUserSettingsRepository';