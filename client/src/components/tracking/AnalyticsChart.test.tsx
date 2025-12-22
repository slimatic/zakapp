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

// Use manual ui mock so LoadingSpinner renders a simple test-friendly element
jest.mock('../../components/ui');

// Ensure LoadingSpinner is explicitly mocked to a simple element with a data-testid for reliable selection
jest.mock('../../components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'loading-spinner' });
  }
}));

// Mock Recharts components to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'line-chart' }, children);
  },
  BarChart: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'bar-chart' }, children);
  },
  PieChart: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'pie-chart' }, children);
  },
  AreaChart: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'area-chart' }, children);
  },
  Line: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'line' });
  },
  Bar: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'bar' });
  },
  Pie: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'pie' }, children);
  },
  Area: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'area' });
  },
  Cell: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'cell' });
  },
  XAxis: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'x-axis' });
  },
  YAxis: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'y-axis' });
  },
  CartesianGrid: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'cartesian-grid' });
  },
  Tooltip: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'tooltip' });
  },
  Legend: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'legend' });
  },
  ResponsiveContainer: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'responsive-container' }, children);
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: any }) => {
    const React = require('react');
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
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
    it('shows empty state when no data is returned from API', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: {
          data: []
        },
        isLoading: false,
        error: null
      });

      render(
        <AnalyticsChart metricType="wealth_trend" visualizationType="line_chart" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/No asset data available/i)).toBeInTheDocument();
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
          trend: [{ year: 2024, totalWealth: '50000' }]
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
    it('shows empty state when no Nisab Year Records exist', () => {
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

      expect(screen.getByText(/No Nisab Year Records found/i)).toBeInTheDocument();
    });
  });  describe('Empty State', () => {
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
    it('shows empty state when no payment data exists', () => {
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

      expect(screen.getByText(/No payments recorded yet/i)).toBeInTheDocument();
    });

    it('renders multiple slices when multiple payment categories exist', () => {
      const { useAnalytics } = require('../../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        data: {
          distribution: [
            { category: 'cash', totalAmount: 1200 },
            { category: 'gharimin', totalAmount: 300 }
          ]
        },
        isLoading: false,
        error: null
      });

      render(
        <AnalyticsChart metricType="payment_distribution" visualizationType="pie_chart" />,
        { wrapper: createWrapper() }
      );

      // Two categories => two rendered Cells
      const cells = screen.getAllByTestId('cell');
      expect(cells.length).toBe(2);
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

// Additional tests for Asset Composition pie behavior
describe('AnalyticsChart - Asset Composition (Pie)', () => {
  it('renders multiple slices when multiple asset categories exist', () => {
    const { useAnalytics } = require('../../hooks/useAnalytics');
    useAnalytics.mockReturnValue({
      data: {
        composition: [
          {
            breakdown: {
              assets: [
                { id: 'a1', name: 'Cash', category: 'CASH', value: '1200' },
                { id: 'a2', name: 'Gold', category: 'GOLD', value: '800' }
              ]
            }
          }
        ]
      },
      isLoading: false,
      error: null
    });

    render(
      <AnalyticsChart metricType="asset_composition" visualizationType="pie_chart" />,
      { wrapper: createWrapper() }
    );

    const cells = screen.getAllByTestId('cell');
    expect(cells.length).toBe(2);
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


