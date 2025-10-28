/**
 * T033: Component Test - HawlProgressIndicator
 * 
 * Tests the visual progress indicator for active Hawl tracking,
 * including days remaining, completion percentage, and status display.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { HawlProgressIndicator } from '../../../src/components/HawlProgressIndicator';

describe('HawlProgressIndicator Component', () => {
  const mockActiveHawl = {
    recordId: 'record1',
    hawlStartDate: new Date('2024-01-01'),
    hawlCompletionDate: new Date('2024-12-20'),
    daysRemaining: 100,
    nisabBasis: 'gold' as const,
    nisabThresholdAtStart: 5293.54,
  };

  it('should render progress bar with correct completion percentage', () => {
    render(<HawlProgressIndicator hawl={mockActiveHawl} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();

    // 354 - 100 = 254 days completed → ~71.75%
    const expectedPercentage = ((354 - 100) / 354) * 100;
    expect(progressBar).toHaveAttribute('aria-valuenow', expectedPercentage.toFixed(0));
  });

  it('should display days remaining', () => {
    render(<HawlProgressIndicator hawl={mockActiveHawl} />);

    expect(screen.getByText(/100 days/i)).toBeInTheDocument();
    expect(screen.getByText(/remaining/i)).toBeInTheDocument();
  });

  it('should display Hawl start and completion dates', () => {
    render(<HawlProgressIndicator hawl={mockActiveHawl} />);

    expect(screen.getByText(/Jan.*1.*2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Dec.*20.*2024/i)).toBeInTheDocument();
  });

  it('should show "Ready to Finalize" when Hawl is complete', () => {
    const completedHawl = {
      ...mockActiveHawl,
      daysRemaining: 0,
      completed: true,
    };

    render(<HawlProgressIndicator hawl={completedHawl} />);

    expect(screen.getByText(/ready to finalize/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /finalize/i })).toBeInTheDocument();
  });

  it('should display Nisab basis (gold or silver)', () => {
    render(<HawlProgressIndicator hawl={mockActiveHawl} />);

    expect(screen.getByText(/gold.*nisab/i)).toBeInTheDocument();
  });

  it('should render with silver Nisab basis', () => {
    const silverHawl = {
      ...mockActiveHawl,
      nisabBasis: 'silver' as const,
      nisabThresholdAtStart: 520.51,
    };

    render(<HawlProgressIndicator hawl={silverHawl} />);

    expect(screen.getByText(/silver.*nisab/i)).toBeInTheDocument();
  });

  it('should show warning when approaching completion (< 30 days)', () => {
    const approachingHawl = {
      ...mockActiveHawl,
      daysRemaining: 25,
    };

    render(<HawlProgressIndicator hawl={approachingHawl} />);

    const warningElement = screen.getByText(/approaching completion/i);
    expect(warningElement).toBeInTheDocument();
    expect(warningElement).toHaveClass('warning');
  });

  it('should display completion percentage text', () => {
    render(<HawlProgressIndicator hawl={mockActiveHawl} />);

    // ~71.75% complete
    expect(screen.getByText(/71%|72%/)).toBeInTheDocument();
  });

  it('should render inactive state when no active Hawl', () => {
    render(<HawlProgressIndicator hawl={null} />);

    expect(screen.getByText(/no active hawl/i)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should show Hijri date equivalents', () => {
    const hawlWithHijri = {
      ...mockActiveHawl,
      hawlStartDateHijri: '1445-07-01',
      hawlCompletionDateHijri: '1446-07-01',
    };

    render(<HawlProgressIndicator hawl={hawlWithHijri} />);

    expect(screen.getByText(/1445/)).toBeInTheDocument();
    expect(screen.getByText(/1446/)).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<HawlProgressIndicator hawl={mockActiveHawl} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label');
    expect(progressBar.getAttribute('aria-label')).toContain('Hawl progress');
  });

  it('should display elapsed time in addition to remaining', () => {
    render(<HawlProgressIndicator hawl={mockActiveHawl} />);

    // 354 - 100 = 254 days elapsed
    expect(screen.getByText(/254 days/i)).toBeInTheDocument();
    expect(screen.getByText(/elapsed/i)).toBeInTheDocument();
  });

  it('should handle edge case of 1 day remaining', () => {
    const oneDayLeft = {
      ...mockActiveHawl,
      daysRemaining: 1,
    };

    render(<HawlProgressIndicator hawl={oneDayLeft} />);

    expect(screen.getByText(/1 day remaining/i)).toBeInTheDocument();
  });

  it('should display Nisab threshold amount', () => {
    render(<HawlProgressIndicator hawl={mockActiveHawl} />);

    expect(screen.getByText(/5,293\.54/)).toBeInTheDocument();
  });
});
