/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyProvider } from '../../contexts/PrivacyContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LiabilitiesPage } from '../LiabilitiesPage';
import { sumLiabilitiesInCurrency } from '../../utils/currencyNormalization';

// Regression tests for #310 round 5: LiabilitiesPage previously hardcoded
// 'USD' in its total (a local Intl.NumberFormat bypassing the user's
// currency preference) and raw-summed mixed-currency liabilities.

// Mock AuthContext — LiabilitiesPage (and the repo hooks it uses) call useAuth
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            settings: { currency: 'USD' },
        },
        updateLocalProfile: vi.fn(),
    }),
}));

// Mock the DB + repositories: the page's data comes from RxDB via repo hooks,
// which need a real initialized database. For this unit test we only need the
// loading→loaded render contract, so stub the repository hooks directly.
vi.mock('../../hooks/useLiabilityRepository', () => ({
    useLiabilityRepository: () => ({
        liabilities: [],
        isLoading: false,
        error: null,
        addLiability: vi.fn(),
        updateLiability: vi.fn(),
        removeLiability: vi.fn(),
    }),
}));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PrivacyProvider>
        <MemoryRouter>
          <LiabilitiesPage />
        </MemoryRouter>
      </PrivacyProvider>
    </QueryClientProvider>
  );

afterEach(cleanup);

describe('LiabilitiesPage currency handling (#310 round 5)', () => {
  it('sumLiabilitiesInCurrency honors the display currency for a single currency', () => {
    const r = sumLiabilitiesInCurrency(
      [
        { amount: 100, currency: 'USD' },
        { amount: 250, currency: 'USD' },
      ],
      'USD',
      {}
    );
    expect(r.total).toBe(350);
    expect(r.converted).toBe(true);
  });

  it('flags mixed-currency sums as unconverted when no FX rates exist', () => {
    const r = sumLiabilitiesInCurrency(
      [
        { amount: 100, currency: 'USD' },
        { amount: 1_000_000, currency: 'IDR' },
      ],
      'USD',
      undefined
    );
    // The total is not trustworthy — callers must show the placeholder.
    expect(r.converted).toBe(false);
    expect(r.mixed).toBe(true);
  });

  it('converts a foreign-currency liability when rates are provided', () => {
    // USD-based rates: 1 USD = 15,750 IDR (matches the /api/zakat/fx-rates scale)
    const rates = { USD: 1, IDR: 15_750 };
    const r = sumLiabilitiesInCurrency([{ amount: 15_750_000, currency: 'IDR' }], 'USD', rates);
    expect(r.total).toBeCloseTo(1000, 5);
    expect(r.converted).toBe(true);
  });

  it('renders the page content once data resolves (smoke)', async () => {
    // Repositories are stubbed to isLoading:false with an empty list, so the
    // page should render its full chrome: header, summary card, add button.
    // The currency contract itself is asserted by the sumLiabilities tests.
    renderPage();
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
    expect(screen.getByText(/Add Liability/)).toBeInTheDocument();
  });
});