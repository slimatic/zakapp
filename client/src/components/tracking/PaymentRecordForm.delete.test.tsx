import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { PaymentRecordForm } from './PaymentRecordForm';
import { vi } from 'vitest';

// Mock hooks used by the component
const mockRemovePayment = vi.fn();

vi.mock('../../hooks/usePaymentRepository', () => ({
  usePaymentRepository: () => ({
    payments: [],
    isLoading: false,
    addPayment: vi.fn(),
    updatePayment: vi.fn(),
    removePayment: mockRemovePayment,
  }),
}));

// Minimal mock for nisab records hook
vi.mock('../../hooks/useNisabRecordRepository', () => ({
  useNisabRecordRepository: () => ({ data: { records: [] }, records: [], isLoading: false, error: null })
}));

const mockPayment = {
  id: 'p-1',
  amount: 100,
  paymentDate: new Date().toISOString(),
  recipientName: 'Test Recipient',
  recipientType: 'individual',
  recipientCategory: 'fakir',
  paymentMethod: 'cash',
  notes: '',
  receiptReference: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('PaymentRecordForm (delete)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithClient = (ui: React.ReactElement) => {
    const qc = new QueryClient();
    const React = require('react');
    return render(React.createElement(QueryClientProvider, { client: qc }, ui));
  };

  it('shows delete button when editing and calls deletePayment when confirmed (no nisabRecordId)', async () => {
    window.confirm = vi.fn(() => true);

    renderWithClient(
      <PaymentRecordForm
        payment={mockPayment as any}
        onCancel={() => { }}
      />
    );

    const deleteBtn = screen.getByText('Delete Payment');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    await waitFor(() => expect(mockRemovePayment).toHaveBeenCalledWith(mockPayment.id));
  });

  it('warns and clears recipient field when recipientName is encrypted', () => {
    const encrypted = { ...mockPayment, recipientName: 'uqs8fcxx88Cwt8dAIjNzMw==:Ar9S5pFFoFMMc81/Gvun3g==' } as any;
    renderWithClient(<PaymentRecordForm payment={encrypted} onCancel={() => { }} />);

    expect(screen.getByText(/Recipient name could not be decrypted/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Enter recipient name or organization') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('calls deleteSnapshot when nisabRecordId prop is provided', async () => {
    window.confirm = vi.fn(() => true);

    renderWithClient(
      <PaymentRecordForm
        payment={mockPayment as any}
        nisabRecordId={'s-1'}
        onCancel={() => { }}
      />
    );

    const deleteBtn = screen.getByText('Delete Payment');
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(mockRemovePayment).toHaveBeenCalledWith(mockPayment.id));
  });
});
