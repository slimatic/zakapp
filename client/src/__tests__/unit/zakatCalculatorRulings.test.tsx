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
 * Integration test: ZakatCalculator review step renders per-asset madhab rulings.
 * The calculation flow is exercised via the exported component with mocked
 * repositories/API — verifying the ruling explanations are wired end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const mockAssets = [
  {
    id: 'asset-1',
    userId: 'u1',
    name: 'Wedding Gold Set',
    type: 'GOLD',
    value: 8000,
    currency: 'USD',
    zakatEligible: true, // override vs Shafi'i default (exempt)
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-2',
    userId: 'u1',
    name: 'Emergency Cash',
    type: 'CASH',
    value: 20000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock asset repository hook used by ZakatCalculator
vi.mock('../../hooks/useAssetRepository', () => ({
  useAssetRepository: () => ({
    assets: mockAssets,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// Mock API service (nisab fetch + payment recording)
vi.mock('../../services/api', () => ({
  apiService: {
    getNisab: vi.fn().mockResolvedValue({ success: false, data: null }),
    recordPayment: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock react-router navigation if the component uses it
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as object), useNavigate: () => vi.fn() };
});

import { ZakatCalculator } from '../../components/zakat/ZakatCalculator';

describe('ZakatCalculator — ruling transparency wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows per-asset rulings in the review step after calculating', async () => {
    render(<ZakatCalculator />);

    // Step 0: methodology is pre-selected; proceed to assets
    fireEvent.click(screen.getByRole('button', { name: /next: select assets/i }));

    // Step 1: assets are auto-selected; run the calculation
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /calculate zakat/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /calculate zakat/i }));

    // Step 2 (Review): ruling section must render
    await waitFor(() => {
      expect(screen.getByText(/why each asset counts the way it does/i)).toBeInTheDocument();
    });

    // Both assets get a ruling explanation with the toggle
    const toggles = screen.getAllByTestId('ruling-toggle');
    expect(toggles.length).toBe(2);

    // Status badges present
    expect(screen.getAllByTestId('ruling-status').length).toBe(2);

    // Expand one — citations render
    fireEvent.click(toggles[0]);
    await waitFor(() => {
      expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('override status appears for the Shafi\'i gold override asset', async () => {
    // Shafi'i treats personal jewelry as exempt; asset has zakatEligible=true override
    render(<ZakatCalculator />);
    fireEvent.click(screen.getByRole('button', { name: /next: select assets/i }));
    fireEvent.click(screen.getByRole('button', { name: /calculate zakat/i }));

    await waitFor(() => {
      expect(screen.getByTestId('override-hint')).toBeInTheDocument();
    });
  });
});