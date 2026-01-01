import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { OnboardingWizard } from './OnboardingWizard';
import { apiService } from '../../services/api';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../../services/api', () => ({
    apiService: {
        updateCalendarPreferences: vi.fn().mockResolvedValue({ success: true }),
        createAsset: vi.fn().mockResolvedValue({ success: true }),
        createNisabYearRecord: vi.fn().mockResolvedValue({ success: true }),
    },
}));

// Mock router navigation
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        useNavigate: () => mockedNavigate,
    };
});

// Mock framer-motion to skip animations
vi.mock('framer-motion', () => {
    const React = require('react');
    return {
        AnimatePresence: ({ children }: any) => children,
        motion: {
            div: React.forwardRef(({ children, ...props }: any, ref: any) => {
                // Filter out motion props
                const { initial, animate, exit, transition, ...validProps } = props;
                return React.createElement('div', { ...validProps, ref }, children);
            }),
        },
    };
});

describe('OnboardingWizard Flow', () => {

    const renderWizard = () => {
        return render(
            <BrowserRouter>
                <OnboardingWizard />
            </BrowserRouter>
        );
    };

    it('navigates through the wizard and submits data', async () => {
        renderWizard();

        // 1. Welcome Step - Check presence and click Get Started
        expect(screen.getByText(/Your Wealth, Your Privacy/i)).toBeInTheDocument();
        const startButton = screen.getByRole('button', { name: /Get Started/i });
        fireEvent.click(startButton);

        // 2. Methodology Step
        expect(await screen.findByText(/School of Thought/i, {}, { timeout: 3000 })).toBeInTheDocument();
        fireEvent.click(screen.getByText('Hanafi'));
        fireEvent.click(screen.getByText(/Hijri/i));
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        // 3. Nisab Step - Use findAllByText for robustness causing 'Nisab Threshold' which appears in title
        const nisabHeaders = await screen.findAllByText(/Nisab Threshold/i, {}, { timeout: 3000 });
        expect(nisabHeaders.length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText(/Silver Standard/i));
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        // 4. Assets Step
        expect(await screen.findByText(/What do you own\?/i, {}, { timeout: 3000 })).toBeInTheDocument();
        fireEvent.click(screen.getByText('Cash & Bank Accounts'));
        const cashInput = await screen.findByLabelText('Asset Value');
        fireEvent.change(cashInput, { target: { value: '1000' } });

        // Select but don't add value for Gold (to test enabled but 0 value)
        fireEvent.click(screen.getByText('Gold'));

        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        // 5. Liabilities Step
        expect(await screen.findByText(/Any Immediate Debts?/i, {}, { timeout: 3000 })).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('liability-personal_loans'));
        // Wait for animation
        const loanInput = await screen.findByLabelText(/Estimated Value/i, {}, { timeout: 3000 });
        fireEvent.change(loanInput, { target: { value: '500' } });
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        // 6. Payments Step
        // Title in Layout is 'Recent Payments', Header in component is 'Recent Zakat Payments?'
        // We can check both or either. Let's check the Component Header.
        expect(await screen.findByText(/Recent Zakat Payments\?/i, {}, { timeout: 3000 })).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('payments-yes'));

        // Wait for animation
        // There might be multiple digits inputs now? No, previous step is unmounted.
        // But to be safe use findAll or specific query if possible. 
        // findByPlaceholderText should work as it's the only one on screen.
        const paymentInput = await screen.findByPlaceholderText('0.00');
        fireEvent.change(paymentInput, { target: { value: '20' } });
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        // 7. Summary Step
        expect(screen.getByText(/Review & Confirm/i)).toBeInTheDocument();
        expect(screen.getByText(/Hanafi/i)).toBeInTheDocument();

        // Verify Summary Totals
        expect(screen.getByText(/Starting Hawl/i)).toBeInTheDocument();

        // 8. Submit
        const finishButton = screen.getByRole('button', { name: /Finish Setup/i });
        fireEvent.click(finishButton);

        // Verify API calls
        await waitFor(() => {
            expect(apiService.updateCalendarPreferences).toHaveBeenCalled();

            // Verify Asset Creation (2 assets + 1 liability + 1 payment logic if implemented)
            // We expect at least the assets and liabilities calls
            expect(apiService.createAsset).toHaveBeenCalledWith(expect.objectContaining({
                category: 'debt_personal',
                value: -500
            }));

            // Verify Nisab Record
            expect(apiService.createNisabYearRecord).toHaveBeenCalledWith(expect.objectContaining({
                // Net wealth = 1000 cash - 500 debt = 500
                totalWealth: 500
            }));
        });

        // Verify Redirect
        await waitFor(() => {
            expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
        }, { timeout: 4000 });

        vi.useRealTimers();
    });
});
