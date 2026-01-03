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

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import { useNisabThreshold } from '../../hooks/useNisabThreshold';
import { usePayments } from '../../hooks/usePayments';
import { Decimal } from 'decimal.js';

import type { NisabYearRecord } from '../../types/nisabYearRecord';

interface ActiveRecordWidgetProps {
  record: NisabYearRecord | null;
}

/**
 * ActiveRecordWidget component - Displays active Nisab Year Record status
 * 
 * Features:
 * - Hawl progress indicator (Day X of 354)
 * - Visual progress bar with percentage
 * - Wealth vs Nisab comparison with color-coded status
 * - Status indicators: Green (above), Yellow (near), Red (below)
 * - Link to detailed Nisab Records page
 * 
 * Status Logic:
 * - Green: Wealth > Nisab + 10%
 * - Yellow: Wealth between Nisab and Nisab + 10%
 * - Red: Wealth < Nisab
 * 
 * @param record - Active Nisab Year Record (null if none exists)
 */
export const ActiveRecordWidget: React.FC<ActiveRecordWidgetProps> = ({ record }) => {
  const maskedCurrency = useMaskedCurrency();

  // Get live Nisab threshold for consistency
  const nisabBasis = (record?.nisabBasis || 'GOLD') as 'GOLD' | 'SILVER';
  const { nisabAmount } = useNisabThreshold('USD', nisabBasis);

  // Hooks must be called unconditionally. Prepare memoized values and queries
  // using safe accessors so they can be evaluated even if `record` is null.
  const zakatDue = useMemo(() => {
    const raw = record?.zakatAmount ?? record?.zakatAmount;
    if (raw === null || raw === undefined) return 0;
    if (typeof raw === 'number') return raw;
    const parsed = parseFloat(String(raw));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [record?.zakatAmount]);

  const { data: paymentsResp } = usePayments({ snapshotId: record?.id, enabled: !!record?.id });
  const payments = paymentsResp?.payments || [];

  const safeAmount = (p: any): Decimal => {
    const raw = p?.amount;
    if (raw === null || raw === undefined) return new Decimal(0);
    return new Decimal(raw);
  };

  const totalPaid = useMemo(() => {
    return payments.reduce((s: Decimal, p: any) => s.plus(safeAmount(p)), new Decimal(0)).toNumber();
  }, [payments]);

  const zakatRemaining = Math.max(0, zakatDue - totalPaid);

  if (!record) {
    return null;
  }

  // Get start and end dates (support both API and legacy field names)
  const startDateStr = record.hawlStartDate || record.startDate;
  const endDateStr = record.hawlCompletionDate || record.endDate;

  // Calculate days elapsed and remaining from dates
  const totalDays = 354; // Lunar year
  let daysElapsed = record.daysElapsed || 0;
  let daysRemaining = record.daysRemaining || totalDays;

  if (startDateStr) {
    const startDate = new Date(startDateStr);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    daysRemaining = Math.max(0, totalDays - daysElapsed);
  }

  const progressPercentage = Math.min((daysElapsed / totalDays) * 100, 100);

  // Get wealth values (support both API and legacy field names)
  // API returns totalWealth as string, need to parse it
  const currentWealth = record.currentWealth ||
    (typeof record.totalWealth === 'string' ? parseFloat(record.totalWealth) : record.totalWealth) ||
    0;

  // Nisab threshold might be encrypted (string) or a number
  // Use live value if available, otherwise fall back to record value or default
  let nisabThreshold = nisabAmount || record.initialNisabThreshold || 5000;

  // If we don't have a live value yet, try to use the record's stored value
  if (!nisabAmount && record.nisabThresholdAtStart) {
    if (typeof record.nisabThresholdAtStart === 'number') {
      nisabThreshold = record.nisabThresholdAtStart;
    } else if (typeof record.nisabThresholdAtStart === 'string') {
      // Try to parse if it's a numeric string, otherwise it might be encrypted
      const parsed = parseFloat(record.nisabThresholdAtStart);
      if (!isNaN(parsed)) {
        nisabThreshold = parsed;
      }
      // If it's encrypted (NaN), keep the default
    }
  }

  // Prevent division by zero
  const wealthDifference = currentWealth - nisabThreshold;
  const differencePercentage = nisabThreshold > 0
    ? (wealthDifference / nisabThreshold) * 100
    : 0;



  /**
   * Determine status color based on wealth vs Nisab
   */
  const getStatusColor = (): { bg: string; text: string; border: string; status: string } => {
    if (differencePercentage >= 10) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        status: 'Well Above Nisab',
      };
    } else if (differencePercentage >= 0) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        status: 'Near Nisab',
      };
    } else {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        status: 'Below Nisab',
      };
    }
  };

  const statusColors = getStatusColor();

  // Create dynamic title
  const recordYear = record.hijriYear ? `${record.hijriYear} H` : '';
  const gregorianYear = new Date(startDateStr || Date.now()).getFullYear();
  const displayTitle = recordYear ? `Active Hawl: ${recordYear} (${gregorianYear})` : `Active Hawl (${gregorianYear})`;

  return (
    <div className={`rounded-lg border-2 ${statusColors.border} ${statusColors.bg} p-6 shadow-md`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{displayTitle}</h2>
        <span className={`text-sm font-medium ${statusColors.text}`}>
          {statusColors.status}
        </span>
      </div>

      {/* Hawl Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Day {daysElapsed} of {totalDays}
          </span>
          <span className="text-sm text-gray-600">
            {daysRemaining} days remaining
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Hawl progress: ${progressPercentage.toFixed(1)}%`}
          />
        </div>

        <p className="text-xs text-gray-500 mt-1">
          {progressPercentage.toFixed(1)}% complete
        </p>
      </div>

      {/* Wealth Comparison */}
      <div className="mb-4 p-4 bg-white rounded-md border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Wealth</span>
          <span className="text-lg font-bold text-gray-900">
            {maskedCurrency(`$${currentWealth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Nisab Threshold</span>
          <span className="text-sm font-medium text-gray-700">
            {maskedCurrency(`$${nisabThreshold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
          </span>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Difference</span>
            <span className={`text-sm font-bold ${statusColors.text}`}>
              {maskedCurrency(`${wealthDifference >= 0 ? '+' : ''}$${Math.abs(wealthDifference).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
              {' '}({differencePercentage >= 0 ? '+' : ''}{differencePercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Zakat payment summary */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-600">Zakat Due</div>
            <div className="text-lg font-bold text-green-800">{maskedCurrency(`$${zakatDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Payments Made</div>
            <div className="text-lg font-bold text-gray-900">{maskedCurrency(`$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Payments Remaining</div>
            <div className="text-lg font-bold text-red-700">{maskedCurrency(`$${zakatRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</div>
          </div>
        </div>
      </div>

      {/* Action Link */}
      <Link
        to="/nisab-records"
        className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
      >
        View Detailed Record
      </Link>
    </div>
  );
};
