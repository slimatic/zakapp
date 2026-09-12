/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

/**
 * Regression tests for issue #310 (v0.15.2 user report).
 *
 * Scenario: an IDR user's dashboard showed "$42,000,000.00 / IDR" (hardcoded
 * USD symbol) and an IDR total compared against a USD nisab (+343301.6%).
 *
 * Root causes covered here:
 * 1. WealthSummaryCard formatted amounts with a literal `$` prefix while the
 *    currency label showed the real preference.
 * 2. Dashboard resolved the currency only from the auth-context blob.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils';
import React from 'react';

const mockUseMaskedCurrency = vi.fn((s: string) => s);
vi.mock('../../contexts/PrivacyContext', () => ({
  useMaskedCurrency: () => mockUseMaskedCurrency,
}));

import { WealthSummaryCard } from '../../components/dashboard/WealthSummaryCard';

describe('WealthSummaryCard — issue #310 IDR regression', () => {
  beforeEach(() => {
    mockUseMaskedCurrency.mockClear();
  });

  it('renders IDR amounts with the IDR symbol, not a hardcoded $', () => {
    render(
      <WealthSummaryCard totalWealth={42_000_000} nisabThreshold={230_000_000} currency="IDR" />
    );

    // Shared formatter: id-ID locale → dot-grouped, Rp prefix, 0 decimals
    const total = screen.getByText(/42\.000\.000/);
    expect(total).toBeTruthy();
    expect(total.textContent).not.toContain('$');
    expect(total.textContent).toMatch(/Rp/);
  });

  it('renders the nisab threshold in the display currency (no $ for IDR)', () => {
    render(
      <WealthSummaryCard totalWealth={300_000_000} nisabThreshold={230_000_000} currency="IDR" />
    );

    const nisabLine = screen.getByText(/Nisab:/);
    expect(nisabLine.textContent).not.toContain('$');
    expect(nisabLine.textContent).toMatch(/Rp/);
  });

  it('formats USD amounts with $ as before (no regression for USD users)', () => {
    render(
      <WealthSummaryCard totalWealth={12_500} nisabThreshold={12_230.58} currency="USD" />
    );

    const total = screen.getByText(/12,500/);
    expect(total.textContent).toContain('$');
  });

  it('shows the Above/Below Nisab difference in the display currency', () => {
    render(
      <WealthSummaryCard totalWealth={300_000_000} nisabThreshold={230_000_000} currency="IDR" />
    );

    // difference = 70,000,000 → rendered with Rp, no $
    const diff = screen.getByText(/\+Rp/);
    expect(diff.textContent).not.toContain('$');
  });
});