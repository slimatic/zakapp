/**
 * PaymentDetailModal Component - T023
 * Displays detailed information about a payment record with Nisab Year context
 */

import React from 'react';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';
import { formatGregorianDate, gregorianToHijri, HIJRI_MONTHS } from '../../utils/calendarConverter';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import type { PaymentRecord, YearlySnapshot } from '@zakapp/shared/types/tracking';
import { Button } from '../ui/Button';

interface PaymentDetailModalProps {
  payment: PaymentRecord;
  nisabYear?: YearlySnapshot;
  onClose: () => void;
  onEdit?: (payment: PaymentRecord) => void;
  onDelete?: (paymentId: string) => void;
}

// Islamic recipient categories mapping
const ZAKAT_RECIPIENTS: Record<string, { label: string; description: string }> = {
  'fakir': {
    label: 'Al-Fuqara (The Poor)',
    description: 'Those with little to no income or means of livelihood'
  },
  'miskin': {
    label: 'Al-Masakin (The Needy)',
    description: 'Those in need but not as destitute as the poor'
  },
  'amil': {
    label: 'Al-Amilin (Administrators)',
    description: 'Those who collect and distribute Zakat'
  },
  'muallaf': {
    label: 'Al-Muallafah (New Muslims)',
    description: 'Recent converts who need support'
  },
  'riqab': {
    label: 'Ar-Riqab (Freeing Slaves)',
    description: 'For the liberation of slaves and captives'
  },
  'gharimin': {
    label: 'Al-Gharimin (Debt-ridden)',
    description: 'Those unable to pay off their debts'
  },
  'fisabilillah': {
    label: 'Fi Sabilillah (In Allah\'s way)',
    description: 'For Islamic causes and propagation'
  },
  'ibnus_sabil': {
    label: 'Ibn as-Sabil (Traveler)',
    description: 'Stranded travelers in need of assistance'
  }
};

const PAYMENT_METHODS: Record<string, string> = {
  'cash': 'Cash',
  'bank_transfer': 'Bank Transfer',
  'check': 'Check',
  'online': 'Online Payment',
  'cryptocurrency': 'Cryptocurrency',
  'other': 'Other'
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  'completed': { label: 'Completed', color: 'bg-green-100 text-green-800' },
  'failed': { label: 'Failed', color: 'bg-red-100 text-red-800' },
  'cancelled': { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
};

const RECIPIENT_TYPES: Record<string, string> = {
  'individual': 'Individual',
  'family': 'Family',
  'organization': 'Organization',
  'mosque': 'Mosque',
  'charity': 'Charity'
};

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  payment,
  nisabYear,
  onClose,
  onEdit,
  onDelete
}) => {
  const maskedCurrency = useMaskedCurrency();
  
  const recipientCategory = ZAKAT_RECIPIENTS[payment.recipientCategory];
  const hijriDate = gregorianToHijri(new Date(payment.paymentDate));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            <p className="text-sm text-gray-600 mt-1">Complete information about this Zakat payment</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Amount Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-sm font-medium text-green-800 mb-2">Payment Amount</div>
            <div className="text-4xl font-bold text-green-600">
              {maskedCurrency(formatCurrency(payment.amount, payment.currency as CurrencyCode))}
            </div>
            {payment.exchangeRate !== 1 && (
              <div className="text-sm text-green-700 mt-2">
                Exchange Rate: {payment.exchangeRate.toFixed(4)}
              </div>
            )}
          </div>

          {/* Recipient Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipient Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="text-sm text-gray-900 font-medium">{payment.recipientName}</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className="text-sm text-gray-900">{RECIPIENT_TYPES[payment.recipientType] || payment.recipientType}</span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-600">Category:</span>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="text-sm font-semibold text-blue-900 mb-1">
                    {categoryInfo?.label || payment.recipientCategory}
                  </div>
                  <div className="text-xs text-blue-700">
                    {categoryInfo?.description || 'Eligible Zakat recipient category'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Payment Date:</span>
                <div className="text-right">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatGregorianDate(new Date(payment.paymentDate))}
                  </div>
                  <div className="text-xs text-gray-600">
                    {hijriDate.hd} {HIJRI_MONTHS[hijriDate.hm - 1]} {hijriDate.hy} AH
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                <span className="text-sm text-gray-900">{PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                  PAYMENT_STATUS[payment.status]?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {PAYMENT_STATUS[payment.status]?.label || payment.status}
                </span>
              </div>

              {payment.receiptReference && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">Receipt Reference:</span>
                  <span className="text-sm text-gray-900 font-mono">{payment.receiptReference}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                <span>Created:</span>
                <span>{new Date(payment.createdAt).toLocaleString()}</span>
              </div>

              {payment.updatedAt !== payment.createdAt && (
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Last Updated:</span>
                  <span>{new Date(payment.updatedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Nisab Year Context */}
          {nisabYear && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked Nisab Year Record</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-blue-800 mb-1">Nisab Year</div>
                    <div className="text-sm text-blue-900">
                      {nisabYear.gregorianYear} / {nisabYear.hijriYear}H
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Calculated: {formatGregorianDate(new Date(nisabYear.calculationDate))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-800 mb-1">Total Zakat Due</div>
                    <div className="text-lg font-bold text-blue-900">
                      {maskedCurrency(formatCurrency(nisabYear.zakatAmount || 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {payment.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{payment.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          
          {onEdit && (
            <Button variant="primary" onClick={() => onEdit(payment)}>
              Edit Payment
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="ghost"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
                  onDelete(payment.id);
                  onClose();
                }
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete Payment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
