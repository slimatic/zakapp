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
 * The nisab gram convention is a user preference (`NISAB_STANDARDS`), and every
 * surface that turns a price into a threshold must follow it. These tests mount
 * the Calculator with a user who selected 'aaoifi' (85 g / 595 g) and a
 * portfolio that sits between the two conventions' thresholds, so the rendered
 * figures prove which grams actually ran:
 *
 *   aaoifi  : 65 U/g x 85 g    = 5,525.00 -> 5,600.00 is above -> due 140.00
 *   default : 65 U/g x 87.48 g = 5,686.20 -> 5,600.00 is below -> due  0.00
 *
 * Prices come from the bundled fallback (the nisab API mocked unreachable) so
 * the gram convention is the only moving part. The default-resolution fixture
 * pins the other half of the contract: a user who never picked a convention
 * keeps exactly the threshold the app has always computed.
 *
 * All figures in the fixtures are synthetic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// The nisab threshold now comes from the shared hook, which runs its own query.
// Unreachable prices are simulated at the transport so this test keeps
// exercising the real fallback path.
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Mutable fixture state, hoisted so the module factories created below read
// the same object each test mutates.
const fixture = vi.hoisted(() => ({
  // The user's selected convention; each test sets this before rendering.
  standard: 'aaoifi' as string,
  // The portfolio under test; each test sets this before rendering.
  assets: [] as any[],
}));

const cashAsset = (id: string, value: number) => ({
  id,
  userId: 'u1',
  name: `Cash ${id}`,
  type: 'CASH',
  value,
  currency: 'USD',
  isActive: true,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
});

vi.mock('../../hooks/useAssetRepository', () => ({
  useAssetRepository: () => ({
    assets: fixture.assets,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../hooks/useLiabilityRepository', () => ({
  useLiabilityRepository: () => ({
    liabilities: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// The nisab API is mocked unreachable so the bundled fallback prices (65 / 0.8)
// are what the surface computes from — stale by construction, which keeps the
// gram convention the only moving part.
vi.mock('../../services/api', () => ({
  API_BASE_URL: '/api',
  apiService: {
    getNisab: vi.fn().mockResolvedValue({ success: false, data: null }),
    getFxRates: vi.fn().mockResolvedValue({ success: false, data: null }),
    recordPayment: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { settings: { currency: 'USD' } },
    updateLocalProfile: vi.fn(),
  }),
}));

// The single reader of the user's nisab-preference setting (local settings
// store resolved through getNisabStandard). The components under test must
// route the user's standard through to the engine.
vi.mock('../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    nisabStandard: fixture.standard,
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(amount),
  }),
}));

import { ZakatCalculator } from '../../components/zakat/ZakatCalculator';

describe('the nisab gram convention reaches the Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    fixture.standard = 'aaoifi';
    fixture.assets = [];
  });

  const runToReview = async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ZakatCalculator />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /next: select assets/i }));
    // The hook retries a failed price fetch twice before substituting the
    // bundled fallback, so the threshold arrives a few seconds in.
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /calculate zakat/i })).not.toBeDisabled();
      },
      { timeout: 15_000 }
    );
    fireEvent.click(screen.getByRole('button', { name: /calculate zakat/i }));
    await waitFor(() => {
      expect(screen.getByText(/wealth breakdown/i)).toBeInTheDocument();
    });
  };

  it("an 'aaoifi' user's 5,600.00 portfolio is above the 5,525.00 nisab and 140.00 is due", async () => {
    fixture.standard = 'aaoifi';
    fixture.assets = [cashAsset('a1', 5600)];

    await runToReview();

    // The engine's own threshold, printed on the review card.
    expect(screen.getByText(/nisab threshold: \$5,525\.00 \(exceeded\)/i)).toBeInTheDocument();
    expect(screen.getByText('$140.00')).toBeInTheDocument();
  }, 30_000);

  it('a user who never picked a convention keeps the 5,686.20 default threshold', async () => {
    fixture.standard = 'tola';
    fixture.assets = [cashAsset('a2', 6200)];

    await runToReview();

    // The default resolution must keep exactly the convention the app has
    // always computed, so no un-selecting user's obligation moves.
    expect(screen.getByText(/5,686\.20/)).toBeInTheDocument();
    expect(screen.getByText('$155.00')).toBeInTheDocument();
  }, 30_000);
});
