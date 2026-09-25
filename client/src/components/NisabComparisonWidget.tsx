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
import { Tooltip } from './ui';
import { formatCurrency as canonicalCurrency } from '../utils/formatters';
import { toNumber } from '../utils/precision';

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
 *   onStatusChange={(isAbove) => logger.debug('Above Nisab:', isAbove)}
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
  const { nisabAmount, goldPrice, silverPrice } = useNisabThreshold(record.currency, nisabBasis);

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
    totalWealthDisplay,
    displayNisab,
    percentage,
    isAbove,
    differenceAmount,
    differencePercent,
    canCompare,
    hasWealth,
  } = useMemo(() => {
    // For FINALIZED/UNLOCKED records, use stored wealth (already decrypted by backend)
    // For DRAFT records, use live data if available
    // Prefer Zakatable wealth for the comparison display; fall back to totals if missing.
    //
    // Presence, not truthiness. `totalWealth`/`zakatableWealth` are NOT in the
    // record schema's `required` list, so a real record can lack them. The old
    // code said `Number(record.zakatableWealth) ?? 0` - but Number(undefined)
    // is NaN and NaN is not nullish, so that fallback never ran; the widget
    // printed "$NaN" and (since `NaN >= nisab` is false) reported "Below Nisab"
    // for a record that is above it. toNumber() is the repo's precision helper
    // and maps absent/invalid to 0, but "0" and "not on file" are different
    // claims on a Nisab verdict, so an absent source stays null here and the
    // verdict is withheld instead of defaulted to "below".
    const num = (v: string | number | null | undefined): number | null =>
      v === null || v === undefined || v === '' ? null : toNumber(v);

    const liveZakatable = num(liveHawlData?.currentZakatableWealth);
    const liveTotal = num(liveHawlData?.currentTotalWealth);
    const recZakatable = num(record.zakatableWealth);
    const recTotal = num(record.totalWealth);
    const propWealth = num(currentWealth);

    // `??`, not `||`: a computed 0 is an answer, not a missing value.
    const wealth = shouldEnableLiveTracking
      ? (liveZakatable ?? propWealth ?? recZakatable ?? liveTotal ?? recTotal)
      : (propWealth ?? recZakatable ?? recTotal ?? liveTotal);
    const totalWealth = shouldEnableLiveTracking
      ? (liveTotal ?? recTotal)
      : (recTotal ?? liveTotal);

    // Use nisabAmount from hook (freshly fetched based on nisabBasis)
    // Note: nisabThresholdAtStart in record is encrypted, so we can't parse it directly
    const nisab = nisabAmount ?? 0;
    // nisabAmount is undefined until the price fetch lands; a 0 threshold must
    // not be read as "everything is above Nisab".
    const hasNisab = nisab > 0;
    const comparable = wealth !== null && hasNisab;

    const isWealthAbove = comparable && wealth >= nisab;
    const diff = comparable ? (isWealthAbove ? wealth - nisab : nisab - wealth) : 0;
    const percent = comparable ? (wealth / nisab) * 100 : 0;

    return {
      displayWealth: wealth,
      totalWealthDisplay: totalWealth,
      displayNisab: hasNisab ? nisab : null,
      percentage: Math.min(percent, 200), // Cap visual at 200%
      isAbove: isWealthAbove,
      differenceAmount: diff,
      differencePercent: comparable ? (diff / nisab) * 100 : 0,
      canCompare: comparable,
      hasWealth: wealth !== null,
    };
  }, [liveHawlData, currentWealth, record, nisabAmount, shouldEnableLiveTracking]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return canonicalCurrency(amount, record.currency || 'USD');
  };

  const formatMaskedCurrency = (amount: number) => maskedCurrency(formatCurrency(amount));

  // Notify on status change only when a verdict actually exists. Reporting
  // `false` for "unknown" would push the same wrong "Below Nisab" downstream.
  React.useEffect(() => {
    if (onStatusChange && canCompare) {
      onStatusChange(isAbove);
    }
  }, [isAbove, canCompare, onStatusChange]);

  const statusLabel = !canCompare ? 'Not enough data' : isAbove ? 'Above Nisab' : 'Below Nisab';
  const statusBg = !canCompare
    ? 'bg-muted border-border'
    : isAbove
      ? 'bg-success-soft border-success/30'
      : 'bg-danger-soft border-danger/30';
  const statusBadge = !canCompare
    ? 'bg-muted text-muted-foreground'
    : isAbove
      ? 'bg-success-soft text-success'
      : 'bg-danger-soft text-danger';
  const statusIcon = !canCompare ? '–' : isAbove ? '✓' : '⚠';

  // Label/value rows, matching the detail-panel vocabulary in the design.
  // These were three fixed columns, which does not work: this card renders in
  // the ~350px detail rail, and `lg:grid-cols-3` keys off the VIEWPORT, not the
  // container - so on a desktop width three columns each got ~110px and the
  // money strings ($153,561.38 / $91,920.60 / $11,985.63) ran into each other.
  // A null value means "not on file", rendered as a dash rather than $0.00.
  const comparisonRows: Array<{ label: string; value: number | null; emphasis: boolean }> = [
    { label: 'Zakatable Wealth', value: displayWealth, emphasis: true },
    { label: 'Total Wealth', value: totalWealthDisplay, emphasis: false },
    { label: 'Nisab Threshold', value: displayNisab, emphasis: false },
  ];

  const renderMoney = (amount: number | null) =>
    amount === null ? '—' : formatMaskedCurrency(amount);

  return (
    <div className={`nisab-comparison-widget ${className}`}>
      <div className={`rounded-lg border p-4 ${statusBg}`}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Wealth vs Nisab</h3>
          {isUpdating && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-secondary"></span>
              Updating...
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusBadge}`}>
            {statusIcon} {statusLabel}
          </span>
        </div>

        {/* Main comparison - label/value rows, not fixed columns */}
        <div className="mb-4 flex flex-col gap-1">
          {comparisonRows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3 py-1.5"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {row.label}
              </span>
              <Tooltip content={renderMoney(row.value)}>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums tracking-tight ${
                    row.emphasis ? 'text-foreground' : 'text-foreground/80'
                  }`}
                >
                  {renderMoney(row.value)}
                </span>
              </Tooltip>
            </div>
          ))}
        </div>

        {/* Visual bar chart */}
        <div className="mb-4">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Nisab</span>
            <span>100%</span>
            {percentage > 100 && <span>Current</span>}
          </div>
          <div className="relative h-8 overflow-hidden rounded-lg bg-muted">
            {/* Nisab baseline (100%) */}
            <div className="absolute start-0 top-0 h-full w-1/4 bg-border-strong"></div>

            {/* Current wealth bar */}
            <div
              className={`absolute start-0 top-0 h-full transition-all duration-500 ${
                !canCompare ? 'bg-border-strong' : isAbove ? 'bg-success' : 'bg-danger'
              }`}
              style={{ width: `${Math.min(percentage / 2, 100)}%` }}
            ></div>

            {/* Percentage label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-success-foreground">
                {canCompare ? `${percentage.toFixed(0)}%` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Difference indicator */}
        <div className={`rounded-lg bg-card p-3 text-center`}>
          <div className="text-xs text-muted-foreground">
            {!canCompare ? 'Comparison unavailable' : `${isAbove ? 'Above' : 'Below'} Nisab by`}
          </div>
          <div className={`text-lg font-bold ${!canCompare ? 'text-muted-foreground' : isAbove ? 'text-success' : 'text-danger'}`}>
            {canCompare ? `${isAbove ? '+' : '-'} ${formatMaskedCurrency(differenceAmount)}` : '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            {canCompare ? `(${differencePercent.toFixed(1)}%)` : '(wealth not on file)'}
          </div>
        </div>

        {/* Details section */}
        {showDetails && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="text-xs font-medium text-foreground/80">Details</div>

            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Nisab Basis:</span>
                <span className="font-medium text-foreground">
                  {record.nisabBasis === 'GOLD' ? 'Gold (87.48g)' : 'Silver (612.36g)'}
                </span>
              </div>

              {/* Live Price Display by Antigravity */}
              {(record.nisabBasis === 'GOLD' ? goldPrice : silverPrice) && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Current Price:</span>
                  <span className="font-medium">
                    {formatMaskedCurrency(Number(record.nisabBasis === 'GOLD' ? goldPrice : silverPrice))}/g
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-foreground">{record.status}</span>
              </div>
              {record.startDate && (
                <div className="flex justify-between">
                  <span>Record Started:</span>
                  <span className="font-medium text-foreground">
                    {new Date(record.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status-specific messages - both gated on canCompare, so an unknown
            wealth value never produces a "below Nisab" ruling. */}
        {canCompare && !isAbove && record.status === 'DRAFT' && (
          <div className="mt-4 rounded-lg bg-danger-soft p-3">
            <p className="text-sm text-danger">
              Wealth is below Nisab threshold. Zakat is not due until wealth reaches or exceeds the threshold.
            </p>
          </div>
        )}

        {canCompare && isAbove && record.status === 'DRAFT' && (
          <div className="mt-4 rounded-lg bg-success-soft p-3">
            <p className="text-sm text-success">
              Wealth is above Nisab. Hawl period is tracking. Once 354 lunar days pass, you can finalize and calculate Zakat.
            </p>
          </div>
        )}

        {!canCompare && (
          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              {hasWealth
                ? 'Nisab threshold unavailable — cannot compare wealth right now.'
                : 'No wealth figure is recorded for this year yet, so a Nisab comparison cannot be made.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NisabComparisonWidget;
