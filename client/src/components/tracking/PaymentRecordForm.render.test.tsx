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
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentRecordForm } from './PaymentRecordForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithClient = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  const React = require('react');
  return render(React.createElement(QueryClientProvider, { client: qc }, ui));
};

import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../hooks/usePaymentRepository', () => ({
  usePaymentRepository: () => ({
    payments: [],
    addPayment: vi.fn(),
    updatePayment: vi.fn(),
    removePayment: vi.fn(),
  }),
}));

vi.mock('../../hooks/useNisabRecordRepository', () => ({
  useNisabRecordRepository: () => ({
    records: [],
    isLoading: false,
  }),
}));

describe('PaymentRecordForm mount', () => {
  it('renders when creating new payment (no payment prop)', () => {
    renderWithClient(<PaymentRecordForm onCancel={() => { }} />);
    expect(screen.getByText(/Record your Zakat payment/i)).toBeInTheDocument();
  });
});
