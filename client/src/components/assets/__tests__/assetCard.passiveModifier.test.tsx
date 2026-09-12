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

// Passive-investment display (the old AssetList.passive tests, re-homed):
// the modifier badge in AssetCard is the user-visible surface of the
// passive-investment feature. The modifier math itself is covered by
// calculation tests; here we pin the rendering contract.

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
  it('renders the 30% Rule badge for passive investments', () => {
    renderCard({ ...baseAsset });
    expect(screen.getByText('📊 30% Rule Applied')).toBeInTheDocument();
    expect(
      screen.getByText('Passive investments contribute 30% of value to Zakat.')
    ).toBeInTheDocument();
  });

  it('renders the Deferred badge for 0.0-modifier assets', () => {
    renderCard({
      ...baseAsset,
      name: 'Deferred Asset',
      isPassiveInvestment: false,
      calculationModifier: 0.0,
    });
    expect(screen.getByText('⏸️ Deferred')).toBeInTheDocument();
    expect(
      screen.getByText('Zakat-Deferred assets are exempt until withdrawal.')
    ).toBeInTheDocument();
  });

  it('renders no modifier badge when modifier is 1.0', () => {
    renderCard({
      ...baseAsset,
      isPassiveInvestment: false,
      calculationModifier: 1.0,
    });
    expect(screen.queryByText('📊 30% Rule Applied')).not.toBeInTheDocument();
    expect(screen.queryByText('⏸️ Deferred')).not.toBeInTheDocument();
  });
});