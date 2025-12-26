import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ZakatDisplayCard from '../../src/components/tracking/ZakatDisplayCard';
import { PrivacyProvider } from '../../src/contexts/PrivacyContext';

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
