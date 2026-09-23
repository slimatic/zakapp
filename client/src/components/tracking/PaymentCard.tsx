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
 * PaymentCard Component - T020
 * Individual payment card showing details with linked Nisab Year context
 * Memoized for performance optimization (T062)
 */

import React from 'react';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';
import { formatGregorianDate } from '../../utils/calendarConverter';
import { looksEncrypted } from '../../utils/encryption';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import type { PaymentRecord, YearlySnapshot } from '@zakapp/shared/types/tracking';

interface PaymentCardProps {
  payment: PaymentRecord;
  nisabYear?: YearlySnapshot;
  onEdit?: (payment: PaymentRecord) => void;
  onDelete?: (paymentId: string) => void;
  onViewDetails?: (payment: PaymentRecord) => void;
  compact?: boolean;
}

// Islamic recipient categories mapping
const ZAKAT_RECIPIENTS: Record<string, string> = {
  'fakir': 'Al-Fuqara (The Poor)',
  'miskin': 'Al-Masakin (The Needy)',
  'amil': 'Al-Amilin (Administrators)',
  'muallaf': 'Al-Muallafah (New Muslims)',
  'riqab': 'Ar-Riqab (Freeing Slaves)',
  'gharimin': 'Al-Gharimin (Debt-ridden)',
  'fisabilillah': 'Fi Sabilillah (In Allah\'s way)',
  'ibnus_sabil': 'Ibn as-Sabil (Traveler)'
};

const PAYMENT_METHODS: Record<string, string> = {
  'cash': 'Cash',
  'bank_transfer': 'Bank Transfer',
  'check': 'Check',
  'online': 'Online Payment',
  'cryptocurrency': 'Cryptocurrency',
  'other': 'Other'
};

/**
 * PaymentCard component with React.memo for performance
 * Only re-renders when payment data or callbacks change
 */
export const PaymentCard: React.FC<PaymentCardProps> = React.memo(({
  payment,
  nisabYear,
  onEdit,
  onDelete,
  onViewDetails,
  compact = false
}) => {
  const maskedCurrency = useMaskedCurrency();
  // Helper to coerce possibly-missing or non-numeric amounts into a safe number
  const safeAmount = (p: PaymentRecord | any) => {
    const raw = p?.amount;
    if (raw === null || raw === undefined) return 0;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return Number.isFinite(num) ? num : 0;
  };
  
  const categoryLabel = ZAKAT_RECIPIENTS[payment.recipientCategory] || payment.recipientCategory;
  const methodLabel = PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod;

  return (
    <div className="bg-card border border-border rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow">
      {/* Mask encrypted-looking recipient names to avoid showing ciphertext to users */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {/* Header with recipient and amount */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {looksEncrypted(payment.recipientName) ? 'Encrypted recipient' : payment.recipientName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {categoryLabel}
            </p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-base sm:text-lg font-bold text-success">
                {maskedCurrency(formatCurrency(safeAmount(payment), payment.currency as CurrencyCode))}
              </div>
            <div className="text-xs text-muted-foreground">
              {formatGregorianDate(new Date(payment.paymentDate))}
            </div>
          </div>
        </div>

        {/* Nisab Year Context */}
        {nisabYear && (
          <div className="bg-accent border border-border rounded p-1.5 sm:p-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-secondary truncate">
                {nisabYear.gregorianYear} / {nisabYear.hijriYear}H
              </span>
                <span className="text-secondary whitespace-nowrap">
                Due: <span className="font-semibold text-secondary">{maskedCurrency(formatCurrency(Number(nisabYear.zakatAmount) || 0))}</span>
              </span>
            </div>
          </div>
        )}

        {/* Payment details */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 bg-muted rounded">
              {methodLabel}
            </span>
            {payment.receiptReference && (
              <span className="px-2 py-0.5 bg-muted rounded">
                Ref: {payment.receiptReference}
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {payment.notes && !compact && (
          <div className="bg-muted rounded-md p-2">
            <p className="text-xs text-muted-foreground italic">
              {payment.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1 pt-1 border-t border-border">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(payment)}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded"
            >
              Details
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => onEdit(payment)}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs text-secondary hover:text-secondary/80 hover:bg-accent rounded"
            >
              Edit
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(payment.id)}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs text-danger hover:text-danger/90 hover:bg-danger-soft rounded"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
