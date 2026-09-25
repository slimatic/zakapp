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
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { useNisabThreshold } from '../../hooks/useNisabThreshold';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
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
  const { t } = useTranslation('dashboard');
  // Single source of truth for the display currency + masked formatting
  // (#310 / #341). Resolves local RxDB settings → auth settings → prefs → USD.
  const { currency: userCurrency, formatCurrency } = useDisplayCurrency();

  // Get live Nisab threshold for consistency — in the USER's currency (#310),
  // not hardcoded USD: an IDR user's hawl progress must be measured against an IDR nisab.
  const nisabBasis = (record?.nisabBasis || 'GOLD') as 'GOLD' | 'SILVER';
  const { nisabAmount } = useNisabThreshold(userCurrency, nisabBasis);

  // Hooks must be called unconditionally. Prepare memoized values and queries
  // using safe accessors so they can be evaluated even if `record` is null.
  const zakatDue = useMemo(() => {
    const raw = record?.zakatAmount ?? record?.zakatAmount;
    if (raw === null || raw === undefined) return 0;
    if (typeof raw === 'number') return raw;
    const parsed = parseFloat(String(raw));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [record?.zakatAmount]);

  const { payments } = usePaymentRepository({ snapshotId: record?.id });

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
        bg: 'bg-success-soft',
        text: 'text-success',
        border: 'border-success/30',
        status: 'Well Above Nisab',
      };
    } else if (differencePercentage >= 0) {
      return {
        bg: 'bg-warn-soft',
        text: 'text-warn-strong',
        border: 'border-warn/30',
        status: 'Near Nisab',
      };
    } else {
      return {
        bg: 'bg-danger-soft',
        text: 'text-danger',
        border: 'border-danger/30',
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
        <h2 className="text-xl font-bold text-foreground">{displayTitle}</h2>
        <span className={`text-sm font-medium ${statusColors.text}`}>
          {statusColors.status}
        </span>
      </div>

      {/* Hawl Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground/80">
            Day {daysElapsed} of {totalDays}
          </span>
          <span className="text-sm text-muted-foreground">
            {daysRemaining} days remaining
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-success h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Hawl progress: ${progressPercentage.toFixed(1)}%`}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          {progressPercentage.toFixed(1)}% complete
        </p>

        {/* Hawl countdown milestones — surfaces urgency without any state change */}
        {daysRemaining <= 30 && daysRemaining > 0 && (
          <p
            className="text-xs font-semibold text-warn-strong mt-1"
            role="status"
          >
            ⏳ Zakat due soon — {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left in this Hawl
          </p>
        )}
        {daysRemaining === 0 && (
          <p className="text-xs font-semibold text-danger mt-1" role="status">
            🔔 Hawl complete — calculate and pay your Zakat now
          </p>
        )}
      </div>

      {/* Wealth Comparison */}
      <div className="mb-4 p-4 bg-card rounded-md border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{t('widget.currentWealth')}</span>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(currentWealth)}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{t('widget.nisabThreshold')}</span>
          <span className="text-sm font-medium text-foreground/80">
            {formatCurrency(nisabThreshold)}
          </span>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/80">{t('widget.difference')}</span>
            <span className={`text-sm font-bold ${statusColors.text}`}>
              {formatCurrency(wealthDifference)}
              {' '}({differencePercentage >= 0 ? '+' : ''}{differencePercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Zakat payment summary */}
      <div className="mb-4 p-4 bg-muted rounded-md border border-border">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">{t('widget.zakatDue')}</div>
            <div className="text-lg font-bold text-success">{formatCurrency(zakatDue)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('widget.paymentsMade')}</div>
            <div className="text-lg font-bold text-foreground">{formatCurrency(totalPaid)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('widget.paymentsRemaining')}</div>
            <div className="text-lg font-bold text-danger">{formatCurrency(zakatRemaining)}</div>
          </div>
        </div>
      </div>

      {/* Action Link */}
      <Link
        to={`/nisab-records`}
        className="block w-full text-center px-4 py-2 bg-success text-success-foreground rounded-md hover:bg-success/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
      >
        {t('widget.viewDetailedRecord')}
      </Link>
    </div>
  );
};
