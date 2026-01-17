import { vi, type Mock } from 'vitest';
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

import { AssetService } from '../AssetService';
import { prisma } from '../../utils/prisma';

describe('AssetService category normalization', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('accepts PRIMARY_RESIDENCE and maps to property', async () => {
    const mockCreate = vi.spyOn(prisma.asset, 'create').mockResolvedValue({
      id: 'test-id',
      userId: 'u1',
      category: 'property',
      name: 'Test',
      value: 100,
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
    } as any);

    const svc = new AssetService();
    await expect(svc.createAsset('user-1', {
      category: 'PRIMARY_RESIDENCE',
      name: 'My House',
      value: 100000,
      currency: 'USD',
      acquisitionDate: new Date()
    } as any)).resolves.toHaveProperty('id', 'test-id');

    expect(mockCreate).toHaveBeenCalled();
    const createArg = (mockCreate as Mock).mock.calls[0][0];
    expect(createArg.data.category).toBe('property');
  });

  it('accepts BUSINESS_INVENTORY and maps to business', async () => {
    const mockCreate = vi.spyOn(prisma.asset, 'create').mockResolvedValue({
      id: 'test-id-2',
      userId: 'u1',
      category: 'business',
      name: 'Test2',
      value: 500,
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
    } as any);

    const svc = new AssetService();
    await expect(svc.createAsset('user-1', {
      category: 'BUSINESS_INVENTORY',
      name: 'Inventory',
      value: 5000,
      currency: 'USD',
      acquisitionDate: new Date()
    } as any)).resolves.toHaveProperty('id', 'test-id-2');

    const createArg = (mockCreate as Mock).mock.calls[0][0];
    expect(createArg.data.category).toBe('business');
  });
});
