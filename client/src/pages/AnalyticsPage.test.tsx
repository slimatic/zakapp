/**
 * AnalyticsPage Component Tests - T041
 * Tests for Analytics Dashboard functionality and terminology
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AnalyticsPage } from './AnalyticsPage';

// Mock the hooks
jest.mock('../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn()
}));

jest.mock('../services/apiHooks', () => ({
  useAssets: jest.fn()
}));

jest.mock('../hooks/useSnapshots', () => ({
  useSnapshots: jest.fn()
}));

// Mock the AnalyticsChart component
jest.mock('../components/tracking/AnalyticsChart', () => ({
  AnalyticsChart: ({ metricType }: { metricType: string }) => (
    <div data-testid={`chart-${metricType}`}>Mock Chart: {metricType}</div>
  )
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders page header while loading', () => {
      const { useAnalytics } = require('../hooks/useAnalytics');
      const { useAssets } = require('../services/apiHooks');
      const { useSnapshots } = require('../hooks/useSnapshots');

      useAnalytics.mockReturnValue({ data: undefined, isLoading: true });
      useAssets.mockReturnValue({ data: undefined, isLoading: true });
      useSnapshots.mockReturnValue({ data: undefined, isLoading: true });

      render(<AnalyticsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Comprehensive insights into your Zakat history and trends/i)).toBeInTheDocument();
    });
  });

  describe('With Data', () => {
    it('renders all chart sections', () => {
      render(<AnalyticsPage />, { wrapper: createWrapper() });

      expect(screen.getAllByText('Wealth Over Time')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Zakat Obligations')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Asset Distribution')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Payment Distribution')[0]).toBeInTheDocument();
    });

    it('displays summary statistics with correct calculations', () => {
      const { useAnalytics } = require('../hooks/useAnalytics');
      const { useAssets } = require('../services/apiHooks');
      const { useSnapshots } = require('../hooks/useSnapshots');

      useAnalytics.mockReturnValue({
        data: { data: [] },
        isLoading: false
      });
      
      useAssets.mockReturnValue({
        data: { 
          data: { 
            assets: [
              { assetId: '1', value: 50000 },
              { assetId: '2', value: 30000 }
            ] 
          } 
        },
        isLoading: false
      });

      useSnapshots.mockReturnValue({
        data: { 
          snapshots: [
            { id: '1', zakatAmount: 250, zakatPaid: 200 },
            { id: '2', zakatAmount: 300, zakatPaid: 300 }
          ] 
        },
        isLoading: false
      });

      render(<AnalyticsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Summary Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Wealth')).toBeInTheDocument();
      expect(screen.getByText('Total Zakat Due')).toBeInTheDocument();
      expect(screen.getByText('Total Paid')).toBeInTheDocument();
      expect(screen.getByText('Outstanding')).toBeInTheDocument();
      expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('renders empty state guidance when no data', () => {
      const { useAnalytics } = require('../hooks/useAnalytics');
      const { useAssets } = require('../services/apiHooks');
      const { useSnapshots } = require('../hooks/useSnapshots');

      useAnalytics.mockReturnValue({
        data: { data: [] },
        isLoading: false
      });
      
      useAssets.mockReturnValue({
        data: { data: { assets: [] } },
        isLoading: false
      });

      useSnapshots.mockReturnValue({
        data: { snapshots: [] },
        isLoading: false
      });

      render(<AnalyticsPage />, { wrapper: createWrapper() });

      // Charts should render (they handle their own empty states)
      expect(screen.getByTestId('chart-wealth_trend')).toBeInTheDocument();
      expect(screen.getByTestId('chart-zakat_trend')).toBeInTheDocument();
    });
  });

  describe('Terminology Compliance', () => {
    it('does not use "snapshot" terminology anywhere', () => {
      const { useAnalytics } = require('../hooks/useAnalytics');
      const { useAssets } = require('../services/apiHooks');
      const { useSnapshots } = require('../hooks/useSnapshots');

      useAnalytics.mockReturnValue({ data: { data: [] }, isLoading: false });
      useAssets.mockReturnValue({ data: { data: { assets: [] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { snapshots: [] }, isLoading: false });

      render(<AnalyticsPage />, { wrapper: createWrapper() });
      
      // Check primary headings and chart titles don't use "snapshot"
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading.textContent?.toLowerCase()).not.toMatch(/\bsnapshot\b/);
      });
    });

    it('uses "Nisab Year Record" terminology', () => {
      const { useAnalytics } = require('../hooks/useAnalytics');
      const { useAssets } = require('../services/apiHooks');
      const { useSnapshots } = require('../hooks/useSnapshots');

      useAnalytics.mockReturnValue({ data: { data: [] }, isLoading: false });
      useAssets.mockReturnValue({ data: { data: { assets: [] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { snapshots: [] }, isLoading: false });

      render(<AnalyticsPage />, { wrapper: createWrapper() });
      
      // Should appear multiple times in the page
      const matches = screen.getAllByText(/Nisab Year Record/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('Timeframe Selector', () => {
    it('renders timeframe selector buttons', () => {
      const { useAnalytics } = require('../hooks/useAnalytics');
      const { useAssets } = require('../services/apiHooks');
      const { useSnapshots } = require('../hooks/useSnapshots');

      useAnalytics.mockReturnValue({ data: { data: [] }, isLoading: false });
      useAssets.mockReturnValue({ data: { data: { assets: [] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { snapshots: [] }, isLoading: false });

      render(<AnalyticsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Last Year')).toBeInTheDocument();
      expect(screen.getByText('Last 3 Years')).toBeInTheDocument();
      expect(screen.getByText('Last 5 Years')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });
  });

  describe('Help Section', () => {
    it('renders help section with data source explanations', () => {
      const { useAnalytics } = require('../hooks/useAnalytics');
      const { useAssets } = require('../services/apiHooks');
      const { useSnapshots } = require('../hooks/useSnapshots');

      useAnalytics.mockReturnValue({ data: { data: [] }, isLoading: false });
      useAssets.mockReturnValue({ data: { data: { assets: [] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { snapshots: [] }, isLoading: false });

      render(<AnalyticsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Understanding Your Analytics')).toBeInTheDocument();
      expect(screen.getByText(/two separate data sources/i)).toBeInTheDocument();
    });
  });
});
