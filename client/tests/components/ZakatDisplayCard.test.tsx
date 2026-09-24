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
});
