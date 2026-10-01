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

import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyProvider } from '../../../contexts/PrivacyContext';
import { AssetCard } from '../AssetCard';

// Passive-investment display: the zakat treatment shown on an asset row is the
// user-visible surface of the passive-investment feature. The modifier math is
// covered by calculation tests; here we pin the rendering contract.
//
// The row shows the treatment in one muted sub-line ("30% rule applies"),
// not the old badge + explanatory callout box - a list of those boxes was
// unreadable. The full sentence now lives on the asset detail page.

vi.mock('../../../hooks/useDisplayCurrency', () => ({
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

const baseAsset = {
  assetId: 'p1',
  name: 'Passive Fund',
  type: 'INVESTMENT_ACCOUNT',
  category: 'stocks',
  value: 6000,
  currency: 'USD',
  description: '',
  zakatEligible: true,
  isPassiveInvestment: true,
  calculationModifier: 0.3,
  createdAt: new Date().toISOString(),
};

const renderCard = (asset: Record<string, unknown>) =>
  render(
    <PrivacyProvider>
      <MemoryRouter>
        <AssetCard
          asset={asset as never}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    </PrivacyProvider>
  );

afterEach(cleanup);

describe('AssetCard passive-investment modifier display', () => {
  it('shows the 30% treatment for passive investments', () => {
    renderCard({ ...baseAsset });
    expect(screen.getByText(/30% rule applies/i)).toBeInTheDocument();
  });

  it('shows the deferred treatment for 0.0-modifier assets', () => {
    renderCard({
      ...baseAsset,
      name: 'Deferred Asset',
      isPassiveInvestment: false,
      calculationModifier: 0.0,
    });
    expect(screen.getByText(/deferred until withdrawn/i)).toBeInTheDocument();
  });

  it('shows no zakat treatment when modifier is 1.0', () => {
    renderCard({
      ...baseAsset,
      isPassiveInvestment: false,
      calculationModifier: 1.0,
    });
    expect(screen.queryByText(/30% rule applies/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/deferred until withdrawn/i)).not.toBeInTheDocument();
  });

  it('shows the asset value as money and the estimated zakat due', () => {
    renderCard({ ...baseAsset });
    expect(screen.getByText(/6,000\.00/)).toBeInTheDocument();
    // 30% of 6000 = 1800 zakatable, 2.5% of that = 45.00
    expect(screen.getByText(/45\.00 due/i)).toBeInTheDocument();
  });

  it('reports no zakat due for an exempt asset', () => {
    renderCard({
      ...baseAsset,
      zakatEligible: false,
      calculationModifier: 0,
    });
    expect(screen.getByText(/no zakat due/i)).toBeInTheDocument();
    expect(screen.getByText(/exempt/i)).toBeInTheDocument();
  });
});
