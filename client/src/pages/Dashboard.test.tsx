/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { MemoryRouter } from 'react-router-dom';
import * as router from 'react-router-dom';

// Mock hooks
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 'test-user',
            name: 'Test User',
            isAdmin: false,
            userType: 'free',
            maxAssets: 10,
            maxNisabRecords: 12,
            maxPayments: 50,
            isSetupCompleted: false
        }
    }),
}));

vi.mock('../hooks/useAssetRepository', () => ({
    useAssetRepository: vi.fn(),
}));

vi.mock('../hooks/useNisabRecordRepository', () => ({
    useNisabRecordRepository: vi.fn(),
}));

vi.mock('../hooks/usePaymentRepository', () => ({
    usePaymentRepository: vi.fn(),
}));

vi.mock('../hooks/useUserOnboarding', () => ({
    useUserOnboarding: () => ({
        currentStep: 1,
        markComplete: vi.fn(),
        completedSteps: [],
    }),
}));

vi.mock('../contexts/PrivacyContext', () => ({
    useMaskedCurrency: () => (val: number) => `$${val}`,
}));

// Mock repositories imports to control them in tests
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

describe('Dashboard Redirection', () => {
    const navigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(router, 'useNavigate').mockImplementation(() => navigate);

        // Clear local storage
        localStorage.clear();
    });

    it('redirects to onboarding when user has no assets and no local prefs', async () => {
        (useAssetRepository as any).mockReturnValue({
            assets: [],
            isLoading: false,
            error: null,
        });
        (useNisabRecordRepository as any).mockReturnValue({
            activeRecord: null,
            isLoading: false,
            error: null,
        });
        (usePaymentRepository as any).mockReturnValue({
            payments: [],
            isLoading: false,
            error: null,
        });

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <Dashboard />
                </MemoryRouter>
            </QueryClientProvider>
        );

        // Should redirect
        await waitFor(() => {
            expect(navigate).toHaveBeenCalledWith('/onboarding');
        });
    });

    it('does NOT redirect when user has assets', async () => {
        (useAssetRepository as any).mockReturnValue({
            assets: [{ id: '1', value: 100, type: 'cash' }],
            isLoading: false,
            error: null,
        });
        (useNisabRecordRepository as any).mockReturnValue({
            activeRecord: null,
            isLoading: false,
            error: null,
        });

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <Dashboard />
                </MemoryRouter>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
        });

        expect(navigate).not.toHaveBeenCalledWith('/onboarding');
    });

    it('does NOT redirect if local prefs exist for user', async () => {
        // Mock existing prefs
        localStorage.setItem('zakapp_local_prefs_test-user', '{"skipped": true}');

        (useAssetRepository as any).mockReturnValue({
            assets: [],
            isLoading: false,
            error: null,
        });
        (useNisabRecordRepository as any).mockReturnValue({
            activeRecord: null,
            isLoading: false,
            error: null,
        });
        (usePaymentRepository as any).mockReturnValue({
            payments: [],
            isLoading: false,
            error: null,
        });

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <Dashboard />
                </MemoryRouter>
            </QueryClientProvider>
        );

        // Should NOT redirect
        await new Promise(r => setTimeout(r, 100)); // Wait a bit
        expect(navigate).not.toHaveBeenCalledWith('/onboarding');
    });
});
