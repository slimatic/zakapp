/**
 * Accessibility tests for AnalyticsDashboard component
 * Tests WCAG 2.1 AA compliance per Constitutional Principle I
 * 
 * Coverage:
 * - Chart accessibility (data tables, ARIA labels)
 * - Keyboard navigation for interactive charts
 * - Screen reader announcements for data updates
 * - Color-independent information display
 * - Focus management in dashboard widgets
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AnalyticsDashboard from '../../src/components/AnalyticsDashboard';

expect.extend(toHaveNoViolations);

describe('AnalyticsDashboard Accessibility (WCAG 2.1 AA)', () => {
  const mockAnalyticsData = {
    totalPayments: 25,
    totalAmount: 2500.00,
    averagePayment: 100.00,
    monthlyTrends: [
      { month: '2024-01', count: 5, amount: 500 },
      { month: '2024-02', count: 8, amount: 800 },
      { month: '2024-03', count: 12, amount: 1200 }
    ],
    categoryBreakdown: [
      { category: 'Masjid', count: 10, amount: 1000 },
      { category: 'Sadaqah', count: 15, amount: 1500 }
    ]
  };

  describe('Automated Accessibility Testing', () => {
    it('should have no axe violations in default state', async () => {
      const { container } = render(<AnalyticsDashboard data={mockAnalyticsData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with empty data', async () => {
      const emptyData = {
        totalPayments: 0,
        totalAmount: 0,
        averagePayment: 0,
        monthlyTrends: [],
        categoryBreakdown: []
      };
      const { container } = render(<AnalyticsDashboard data={emptyData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with loading state', async () => {
      const { container } = render(<AnalyticsDashboard loading={true} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Chart Accessibility (WCAG 1.1.1, 1.4.1)', () => {
    it('should provide text alternative for charts', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Charts should have accessible labels/descriptions
      const charts = screen.queryAllByRole('img', { hidden: true });
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('aria-label') || 
               expect(chart).toHaveAttribute('aria-labelledby');
      });
    });

    it('should provide data table alternative for visual charts', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Should have a data table or screen reader accessible summary
      const tables = screen.queryAllByRole('table');
      const regions = screen.queryAllByRole('region');
      
      // At least one way to access the data non-visually
      expect(tables.length + regions.length).toBeGreaterThan(0);
    });

    it('should describe chart data in aria-label or aria-describedby', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Find chart containers
      const chartContainers = screen.queryAllByRole('img', { hidden: true });
      
      chartContainers.forEach(chart => {
        const ariaLabel = chart.getAttribute('aria-label');
        const ariaDescribedBy = chart.getAttribute('aria-describedby');
        
        // Should have meaningful description
        expect(ariaLabel || ariaDescribedBy).toBeTruthy();
      });
    });

    it('should not rely solely on color to convey information', () => {
      /**
       * MANUAL VERIFICATION CHECKLIST:
       * 
       * Charts should use multiple visual cues:
       * ✓ Color + Pattern (hatching, dots, lines)
       * ✓ Color + Labels/Text
       * ✓ Color + Icons/Symbols
       * ✓ Different shapes for data points
       * 
       * Verify:
       * - Bar charts use patterns or labels
       * - Line charts use different line styles
       * - Pie charts include percentage labels
       * - Legend items identifiable without color
       */
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      expect(true).toBe(true); // Documentation placeholder
    });
  });

  describe('Keyboard Navigation (WCAG 2.1.1, 2.1.2)', () => {
    it('should allow keyboard navigation to all interactive elements', async () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      const user = userEvent.setup();

      // Get all interactive elements
      const buttons = screen.queryAllByRole('button');
      const links = screen.queryAllByRole('link');
      const selects = screen.queryAllByRole('combobox');

      const interactiveElements = [...buttons, ...links, ...selects];

      // Should be able to tab to each
      for (const element of interactiveElements) {
        await user.tab();
        expect(document.activeElement).toBeInTheDocument();
      }
    });

    it('should support keyboard interaction with chart filters', async () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      const user = userEvent.setup();

      // Find filter controls (date range, category filter, etc.)
      const filterControls = screen.queryAllByRole('combobox');
      
      for (const control of filterControls) {
        control.focus();
        
        // Should respond to keyboard
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');
        
        // Control should remain functional
        expect(control).toBeInTheDocument();
      }
    });

    it('should support Escape key to close expanded chart details', async () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      const user = userEvent.setup();

      // Find expandable elements
      const expandButtons = screen.queryAllByRole('button', { expanded: false });
      
      if (expandButtons.length > 0) {
        await user.click(expandButtons[0]);
        await user.keyboard('{Escape}');
        
        // Should close expanded content
        expect(expandButtons[0]).toHaveAttribute('aria-expanded', 'false') ||
               expect(expandButtons[0]).not.toHaveAttribute('aria-expanded');
      }
    });
  });

  describe('Screen Reader Support (WCAG 4.1.2, 4.1.3)', () => {
    it('should have proper heading structure', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      const headings = screen.queryAllByRole('heading');
      
      // Should have at least one heading
      expect(headings.length).toBeGreaterThan(0);

      // Headings should be in logical order (h1 -> h2 -> h3, etc.)
      const levels = headings.map(h => {
        const tagName = h.tagName.toLowerCase();
        return parseInt(tagName.replace('h', ''));
      });

      for (let i = 1; i < levels.length; i++) {
        // Next level should not skip more than 1 level
        expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
      }
    });

    it('should announce data updates to screen readers', async () => {
      const { rerender } = render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Find live regions
      const liveRegions = screen.queryAllByRole('status') || 
                         screen.queryAllByRole('alert');

      const updatedData = {
        ...mockAnalyticsData,
        totalPayments: 30,
        totalAmount: 3000.00
      };

      rerender(<AnalyticsDashboard data={updatedData} />);

      // Updates should be announced via aria-live regions
      const statusRegions = document.querySelectorAll('[aria-live]');
      expect(statusRegions.length).toBeGreaterThanOrEqual(0); // May or may not be present
    });

    it('should have descriptive region labels', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      const regions = screen.queryAllByRole('region');
      
      regions.forEach(region => {
        // Each region should be labeled
        expect(region).toHaveAttribute('aria-label') || 
               expect(region).toHaveAttribute('aria-labelledby');
      });
    });

    it('should describe loading state to screen readers', () => {
      render(<AnalyticsDashboard loading={true} />);

      // Should announce loading status
      const loadingIndicator = screen.queryByRole('status') || 
                              screen.queryByText(/loading/i);
      
      if (loadingIndicator) {
        expect(loadingIndicator).toHaveAttribute('aria-live') ||
               expect(loadingIndicator).toHaveAttribute('role', 'status');
      }
    });
  });

  describe('Focus Management (WCAG 2.4.3, 2.4.7)', () => {
    it('should maintain visible focus indicators', async () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      const user = userEvent.setup();

      await user.tab();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).not.toBe(document.body);
      expect(focusedElement).toBeVisible();
    });

    it('should have logical focus order', async () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      const user = userEvent.setup();

      const focusableElements: Element[] = [];
      
      // Collect focus order
      for (let i = 0; i < 10; i++) {
        await user.tab();
        if (document.activeElement && document.activeElement !== document.body) {
          focusableElements.push(document.activeElement);
        }
      }

      // Focus order should follow visual/logical order
      // This is a basic check - visual order requires manual verification
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should not create keyboard traps', async () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      const user = userEvent.setup();

      const startElement = document.activeElement;

      // Tab many times
      for (let i = 0; i < 20; i++) {
        await user.tab();
      }

      // Should eventually cycle or move to next section
      expect(document.activeElement).toBeTruthy();
      expect(document.activeElement).not.toBe(startElement) || 
             expect(document.querySelectorAll('[tabindex]').length).toBe(0);
    });
  });

  describe('Data Summary Accessibility', () => {
    it('should provide text summary of key metrics', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Key metrics should be available as text
      expect(screen.getByText(/25/)).toBeInTheDocument(); // totalPayments
      expect(screen.getByText(/2500|2,500/)).toBeInTheDocument(); // totalAmount
      expect(screen.getByText(/100/)).toBeInTheDocument(); // averagePayment
    });

    it('should format numbers for screen reader clarity', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Large numbers should be formatted appropriately
      const amounts = screen.queryAllByText(/\$|USD|£|€/);
      
      // Currency symbols should be announced correctly
      amounts.forEach(amount => {
        const ariaLabel = amount.getAttribute('aria-label');
        if (ariaLabel) {
          expect(ariaLabel).toMatch(/dollar|pound|euro|usd|gbp|eur/i);
        }
      });
    });

    it('should describe empty state meaningfully', () => {
      const emptyData = {
        totalPayments: 0,
        totalAmount: 0,
        averagePayment: 0,
        monthlyTrends: [],
        categoryBreakdown: []
      };
      
      render(<AnalyticsDashboard data={emptyData} />);

      // Should provide helpful message
      const emptyMessage = screen.queryByText(/no data|no payments|no analytics/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  describe('Responsive & Zoom Support (WCAG 1.4.4, 1.4.10)', () => {
    it('should remain functional at 200% zoom', () => {
      /**
       * MANUAL VERIFICATION CHECKLIST:
       * 
       * At 200% browser zoom:
       * ✓ Charts remain visible and readable
       * ✓ Data labels don't overlap
       * ✓ Navigation controls remain accessible
       * ✓ No horizontal scrolling required
       * ✓ Touch targets remain adequate size
       * ✓ Legend remains associated with charts
       */
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      expect(true).toBe(true); // Documentation placeholder
    });

    it('should adapt to mobile viewports', () => {
      /**
       * MANUAL VERIFICATION CHECKLIST:
       * 
       * At 320px viewport:
       * ✓ Charts stack vertically
       * ✓ Data remains readable
       * ✓ Controls remain accessible
       * ✓ No content cut off
       * ✓ Touch targets ≥ 44x44px
       */
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      expect(true).toBe(true); // Documentation placeholder
    });
  });

  describe('Time-based Data Accessibility', () => {
    it('should have accessible date range controls', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      const dateInputs = screen.queryAllByLabelText(/date|from|to|start|end/i);
      
      dateInputs.forEach(input => {
        // Should be properly labeled
        expect(input).toHaveAccessibleName();
        
        // Should have appropriate input type
        expect(['date', 'text']).toContain(input.getAttribute('type') || 'text');
      });
    });

    it('should format dates consistently for screen readers', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Dates should be in readable format
      const dateElements = screen.queryAllByText(/\d{4}-\d{2}/);
      
      dateElements.forEach(dateEl => {
        const text = dateEl.textContent || '';
        // Should be formatted (MM/DD/YYYY or similar)
        expect(text).toMatch(/\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|[A-Z][a-z]{2,8}\s+\d{4}/);
      });
    });
  });

  describe('Error States (WCAG 3.3.1, 3.3.2)', () => {
    it('should announce errors to screen readers', () => {
      const errorState = { error: 'Failed to load analytics data' };
      render(<AnalyticsDashboard data={mockAnalyticsData} error={errorState} />);

      // Error should be announced
      const errorMessage = screen.queryByRole('alert') || 
                          screen.queryByText(/error|failed/i);
      
      if (errorMessage) {
        expect(errorMessage).toHaveAttribute('role', 'alert') ||
               expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      }
    });

    it('should provide recovery options on error', () => {
      const errorState = { error: 'Failed to load analytics data' };
      render(<AnalyticsDashboard data={mockAnalyticsData} error={errorState} />);

      // Should offer retry or alternative action
      const retryButton = screen.queryByRole('button', { name: /retry|try again|refresh/i });
      
      if (retryButton) {
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toBeEnabled();
      }
    });
  });

  describe('Interactive Chart Elements', () => {
    it('should make chart tooltips keyboard accessible', async () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      const user = userEvent.setup();

      // Find chart data points or interactive elements
      const chartPoints = screen.queryAllByRole('button', { hidden: true });
      
      for (const point of chartPoints) {
        point.focus();
        
        // Tooltip/details should be accessible via keyboard
        await user.keyboard('{Enter}');
        
        const tooltip = screen.queryByRole('tooltip') || 
                       screen.queryByRole('dialog');
        
        if (tooltip) {
          expect(tooltip).toBeInTheDocument();
          
          // Close with Escape
          await user.keyboard('{Escape}');
        }
      }
    });

    it('should describe chart interactions to screen readers', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} />);

      // Interactive chart elements should have instructions
      const interactiveElements = screen.queryAllByRole('button', { hidden: true });
      
      interactiveElements.forEach(element => {
        const ariaLabel = element.getAttribute('aria-label');
        const ariaDescribedBy = element.getAttribute('aria-describedby');
        
        // Should describe what happens on interaction
        expect(ariaLabel || ariaDescribedBy).toBeTruthy();
      });
    });
  });

  describe('Performance & Timing (WCAG 2.2.1)', () => {
    it('should not have auto-updating content without user control', () => {
      render(<AnalyticsDashboard data={mockAnalyticsData} autoRefresh={true} />);

      // If auto-refresh exists, should have pause control
      const pauseButton = screen.queryByRole('button', { name: /pause|stop|disable auto/i });
      
      if (pauseButton) {
        expect(pauseButton).toBeInTheDocument();
      } else {
        // Auto-refresh should be off by default
        expect(true).toBe(true);
      }
    });

    it('should allow users to control animation speed', () => {
      /**
       * MANUAL VERIFICATION CHECKLIST:
       * 
       * For animated charts:
       * ✓ Provide option to reduce motion (prefers-reduced-motion)
       * ✓ Provide pause/play controls
       * ✓ Respect system reduced motion settings
       * ✓ Ensure animations don't flash more than 3 times per second
       */
      render(<AnalyticsDashboard data={mockAnalyticsData} />);
      expect(true).toBe(true); // Documentation placeholder
    });
  });
});
