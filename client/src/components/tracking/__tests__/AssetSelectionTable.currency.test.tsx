/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * Regression tests for #310 round 6 — AssetSelectionTable currency prop.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AssetSelectionTable } from '../AssetSelectionTable';
import { Asset } from '../../types';

const baseAssets: Asset[] = [
  {
    id: 'a1',
    name: 'Savings',
    type: 'CASH',
    value: 1000000,
    currency: 'IDR',
    zakatEligible: true,
    acquisitionDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('AssetSelectionTable (#310 round 6)', () => {
  it('defaults to USD when no currency prop', () => {
    render(
      <AssetSelectionTable
        assets={baseAssets}
        onSelectionChange={() => {}}
      />
    );
    // Should render USD-formatted amount for the asset value
    const usdFormatted = screen.getAllByText('$1,000,000.00');
    expect(usdFormatted.length).toBeGreaterThan(0);
  });

  it('formats IDR when currency="IDR" prop is passed', () => {
    render(
      <AssetSelectionTable
        assets={baseAssets}
        onSelectionChange={() => {}}
        currency="IDR"
      />
    );
    // Intl.NumberFormat uses non-breaking space (U+00A0) between currency code and amount
    const idrFormatted = screen.getAllByText(/IDR\s1,000,000\.00/);
    expect(idrFormatted.length).toBeGreaterThan(0);
  });

  it('formats USD when currency="USD" prop is passed', () => {
    render(
      <AssetSelectionTable
        assets={baseAssets}
        onSelectionChange={() => {}}
        currency="USD"
      />
    );
    const usdFormatted = screen.getAllByText('$1,000,000.00');
    expect(usdFormatted.length).toBeGreaterThan(0);
  });
});
