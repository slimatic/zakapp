/**
 * Regression tests for the residual hardcoded-USD sites (#310).
 *
 * WHY THESE EXIST
 * #310 has now been reported five times. Each round fixed the sites that were
 * found, but nothing prevented a NEW file from hardcoding "$" — so it kept
 * coming back. These tests fail if any of the fixed components reverts to a
 * hardcoded dollar formatter, and they assert the *behaviour* (currency flows
 * through) rather than just the absence of a string.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// The canonical hook is mocked so we can force a non-USD currency and prove
// the component follows it. If a component ignores the hook, these fail.
const mockFormatCurrency = vi.fn((amount: number, currency?: string) => {
  const n = Number.isFinite(amount) ? amount : 0;
  const sym = (currency ?? 'IDR') === 'IDR' ? 'Rp ' : '$';
  return `${sym}${n.toLocaleString('en-US')}`;
});

vi.mock('../../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'IDR',
    formatCurrency: mockFormatCurrency,
  }),
}));

import { CalculationTrendsChart } from '../../../components/zakat/CalculationTrendsChart';

const baseProps = {
  wealthTrend: [{ date: '2026-01-01', wealth: 42000000 }],
  zakatTrend: [{ date: '2026-01-01', zakat: 1050000 }],
  methodologyDistribution: { standard: 1 },
  averages: { wealth: 42000000, zakat: 1050000 },
  totals: { wealth: 42000000, zakat: 1050000 },
  selectedPeriod: '1year' as const,
  onPeriodChange: vi.fn(),
};

describe('#310 residual — CalculationTrendsChart honours display currency', () => {
  beforeEach(() => mockFormatCurrency.mockClear());

  it('routes the summary totals through the display-currency hook', () => {
    render(React.createElement(CalculationTrendsChart, baseProps));
    expect(mockFormatCurrency).toHaveBeenCalled();
  });

  it('does NOT render a hardcoded "$" amount for a non-USD user', () => {
    const { container } = render(
      React.createElement(CalculationTrendsChart, baseProps)
    );
    const text = container.textContent ?? '';
    // A "$" adjacent to digits is the #310 signature. The compact tick
    // formatter must use the user's symbol instead.
    expect(text).not.toMatch(/\$\d/);
  });

  it('uses the IDR symbol in compact notation', () => {
    const { container } = render(
      React.createElement(CalculationTrendsChart, baseProps)
    );
    const text = container.textContent ?? '';
    expect(text).toMatch(/Rp\s?\d/);
  });
});
