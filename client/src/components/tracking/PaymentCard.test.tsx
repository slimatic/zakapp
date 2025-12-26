/**
 * PaymentCard Component Tests - T045
 * Tests for Payment Card display and Nisab Year context
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentCard } from './PaymentCard';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import { PrivacyProvider } from '../../contexts/PrivacyContext';

// Mock formatters
jest.mock('../../utils/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatDate: (date: string) => new Date(date).toLocaleDateString()
}));

const mockPayment: PaymentRecord = {
  id: 'payment-1',
  userId: 'user-1',
  snapshotId: 'snapshot-1',
  amount: 250,
  currency: 'USD',
  paymentDate: '2024-12-01T00:00:00.000Z',
  recipientName: 'Islamic Relief',
  recipientType: 'charity',
  recipientCategory: 'fakir',
  paymentMethod: 'bank_transfer',
  notes: 'Monthly Zakat payment',
  receiptReference: 'REF-2024-001',
  createdAt: '2024-12-01T10:00:00.000Z',
  updatedAt: '2024-12-01T10:00:00.000Z'
};

const mockNisabYear = {
  id: 'snapshot-1',
  userId: 'user-1',
  hawlStartDate: '2023-06-01T00:00:00.000Z',
  hawlEndDate: '2024-06-01T00:00:00.000Z',
  calculationDate: '2024-06-01T00:00:00.000Z',
  nisabThreshold: 5000,
  totalWealth: 20000,
  zakatAmount: 500,
  zakatPaid: 250,
  zakatableAssets: [],
  nisabBasis: 'GOLD' as const,
  status: 'FINALIZED' as const,
  createdAt: '2024-06-01T00:00:00.000Z',
  updatedAt: '2024-12-01T10:00:00.000Z'
};

describe('Encrypted recipient masking', () => {
  it('shows masked placeholder when recipientName looks encrypted', () => {
    const encryptedPayment = { ...mockPayment, recipientName: 'uqs8fcxx88Cwt8dAIjNzMw==:Ar9S5pFFoFMMc81/Gvun3g==' } as any;
    render(
      <PrivacyProvider>
        <PaymentCard payment={encryptedPayment} />
      </PrivacyProvider>
    );
    expect(screen.getByText(/Encrypted recipient/i)).toBeInTheDocument();
  });
});
