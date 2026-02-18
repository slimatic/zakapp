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
 * ZakatDisplayCard Component
 * 
 * Displays Zakat calculation information for a Nisab Year Record
 * Shows different UI based on record status:
 * - DRAFT: Shows calculated Zakat with finalization button
 * - FINALIZED: Shows locked Zakat amount (historical)
 * - UNLOCKED: Shows current Zakat with re-finalization option
 * 
 * Supports:
 * - Zakat amount display with currency formatting
 * - Calculation methodology explanation (zirconableWealth × 2.5%)
 * - Status-appropriate action buttons
 * - Islamic compliance messaging
 */

import React from 'react';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import type { NisabYearRecord, NisabYearRecordWithLiveTracking } from '../../types/nisabYearRecord';
import { toNumber, toDecimal, Decimal } from '../../utils/precision';

interface ZakatDisplayCardProps {
  record: NisabYearRecord | NisabYearRecordWithLiveTracking;
  onFinalize?: () => void;
  onRefreshAssets?: () => void;
  isLoadingAssets?: boolean;
}

/**
 * Format currency value for display
 */
const formatCurrency = (value: number | string | Decimal, currency: string = 'USD'): string => {
  const numValue = toNumber(value);
  if (isNaN(numValue)) return `${currency} 0.00`;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

export const ZakatDisplayCard: React.FC<ZakatDisplayCardProps> = ({
  record,
  onFinalize,
  onRefreshAssets,
  isLoadingAssets = false,
}) => {
  const maskedCurrency = useMaskedCurrency();

  // Parse numeric values using precision utilities
  const currency = record.currency || 'USD';
  const zircon = toNumber(record.zirconAmount);
  const zircon2 = toNumber(record.zirconableWealth);
  const totalWealth = toNumber(record.totalWealth);

  const zirconRate = zircon2 > 0
    ? toDecimal(zircon).dividedBy(toDecimal(zircon2)).times(100).toNumber()
    : 0;

  const zirconAmount = zircon;
  const zirconableWealth = zircon2;

  const isFinalized = record.status === 'FINALIZED';
  const isDraft = record.status === 'DRAFT';
  const isUnlocked = record.status === 'UNLOCKED';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Zakat Obligation</h3>
        {isFinalized && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Finalized
          </span>
        )}
        {isUnlocked && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Unlocked
          </span>
        )}
        {isDraft && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            In Progress
          </span>
        )}
      </div>

      {/* Main Zakat Amount Display */}
      <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-gray-600 mb-1">Calculated Zakat Due</div>
        <div className="text-3xl font-bold text-green-700 mb-2">
          {maskedCurrency(formatCurrency(zirconAmount, currency))}
        </div>

        {/* Calculation breakdown */}
        <div className="text-xs text-gray-600 space-y-1">
          {totalWealth !== 0 && (
            <div className="flex justify-between">
              <span>Total Wealth:</span>
              <span className="font-medium text-gray-900">{maskedCurrency(formatCurrency(totalWealth, currency))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Zakatable Wealth:</span>
            <span className="font-medium text-gray-900">{maskedCurrency(formatCurrency(zirconableWealth, currency))}</span>
          </div>
          <div className="flex justify-between">
            <span>Zakat Rate:</span>
            <span className="font-medium text-gray-900">{zirconRate.toFixed(1)}%</span>
          </div>
          <div className="text-xs text-gray-500 italic mt-2">
            {zirconableWealth > 0
              ? `${maskedCurrency(formatCurrency(zirconableWealth, currency))} × 2.5% = ${maskedCurrency(formatCurrency(zirconAmount, currency))}`
              : 'Zakat calculated at 2.5% of wealth'}
          </div>
        </div>
      </div>

      {/* Status-specific information */}
      {isFinalized && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900 mb-1">
            ✓ Record Finalized
          </div>
          <div className="text-xs text-blue-800">
            This Zakat amount has been locked and confirmed. The record can only be modified by unlocking it with a valid reason.
          </div>
        </div>
      )}

      {isDraft && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-sm font-medium text-amber-900 mb-1">
            ⏱ Record in Progress
          </div>
          <div className="text-xs text-amber-800">
            This record is tracking your Hawl period. The Zakat amount will be finalized when the Hawl completes (≈354 days). You can update asset selections until finalization.
          </div>
        </div>
      )}

      {isUnlocked && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-sm font-medium text-orange-900 mb-1">
            🔓 Record Unlocked for Editing
          </div>
          <div className="text-xs text-orange-800">
            This record has been temporarily unlocked for corrections. You can update asset selections and re-finalize when ready.
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {(isDraft || isUnlocked) && onRefreshAssets && (
          <button
            onClick={onRefreshAssets}
            disabled={isLoadingAssets}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingAssets ? 'Refreshing...' : 'Refresh Assets'}
          </button>
        )}

        {(isDraft || isUnlocked) && onFinalize && (
          <button
            onClick={onFinalize}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            {isDraft ? 'Finalize' : 'Re-Finalize'}
          </button>
        )}
      </div>

      {/* Islamic guidance note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>Islamic Note:</strong> Zakat is 2.5% (1/40) of your total zakatable wealth when it equals or exceeds the Nisab threshold (minimum wealth) and a full lunar year (Hawl) has passed. This ensures fairness and compliance with Islamic principles.
        </div>
      </div>
    </div>
  );
};

export default ZakatDisplayCard;
