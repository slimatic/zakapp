import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { PaymentRecordForm } from './PaymentRecordForm';
import userEvent from '@testing-library/user-event';

// Mocks
const mockCreatePayment = { mutateAsync: jest.fn(), isPending: false };
const mockUpdatePayment = { mutateAsync: jest.fn(), isPending: false };
const mockDeletePayment = { mutateAsync: jest.fn(), isPending: false };
const mockDeleteSnapshotPayment = { mutateAsync: jest.fn(), isPending: false };

jest.mock('../../hooks/usePayments', () => ({
    useCreatePayment: () => mockCreatePayment,
    useUpdatePayment: () => mockUpdatePayment,
}));

jest.mock('../../hooks/usePaymentRecords', () => ({
    useDeletePayment: () => mockDeletePayment,
    useDeleteSnapshotPayment: () => mockDeleteSnapshotPayment,
}));

const mockNisabRecords = [
    { id: 'nr-1', gregorianYear: 2024, hijriYear: 1445, status: 'DRAFT' },
    { id: 'nr-2', gregorianYear: 2023, hijriYear: 1444, status: 'FINALIZED' }
];

jest.mock('../../hooks/useNisabYearRecords', () => ({
    useNisabYearRecords: () => ({
        data: { records: mockNisabRecords },
        isLoading: false,
        error: null
    })
}));

const renderWithClient = (ui: React.ReactElement) => {
    const qc = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return render(
        <QueryClientProvider client={qc}>
            {ui}
        </QueryClientProvider>
    );
};

describe('PaymentRecordForm Refactor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        renderWithClient(<PaymentRecordForm onCancel={() => { }} />);
        expect(screen.getByText(/Record your Zakat payment/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        // const user = userEvent.setup(); // Removed setup
        renderWithClient(<PaymentRecordForm onCancel={() => { }} />);

        // Click submit without filling anything
        const submitBtn = screen.getByRole('button', { name: /Save Payment/i });
        await userEvent.click(submitBtn);

        // Check for validation messages
        // Note: Expecting messages to be standardised in the new schema
        await waitFor(() => {
            expect(screen.getByText(/Amount is required/i)).toBeInTheDocument();
            // Recipient name error
            expect(screen.getByText(/Recipient name is required/i)).toBeInTheDocument();
        });
    });

    it('submits valid data for creation', async () => {
        // const user = userEvent.setup(); // Removed setup
        mockCreatePayment.mutateAsync.mockResolvedValue({ id: 'new-p' });

        renderWithClient(<PaymentRecordForm onSuccess={() => { }} />);

        // Fill form
        // Select Nisab Record (should be mocked to have options)
        const nisabSelect = screen.getByRole('combobox', { name: /Nisab Year Record/i });
        await userEvent.selectOptions(nisabSelect, 'nr-1');

        await userEvent.type(screen.getByLabelText(/Amount Paid/i), '500.00');
        // Date is usually pre-filled with today, valid
        await userEvent.type(screen.getByLabelText(/Recipient Name/i), 'Charity ABC');

        const submitBtn = screen.getByRole('button', { name: /Save Payment/i });
        await userEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockCreatePayment.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
                amount: 500,
                recipientName: 'Charity ABC',
                snapshotId: 'nr-1'
            }));
        });
    });

    it('submits valid data for update', async () => {
        // const user = userEvent.setup(); // Removed setup
        const existingPayment = {
            id: 'p-1',
            snapshotId: 'nr-1',
            amount: 100,
            paymentDate: '2023-01-01T00:00:00.000Z',
            recipientName: 'Old Recipient',
            recipientType: 'individual',
            recipientCategory: 'fakir',
            paymentMethod: 'cash',
            currency: 'USD'
        };

        mockUpdatePayment.mutateAsync.mockResolvedValue({ ...existingPayment, amount: 200 });

        renderWithClient(
            <PaymentRecordForm
                payment={existingPayment as any}
                onSuccess={() => { }}
            />
        );

        // Edit amount
        const amountInput = screen.getByLabelText(/Amount Paid/i);
        await userEvent.clear(amountInput);
        await userEvent.type(amountInput, '200');

        const submitBtn = screen.getByRole('button', { name: /Update Payment/i });
        await userEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockUpdatePayment.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
                id: 'p-1',
                data: expect.objectContaining({
                    amount: 200
                })
            }));
        });
    });
});
