/**
 * AnalyticsChart Component Tests - T043 & T044
 * Tests for chart rendering and accessibility
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { AnalyticsChart } from './AnalyticsChart';

// Mock the useAnalytics hook
jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn()
}));

// Mock Recharts components to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Area: () => <div data-testid="area" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('AnalyticsChart - Wealth Trend (T043)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner when data is loading', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({ data: undefined, isLoading: true, error: null });

      render(
        <AnalyticsChart metricType="wealth_trend" visualizationType="line_chart" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('With Valid Data', () => {
    it('renders line chart with wealth trend data', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: {
          data: [
            { period: '2023', value: 45000 },
            { period: '2024', value: 50000 }
          ]
        },
        isLoading: false,
        error: null
      });

      render(
        <AnalyticsChart metricType="wealth_trend" visualizationType="line_chart" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state message when no data', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null
      });

      render(
        <AnalyticsChart metricType="wealth_trend" visualizationType="line_chart" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('No asset data available')).toBeInTheDocument();
      expect(screen.getByText(/Add assets to your portfolio/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility attributes', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: {
          data: [{ period: '2024', value: 50000 }]
        },
        isLoading: false,
        error: null
      });

      const { container } = render(
        <AnalyticsChart 
          metricType="wealth_trend" 
          visualizationType="line_chart"
          title="Wealth Trend"
        />,
        { wrapper: createWrapper() }
      );

      // Check for ARIA attributes
      const chartRegion = container.querySelector('[role="region"]');
      expect(chartRegion).toBeInTheDocument();
    });
  });
});

describe('AnalyticsChart - Zakat Obligations (T044)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('With Nisab Year Data', () => {
    it('renders bar chart with due/paid/outstanding data', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: {
          data: [
            { period: '2024', due: 500, paid: 400, outstanding: 100 },
            { period: '2023', due: 450, paid: 450, outstanding: 0 }
          ]
        },
        isLoading: false,
        error: null
      });

      render(
        <AnalyticsChart metricType="zakat_trend" visualizationType="bar_chart" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows Nisab Year specific empty state', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null
      });

      render(
        <AnalyticsChart metricType="zakat_trend" visualizationType="bar_chart" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('No Nisab Year Records found')).toBeInTheDocument();
      expect(screen.getByText(/Create a Nisab Year Record/i)).toBeInTheDocument();
    });
  });

  describe('Terminology', () => {
    it('does not use "snapshot" in empty state messages', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null
      });

      const { container } = render(
        <AnalyticsChart metricType="zakat_trend" visualizationType="bar_chart" />,
        { wrapper: createWrapper() }
      );

      const text = container.textContent || '';
      expect(text.toLowerCase()).not.toContain('snapshot');
    });
  });
});

describe('AnalyticsChart - Payment Distribution', () => {
  describe('Pie Chart Rendering', () => {
    it('renders pie chart for payment distribution', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: {
          data: [
            { category: 'Fakir', value: 200 },
            { category: 'Miskin', value: 150 }
          ]
        },
        isLoading: false,
        error: null
      });

      render(
        <AnalyticsChart metricType="payment_distribution" visualizationType="pie_chart" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows payment-specific empty state', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null
      });

      render(
        <AnalyticsChart metricType="payment_distribution" visualizationType="pie_chart" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('No payments recorded yet')).toBeInTheDocument();
    });
  });
});

describe('AnalyticsChart - Error Handling', () => {
  it('displays error message when fetch fails', () => {
    const { useAnalytics } = require('../../hooks/useAnalytics');
    useAnalytics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch analytics')
    });

    render(
      <AnalyticsChart metricType="wealth_trend" visualizationType="line_chart" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
  });
});

// Mock LoadingSpinner component
jest.mock('../../components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));
