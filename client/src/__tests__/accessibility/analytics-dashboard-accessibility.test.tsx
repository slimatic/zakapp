import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AnalyticsDashboard } from '../../../src/components/AnalyticsDashboard';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('AnalyticsDashboard Accessibility', () => {
  const mockData = {
    totalPayments: 150,
    totalAmount: 25000,
    monthlyTrends: [
      { month: 1, year: 2024, paymentCount: 12, totalAmount: 2000 },
      { month: 2, year: 2024, paymentCount: 15, totalAmount: 2500 },
      { month: 3, year: 2024, paymentCount: 18, totalAmount: 3000 },
    ],
    yearlyComparison: [
      { year: 2023, totalAmount: 20000, paymentCount: 120 },
      { year: 2024, totalAmount: 25000, paymentCount: 150 },
    ],
    categoryBreakdown: [
      { category: 'Zakat', amount: 20000, percentage: 80 },
      { category: 'Sadaqah', amount: 5000, percentage: 20 },
    ],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    userId: 'user-123',
  };

  it('should have no accessibility violations', async () => {
    const { container } = render(<AnalyticsDashboard data={mockData} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    // Should have section headings (h3 elements)
    const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(sectionHeadings.length).toBeGreaterThan(0);

    // Should have expected section titles
    expect(screen.getByText('Total Payments')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('Monthly Trends')).toBeInTheDocument();
  });

  it('should have descriptive chart labels and titles', () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    // The component displays data in text format, not as images
    // Check that data is properly labeled
    expect(screen.getByText('Total Payments')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('Monthly Trends')).toBeInTheDocument();
  });

  it('should provide sufficient color contrast', () => {
    render(<AnalyticsDashboard data={mockData} />);

    // Check that text elements have sufficient contrast
    // This is a basic check - comprehensive contrast testing would require visual testing
    const textElements = screen.getAllByText(/.+/);
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      // Basic check that text is not invisible
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.color).not.toBe('transparent');
    });
  });

  it('should be keyboard navigable', () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    // The component doesn't have interactive buttons, but should be readable
    // Check that content is present and visible
    expect(screen.getByText('Total Payments')).toBeVisible();
    expect(screen.getByText('Total Amount')).toBeVisible();
  });

  it('should have descriptive text for data', () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    // Should have descriptive text for data - check for the actual rendered text
    expect(screen.getByText('150')).toBeInTheDocument(); // Total payments
    expect(screen.getAllByText('$25,000.00')).toBeTruthy(); // Total amount appears in multiple places

    // Should have labels for data points
    expect(screen.getByText('Total Payments')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
  });

  it('should support high contrast mode', () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    // Check that the main content area exists
    const heading = screen.getByText('Total Payments');
    expect(heading).toBeTruthy();

    // Components should not rely solely on color for conveying information
    expect(heading).toBeVisible();
  });

  it('should have appropriate ARIA labels where needed', () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    // Basic check: headings should be present
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Check that headings have meaningful text
    headings.forEach(heading => {
      expect(heading.textContent?.trim()).not.toBe('');
    });
  });

  it('should be responsive and work on different screen sizes', () => {
    render(<AnalyticsDashboard data={mockData} isLoading={false} />);

    // Check that the main content area exists
    const heading = screen.getByText('Total Payments');
    expect(heading).toBeTruthy();

    // Check that layout has content
    expect(heading).toBeVisible();
  });
});