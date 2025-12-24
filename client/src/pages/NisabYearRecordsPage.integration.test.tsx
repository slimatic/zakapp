
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { NisabYearRecordsPage } from './NisabYearRecordsPage';
import { apiService } from '../services/api';

// Mock API service instead of hooks to test integration
jest.mock('../services/api', () => ({
    apiService: {
        getNisabYearRecords: jest.fn(),
        getAssets: jest.fn(),
        createNisabYearRecord: jest.fn(),
        updateNisabYearRecord: jest.fn(),
        deleteNisabYearRecord: jest.fn(),
    }
}));

// Mock usePayments hook as it's used directly
jest.mock('../hooks/usePayments', () => ({
    usePayments: () => ({ data: { payments: [] }, isLoading: false }),
    useCreatePayment: () => ({ mutateAsync: jest.fn() }),
    useUpdatePayment: () => ({ mutateAsync: jest.fn() }),
}));

// Mock usePaymentRecords hooks
jest.mock('../hooks/usePaymentRecords', () => ({
    useDeletePayment: () => ({ mutateAsync: jest.fn() }),
    useDeleteSnapshotPayment: () => ({ mutateAsync: jest.fn() }),
}));

// Mock useNisabYearRecords hook - used in PaymentRecordForm
jest.mock('../hooks/useNisabYearRecords', () => ({
    useNisabYearRecords: () => ({ data: { records: [] }, isLoading: false }),
}));

const renderWithClient = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                {ui}
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe('NisabYearRecordsPage Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (apiService.getNisabYearRecords as jest.Mock).mockResolvedValue({
            success: true,
            data: { records: [] }
        });
    });

    it('renders without crashing', async () => {
        // This will implicitly test if PaymentRecordForm import crashes
        renderWithClient(<NisabYearRecordsPage />);

        expect(screen.getByText('Nisab Year Records')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText(/No.*records yet/)).toBeInTheDocument();
        });
    });

    it('opens payment modal without crashing', async () => {
        (apiService.getNisabYearRecords as jest.Mock).mockResolvedValue({
            success: true,
            data: {
                records: [
                    {
                        id: 'r1',
                        status: 'DRAFT',
                        hawlStartDate: '2024-01-01T00:00:00.000Z',
                        zakatAmount: '1000'
                    }
                ]
            }
        });

        renderWithClient(<NisabYearRecordsPage />);

        // Wait for record to appear
        await waitFor(() => {
            expect(screen.getByText('Draft')).toBeInTheDocument();
        });

        // Click on the record to select it
        screen.getByText('Draft').click();

        // Verify detail view appears
        await waitFor(() => {
            expect(screen.getByText('Payment Progress')).toBeInTheDocument();
        });

        // Click "+ Payment" button
        const addPaymentBtn = screen.getByText('+ Payment');
        fireEvent.click(addPaymentBtn);

        // Verify form appears
        await waitFor(() => {
            expect(screen.getByText('Record Zakat Payment')).toBeInTheDocument();
            // Check if PaymentRecordForm rendered inputs
            expect(screen.getByLabelText(/Amount Paid/i)).toBeInTheDocument();
        });
    });
});
