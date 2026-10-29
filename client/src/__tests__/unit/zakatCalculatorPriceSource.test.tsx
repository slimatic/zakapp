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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * The nisab threshold the calculator runs on must never be presented as a live
 * rate when it is not one.
 *
 * When the price feed cannot be reached the app falls back to bundled prices,
 * which are stale by construction. A figure computed from them is still usable,
 * but a user deciding an obligation against it has to be told that it is an
 * estimate. The same applies when the feed answers with a price that is more
 * than a week old.
 *
 * The threshold is owned by `useNisabThreshold` (one cache, one retry policy, one
 * fallback). This screen used to fetch its own copy and fall back silently, so a
 * stale bundled price was printed exactly like a live one.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const mockAssets = [
  {
    id: 'asset-cash',
    userId: 'u1',
    name: 'Cash',
    type: 'CASH',
    value: 20000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

vi.mock('../../hooks/useAssetRepository', () => ({
  useAssetRepository: () => ({
    assets: mockAssets,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { settings: { currency: 'USD' } },
    updateLocalProfile: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    nisabStandard: 'tola',
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(amount),
  }),
}));

import { ZakatCalculator } from '../../components/zakat/ZakatCalculator';

/** Drive the wizard to the assets step. */
function goToAssets() {
  fireEvent.click(screen.getByRole('button', { name: /next: select assets/i }));
}

/** From the assets step, run the calculation and reach the review screen. */
async function calculate() {
  await waitFor(
    () => expect(screen.getByRole('button', { name: /calculate zakat/i })).not.toBeDisabled(),
    { timeout: 15_000 }
  );
  fireEvent.click(screen.getByRole('button', { name: /calculate zakat/i }));
  await waitFor(() => expect(screen.getByText(/zakat obligation/i)).toBeInTheDocument());
}

function livePayload(daysOld = 0) {
  const stamped = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  return {
    success: true,
    data: {
      currency: 'USD',
      effectiveDate: stamped,
      lastUpdated: stamped,
      // 100/g gold, 1/g silver: tola (87.48 g) gives 8,748.
      goldPrice: { pricePerGram: 100, currency: 'USD', nisabGrams: 87.48, nisabValue: 8748 },
      silverPrice: { pricePerGram: 1, currency: 'USD', nisabGrams: 612.36, nisabValue: 612.36 },
    },
  };
}

describe('ZakatCalculator — nisab price provenance', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetchMock.mockReset();
    // The live/fallback fixtures assume a portfolio above both thresholds.
    mockAssets[0].value = 20000;
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('labels a bundled-fallback threshold as an estimate, before and after calculating', async () => {
    // The offline case: no live rate can be fetched.
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    render(
      <QueryClientProvider client={queryClient}>
        <ZakatCalculator />
      </QueryClientProvider>
    );

    goToAssets();

    // The screen states the provenance of the figure it is about to use, and
    // offers a way to try again rather than hiding the failure.
    await waitFor(
      () => expect(screen.getByTestId('nisab-price-notice')).toHaveTextContent(/bundled fallback prices/i),
      { timeout: 15_000 }
    );
    expect(screen.getByTestId('nisab-price-notice')).toHaveTextContent(/estimate/i);
    expect(screen.getByRole('button', { name: /retry prices/i })).toBeInTheDocument();

    await calculate();

    // The result carries the same warning, so the figure is not separated from
    // the fact that it was computed from an estimate.
    expect(screen.getByTestId('nisab-price-used')).toHaveTextContent(/bundled fallback prices/i);
    // Fallback gold 65/g x 87.48 g — the figure itself is unchanged and usable.
    expect(screen.getByText(/Nisab Threshold: \$5,686\.20/)).toBeInTheDocument();
  }, 30_000);

  it('reports a stale-but-live price as old rather than presenting it as current', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => livePayload(10),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ZakatCalculator />
      </QueryClientProvider>
    );
    goToAssets();

    await waitFor(
      () => expect(screen.getByTestId('nisab-price-notice')).toHaveTextContent(/10 days old/i),
      { timeout: 15_000 }
    );

    await calculate();
    expect(screen.getByTestId('nisab-price-used')).toHaveTextContent(/10 days old/i);
  }, 30_000);

  it('states that prices are unavailable instead of leaving a disabled button unexplained', async () => {
    // A payload with no per-gram price cannot produce an honest threshold: the
    // hook withholds the pair rather than half-knowing it. The screen must say
    // what is missing rather than silently computing from bundled defaults.
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
          goldPrice: { nisabValue: 8748 },
          silverPrice: { nisabValue: 612.36 },
        },
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ZakatCalculator />
      </QueryClientProvider>
    );
    goToAssets();

    await waitFor(
      () => expect(screen.getByTestId('nisab-price-notice')).toHaveTextContent(/prices are unavailable/i),
      { timeout: 15_000 }
    );
    expect(screen.getByRole('button', { name: /calculate zakat/i })).toBeDisabled();
  }, 30_000);

  it('follows the selected school to the silver basis when the feed is unavailable', async () => {
    // The basis is not a display detail: each school carries its own nisab source,
    // and the Hanafi rule uses silver. A 1,000 portfolio sits between the two
    // fallback thresholds (silver 0.8 x 612.36 = 489.89, gold 65 x 87.48 = 5,686.20),
    // so the due figure proves which basis the screen actually ran.
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    mockAssets[0].value = 1000;

    render(
      <QueryClientProvider client={queryClient}>
        <ZakatCalculator />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /hanafi method methodology/i }));
    goToAssets();
    await calculate();

    expect(screen.getByText(/nisab threshold: \$489\.89/i)).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  }, 30_000);

  it('does not label a current price as an estimate', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => livePayload(0),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ZakatCalculator />
      </QueryClientProvider>
    );

    // Wait until the threshold is available, then confirm no warning is claimed.
    goToAssets();
    await waitFor(
      () => expect(screen.getByRole('button', { name: /calculate zakat/i })).not.toBeDisabled(),
      { timeout: 15_000 }
    );

    expect(screen.queryByTestId('nisab-price-notice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /calculate zakat/i }));
    await waitFor(() => expect(screen.getByText(/zakat obligation/i)).toBeInTheDocument());

    expect(screen.queryByTestId('nisab-price-used')).not.toBeInTheDocument();
    expect(screen.getByText(/Nisab Threshold: \$8,748\.00/)).toBeInTheDocument();
  }, 30_000);
});
