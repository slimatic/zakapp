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

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetRulingExplanation } from '../../components/zakat/AssetRulingExplanation';
import { getAssetRuling } from '../../data/rulings';
import { AssetType } from '../../types/index';

const baseAsset = {
  id: 'a1',
  userId: 'u1',
  name: 'Wedding Gold Set',
  type: AssetType.GOLD,
  value: 8000,
  currency: 'USD',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any;

describe('AssetRulingExplanation', () => {
  it('renders the expandable toggle collapsed by default', () => {
    const ruling = getAssetRuling(baseAsset, 'SHAFII');
    const { getByRole, queryByText } = render(
      <AssetRulingExplanation ruling={ruling} assetName="Wedding Gold Set" />
    );
    expect(getByRole('button', { name: /why/i })).toBeInTheDocument();
    // Ruling detail text hidden until expanded
    expect(queryByText(/personal-use jewelry/i)).toBeNull();
  });

  it('shows ruling, reasoning, and citation links when expanded', () => {
    const ruling = getAssetRuling(baseAsset, 'SHAFII');
    const { getByRole, getAllByRole, getByText } = render(
      <AssetRulingExplanation ruling={ruling} assetName="Wedding Gold Set" />
    );
    fireEvent.click(getByRole('button', { name: /why/i }));
    // Citation links render with safe attrs
    const links = getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
    // Reasoning text visible
    expect(getByText(/exempts personal-use jewelry/i)).toBeInTheDocument();
  });

  it('renders override block when user overrode the madhab default', () => {
    const ruling = getAssetRuling({ ...baseAsset, zakatEligible: true }, 'SHAFII');
    const { getByRole, getByText, queryByText } = render(
      <AssetRulingExplanation ruling={ruling} assetName="Wedding Gold Set" />
    );
    expect(getByText(/you marked/i)).toBeInTheDocument();
    fireEvent.click(getByRole('button', { name: /why/i }));
    expect(getByText(/takes precedence/i)).toBeInTheDocument();
    expect(getByText(/default for this asset type/i)).toBeInTheDocument();
  });

  it('shows exempt badge for exempt status and zakatable for zakatable', () => {
    const exempt = getAssetRuling(baseAsset, 'SHAFII');
    const { getByText: g1 } = render(
      <AssetRulingExplanation ruling={exemptFix(exempt)} assetName="Wedding Gold Set" />
    );
    expect(g1(/exempt/i)).toBeInTheDocument();

    const cash = getAssetRuling({ ...baseAsset, type: AssetType.CASH, name: 'Emergency Fund' }, 'HANAFI');
    const { getByText: g2 } = render(
      <AssetRulingExplanation ruling={cash} assetName="Emergency Fund" />
    );
    expect(g2(/zakatable/i)).toBeInTheDocument();
  });
});

function exemptFix<T>(x: T): T {
  return x;
}