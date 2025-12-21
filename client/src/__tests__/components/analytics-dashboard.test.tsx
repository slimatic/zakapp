import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';

describe('AnalyticsDashboard', () => {
  const mockData = {
    totalPayments: 12,
    totalAmount: 15000,
    monthlyTrends: [
      { month: 1, year: 2024, paymentCount: 2, totalAmount: 2000 },
      { month: 2, year: 2024, paymentCount: 3, totalAmount: 3000 },
      { month: 3, year: 2024, paymentCount: 1, totalAmount: 1000 },
    ],
    yearlyComparison: [
      { year: 2023, totalAmount: 12000, paymentCount: 8 },
      { year: 2024, totalAmount: 15000, paymentCount: 12 },
    ],
    categoryBreakdown: [
      { category: 'poor', amount: 5000, percentage: 33.3 },
      { category: 'orphans', amount: 4000, percentage: 26.7 },
      { category: 'education', amount: 3000, percentage: 20.0 },
      { category: 'general', amount: 3000, percentage: 20.0 },
    ],
  };

  it('renders analytics dashboard with key metrics', async () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    expect(screen.getByText('Total Payments')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    const totalAmountLabel = screen.getByText('Total Amount');
    expect(totalAmountLabel).toBeInTheDocument();
    // Ensure the total amount is rendered within the Total Amount card
    const totalAmountCard = totalAmountLabel.closest('div');
    expect(totalAmountCard).toBeTruthy();
    if (totalAmountCard) {
      expect(totalAmountCard.querySelector('div')?.textContent).toMatch(/\$15,000/);
    }
  });

  it('displays monthly trends chart', async () => {
  });

  it('displays monthly trends chart', async () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    expect(screen.getByText('Monthly Trends')).toBeInTheDocument();
    // Chart components would be tested separately
  });

  it('shows yearly comparison', async () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    expect(screen.getByText('Year-over-Year Comparison')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('displays category breakdown', async () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    expect(screen.getByText('Payment Categories')).toBeInTheDocument();
    expect(screen.getByText(/poor/i)).toBeInTheDocument();
    expect(screen.getByText(/orphans/i)).toBeInTheDocument();
    expect(screen.getByText(/education/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AnalyticsDashboard data={null} isLoading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
  });

  it('handles empty data gracefully', () => {
    const emptyData = {
      totalPayments: 0,
      totalAmount: 0,
      monthlyTrends: [],
      yearlyComparison: [],
      categoryBreakdown: [],
    };

    render(<AnalyticsDashboard data={emptyData} isLoading={false} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/\$0/)).toBeInTheDocument();
  });
});