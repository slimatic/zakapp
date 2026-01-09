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
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { NisabYearRecordsPage } from './NisabYearRecordsPage';
import { apiService } from '../services/api';

import { vi } from 'vitest';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { useAssetRepository } from '../hooks/useAssetRepository';

// Mock Repository Hooks
vi.mock('../hooks/useNisabRecordRepository', () => ({
    useNisabRecordRepository: vi.fn()
}));

vi.mock('../hooks/usePaymentRepository', () => ({
    usePaymentRepository: vi.fn()
}));

vi.mock('../hooks/useAssetRepository', () => ({
    useAssetRepository: vi.fn()
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            maxAssets: 10,
            maxNisabRecords: 100,
            maxPayments: 1000,
            settings: {
                currency: 'USD',
                madhab: 'hanafi'
            }
        }
    }),
}));

// Mock PrivacyContext
vi.mock('../contexts/PrivacyContext', () => ({
    useMaskedCurrency: () => (val: string) => val,
    usePrivacy: () => ({ privacyMode: false, togglePrivacyMode: vi.fn(), setPrivacyMode: vi.fn() }),
}));

// Mock Legacy hooks (just in case sub-components use them, or remove if verified unused)
// PaymentRecordForm might use older hooks?
// Checking NisabYearRecordsPage.tsx imports: It imports PaymentRecordForm.
// Let's verify PaymentRecordForm dependencies later if it fails.

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
        vi.clearAllMocks();

        // Default Mock Implementations
        vi.mocked(useNisabRecordRepository).mockReturnValue({
            records: [],
            isLoading: false,
            addRecord: vi.fn(),
            updateRecord: vi.fn(),
            removeRecord: vi.fn(),
            getRecord: vi.fn(),
            bulkAddRecords: vi.fn(),
        } as any);

        vi.mocked(usePaymentRepository).mockReturnValue({
            payments: [],
            isLoading: false,
            addPayment: vi.fn(),
            updatePayment: vi.fn(),
            removePayment: vi.fn(),
            getPayment: vi.fn(),
            bulkAddPayments: vi.fn(),
        } as any);

        vi.mocked(useAssetRepository).mockReturnValue({
            assets: [],
            isLoading: false,
            addAsset: vi.fn(),
            updateAsset: vi.fn(),
            removeAsset: vi.fn(),
            getAsset: vi.fn(),
        } as any);
    });

    it('renders without crashing', async () => {
        renderWithClient(<NisabYearRecordsPage />);

        expect(screen.getByText('Nisab Year Records')).toBeInTheDocument();
        // With empty records, it should show "No ... records yet"
        expect(screen.getByText(/No.*records yet/)).toBeInTheDocument();
    });

    it('opens payment modal without crashing', async () => {
        // Mock data with one record
        const mockData = {
            records: [
                {
                    id: 'r1',
                    status: 'DRAFT',
                    hawlStartDate: '2024-01-01T00:00:00.000Z',
                    zakatAmount: 1000,
                    totalWealth: 40000,
                    zakatableWealth: 40000,
                    nisabBasis: 'GOLD',
                    // Add all fields to avoid shape issues
                    hawlCompletionDate: '2025-01-01T00:00:00.000Z',
                    hijriYear: 1445,
                    currency: 'USD'
                }
            ],
            isLoading: false,
            addRecord: vi.fn(),
            updateRecord: vi.fn(),
            removeRecord: vi.fn(),
            getRecord: vi.fn(),
            bulkAddRecords: vi.fn(),
        };

        vi.mocked(useNisabRecordRepository).mockReturnValue(mockData as any);

        renderWithClient(<NisabYearRecordsPage />);

        // Wait for record to appear
        await waitFor(() => {
            expect(screen.getByText('1445 H')).toBeInTheDocument();
        });

        // Click on the record to select it
        screen.getByText('1445 H').click();

        // Verify detail view appears (Payment Progress section)
        await waitFor(() => {
            // "Zakat Payments" header is visible in detail view
            expect(screen.getByText('Zakat Payments')).toBeInTheDocument();
            // Verify active record details are shown
            expect(screen.getByText('Record ID')).toBeInTheDocument();
        });

        // Click "+ Add Payment" button (Note: Text might be "+ Add Payment" or "+ Payment", check component)
        // Component says: "+ Add Payment" (line 414)
        const addPaymentBtn = screen.getByText('+ Add Payment');
        fireEvent.click(addPaymentBtn);

        // Verify form appears
        await waitFor(() => {
            expect(screen.getByText('Record Zakat Payment')).toBeInTheDocument();
            // Check if PaymentRecordForm rendered inputs
            expect(screen.getByLabelText(/Amount Paid/i)).toBeInTheDocument();
        });
    }, 20000);
});
