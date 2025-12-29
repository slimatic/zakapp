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

import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetForm } from '../AssetForm';

// Mock hook
const mockUpdateAsset = vi.fn();
const mockAddAsset = vi.fn();

vi.mock('../../../hooks/useAssetRepository', () => ({
  useAssetRepository: () => ({
    addAsset: mockAddAsset,
    updateAsset: mockUpdateAsset,
    isLoading: false
  }),
}));

// Mock DB to ensure no leakage
vi.mock('../../../db', () => ({
  useDb: () => null,
  getDb: vi.fn(),
  resetDb: vi.fn(), // Also mock resetDb to prevent setupTests issues
}));

describe('AssetForm eligibility and passive behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Passive checkbox is disabled when zakatEligible is unchecked and cleared', () => {
    // Note: type must be INVESTMENT_ACCOUNT (stocks) for passive logic to activate
    render(<AssetForm asset={{ id: 'a1', type: 'INVESTMENT_ACCOUNT' as any, name: 'Test', category: 'stocks' as any, value: 100, currency: 'USD', acquisitionDate: new Date().toISOString(), description: '', zakatEligible: true, isPassiveInvestment: true, isRestrictedAccount: false, calculationModifier: 0.3 } as any} /> as any);

    // Passive checkbox should be checked initially
    // Use ID directly to avoid ambiguity if multiple labels exist
    const checkboxes = screen.getAllByRole('checkbox');
    const passiveCheckbox = checkboxes.find(c => c.id === 'isPassiveInvestment') as HTMLInputElement;

    if (!passiveCheckbox) throw new Error('Passive checkbox not found');

    expect(passiveCheckbox).toBeInTheDocument();
    expect(passiveCheckbox).toBeEnabled();
    expect(passiveCheckbox.checked).toBe(true);

    // Uncheck eligibility
    const eligibleCheckbox = screen.getByLabelText(/This asset is eligible for Zakat calculation/i) as HTMLInputElement;
    expect(eligibleCheckbox.checked).toBe(true);
    fireEvent.click(eligibleCheckbox);

    // Passive should now be disabled and unchecked
    expect(passiveCheckbox).toBeDisabled();
    expect(passiveCheckbox.checked).toBe(false);
  });

  test('Update submission includes zakatEligible and cleared passive when eligibility removed', () => {
    render(<AssetForm asset={{ id: 'a2', type: 'INVESTMENT_ACCOUNT' as any, name: 'Stocks Inc', category: 'stocks' as any, value: 5000, currency: 'USD', acquisitionDate: new Date().toISOString(), description: '', zakatEligible: true, isPassiveInvestment: true, isRestrictedAccount: false, calculationModifier: 0.3 } as any} onSuccess={() => { }} /> as any);

    const eligibleCheckbox = screen.getByLabelText(/This asset is eligible for Zakat calculation/i) as HTMLInputElement;
    fireEvent.click(eligibleCheckbox); // uncheck

    const submitButton = screen.getByRole('button', { name: /Update Asset/i });
    fireEvent.click(submitButton);

    expect(mockUpdateAsset).toHaveBeenCalledTimes(1);
    expect(mockUpdateAsset).toHaveBeenCalledWith('a2', expect.objectContaining({
      zakatEligible: false,
      isPassiveInvestment: false
    }));
  });
});
