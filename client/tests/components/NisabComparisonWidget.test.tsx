/**
 * T034: Component Test - NisabComparisonWidget
 * 
 * Tests the widget displaying gold vs silver Nisab thresholds
 * and current wealth comparison.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NisabComparisonWidget } from '../../../src/components/NisabComparisonWidget';

describe('NisabComparisonWidget Component', () => {
  const mockComparisonData = {
    goldNisab: 5293.54,
    silverNisab: 520.51,
    goldPricePerGram: 60.50,
    silverPricePerGram: 0.85,
    currentWealth: 7000,
    fetchedAt: new Date('2024-01-15T10:00:00Z'),
  };

  it('should display gold Nisab threshold', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    expect(screen.getByText(/gold nisab/i)).toBeInTheDocument();
    expect(screen.getByText(/5,293\.54/)).toBeInTheDocument();
  });

  it('should display silver Nisab threshold', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    expect(screen.getByText(/silver nisab/i)).toBeInTheDocument();
    expect(screen.getByText(/520\.51/)).toBeInTheDocument();
  });

  it('should show current wealth value', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    expect(screen.getByText(/current wealth/i)).toBeInTheDocument();
    expect(screen.getByText(/7,000/)).toBeInTheDocument();
  });

  it('should indicate wealth is above gold Nisab', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    const goldIndicator = screen.getByText(/above gold nisab/i);
    expect(goldIndicator).toBeInTheDocument();
    expect(goldIndicator).toHaveClass('success');
  });

  it('should indicate wealth is above silver Nisab', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    expect(screen.getByText(/above silver nisab/i)).toBeInTheDocument();
  });

  it('should show wealth below Nisab when applicable', () => {
    const lowWealthData = {
      ...mockComparisonData,
      currentWealth: 400, // Below both thresholds
    };

    render(<NisabComparisonWidget data={lowWealthData} />);

    expect(screen.getByText(/below gold nisab/i)).toBeInTheDocument();
    expect(screen.getByText(/below silver nisab/i)).toBeInTheDocument();
  });

  it('should display recommended Nisab basis', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    // Silver Nisab is lower, so it's more cautious (recommended)
    expect(screen.getByText(/recommended.*silver/i)).toBeInTheDocument();
  });

  it('should show gold price per gram', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    expect(screen.getByText(/60\.50.*gram/i)).toBeInTheDocument();
  });

  it('should show silver price per gram', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    expect(screen.getByText(/0\.85.*gram/i)).toBeInTheDocument();
  });

  it('should display when prices were last updated', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    expect(screen.getByText(/updated.*jan.*15/i)).toBeInTheDocument();
  });

  it('should warn if prices are stale (>7 days old)', () => {
    const staleData = {
      ...mockComparisonData,
      fetchedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    };

    render(<NisabComparisonWidget data={staleData} />);

    expect(screen.getByText(/prices may be outdated/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should show loading state when data is not available', () => {
    render(<NisabComparisonWidget data={null} loading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText(/gold nisab/i)).not.toBeInTheDocument();
  });

  it('should display error message on fetch failure', () => {
    const error = 'Failed to fetch precious metal prices';
    render(<NisabComparisonWidget data={null} error={error} />);

    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
  });

  it('should show educational tooltip explaining Nisab', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    const tooltipTrigger = screen.getByLabelText(/what is nisab/i);
    expect(tooltipTrigger).toBeInTheDocument();
  });

  it('should display comparison as percentage', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    // 7000 / 5293.54 ≈ 132% of gold Nisab
    expect(screen.getByText(/132%.*gold nisab/i)).toBeInTheDocument();
  });

  it('should be accessible with proper headings', () => {
    render(<NisabComparisonWidget data={mockComparisonData} />);

    expect(screen.getByRole('heading', { name: /nisab comparison/i })).toBeInTheDocument();
  });
});
