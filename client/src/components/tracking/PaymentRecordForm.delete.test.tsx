import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentRecordForm } from './PaymentRecordForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockDeletePayment = { mutateAsync: jest.fn(), isPending: false };
const mockDeleteSnapshotPayment = { mutateAsync: jest.fn(), isPending: false };

jest.mock('../../hooks/usePaymentRecords', () => ({
  useDeletePayment: () => mockDeletePayment,
  useDeleteSnapshotPayment: () => mockDeleteSnapshotPayment,
}));

jest.mock('../../hooks/useNisabYearRecords', () => ({
  useNisabYearRecords: () => ({ data: { records: [] }, isLoading: false, error: null })
}));

const renderWithClient = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe('PaymentRecordForm - delete identifier selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('calls deletePayment with paymentId when editing a global zakat payment (no snapshot)', async () => {
    const payment = {
      paymentId: 'zak-123',
      amount: 50,
      paymentDate: new Date().toISOString(),
      recipientName: 'Global',
      recipientType: 'charity',
      recipientCategory: 'fakir',
      paymentMethod: 'cash',
      notes: '',
      receiptReference: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;

    renderWithClient(<PaymentRecordForm payment={payment} onCancel={() => {}} />);

    const deleteBtn = screen.getByText('Delete Payment');
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(mockDeletePayment.mutateAsync).toHaveBeenCalledWith('zak-123'));
  });

  it('calls deleteSnapshot with id when payment has snapshotId', async () => {
    const payment = {
      id: 'snap-abc',
      snapshotId: 's-1',
      amount: 200,
      paymentDate: new Date().toISOString(),
      recipientName: 'Snapshot',
      recipientType: 'charity',
      recipientCategory: 'fakir',
      paymentMethod: 'cash',
      notes: '',
      receiptReference: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;

    renderWithClient(<PaymentRecordForm payment={payment} nisabRecordId={'s-1'} onCancel={() => {}} />);

    const deleteBtn = screen.getByText('Delete Payment');
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(mockDeleteSnapshotPayment.mutateAsync).toHaveBeenCalledWith('snap-abc'));
  });
});
