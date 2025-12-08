/**
 * PaymentCard Component - T020
 * Individual payment card showing details with linked Nisab Year context
 */

import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { formatGregorianDate } from '../../utils/calendarConverter';
import type { PaymentRecord, YearlySnapshot } from '@zakapp/shared/types/tracking';
import { Button } from '../ui/Button';

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

export const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  nisabYear,
  onEdit,
  onDelete,
  onViewDetails,
  compact = false
}) => {
  const categoryLabel = ZAKAT_RECIPIENTS[payment.recipientCategory] || payment.recipientCategory;
  const methodLabel = PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4">
        {/* Header with recipient and amount */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">
              {payment.recipientName}
            </h4>
            <p className="text-sm text-gray-600 mt-0.5">
              {categoryLabel}
            </p>
          </div>
          <div className="text-right ml-4 flex-shrink-0">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(payment.amount, payment.currency)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatGregorianDate(new Date(payment.paymentDate))}
            </div>
          </div>
        </div>

        {/* Nisab Year Context */}
        {nisabYear && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs font-medium text-blue-800 mb-1">
                  Linked Nisab Year Record
                </div>
                <div className="text-sm font-semibold text-blue-900">
                  Hawl: {new Date(nisabYear.hawlStartDate).getFullYear()} 
                  {' '}({formatGregorianDate(new Date(nisabYear.hawlStartDate))} - {formatGregorianDate(new Date(nisabYear.hawlEndDate))})
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-blue-700 mb-1">Zakat Due</div>
                <div className="text-sm font-semibold text-blue-900">
                  {formatCurrency(nisabYear.zakatAmount || 0, nisabYear.currency)}
                </div>
              </div>
            </div>
            
            {/* Payment progress for this Nisab Year */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-700">Total Paid for this Hawl:</span>
                <span className="font-semibold text-blue-900">
                  {formatCurrency(nisabYear.zakatPaid || 0, nisabYear.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-blue-700">Outstanding Balance:</span>
                <span className={`font-semibold ${
                  (nisabYear.zakatAmount || 0) - (nisabYear.zakatPaid || 0) <= 0 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {formatCurrency(
                    Math.max(0, (nisabYear.zakatAmount || 0) - (nisabYear.zakatPaid || 0)),
                    nisabYear.currency
                  )}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-2">
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, ((nisabYear.zakatPaid || 0) / (nisabYear.zakatAmount || 1)) * 100)}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-blue-700 mt-1 text-center">
                  {Math.round(((nisabYear.zakatPaid || 0) / (nisabYear.zakatAmount || 1)) * 100)}% paid
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment details */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {methodLabel}
            </span>

            {payment.receiptReference && (
              <span className="flex items-center">
                <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l4-2 4 2V4M7 4h10M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h2" />
                </svg>
                Ref: {payment.receiptReference}
              </span>
            )}

            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(payment.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Notes */}
        {payment.notes && !compact && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Notes</div>
            <p className="text-sm text-gray-600 italic">
              {payment.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(payment)}
            >
              View Details
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(payment)}
            >
              Edit
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(payment.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
