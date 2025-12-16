import { AssetService } from '../AssetService';
import { prisma } from '../../utils/prisma';

describe('AssetService category normalization', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('accepts PRIMARY_RESIDENCE and maps to property', async () => {
    const mockCreate = jest.spyOn(prisma.asset, 'create').mockResolvedValue({
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
    const createArg = (mockCreate as jest.Mock).mock.calls[0][0];
    expect(createArg.data.category).toBe('property');
  });

  it('accepts BUSINESS_INVENTORY and maps to business', async () => {
    const mockCreate = jest.spyOn(prisma.asset, 'create').mockResolvedValue({
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

    const createArg = (mockCreate as jest.Mock).mock.calls[0][0];
    expect(createArg.data.category).toBe('business');
  });
});
