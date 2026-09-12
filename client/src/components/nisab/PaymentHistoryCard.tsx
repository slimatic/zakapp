/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React from 'react';
import { PaymentCard } from '../tracking/PaymentCard';

/**
 * PaymentHistoryCard — extracted from NisabYearRecordsPage (#341-lite).
 *
 * Shows the payment summary for the active Nisab Year record: obligation,
 * paid, remaining balance, a "Record Payment" button (when applicable),
 * and the payment list. Purely presentational; money math is passed in.
 */
export interface PaymentHistoryCardProps {
  totalObligation: number;
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  recordStatus: string;
  payments: unknown[];
  canRecordPayment: boolean;
  onRecordPayment: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const PaymentHistoryCard: React.FC<PaymentHistoryCardProps> = ({
  totalObligation,
  totalPaid,
  remainingBalance,
  isFullyPaid,
  recordStatus: _recordStatus,
  payments,
  canRecordPayment,
  onRecordPayment,
  formatCurrency,
}) => {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-4 md:p-5 shadow-sm" data-testid="payment-history-card">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-card-foreground">Payment History</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isFullyPaid ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
          {isFullyPaid ? 'Paid' : 'Pending'}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Obligation:</span>
          <span className="font-medium text-card-foreground">{formatCurrency(totalObligation)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Paid:</span>
          <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between text-sm">
          <span className="text-card-foreground font-medium">Remaining:</span>
          <span className={`font-bold ${remainingBalance === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remainingBalance)}
          </span>
        </div>
      </div>

      {canRecordPayment && (
        <button
          onClick={onRecordPayment}
          className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Record Payment
        </button>
      )}
      <div className="mt-4 space-y-2">
        {payments.map((payment) => (
          <PaymentCard key={(payment as { id: string }).id} payment={payment as never} />
        ))}
        {payments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No payments recorded yet.</p>
        )}
      </div>
    </div>
  );
};