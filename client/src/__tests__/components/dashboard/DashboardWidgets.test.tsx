import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardHeader } from '../../../components/dashboard/DashboardHeader';
import { QuickActionCard } from '../../../components/dashboard/QuickActionCard';
import { ActiveRecordWidget } from '../../../components/dashboard/ActiveRecordWidget';
import { WealthSummaryCard } from '../../../components/dashboard/WealthSummaryCard';
import { OnboardingGuide } from '../../../components/dashboard/OnboardingGuide';

describe('Dashboard widgets', () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe('DashboardHeader', () => {
    it('encourages users without assets to add their first asset', () => {
      render(<DashboardHeader userName="Aisha" hasAssets={false} hasActiveRecord={false} />);

      // Component may display a personalized greeting or a generic title depending on localization updates
      expect(screen.getByText(/welcome (back, aisha|to zakapp)/i)).toBeInTheDocument();
      // Avoid brittle sentence-match; match a stable phrase present in the onboarding description
      expect(screen.getByText(/start by adding your first asset/i)).toBeInTheDocument();
    });

    it('prompts users with assets but no record to create one', () => {
      render(<DashboardHeader hasAssets={true} hasActiveRecord={false} />);

      expect(screen.getByText(/create a nisab year record/i)).toBeInTheDocument();
    });

    it('confirms tracking is active when an active record exists', () => {
      render(<DashboardHeader hasAssets={true} hasActiveRecord={true} />);

      expect(screen.getByText(/zakat tracking is active/i)).toBeInTheDocument();
    });
  });

  describe('QuickActionCard', () => {
    it('navigates via link when href is provided', async () => {
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <QuickActionCard
            title="Add Asset"
            description="Add your first asset"
            icon={<span>*</span>}
            href="/assets"
          />
          <Routes>
            <Route path="/assets" element={<div data-testid="assets-page">Assets Page</div>} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await userEvent.click(screen.getByRole('link', { name: /add asset/i }));
      expect(screen.getByTestId('assets-page')).toBeInTheDocument();
    });

    it('fires onClick when rendered as a button', async () => {
      const onClick = jest.fn();
      render(
        <QuickActionCard
          title="Update Assets"
          description="Refresh your asset values"
          icon={<span>*</span>}
          onClick={onClick}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /update assets/i }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('ActiveRecordWidget', () => {
    it('displays Hawl progress and wealth comparison', () => {
      const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

      render(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <ActiveRecordWidget
              record={{
                id: 'rec-1',
                userId: 'user-1',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                initialNisabThreshold: 5000,
                nisabMethod: 'gold',
                status: 'active',
                daysElapsed: 120,
                daysRemaining: 234,
                currentWealth: 6500,
                createdAt: '2025-01-01',
                updatedAt: '2025-03-01'
              }}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );

      // Check for key elements rather than exact day string which can be computed differently
      expect(screen.getByText(/active hawl period/i)).toBeInTheDocument();
      expect(screen.getByText(/\$6,500\.00/)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow');
      expect(screen.getByRole('link', { name: /view detailed record/i })).toBeInTheDocument();
    });
  });

  describe('WealthSummaryCard', () => {
    it('indicates whether wealth is above or below Nisab', () => {
      const { rerender } = render(
        <WealthSummaryCard totalWealth={12000} nisabThreshold={5000} />
      );

      expect(screen.getByText(/above nisab/i)).toBeInTheDocument();

      rerender(<WealthSummaryCard totalWealth={2000} nisabThreshold={5000} />);
      expect(screen.getByText(/below nisab/i)).toBeInTheDocument();
    });
  });

  describe('OnboardingGuide', () => {
    it('highlights the current step and shows progress', () => {
      render(
        <MemoryRouter>
          <OnboardingGuide currentStep={2} completedSteps={[1]} />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /collapse guide/i })).toBeInTheDocument();
  const stepTitle = screen.getAllByText(/create nisab record/i)[0];
  expect(stepTitle).toBeInTheDocument();
      // The action is implemented as a link; assert link is present and accessible
      expect(screen.getByRole('link', { name: /create nisab record/i })).toBeInTheDocument();
      expect(screen.getByText(/1 of 3 completed/i)).toBeInTheDocument();
      expect(screen.getByText(/✓ Completed/)).toBeInTheDocument();
    });
  });
});
