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
 * NisabComparisonWidget Component (T061)
 * 
 * Displays wealth vs Nisab threshold comparison
 * Features:
 * - Visual bar chart
 * - Color-coded (green if above, red if below)
 * - Percentage calculation
 * - Difference amount display
 */

import React, { useMemo } from 'react';
import { useNisabThreshold } from '../hooks/useNisabThreshold';
import { useHawlStatus } from '../hooks/useHawlStatus';
import { useMaskedCurrency } from '../contexts/PrivacyContext';

export interface NisabComparisonWidgetProps {
  /**
   * The Nisab Year Record
   */
  record: any;

  /**
   * Current zakatble wealth
   */
  currentWealth?: number;

  /**
   * Optional custom className
   */
  className?: string;

  /**
   * Optional callback when above/below status changes
   */
  onStatusChange?: (isAbove: boolean) => void;

  /**
   * Optional: show detailed breakdown
   */
  showDetails?: boolean;
}

/**
 * Component to display wealth vs Nisab comparison
 * 
 * Shows:
 * - Current wealth amount
 * - Nisab threshold
 * - Visual comparison bar
 * - Percentage above or below Nisab
 * - Color-coded indicator (green if above Nisab, red if below)
 * - Last price update time
 * 
 * @example
 * <NisabComparisonWidget
 *   record={nisabYearRecord}
 *   currentWealth={45000}
 *   showDetails={true}
 *   onStatusChange={(isAbove) => console.log('Above Nisab:', isAbove)}
 * />
 */
export const NisabComparisonWidget: React.FC<NisabComparisonWidgetProps> = ({
  record,
  currentWealth,
  className = '',
  onStatusChange,
  showDetails = true,
}) => {
  const maskedCurrency = useMaskedCurrency();
  // Pass nisabBasis from record to hook to get correct Nisab threshold
  const nisabBasis = (record.nisabBasis || 'GOLD') as 'GOLD' | 'SILVER';
  const { nisabAmount } = useNisabThreshold(record.currency, nisabBasis);

  // Only enable live tracking for DRAFT records, not FINALIZED or UNLOCKED
  const shouldEnableLiveTracking = record.status === 'DRAFT';
  const { liveHawlData, isUpdating } = useHawlStatus(
    record.id,
    5000,
    shouldEnableLiveTracking
  );

  // Calculate wealth and comparison
  const {
    displayWealth,
    displayNisab,
    percentage,
    isAbove,
    differenceAmount,
  } = useMemo(() => {
    // For FINALIZED/UNLOCKED records, use stored wealth (already decrypted by backend)
    // For DRAFT records, use live data if available
    // Prefer Zakatable wealth for the comparison display; fall back to totals if missing
    // Safe wealth calculation with fallback chain
    const liveZakatable = liveHawlData?.currentZakatableWealth;
    const liveTotal = liveHawlData?.currentTotalWealth;
    const recZakatable = Number(record.zakatableWealth);
    const recTotal = Number(record.totalWealth);

    // Determine base wealth values
    const effectiveZakatable = liveZakatable ?? currentWealth ?? recZakatable ?? 0;
    const effectiveTotal = liveTotal ?? recTotal ?? 0;

    const wealth = shouldEnableLiveTracking
      ? (effectiveZakatable || effectiveTotal)
      : ((currentWealth ?? recZakatable) || recTotal || 0);

    // Use nisabAmount from hook (freshly fetched based on nisabBasis)
    // Note: nisabThresholdAtStart in record is encrypted, so we can't parse it directly
    const nisab = nisabAmount || 0;

    const isWealthAbove = wealth >= nisab;
    const diff = isWealthAbove ? wealth - nisab : nisab - wealth;
    const percent = nisab > 0 ? (wealth / nisab) * 100 : 0;

    return {
      displayWealth: wealth,
      displayNisab: nisab,
      percentage: Math.min(percent, 200), // Cap visual at 200%
      isAbove: isWealthAbove,
      differenceAmount: diff,
    };
  }, [liveHawlData, currentWealth, record, nisabAmount, shouldEnableLiveTracking]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: record.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatMaskedCurrency = (amount: number) => maskedCurrency(formatCurrency(amount));

  // Notify on status change
  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(isAbove);
    }
  }, [isAbove, onStatusChange]);

  const statusLabel = isAbove ? 'Above Nisab' : 'Below Nisab';
  const statusBg = isAbove ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const statusBadge = isAbove ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  const statusIcon = isAbove ? '✓' : '⚠';

  return (
    <div className={`nisab-comparison-widget ${className}`}>
      <div className={`rounded-lg border p-4 ${statusBg}`}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Wealth vs Nisab</h3>
          {isUpdating && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              Updating...
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusBadge}`}>
            {statusIcon} {statusLabel}
          </span>
        </div>

        {/* Main comparison */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white p-3">
            <div className="text-xs text-gray-600">Zakatable Wealth</div>
            <div className="text-lg font-bold text-gray-900">
              {formatMaskedCurrency(displayWealth)}
            </div>
          </div>
          <div className="rounded-lg bg-white p-3">
            <div className="text-xs text-gray-600">Total Wealth</div>
            <div className="text-lg font-bold text-gray-900">
              {formatMaskedCurrency(record.totalWealth ? Number(record.totalWealth) : (liveHawlData?.currentTotalWealth ?? 0))}
            </div>
          </div>
          <div className="rounded-lg bg-white p-3">
            <div className="text-xs text-gray-600">Nisab Threshold</div>
            <div className="text-lg font-bold text-gray-700">
              {formatMaskedCurrency(displayNisab)}
            </div>
          </div>
        </div>

        {/* Visual bar chart */}
        <div className="mb-4">
          <div className="mb-2 flex justify-between text-xs text-gray-600">
            <span>Nisab</span>
            <span>100%</span>
            {percentage > 100 && <span>Current</span>}
          </div>
          <div className="relative h-8 overflow-hidden rounded-lg bg-gray-200">
            {/* Nisab baseline (100%) */}
            <div className="absolute left-0 top-0 h-full w-1/4 bg-gray-400"></div>

            {/* Current wealth bar */}
            <div
              className={`absolute left-0 top-0 h-full transition-all duration-500 ${isAbove ? 'bg-green-500' : 'bg-red-500'
                }`}
              style={{ width: `${Math.min(percentage / 2, 100)}%` }}
            ></div>

            {/* Percentage label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white drop-shadow-sm">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Difference indicator */}
        <div className={`rounded-lg bg-white p-3 text-center`}>
          <div className="text-xs text-gray-600">
            {isAbove ? 'Above' : 'Below'} Nisab by
          </div>
          <div className={`text-lg font-bold ${isAbove ? 'text-green-600' : 'text-red-600'}`}>
            {isAbove ? '+' : '-'} {formatMaskedCurrency(differenceAmount)}
          </div>
          <div className="text-xs text-gray-500">
            ({((differenceAmount / displayNisab) * 100).toFixed(1)}%)
          </div>
        </div>

        {/* Details section */}
        {showDetails && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="text-xs font-medium text-gray-700">Details</div>

            <div className="mt-2 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Nisab Basis:</span>
                <span className="font-medium text-gray-900">
                  {record.nisabBasis === 'GOLD' ? 'Gold (87.48g)' : 'Silver (612.36g)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-gray-900">{record.status}</span>
              </div>
              {record.startDate && (
                <div className="flex justify-between">
                  <span>Record Started:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(record.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status-specific messages */}
        {!isAbove && record.status === 'DRAFT' && (
          <div className="mt-4 rounded-lg bg-red-100 p-3">
            <p className="text-sm text-red-700">
              Wealth is below Nisab threshold. Zakat is not due until wealth reaches or exceeds the threshold.
            </p>
          </div>
        )}

        {isAbove && record.status === 'DRAFT' && (
          <div className="mt-4 rounded-lg bg-green-100 p-3">
            <p className="text-sm text-green-700">
              Wealth is above Nisab. Hawl period is tracking. Once 354 lunar days pass, you can finalize and calculate Zakat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NisabComparisonWidget;
