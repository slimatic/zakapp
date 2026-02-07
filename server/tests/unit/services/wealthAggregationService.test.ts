import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WealthAggregationService } from '../../../src/services/wealthAggregationService';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/services/EncryptionService';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    asset: {
      findMany: vi.fn(),
    },
    liability: {
      findMany: vi.fn(),
    },
  })),
}));
vi.mock('../../../src/services/EncryptionService');

describe('WealthAggregationService', () => {
  let service: WealthAggregationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      asset: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      liability: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    service = new WealthAggregationService(mockPrisma as any);

    vi.mocked(EncryptionService.decryptObject).mockResolvedValue({ zakatEligible: true });

    vi.clearAllMocks();
  });

  describe('calculateTotalZakatableWealth', () => {
    it('should sum all active asset values', async () => {
      const userId = 'user1';
      const mockAssets = [
        { id: 'a1', category: 'cash', value: 5000, calculationModifier: 1.0 },
        { id: 'a2', category: 'gold', value: 3000, calculationModifier: 1.0 },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets);

      const result = await service.calculateTotalZakatableWealth(userId);

      expect(result.totalZakatableWealth).toBe(8000);
      expect(result.breakdown.cash).toBe(5000);
      expect(result.breakdown.gold).toBe(3000);
    });

    it('should apply calculation modifiers', async () => {
      const userId = 'user1';
      const mockAssets = [
        { id: 'a1', category: 'investments', value: 10000, calculationModifier: 0.3 }, // Only 30% zakatable
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets);

      const result = await service.calculateTotalZakatableWealth(userId);

      expect(result.totalZakatableWealth).toBe(3000);
    });
  });

  describe('calculateTotalLiabilities', () => {
    it('should sum all active liability amounts', async () => {
      const userId = 'user1';
      const mockLiabilities = [
        { id: 'l1', amount: 1500 },
        { id: 'l2', amount: 500 },
      ];

      mockPrisma.liability.findMany.mockResolvedValue(mockLiabilities);

      const total = await service.calculateTotalLiabilities(userId);

      expect(total).toBe(2000);
    });
  });

  describe('calculateNetZakatableWealth', () => {
    it('should subtract liabilities from total zakatable wealth', async () => {
      const userId = 'user1';

      // Mock assets (10,000 zakatable)
      mockPrisma.asset.findMany.mockResolvedValue([
        { id: 'a1', category: 'cash', value: 10000, calculationModifier: 1.0 }
      ]);

      // Mock liabilities (2,000)
      mockPrisma.liability.findMany.mockResolvedValue([
        { id: 'l1', amount: 2000 }
      ]);

      const netWealth = await service.calculateNetZakatableWealth(userId);

      expect(netWealth).toBe(8000);
    });
  });

  describe('calculatePeriodWealth', () => {
    it('should calculate wealth for specific date range', async () => {
      const userId = 'user1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockAssets = [
        { id: 'a1', category: 'cash', value: 5000, calculationModifier: 1.0, createdAt: new Date('2024-06-01') },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets);

      const result = await service.calculatePeriodWealth(userId, startDate, endDate);

      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: startDate, lte: endDate }
        })
      }));
      expect(result.totalZakatableWealth).toBe(5000);
    });
  });

  describe('getWealthByCategory', () => {
    it('should return sum of assets in category', async () => {
      const userId = 'user1';
      mockPrisma.asset.findMany.mockResolvedValue([
        { value: 1000 },
        { value: 2000 }
      ]);

      const result = await service.getWealthByCategory(userId, 'cash');

      expect(result).toBe(3000);
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ category: 'cash' })
      }));
    });
  });
});
