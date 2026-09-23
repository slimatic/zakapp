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
 * PaymentDetailModal Component - T023
 * Displays detailed information about a payment record with Nisab Year context
 */

import React from 'react';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';
import { formatGregorianDate, gregorianToHijri, HIJRI_MONTHS } from '../../utils/calendarConverter';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import { looksEncrypted } from '../../utils/encryption';
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
  'pending': { label: 'Pending', color: 'bg-warn-soft text-warn-strong' },
  'completed': { label: 'Completed', color: 'bg-success-soft text-success' },
  'failed': { label: 'Failed', color: 'bg-danger-soft text-danger' },
  'cancelled': { label: 'Cancelled', color: 'bg-muted text-foreground' }
};

const RECIPIENT_TYPES: Record<string, string> = {
  'individual': 'Individual',
  'family': 'Family',
  'organization': 'Organization',
  'mosque': 'Mosque',
  'charity': 'Charity'
};

import { Modal } from '../ui/Modal';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Payment Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Payment Amount Section */}
        <div className="bg-success-soft border border-success/30 rounded-lg p-6 text-center">
          <div className="text-sm font-medium text-success mb-2">Payment Amount</div>
          <div className="text-4xl font-bold text-success">
            {maskedCurrency(formatCurrency(payment.amount, payment.currency as CurrencyCode))}
          </div>
          {payment.exchangeRate !== 1 && (
            <div className="text-sm text-success mt-2">
              Exchange Rate: {payment.exchangeRate.toFixed(4)}
            </div>
          )}
        </div>

        {/* Recipient Information */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Recipient Information</h3>
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Name:</span>
              <span className="text-sm text-foreground font-medium">{looksEncrypted(payment.recipientName) ? 'Encrypted recipient' : payment.recipientName}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Type:</span>
              <span className="text-sm text-foreground">{RECIPIENT_TYPES[payment.recipientType] || payment.recipientType}</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Category:</span>
              <div className="bg-accent border border-border rounded p-3">
                <div className="text-sm font-semibold text-secondary mb-1">
                  {recipientCategory?.label || payment.recipientCategory}
                </div>
                <div className="text-xs text-secondary">
                  {recipientCategory?.description || 'Eligible Zakat recipient category'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Payment Details</h3>
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Payment Date:</span>
              <div className="text-end">
                <div className="text-sm text-foreground font-medium">
                  {formatGregorianDate(new Date(payment.paymentDate))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {hijriDate.hd} {HIJRI_MONTHS[hijriDate.hm - 1]} {hijriDate.hy} AH
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Payment Method:</span>
              <span className="text-sm text-foreground">{PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${PAYMENT_STATUS[payment.status]?.color || 'bg-muted text-foreground'
                }`}>
                {PAYMENT_STATUS[payment.status]?.label || payment.status}
              </span>
            </div>

            {payment.receiptReference && (
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Receipt Reference:</span>
                <span className="text-sm text-foreground font-mono">{payment.receiptReference}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Created:</span>
              <span>{new Date(payment.createdAt).toLocaleString()}</span>
            </div>

            {payment.updatedAt !== payment.createdAt && (
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Last Updated:</span>
                <span>{new Date(payment.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Nisab Year Context */}
        {nisabYear && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Linked Nisab Year Record</h3>
            <div className="bg-accent border border-border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-secondary mb-1">Nisab Year</div>
                  <div className="text-sm text-secondary">
                    {nisabYear.gregorianYear} / {nisabYear.hijriYear}H
                  </div>
                  <div className="text-xs text-secondary mt-1">
                    Calculated: {formatGregorianDate(new Date(nisabYear.calculationDate))}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-sm font-medium text-secondary mb-1">Total Zakat Due</div>
                  <div className="text-lg font-bold text-secondary">
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
            <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{payment.notes}</p>
            </div>
          </div>
        )}

        {/* Footer with Actions */}
        <div className="mt-6 border-t border-border pt-6 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          {onEdit && (
            <Button variant="default" onClick={() => onEdit(payment)}>
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
              className="text-danger hover:text-danger/90 hover:bg-danger-soft"
            >
              Delete Payment
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
