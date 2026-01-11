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

// Mock @zakapp/shared to avoid ESM runtime in Jest
jest.mock('@zakapp/shared', () => ({
  PASSIVE_INVESTMENT_TYPES: ['Stock', 'ETF', 'Mutual Fund', 'Roth IRA'],
  RESTRICTED_ACCOUNT_TYPES: ['401k', 'Traditional IRA', 'Pension', 'Roth IRA'],
  CalculationModifier: { RESTRICTED: 0.0, PASSIVE: 0.3, FULL: 1.0 }
}));

import { AssetService } from '../AssetService';
import { prisma } from '../../utils/prisma';

describe('AssetService update asset modifier validation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('allows setting passive investment for stocks (case-insensitive category)', async () => {
    // Mock existing asset
    const existing = {
      id: 'a1',
      userId: 'u1',
      category: 'stocks',
      name: 'My Stocks',
      value: 1000,
      currency: 'USD',
      acquisitionDate: new Date(),
      metadata: null,
      notes: null,
      calculationModifier: 1.0,
      isPassiveInvestment: false,
      isRestrictedAccount: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    jest.spyOn(prisma.asset, 'findFirst').mockResolvedValue(existing);
    // @ts-ignore
    jest.spyOn(prisma.asset, 'update').mockImplementation(async (args: any) => ({ ...existing, ...args.data }));

    const svc = new AssetService();
    const updated = await svc.updateAsset('u1', 'a1', { category: 'STOCKS', isPassiveInvestment: true } as any);

    expect(updated).toHaveProperty('calculationModifier', 0.3);
    expect((updated as any).isPassiveInvestment).toBe(true);
  });

  it('rejects passive investment on ineligible category', async () => {
    const existing = {
      id: 'a2',
      userId: 'u1',
      category: 'property',
      name: 'House',
      value: 10000,
      currency: 'USD',
      acquisitionDate: new Date(),
      metadata: null,
      notes: null,
      calculationModifier: 1.0,
      isPassiveInvestment: false,
      isRestrictedAccount: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    jest.spyOn(prisma.asset, 'findFirst').mockResolvedValue(existing);

    const svc = new AssetService();
    await expect(svc.updateAsset('u1', 'a2', { category: 'PROPERTY', isPassiveInvestment: true } as any)).rejects.toThrow('Passive investment flag can only be set');
  });
});
