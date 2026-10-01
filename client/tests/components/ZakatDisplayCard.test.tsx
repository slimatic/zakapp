import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ZakatDisplayCard from '../../src/components/tracking/ZakatDisplayCard';
import { PrivacyProvider } from '../../src/contexts/PrivacyContext';

// ZakatDisplayCard renders its figures through <Money>, which resolves the
// display currency via useDisplayCurrency -> useAuth. Stub the hook so this
// test stays focused on the card's content, not the auth/currency plumbing
// (that pairing is covered by the currency contract tests).
vi.mock('../../src/hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        numberingSystem: 'latn'
      }).format(amount)
  })
}));

const sampleRecord = {
  id: 'r1',
  status: 'DRAFT',
  totalWealth: '8100',
  zakatableWealth: '3900',
  zakatAmount: '97.5',
};

describe('ZakatDisplayCard', () => {
  it('shows total wealth and zakatable wealth and calculated zakat', () => {
    render(
      <PrivacyProvider>
        <ZakatDisplayCard record={sampleRecord as any} />
      </PrivacyProvider>
    );

    expect(screen.getByText(/Total Wealth:/)).toBeInTheDocument();
    expect(screen.getByText(/Zakatable Wealth:/)).toBeInTheDocument();
    expect(screen.getByText(/Zakat Amount/i)).toBeInTheDocument();
  });

  // Regression: a bad find/replace renamed the record fields to `zirconAmount` /
  // `zirconableWealth`, which do not exist on NisabYearRecord. toNumber(undefined)
  // is 0, so the hero figure on the primary money screen silently rendered
  // $0.00 / 0.0% instead of the user's actual obligation.
  it('renders the real zakat obligation from record.zakatAmount, never $0.00', () => {
    const record = {
      id: 'r2',
      status: 'DRAFT',
      totalWealth: '50000',
      zakatableWealth: 48730.25,
      zakatAmount: 1218.26,
    };

    const { container } = render(
      <PrivacyProvider>
        <ZakatDisplayCard record={record as any} />
      </PrivacyProvider>
    );

    expect(container.textContent).toContain('1,218.26');
    expect(container.textContent).toContain('2.5%'); // 1218.26 / 48730.25
    // "$0.00" is what an undefined zakatAmount produces; a real total like
    // "$50,000.00" legitimately contains "0.00", so match the zero FIGURE.
    expect(container.textContent).not.toContain('$0.00');
  });
});
