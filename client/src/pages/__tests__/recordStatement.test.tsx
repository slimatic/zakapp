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
 * The Hawl statement (PDF) is a printout of a stored nisab year record.
 *
 * It must read the figures that record's engine stored. Re-deriving a second
 * recipe over the raw asset and liability lists produces a statement that
 * contradicts the Zakatable Wealth and Zakat Due figures printed beside it —
 * the raw list includes inactive balances the engine excludes, and knows
 * nothing about the deductions the record actually applied.
 *
 * The generator is mocked and its ARGUMENTS are asserted, so the PDF bytes
 * (jsPDF) never need to be parsed in a test.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { NisabYearRecordsPage } from '../NisabYearRecordsPage';
import { vi } from 'vitest';
import { useNisabRecordRepository } from '../../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { useLiabilityRepository } from '../../hooks/useLiabilityRepository';

const statementCalls = vi.hoisted(() => ({ calls: [] as unknown[][] }));

vi.mock('../../utils/ReportGenerator', () => ({
    ReportGenerator: class MockReportGenerator {
        constructor(_currency?: string) {
            void _currency;
        }
        generateHawlStatement(...args: unknown[]) {
            statementCalls.calls.push(args);
            return {};
        }
    },
}));

vi.mock('../../hooks/useNisabRecordRepository', () => ({
    useNisabRecordRepository: vi.fn()
}));

vi.mock('../../hooks/usePaymentRepository', () => ({
    usePaymentRepository: vi.fn()
}));

vi.mock('../../hooks/useAssetRepository', () => ({
    useAssetRepository: vi.fn()
}));

vi.mock('../../hooks/useLiabilityRepository', () => ({
    useLiabilityRepository: vi.fn()
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            maxAssets: 10,
            maxNisabRecords: 100,
            maxPayments: 1000,
            firstName: 'Test User',
            settings: {
                currency: 'USD',
                madhab: 'hanafi'
            }
        }
    }),
}));

vi.mock('../../contexts/PrivacyContext', () => ({
    useMaskedCurrency: () => (val: string) => val,
    usePrivacy: () => ({ privacyMode: false, togglePrivacyMode: vi.fn(), setPrivacyMode: vi.fn() }),
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

// Synthetic fixtures only — never real portfolio values.
const ACTIVE_ASSET_VALUE = 1000;
const INACTIVE_ASSET_VALUE = 500;
const ACTIVE_LIABILITY = 400;
const INACTIVE_LIABILITY = 3600;

describe('the Hawl statement is generated from the record itself', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        statementCalls.calls.length = 0;

        vi.mocked(useNisabRecordRepository).mockReturnValue({
            records: [{
                id: 'rec-1',
                status: 'FINALIZED',
                hawlStartDate: '2024-01-01T00:00:00.000Z',
                hawlCompletionDate: '2025-01-01T00:00:00.000Z',
                hijriYear: 1445,
                currency: 'USD',
                // Stored engine figures for this record (net after deductions).
                totalWealth: ACTIVE_ASSET_VALUE,
                zakatableWealth: ACTIVE_ASSET_VALUE - ACTIVE_LIABILITY,
                zakatAmount: (ACTIVE_ASSET_VALUE - ACTIVE_LIABILITY) * 0.025,
            }],
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
            assets: [
                { id: 'a-1', value: ACTIVE_ASSET_VALUE, isActive: true },
                { id: 'a-2', value: INACTIVE_ASSET_VALUE, isActive: false },
            ],
            isLoading: false,
            addAsset: vi.fn(),
            updateAsset: vi.fn(),
            removeAsset: vi.fn(),
            getAsset: vi.fn(),
        } as any);

        vi.mocked(useLiabilityRepository).mockReturnValue({
            liabilities: [
                { id: 'l-1', amount: ACTIVE_LIABILITY, isActive: true },
                { id: 'l-2', amount: INACTIVE_LIABILITY, isActive: false },
            ],
            isLoading: false,
            addLiability: vi.fn(),
            updateLiability: vi.fn(),
            removeLiability: vi.fn(),
            getLiability: vi.fn(),
        } as any);
    });

    it('the generator consumes the record, not recomputed asset/liability sums', async () => {
        renderWithClient(<NisabYearRecordsPage />);

        const pdfButton = await screen.findByText('📄 PDF');
        fireEvent.click(pdfButton);

        await waitFor(() => {
            expect(statementCalls.calls.length).toBe(1);
        });

        const args = statementCalls.calls[0];
        const firstArg = args[0] as { id?: string } | undefined;
        expect(firstArg?.id).toBe('rec-1');

        // The raw all-liabilities sum (400 + 3600 = 4000) is not an engine
        // figure: the engine deducts only the active, due-in-window portion.
        // Anything the page recomputes can contradict the statement's own
        // Zakatable Wealth and Zakat Due rows.
        expect(args[3], 'the statement reads the record, not a recomputed liability sum').toBeUndefined();

        expect(args, 'the statement reads the record, not the raw asset list').toHaveLength(2);
        expect(args[1]).toBe('Test User');
    }, 20000);
});