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
