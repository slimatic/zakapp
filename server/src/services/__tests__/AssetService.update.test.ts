// Mock @zakapp/shared to avoid ESM runtime in Jest
jest.mock('@zakapp/shared', () => ({
  PASSIVE_INVESTMENT_TYPES: ['Stock','ETF','Mutual Fund','Roth IRA'],
  RESTRICTED_ACCOUNT_TYPES: ['401k','Traditional IRA','Pension','Roth IRA'],
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
    jest.spyOn(prisma.asset, 'update').mockImplementation(async ({ where, data }: any) => ({ ...existing, ...data }));

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
