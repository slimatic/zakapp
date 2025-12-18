import { WealthAggregationService } from '../wealthAggregationService';

describe('WealthAggregationService.getZakatableAssets', () => {
  it('respects encrypted metadata zakatEligible flag and calculates zakatableValue', async () => {
    // Mock prisma client on the service instance
    const fakePrisma: any = {
      asset: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'a1', name: 'Cash', category: 'cash', value: 600, calculationModifier: 1.0, createdAt: new Date(), metadata: null },
          { id: 'a2', name: 'Passive', category: 'stocks', value: 6000, calculationModifier: 0.3, createdAt: new Date(), metadata: 'encrypted:passive' },
          { id: 'a3', name: 'Excluded', category: 'cash', value: 100, calculationModifier: 1.0, createdAt: new Date(), metadata: 'encrypted:excluded' }
        ])
      }
    };

    // Mock EncryptionService.decryptObject to return metadata objects
    const mockDecrypt = jest.spyOn(require('../EncryptionService'), 'decryptObject' as any)
      .mockImplementation((str: any) => {
        if (str === 'encrypted:passive') return Promise.resolve({ zakatEligible: true });
        if (str === 'encrypted:excluded') return Promise.resolve({ zakatEligible: false });
        return Promise.resolve({});
      });

    const svc = new WealthAggregationService(fakePrisma as any, undefined as any);
    const result = await svc.getZakatableAssets('user-1');

    expect(result).toBeDefined();
    const excl = result.find(a => a.id === 'a3');
    expect(excl.isZakatable).toBe(false);
    expect((excl as any).zakatableValue).toBe(0);

    const passive = result.find(a => a.id === 'a2');
    expect(passive.isZakatable).toBe(true);
    expect((passive as any).zakatableValue).toBeCloseTo(6000 * 0.3);

    mockDecrypt.mockRestore();
  });
});
