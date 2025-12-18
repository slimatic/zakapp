/**
 * Unit Tests for WealthAggregationService (T023)
 * 
 * Tests wealth calculation across asset categories:
 * - Total zakatable wealth aggregation
 * - Category-wise breakdown
 * - Performance optimization (target: <100ms for 500 assets)
 * - Period-based wealth calculations
 * - Liability deductions
 */

import { WealthAggregationService } from '../../src/services/wealthAggregationService';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../src/services/EncryptionService';

// Mock Prisma and dependencies
jest.mock('@prisma/client');
jest.mock('../../src/services/EncryptionService');
jest.mock('../../src/utils/logger');

describe('WealthAggregationService', () => {
  let service: WealthAggregationService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;

  const userId = 'user_123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Prisma instance
    mockPrisma = {
      asset: {
        findMany: jest.fn(),
      },
      liability: {
        findMany: jest.fn(),
      },
    } as any;

    mockEncryptionService = new EncryptionService() as jest.Mocked<EncryptionService>;

    service = new WealthAggregationService(mockPrisma, mockEncryptionService);
  });

  describe('calculateTotalZakatableWealth', () => {
    it('should calculate total zakatable wealth across all categories', async () => {
      // Arrange: Mock asset data
      const mockAssets = [
        { id: '1', category: 'cash', value: 1000.0, isActive: true },
        { id: '2', category: 'gold', value: 2500.0, isActive: true },
        { id: '3', category: 'crypto', value: 3000.0, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);

      // Act
      const result = await service.calculateTotalZakatableWealth(userId);

      // Assert
      expect(result.totalZakatableWealth).toBe(6500.0);
      expect(result.breakdown.cash).toBe(1000.0);
      expect(result.breakdown.gold).toBe(2500.0);
      expect(result.breakdown.crypto).toBe(3000.0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should query only active assets for user', async () => {
      // Arrange
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue([]);

      // Act
      await service.calculateTotalZakatableWealth(userId);

      // Assert
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          category: true,
          value: true,
          calculationModifier: true,
        },
      });
    });

    it('should apply calculationModifier when present', async () => {
      // Arrange: One passive asset with 30% modifier
      const mockAssets = [
        { id: '1', category: 'investments', value: 6000.0, calculationModifier: 0.3, isActive: true },
        { id: '2', category: 'cash', value: 2100.0, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets as any);

      // Act
      const result = await service.calculateTotalZakatableWealth(userId);

      // Assert: zakatable = 2100 + (6000 * 0.3) = 3900
      expect(result.totalZakatableWealth).toBeCloseTo(3900.0);
      // Gross total must still be available
      expect(result.totalWealth).toBe(8100.0);
    });

    it('should handle empty asset list', async () => {
      // Arrange
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.calculateTotalZakatableWealth(userId);

      // Assert
      expect(result.totalZakatableWealth).toBe(0);
      expect(result.categories).toEqual([]);
    });

    it('should group assets by category with counts', async () => {
      // Arrange
      const mockAssets = [
        { id: '1', category: 'cash', value: 1000.0, isActive: true },
        { id: '2', category: 'cash', value: 500.0, isActive: true },
        { id: '3', category: 'gold', value: 2500.0, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);

      // Act
      const result = await service.calculateTotalZakatableWealth(userId);

      // Assert
      const cashCategory = result.categories.find(c => c.category === 'cash');
      const goldCategory = result.categories.find(c => c.category === 'gold');
      
      expect(cashCategory?.value).toBe(1500.0);
      expect(cashCategory?.count).toBe(2);
      expect(goldCategory?.value).toBe(2500.0);
      expect(goldCategory?.count).toBe(1);
    });

    it('should calculate breakdown for all zakatable categories', async () => {
      // Arrange: One asset per category
      const mockAssets = [
        { id: '1', category: 'cash', value: 100, isActive: true },
        { id: '2', category: 'gold', value: 200, isActive: true },
        { id: '3', category: 'silver', value: 300, isActive: true },
        { id: '4', category: 'business', value: 400, isActive: true },
        { id: '5', category: 'crypto', value: 500, isActive: true },
        { id: '6', category: 'investments', value: 600, isActive: true },
        { id: '7', category: 'receivables', value: 700, isActive: true },
        { id: '8', category: 'other', value: 800, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);

      // Act
      const result = await service.calculateTotalZakatableWealth(userId);

      // Assert
      expect(result.breakdown.cash).toBe(100);
      expect(result.breakdown.gold).toBe(200);
      expect(result.breakdown.silver).toBe(300);
      expect(result.breakdown.business).toBe(400);
      expect(result.breakdown.crypto).toBe(500);
      expect(result.breakdown.investments).toBe(600);
      expect(result.breakdown.receivables).toBe(700);
      expect(result.breakdown.other).toBe(800);
      expect(result.totalZakatableWealth).toBe(3600);
    });

    it('should complete calculation within performance target (<100ms)', async () => {
      // Arrange: Generate 500 assets
      const mockAssets = Array.from({ length: 500 }, (_, i) => ({
        id: `asset_${i}`,
        category: i % 2 === 0 ? 'cash' : 'gold',
        value: 100.0,
        isActive: true,
      }));
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);

      // Act
      const startTime = Date.now();
      await service.calculateTotalZakatableWealth(userId);
      const duration = Date.now() - startTime;

      // Assert: Should be well under 100ms for in-memory calculation
      expect(duration).toBeLessThan(100);
    });

    it('should throw descriptive error on calculation failure', async () => {
      // Arrange
      mockPrisma.asset.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.calculateTotalZakatableWealth(userId))
        .rejects
        .toThrow('Wealth calculation failed: Database error');
    });

    it('should handle large asset values correctly', async () => {
      // Arrange: Very large wealth amounts
      const mockAssets = [
        { id: '1', category: 'investments', value: 999999999.99, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);

      // Act
      const result = await service.calculateTotalZakatableWealth(userId);

      // Assert
      expect(result.totalZakatableWealth).toBe(999999999.99);
    });
  });

  describe('calculatePeriodWealth', () => {
    it('should calculate wealth for specific date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockAssets = [
        { id: '1', category: 'cash', value: 1000.0, isActive: true, createdAt: new Date('2024-06-15') },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);

      // Act
      const result = await service.calculatePeriodWealth(userId, startDate, endDate);

      // Assert
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      expect(result.totalZakatableWealth).toBe(1000.0);
    });

    it('should return breakdown and categories for period', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockAssets = [
        { id: '1', category: 'cash', value: 500, isActive: true, createdAt: new Date('2024-03-01') },
        { id: '2', category: 'gold', value: 1500, isActive: true, createdAt: new Date('2024-06-01') },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);

      // Act
      const result = await service.calculatePeriodWealth(userId, startDate, endDate);

      // Assert
      expect(result.breakdown.cash).toBe(500);
      expect(result.breakdown.gold).toBe(1500);
      expect(result.categories.length).toBe(2);
    });

    it('should handle empty period', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.calculatePeriodWealth(userId, startDate, endDate);

      // Assert
      expect(result.totalZakatableWealth).toBe(0);
    });

    it('should propagate database errors', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockPrisma.asset.findMany = jest.fn().mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(
        service.calculatePeriodWealth(userId, startDate, endDate)
      ).rejects.toThrow('Connection failed');
    });
  });

  describe('calculateZakat', () => {
    it('should calculate 2.5% Zakat correctly', () => {
      // Arrange
      const zakatableWealth = 10000.0;

      // Act
      const result = service.calculateZakat(zakatableWealth);

      // Assert
      expect(result).toBe(250.0); // 2.5% of 10,000
    });

    it('should round to 2 decimal places', () => {
      // Arrange
      const zakatableWealth = 12345.67;

      // Act
      const result = service.calculateZakat(zakatableWealth);

      // Assert
      expect(result).toBe(308.64); // 2.5% of 12345.67
      expect(Number.isInteger(result * 100)).toBe(true);
    });

    it('should handle zero wealth', () => {
      // Act
      const result = service.calculateZakat(0);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle small amounts', () => {
      // Arrange
      const zakatableWealth = 100.0;

      // Act
      const result = service.calculateZakat(zakatableWealth);

      // Assert
      expect(result).toBe(2.50);
    });
  });

  describe('isAboveNisab', () => {
    it('should return true when wealth exceeds Nisab', async () => {
      // Arrange
      const mockAssets = [
        { id: '1', category: 'cash', value: 6000.0, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);
      const nisabThreshold = 5686.2;

      // Act
      const result = await service.isAboveNisab(userId, nisabThreshold);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when wealth equals Nisab', async () => {
      // Arrange
      const mockAssets = [
        { id: '1', category: 'cash', value: 5686.2, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);
      const nisabThreshold = 5686.2;

      // Act
      const result = await service.isAboveNisab(userId, nisabThreshold);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when wealth below Nisab', async () => {
      // Arrange
      const mockAssets = [
        { id: '1', category: 'cash', value: 5000.0, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);
      const nisabThreshold = 5686.2;

      // Act
      const result = await service.isAboveNisab(userId, nisabThreshold);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for zero wealth', async () => {
      // Arrange
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue([]);
      const nisabThreshold = 5686.2;

      // Act
      const result = await service.isAboveNisab(userId, nisabThreshold);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getWealthByCategory', () => {
    it('should sum wealth for specific category', async () => {
      // Arrange
      const mockAssets = [
        { id: '1', category: 'gold', value: 1000, isActive: true },
        { id: '2', category: 'gold', value: 1500, isActive: true },
        { id: '3', category: 'gold', value: 2000, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);

      // Act
      const result = await service.getWealthByCategory(userId, 'gold');

      // Assert
      expect(result).toBe(4500);
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          category: 'gold',
          isActive: true,
        },
      });
    });

    it('should return zero for category with no assets', async () => {
      // Arrange
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.getWealthByCategory(userId, 'silver');

      // Assert
      expect(result).toBe(0);
    });

    it('should query only active assets', async () => {
      // Arrange
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue([]);

      // Act
      await service.getWealthByCategory(userId, 'crypto');

      // Assert
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          category: 'crypto',
          isActive: true,
        },
      });
    });
  });

  describe('calculateTotalLiabilities', () => {
    it('should sum all active liabilities', async () => {
      // Arrange
      const mockLiabilities = [
        { id: '1', amount: 1000, isActive: true },
        { id: '2', amount: 500, isActive: true },
        { id: '3', amount: 250, isActive: true },
      ];
      mockPrisma.liability.findMany = jest.fn().mockResolvedValue(mockLiabilities);

      // Act
      const result = await service.calculateTotalLiabilities(userId);

      // Assert
      expect(result).toBe(1750);
    });

    it('should query only active liabilities for user', async () => {
      // Arrange
      mockPrisma.liability.findMany = jest.fn().mockResolvedValue([]);

      // Act
      await service.calculateTotalLiabilities(userId);

      // Assert
      expect(mockPrisma.liability.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
      });
    });

    it('should return zero when no liabilities', async () => {
      // Arrange
      mockPrisma.liability.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.calculateTotalLiabilities(userId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle large liability amounts', async () => {
      // Arrange
      const mockLiabilities = [
        { id: '1', amount: 999999.99, isActive: true },
      ];
      mockPrisma.liability.findMany = jest.fn().mockResolvedValue(mockLiabilities);

      // Act
      const result = await service.calculateTotalLiabilities(userId);

      // Assert
      expect(result).toBe(999999.99);
    });
  });

  describe('calculateNetZakatableWealth', () => {
    it('should deduct liabilities from gross wealth', async () => {
      // Arrange
      const mockAssets = [
        { id: '1', category: 'cash', value: 10000, isActive: true },
      ];
      const mockLiabilities = [
        { id: '1', amount: 2000, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);
      mockPrisma.liability.findMany = jest.fn().mockResolvedValue(mockLiabilities);

      // Act
      const result = await service.calculateNetZakatableWealth(userId);

      // Assert
      expect(result).toBe(8000); // 10,000 - 2,000
    });

    it('should return gross wealth when no liabilities', async () => {
      // Arrange
      const mockAssets = [
        { id: '1', category: 'cash', value: 10000, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);
      mockPrisma.liability.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.calculateNetZakatableWealth(userId);

      // Assert
      expect(result).toBe(10000);
    });

    it('should handle negative net wealth (liabilities exceed assets)', async () => {
      // Arrange
      const mockAssets = [
        { id: '1', category: 'cash', value: 1000, isActive: true },
      ];
      const mockLiabilities = [
        { id: '1', amount: 5000, isActive: true },
      ];
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);
      mockPrisma.liability.findMany = jest.fn().mockResolvedValue(mockLiabilities);

      // Act
      const result = await service.calculateNetZakatableWealth(userId);

      // Assert
      expect(result).toBe(-4000);
    });

    it('should return zero when both assets and liabilities are zero', async () => {
      // Arrange
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.liability.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.calculateNetZakatableWealth(userId);

      // Assert
      expect(result).toBe(0);
    });
  });
});
