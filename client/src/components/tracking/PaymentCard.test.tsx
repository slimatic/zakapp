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
 * PaymentCard tests: recipient masking and row content.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { PaymentCard } from './PaymentCard';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import { PrivacyProvider } from '../../contexts/PrivacyContext';

// PaymentCard renders amounts through <Money>, which resolves the display
// currency via useDisplayCurrency -> useAuth. Stub the hook so these tests stay
// about the row's content (the auth/currency pairing has its own contract tests).
vi.mock('../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        numberingSystem: 'latn'
      }).format(amount)
  })
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

const renderCard = (payment: PaymentRecord) =>
  render(
    <PrivacyProvider>
      <PaymentCard payment={payment} />
    </PrivacyProvider>
  );

describe('Encrypted recipient masking', () => {
  it('shows masked placeholder when recipientName looks encrypted', () => {
    const encryptedPayment = {
      ...mockPayment,
      recipientName: 'uqs8fcxx88Cwt8dAIjNzMw==:Ar9S5pFFoFMMc81/Gvun3g=='
    } as any;
    renderCard(encryptedPayment);
    expect(screen.getByText(/Encrypted recipient/i)).toBeInTheDocument();
  });

  it('shows the plain recipient name when it is not encrypted', () => {
    renderCard(mockPayment);
    expect(screen.getByText('Islamic Relief')).toBeInTheDocument();
  });

  it('renders the amount, category and method in one row', () => {
    renderCard(mockPayment);
    expect(screen.getByText(/250\.00/)).toBeInTheDocument();
    // Category and method share the muted sub-line instead of separate blocks.
    expect(screen.getByText(/Al-Fuqara \(The Poor\)/)).toBeInTheDocument();
    expect(screen.getByText(/Bank transfer/)).toBeInTheDocument();
  });
});
