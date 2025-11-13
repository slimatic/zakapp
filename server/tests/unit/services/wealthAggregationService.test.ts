/**
 * T023: Unit Tests for WealthAggregationService
 * 
 * Tests aggregate wealth calculation from all zakatable assets,
 * performance benchmarks (<100ms for 200 assets), and encryption handling.
 * 
 * @see specs/008-nisab-year-record/research.md - Performance benchmarks
 * @see specs/008-nisab-year-record/data-model.md - Asset categories
 */

import { WealthAggregationService } from '../../../src/services/wealthAggregationService';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/services/encryptionService';

jest.mock('@prisma/client');
jest.mock('../../../src/services/encryptionService');

describe('WealthAggregationService', () => {
  let service: WealthAggregationService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockEncryption: jest.Mocked<EncryptionService>;

  beforeEach(() => {
    mockPrisma = {
      asset: {
        findMany: jest.fn(),
      },
    } as any;

    mockEncryption = {
      decryptValue: jest.fn((val) => val), // Pass-through for tests
    } as any;

    service = new WealthAggregationService(mockPrisma, mockEncryption);
    jest.clearAllMocks();
  });

  describe('calculateAggregateWealth', () => {
    it('should sum all zakatable asset values', async () => {
      // Arrange
      const userId = 'user1';
      const mockAssets = [
        { id: 'a1', userId, category: 'cash', currentValue: '5000.00', isZakatable: true },
        { id: 'a2', userId, category: 'gold', currentValue: '3000.00', isZakatable: true },
        { id: 'a3', userId, category: 'investment', currentValue: '2500.00', isZakatable: true },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);

      // Act
      const result = await service.calculateAggregateWealth(userId);

      // Assert
      expect(result.totalWealth).toBe(10500); // 5000 + 3000 + 2500
      expect(result.assetCount).toBe(3);
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isZakatable: true,
        },
        select: {
          id: true,
          category: true,
          currentValue: true,
        },
      });
    });

    it('should exclude non-zakatable assets', async () => {
      // Arrange
      const mockAssets = [
        { id: 'a1', category: 'cash', currentValue: '5000.00', isZakatable: true },
        { id: 'a2', category: 'personal_residence', currentValue: '300000.00', isZakatable: false },
        { id: 'a3', category: 'gold', currentValue: '2000.00', isZakatable: true },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets.filter(a => a.isZakatable) as any);

      // Act
      const result = await service.calculateAggregateWealth('user1');

      // Assert
      expect(result.totalWealth).toBe(7000); // Only zakatable assets
      expect(result.assetCount).toBe(2);
    });

    it('should handle encrypted values correctly', async () => {
      // Arrange
      const mockAssets = [
        { id: 'a1', category: 'cash', currentValue: 'encrypted:5000.00', isZakatable: true },
        { id: 'a2', category: 'gold', currentValue: 'encrypted:3500.00', isZakatable: true },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);
      mockEncryption.decryptValue
        .mockReturnValueOnce('5000.00')
        .mockReturnValueOnce('3500.00');

      // Act
      const result = await service.calculateAggregateWealth('user1');

      // Assert
      expect(result.totalWealth).toBe(8500);
      expect(mockEncryption.decryptValue).toHaveBeenCalledTimes(2);
    });

    it('should return zero for user with no zakatable assets', async () => {
      // Arrange
      mockPrisma.asset.findMany.mockResolvedValue([]);

      // Act
      const result = await service.calculateAggregateWealth('user1');

      // Assert
      expect(result.totalWealth).toBe(0);
      expect(result.assetCount).toBe(0);
      expect(result.breakdown).toEqual({});
    });

    it('should provide breakdown by asset category', async () => {
      // Arrange
      const mockAssets = [
        { id: 'a1', category: 'cash', currentValue: '5000.00', isZakatable: true },
        { id: 'a2', category: 'cash', currentValue: '3000.00', isZakatable: true },
        { id: 'a3', category: 'gold', currentValue: '4000.00', isZakatable: true },
        { id: 'a4', category: 'investment', currentValue: '2000.00', isZakatable: true },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);

      // Act
      const result = await service.calculateAggregateWealth('user1');

      // Assert
      expect(result.breakdown).toEqual({
        cash: 8000,     // 5000 + 3000
        gold: 4000,
        investment: 2000,
      });
    });
  });

  describe('calculateLiabilities', () => {
    it('should sum all deductible liabilities', async () => {
      // Arrange
      const userId = 'user1';
      const mockLiabilities = [
        { id: 'l1', userId, type: 'credit_card', amount: '1500.00', isDeductible: true },
        { id: 'l2', userId, type: 'personal_loan', amount: '3000.00', isDeductible: true },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockLiabilities as any);

      // Act
      const result = await service.calculateLiabilities(userId);

      // Assert
      expect(result.totalLiabilities).toBe(4500);
      expect(result.liabilityCount).toBe(2);
    });

    it('should exclude non-deductible liabilities (e.g., mortgages)', async () => {
      // Arrange
      const mockLiabilities = [
        { id: 'l1', type: 'credit_card', amount: '2000.00', isDeductible: true },
        { id: 'l2', type: 'mortgage', amount: '200000.00', isDeductible: false },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockLiabilities.filter(l => l.isDeductible) as any);

      // Act
      const result = await service.calculateLiabilities('user1');

      // Assert
      expect(result.totalLiabilities).toBe(2000); // Only deductible
    });
  });

  describe('calculateNetZakatableWealth', () => {
    it('should subtract liabilities from aggregate wealth', async () => {
      // Arrange
      const userId = 'user1';
      
      // Mock assets
      mockPrisma.asset.findMany.mockResolvedValueOnce([
        { id: 'a1', category: 'cash', currentValue: '10000.00', isZakatable: true },
        { id: 'a2', category: 'gold', currentValue: '5000.00', isZakatable: true },
      ] as any);

      // Mock liabilities
      mockPrisma.asset.findMany.mockResolvedValueOnce([
        { id: 'l1', type: 'credit_card', amount: '2000.00', isDeductible: true },
      ] as any);

      // Act
      const result = await service.calculateNetZakatableWealth(userId);

      // Assert
      expect(result.netWealth).toBe(13000); // 15000 - 2000
      expect(result.totalAssets).toBe(15000);
      expect(result.totalLiabilities).toBe(2000);
    });

    it('should return zero if liabilities exceed assets', async () => {
      // Arrange
      mockPrisma.asset.findMany
        .mockResolvedValueOnce([
          { id: 'a1', category: 'cash', currentValue: '3000.00', isZakatable: true },
        ] as any)
        .mockResolvedValueOnce([
          { id: 'l1', type: 'credit_card', amount: '5000.00', isDeductible: true },
        ] as any);

      // Act
      const result = await service.calculateNetZakatableWealth('user1');

      // Assert
      expect(result.netWealth).toBe(0); // Cannot be negative
      expect(result.totalAssets).toBe(3000);
      expect(result.totalLiabilities).toBe(5000);
    });
  });

  describe('Performance Requirements', () => {
    it('should calculate aggregate wealth for 200 assets in < 100ms', async () => {
      // Arrange
      const mockAssets = Array.from({ length: 200 }, (_, i) => ({
        id: `asset${i}`,
        category: i % 2 === 0 ? 'cash' : 'gold',
        currentValue: '1000.00',
        isZakatable: true,
      }));

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);

      // Act
      const startTime = Date.now();
      await service.calculateAggregateWealth('user1');
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(100); // Performance requirement
    });

    it('should handle 200 assets with encryption in < 100ms', async () => {
      // Arrange
      const mockAssets = Array.from({ length: 200 }, (_, i) => ({
        id: `asset${i}`,
        category: 'cash',
        currentValue: `encrypted:${1000 + i}.00`,
        isZakatable: true,
      }));

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);
      mockEncryption.decryptValue.mockImplementation((val) => val.replace('encrypted:', ''));

      // Act
      const startTime = Date.now();
      await service.calculateAggregateWealth('user1');
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid numeric values gracefully', async () => {
      // Arrange
      const mockAssets = [
        { id: 'a1', category: 'cash', currentValue: 'invalid', isZakatable: true },
        { id: 'a2', category: 'gold', currentValue: '3000.00', isZakatable: true },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);

      // Act
      const result = await service.calculateAggregateWealth('user1');

      // Assert
      expect(result.totalWealth).toBe(3000); // Skip invalid, include valid
      expect(result.errors).toContain('Invalid value for asset a1');
    });

    it('should handle null/undefined values', async () => {
      // Arrange
      const mockAssets = [
        { id: 'a1', category: 'cash', currentValue: null, isZakatable: true },
        { id: 'a2', category: 'gold', currentValue: '2000.00', isZakatable: true },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);

      // Act
      const result = await service.calculateAggregateWealth('user1');

      // Assert
      expect(result.totalWealth).toBe(2000);
    });
  });
});
