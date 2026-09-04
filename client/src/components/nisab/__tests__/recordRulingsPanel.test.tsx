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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordRulingsPanel, categoryToAssetType } from '../RecordRulingsPanel';
import { AssetType } from '../../../types/index';
import { getAssetRuling } from '../../../data/rulings';

describe('RecordRulingsPanel', () => {
  const assets = [
    { id: '1', name: 'Main Bank Account', category: 'cash', zakatEligible: true },
    { id: '2', name: 'Gold Necklace', category: 'gold', zakatEligible: false },
  ];

  it('renders a ruling for each asset under the user methodology', () => {
    render(<RecordRulingsPanel assets={assets} methodologyName="HANAFI" />);
    expect(screen.getByTestId('record-rulings-panel')).toBeInTheDocument();
    const statuses = screen.getAllByTestId('ruling-status');
    expect(statuses).toHaveLength(2);
    expect(statuses[0].textContent).toBe('Zakatable (your override)');
    expect(statuses[1].textContent).toBe('Exempt (your override)');
  });

  it('expands a ruling to reveal reasoning and citations', () => {
    render(<RecordRulingsPanel assets={assets} methodologyName="HANAFI" />);
    const toggles = screen.getAllByTestId('ruling-toggle');
    fireEvent.click(toggles[1]);
    const panel = screen.getByTestId('record-rulings-panel');
    expect(panel.textContent).toContain('jewelry');
  });

  it('maps server categories to AssetTypes the registry covers', () => {
    expect(categoryToAssetType('cash')).toBe(AssetType.CASH);
    expect(categoryToAssetType('gold')).toBe(AssetType.GOLD);
    expect(categoryToAssetType('crypto')).toBe(AssetType.CRYPTOCURRENCY);
    expect(categoryToAssetType('stocks')).toBe(AssetType.INVESTMENT_ACCOUNT);
    expect(categoryToAssetType('property')).toBe(AssetType.REAL_ESTATE);
    expect(categoryToAssetType('debts')).toBe(AssetType.DEBTS_OWED_TO_YOU);
    expect(categoryToAssetType('business')).toBe(AssetType.BUSINESS_ASSETS);
    expect(categoryToAssetType('unknown-thing')).toBe(AssetType.OTHER);
  });

  it('produces the same ruling the parity-tested registry function does', () => {
    const ruling = getAssetRuling({ type: AssetType.GOLD, zakatEligible: false, name: 'Gold Necklace' }, 'SHAFII');
    expect(ruling.status).toBe('override-exempt');
  });

  it('renders nothing when there are no assets', () => {
    const { container } = render(<RecordRulingsPanel assets={[]} methodologyName="STANDARD" />);
    expect(container.firstChild).toBeNull();
  });
});