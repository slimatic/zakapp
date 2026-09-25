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

import React from 'react';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';

interface WealthSummaryCardProps {
  totalWealth: number;
  /** Nisab threshold in `currency`, or `null` while unknown (loading / no metal
   *  prices). `null` renders an explicit unknown state, never a comparison. */
  nisabThreshold: number | null;
  currency?: string;
}

/**
 * WealthSummaryCard component - Displays total wealth and Nisab comparison
 * 
 * Features:
 * - Prominent display of total wealth
 * - Comparison to Nisab threshold
 * - Visual indicator (icon + color) for above/below Nisab
 * - Responsive typography
 * - Clear status messaging
 * 
 * Status Colors:
 * - Green: Wealth >= Nisab (Zakat obligation applies)
 * - Red: Wealth < Nisab (No Zakat obligation)
 * 
 * @param totalWealth - User's current total wealth
 * @param nisabThreshold - Current Nisab threshold value
 * @param currency - Currency symbol (default: USD)
 */
export const WealthSummaryCard: React.FC<WealthSummaryCardProps> = ({
  totalWealth,
  nisabThreshold,
  currency = 'USD',
}) => {
  // Unknown threshold (loading, or metal prices unavailable) must not be treated
  // as a comparison. Previously the caller substituted 5,000 and this card then
  // printed a confident "Above Nisab" — a claim about the user's obligation
  // derived from an arbitrary number.
  const nisabKnown = nisabThreshold !== null && nisabThreshold > 0;
  const isAboveNisab = nisabKnown && totalWealth >= nisabThreshold;
  const difference = nisabKnown ? Math.abs(totalWealth - nisabThreshold) : 0;
  const differencePercentage = nisabKnown
    ? ((totalWealth - nisabThreshold) / nisabThreshold) * 100
    : 0;
  const maskedCurrency = useMaskedCurrency();

  // Issue #310 (v0.15.2 regression): amounts were hardcoded to `$` while the
  // currency label below showed the real preference (e.g. IDR) — an IDR user
  // saw "$42,000,000.00 / IDR". Format with the actual currency code instead.
  // Use the shared locale-aware formatter (#310 QA sweep): currency config
  // defines locale + decimals per code (e.g. IDR → id-ID, 0 decimals) so the
  // dashboard matches Analytics/Assets rendering exactly.
  const fmt = (amount: number) => maskedCurrency(formatCurrency(amount, currency as CurrencyCode));

  return (
    <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Wealth Summary</h2>

        {/* Status Icon */}
        <div className={`p-2 rounded-full ${isAboveNisab ? 'bg-success-soft' : 'bg-danger-soft'}`}>
          {isAboveNisab ? (
            // Checkmark icon
            <svg
              className="w-5 h-5 text-success"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            // Info icon
            <svg
              className="w-5 h-5 text-danger"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Total Wealth - Large Display */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-1">Total Wealth</p>
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          {fmt(totalWealth)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{currency}</p>
      </div>

      {/* Nisab Threshold Comparison */}
      <div className={`p-3 sm:p-4 rounded-md ${
        !nisabKnown
          ? 'bg-muted border border-border'
          : isAboveNisab
            ? 'bg-success-soft border border-success/30'
            : 'bg-danger-soft border border-danger/30'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className={`text-sm font-medium ${
              !nisabKnown ? 'text-muted-foreground' : isAboveNisab ? 'text-success' : 'text-danger'
            }`}>
              {!nisabKnown ? 'Nisab unknown' : isAboveNisab ? 'Above Nisab' : 'Below Nisab'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {nisabKnown ? `Nisab: ${fmt(nisabThreshold)}` : 'Nisab: not available'}
            </p>
          </div>

          {nisabKnown && (
            <div className="text-end">
              <p className={`text-lg font-bold ${isAboveNisab ? 'text-success' : 'text-danger'}`}>
                {`${isAboveNisab ? '+' : '-'}${fmt(difference)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAboveNisab ? '+' : ''}{differencePercentage.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Status Message */}
        <p className="text-xs text-foreground/80 mt-2">
          {!nisabKnown
            ? 'We could not load the current nisab threshold, so we cannot say whether zakat is due. Try again shortly.'
            : isAboveNisab
              ? 'Your wealth meets the Nisab threshold. Zakat may be due after one lunar year (Hawl).'
              : 'Your wealth is below the Nisab threshold. No Zakat obligation at this time.'}
        </p>
      </div>
    </div>
  );
};
