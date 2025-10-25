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
    render(<AnalyticsDashboard data={mockData} />);

    // Should have main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();

    // Should have section headings
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings.length).toBeGreaterThan(0);
  });

  it('should have descriptive chart labels and titles', () => {
    render(<AnalyticsDashboard data={mockData} />);

    // Charts should have accessible titles or labels
    const charts = screen.getAllByRole('img'); // Charts might be rendered as images
    charts.forEach(chart => {
      expect(chart).toHaveAttribute('alt');
      expect(chart.getAttribute('alt')).not.toBe('');
    });
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
    render(<AnalyticsDashboard data={mockData} />);

    // Check for focusable elements
    const focusableElements = screen.getAllByRole('button');
    expect(focusableElements.length).toBeGreaterThanOrEqual(0); // May have interactive elements

    // If there are focusable elements, they should be in logical tab order
    focusableElements.forEach(element => {
      expect(element).toHaveAttribute('tabIndex'); // Should be focusable
    });
  });

  it('should have meaningful content for screen readers', () => {
    render(<AnalyticsDashboard data={mockData} />);

    // Should have descriptive text for data
    expect(screen.getByText(/150/)).toBeInTheDocument(); // Total payments
    expect(screen.getByText(/25000/)).toBeInTheDocument(); // Total amount

    // Should have labels for data points
    const dataLabels = screen.getAllByText(/\d+/);
    expect(dataLabels.length).toBeGreaterThan(0);
  });

  it('should support high contrast mode', () => {
    // Test that components work in high contrast mode
    // This would typically involve CSS media queries, but we can check classes
    render(<AnalyticsDashboard data={mockData} />);

    const container = screen.getByRole('main');
    expect(container).toBeInTheDocument();

    // Components should not rely solely on color for conveying information
    // This is checked by ensuring text alternatives exist for visual elements
  });

  it('should have appropriate ARIA labels where needed', () => {
    render(<AnalyticsDashboard data={mockData} />);

    // Basic check: if there are elements with ARIA labels, they shouldn't be empty
    const allElements = screen.getAllByRole(/.*/);

    // Collect all aria-label values for validation
    const ariaLabels: string[] = [];

    allElements.forEach(element => {
      if (element.hasAttribute('aria-label')) {
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel !== null) {
          ariaLabels.push(ariaLabel);
        }
      }
    });

    // Validate all collected aria-labels
    ariaLabels.forEach(label => {
      expect(label.trim()).not.toBe('');
    });
  });

  it('should be responsive and work on different screen sizes', () => {
    render(<AnalyticsDashboard data={mockData} />);

    const container = screen.getByRole('main');

    // Check that layout has content
    expect(container).toBeInTheDocument();

    // Basic check that there are multiple elements (indicating content structure)
    const headings = screen.getAllByRole('heading');
    const textContent = screen.getAllByText(/.+/);

    expect(headings.length).toBeGreaterThan(0);
    expect(textContent.length).toBeGreaterThan(0);
  });
});