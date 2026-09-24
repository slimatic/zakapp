import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './Dashboard';
import { MemoryRouter } from 'react-router-dom';
// Initialise i18n with its bundles - without this every t() returns the raw key,
// so the education assertions below would be testing nothing.
import '../i18n';
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
            // The dashboard's top section is the hero: greeting + zakat figure.
            expect(screen.getByText(/As-salamu alaykum/i)).toBeInTheDocument();
        });

        expect(navigate).not.toHaveBeenCalledWith('/onboarding');
    });

    it('renders education headings as text, never raw i18n keys', async () => {
        // Regression: <Trans> without ns= looked in the unregistered
        // `translation` namespace, so the module rendered "education.whatIsZakat"
        // as a visible heading for every user.
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

        // The module is collapsed by default; expand it.
        await screen.findByRole('button', { name: /expand educational content/i });
        await userEvent.click(screen.getByRole('button', { name: /expand educational content/i }));

        expect(document.body.textContent).not.toMatch(/education\.[a-zA-Z]+/);

        const body = document.body.textContent || '';
        // Regression: JSX drops the space at a line break that ends with an
        // element, so this rendered as "beforeZakat".
        expect(body).not.toMatch(/beforeZakat/);
        expect(body).toMatch(/before\s+Zakat\s+becomes obligatory/);
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
