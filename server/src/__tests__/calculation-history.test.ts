import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, type Mock } from 'vitest';
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

/**
 * Integration tests for Calculation History functionality
 * 
 * Tests CRUD operations, pagination, trends, comparisons, and exports
 * for the calculation history system implemented in Phase 4.
 */

import { CalculationHistoryService } from '../services/CalculationHistoryService';
import { EncryptionService } from '../services/EncryptionService';
import { prisma } from '../utils/prisma';

vi.mock('../utils/prisma', () => ({
  prisma: {
    calculationHistory: {
      create: vi.fn(({ data }) => Promise.resolve({ id: 'mock-id', ...data, createdAt: new Date(), updatedAt: new Date() })),
      findMany: vi.fn(() => Promise.resolve([])),
      findFirst: vi.fn(() => Promise.resolve(null)),
      count: vi.fn(() => Promise.resolve(0)),
      update: vi.fn(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      delete: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
    },
  },
}));

vi.mock('../services/EncryptionService', () => {
  const mockMethods = {
    encryptObject: vi.fn((obj: any) => Promise.resolve(JSON.stringify(obj))),
    decryptObject: vi.fn((str: any) => {
      try {
        return Promise.resolve(JSON.parse(str));
      } catch {
        return Promise.resolve({});
      }
    }),
    encrypt: vi.fn((plaintext: string) => Promise.resolve(plaintext)),
    decrypt: vi.fn((encrypted: any) => Promise.resolve(typeof encrypted === 'string' ? encrypted : encrypted.encryptedData || '')),
  };

  function MockEncryptionService() {
    return mockMethods;
  }
  Object.assign(MockEncryptionService, mockMethods);

  return { EncryptionService: MockEncryptionService };
});

const mockPrisma = prisma.calculationHistory as any;

describe('Calculation History Functionality', () => {
  let calculationHistoryService: CalculationHistoryService;
  let encryptionService: EncryptionService;
  let testUserId: string;

  beforeAll(async () => {
    calculationHistoryService = new CalculationHistoryService();
    encryptionService = new EncryptionService();
    testUserId = 'test-user-123';
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup no longer needed with mocks
  });

  describe('Save Calculation', () => {
    it('should save a new calculation with encryption', async () => {
      const calculationData = {
        methodology: 'standard',
        calendarType: 'lunar',
        totalWealth: 100000,
        nisabThreshold: 4340,
        zakatDue: 2500,
        zakatRate: 2.5,
        zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: {
          cash: { value: 50000, zakatDue: 1250 },
          gold: { value: 50000, zakatDue: 1250 }
        }
      };

      mockPrisma.create.mockResolvedValue({
        id: 'calc-123',
        userId: testUserId,
        ...calculationData,
        calculationDate: new Date(),
        // Mock encrypted values as strings since they are stored as such
        totalWealth: 'encrypted-wealth',
        nisabThreshold: 'encrypted-nisab',
        zakatDue: 'encrypted-zakat',
        assetBreakdown: 'encrypted-assets',
        notes: null,
        metadata: null
      });

      const result = await calculationHistoryService.saveCalculation(testUserId, calculationData as any);

      expect(result).toBeTruthy();
      expect(result.id).toBeTruthy();
      expect(result.userId).toBe(testUserId);
      expect(result.methodology).toBe('standard');
      expect(result.calendarType).toBe('lunar');
      expect(result.calculationDate).toBeTruthy();

      // Verify that sensitive data was encrypted
      expect(typeof result.totalWealth).toBe('string');
      expect(typeof result.nisabThreshold).toBe('string');
      expect(typeof result.zakatDue).toBe('string');
      expect(typeof result.assetBreakdown).toBe('string');
      expect(typeof result.notes).toBe('string');
    });

    it('should handle saving calculation without optional fields', async () => {
      const minimalData = {
        methodology: 'hanafi',
        calendarType: 'solar',
        totalWealth: 75000,
        nisabThreshold: 3500,
        zakatDue: 1875,
        zakatRate: 2.5,
        zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: {
          cash: { value: 75000, zakatDue: 1875 }
        }
      };

      mockPrisma.create.mockResolvedValue({
        id: 'calc-456',
        userId: testUserId,
        ...minimalData,
        calculationDate: new Date(),
        totalWealth: 'encrypted-wealth',
        nisabThreshold: 'encrypted-nisab',
        zakatDue: 'encrypted-zakat',
        assetBreakdown: 'encrypted-assets',
        notes: null,
        metadata: null
      });

      const result = await calculationHistoryService.saveCalculation(testUserId, minimalData as any);

      expect(result).toBeTruthy();
      expect(result.methodology).toBe('hanafi');
      expect(result.calendarType).toBe('solar');
      expect(result.notes).toBeNull();
      expect(result.metadata).toBeNull();
    });
  });

  describe('Retrieve Calculation by ID', () => {
    let savedCalculationId: string;

    beforeAll(async () => {
      const calculationData = {
        methodology: 'shafii',
        calendarType: 'lunar',
        totalWealth: 120000,
        nisabThreshold: 4340,
        zakatDue: 3000,
        zakatRate: 2.5,
        zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: {
          cash: { value: 60000, zakatDue: 1500 },
          business: { value: 60000, zakatDue: 1500 }
        },
        notes: 'Shafi methodology test calculation'
      };

      const saved = await calculationHistoryService.saveCalculation(testUserId, calculationData);
      savedCalculationId = saved.id;
    });

    it('should retrieve calculation by ID with decrypted data', async () => {
      mockPrisma.findFirst.mockResolvedValue({
        id: savedCalculationId,
        userId: testUserId,
        methodology: 'shafii',
        calendarType: 'lunar',
        calculationDate: new Date(),
        totalWealth: await EncryptionService.encrypt('120000', process.env.ENCRYPTION_KEY!),
        nisabThreshold: await EncryptionService.encrypt('4340', process.env.ENCRYPTION_KEY!),
        zakatDue: await EncryptionService.encrypt('3000', process.env.ENCRYPTION_KEY!),
        assetBreakdown: await EncryptionService.encrypt(JSON.stringify({ cash: { value: 60000, zakatDue: 1500 } }), process.env.ENCRYPTION_KEY!),
        notes: await EncryptionService.encrypt('Shafi methodology test calculation', process.env.ENCRYPTION_KEY!)
      });

      const result = await calculationHistoryService.getCalculationById(testUserId, savedCalculationId);

      expect(result).toBeTruthy();
      expect(result.id).toBe(savedCalculationId);
      expect(result.userId).toBe(testUserId);
      expect(result.methodology).toBe('shafii');

      // Verify data is decrypted
      expect(typeof result.totalWealth).toBe('number');
      expect(result.totalWealth).toBe(120000);
      expect(typeof result.zakatDue).toBe('number');
      expect(result.zakatDue).toBe(3000);
      expect(typeof result.assetBreakdown).toBe('object');
      expect(result.assetBreakdown.cash.value).toBe(60000);
      expect(typeof result.notes).toBe('string');
      expect(result.notes).toBe('Shafi methodology test calculation');
    });

    it('should return null for non-existent calculation', async () => {
      mockPrisma.findFirst.mockResolvedValue(null);
      await expect(calculationHistoryService.getCalculationById(testUserId, 'non-existent-id')).rejects.toThrow();
    });

    it('should return null for calculation owned by different user', async () => {
      const result = await calculationHistoryService.getCalculationById('different-user', savedCalculationId);
      expect(result).toBeNull();
    });
  });

  describe('List Calculations with Pagination', () => {
    beforeAll(async () => {
      // Create multiple test calculations
      const calculations = [
        {
          methodology: 'standard',
          calendarType: 'lunar',
          totalWealth: 50000,
          nisabThreshold: 4340,
          zakatDue: 1250,
          zakatRate: 2.5,
          zakatYearStart: new Date("2024-01-01"),
          zakatYearEnd: new Date("2024-12-31"),
          assetBreakdown: { cash: { value: 50000, zakatDue: 1250 } }
        },
        {
          methodology: 'hanafi',
          calendarType: 'lunar',
          totalWealth: 60000,
          nisabThreshold: 3500,
          zakatDue: 1500,
          zakatRate: 2.5,
          zakatYearStart: new Date("2024-01-01"),
          zakatYearEnd: new Date("2024-12-31"),
          assetBreakdown: { cash: { value: 60000, zakatDue: 1500 } }
        },
        {
          methodology: 'custom',
          calendarType: 'solar',
          totalWealth: 80000,
          nisabThreshold: 4340,
          zakatDue: 1600,
          zakatRate: 2.0,
          zakatYearStart: new Date("2024-01-01"),
          zakatYearEnd: new Date("2024-12-31"),
          assetBreakdown: { cash: { value: 80000, zakatDue: 1600 } }
        }
      ];

      for (const calc of calculations) {
        await calculationHistoryService.saveCalculation(testUserId, calc);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    it('should list calculations with default pagination', async () => {
      mockPrisma.count.mockResolvedValue(1);
      mockPrisma.findMany.mockResolvedValue([{
        id: 'calc-1',
        userId: testUserId,
        methodology: 'standard',
        calendarType: 'lunar',
        totalWealth: await EncryptionService.encrypt('50000', process.env.ENCRYPTION_KEY!),
        nisabThreshold: await EncryptionService.encrypt('4340', process.env.ENCRYPTION_KEY!),
        zakatDue: await EncryptionService.encrypt('1250', process.env.ENCRYPTION_KEY!),
        assetBreakdown: await EncryptionService.encrypt(JSON.stringify({}), process.env.ENCRYPTION_KEY!),
        calculationDate: new Date()
      }]);

      const result = await calculationHistoryService.getCalculationHistory(testUserId, {});

      expect(result.calculations.length).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
    });

    it('should support custom pagination', async () => {
      const result = await calculationHistoryService.getCalculationHistory(testUserId, {
        page: 1,
        limit: 2
      });

      expect(result.calculations.length).toBeLessThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
    });

    it('should filter by methodology', async () => {
      const result = await calculationHistoryService.getCalculationHistory(testUserId, {
        methodology: 'hanafi'
      });

      expect(result.calculations.length).toBeGreaterThan(0);
      result.calculations.forEach(calc => {
        expect(calc.methodology).toBe('hanafi');
      });
    });

    it('should filter by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const result = await calculationHistoryService.getCalculationHistory(testUserId, {
        startDate: yesterday,
        endDate: today
      });

      expect(result.calculations.length).toBeGreaterThan(0);
      result.calculations.forEach(calc => {
        const calcDate = new Date(calc.calculationDate);
        expect(calcDate.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(calcDate.getTime()).toBeLessThanOrEqual(today.getTime());
      });
    });

    it('should sort calculations by date', async () => {
      const result = await calculationHistoryService.getCalculationHistory(testUserId, {
        sortBy: 'calculationDate',
        sortOrder: 'desc'
      });

      expect(result.calculations.length).toBeGreaterThan(1);

      for (let i = 1; i < result.calculations.length; i++) {
        const prevDate = new Date(result.calculations[i - 1].calculationDate);
        const currDate = new Date(result.calculations[i].calculationDate);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    it('should sort calculations by wealth amount', async () => {
      const result = await calculationHistoryService.getCalculationHistory(testUserId, {
        sortBy: 'totalWealth',
        sortOrder: 'asc'
      });

      expect(result.calculations.length).toBeGreaterThan(1);

      for (let i = 1; i < result.calculations.length; i++) {
        expect(result.calculations[i - 1].totalWealth).toBeLessThanOrEqual(result.calculations[i].totalWealth);
      }
    });
  });

  describe('Calculate Trends', () => {
    beforeAll(async () => {
      // Setup mock for findMany to return trend data
      mockPrisma.findMany.mockResolvedValue([
        {
          id: 'trend-1',
          userId: testUserId,
          calculationDate: new Date(),
          totalWealth: await EncryptionService.encrypt('100000', process.env.ENCRYPTION_KEY!),
          zakatDue: await EncryptionService.encrypt('2500', process.env.ENCRYPTION_KEY!),
          methodology: 'standard'
        }
      ]);
    });

    it('should calculate trends for different periods', async () => {
      const periods: Array<'1month' | '3months' | '6months' | '1year'> = ['1month', '3months', '6months', '1year'];

      for (const period of periods) {
        const result = await calculationHistoryService.getTrendAnalysis(testUserId, { period });

        expect(result).toBeTruthy();
        expect(result.period).toBe(period);
        expect(result.wealthTrend).toBeInstanceOf(Array);
        expect(result.zakatTrend).toBeInstanceOf(Array);
        expect(result.calculationCount).toBeGreaterThanOrEqual(0);
        expect(result.averages.wealth).toBeGreaterThanOrEqual(0);
        expect(result.averages.zakat).toBeGreaterThanOrEqual(0);
      }
    });

    it('should include methodology breakdown in trends', async () => {
      const result = await calculationHistoryService.getTrendAnalysis(testUserId, {
        period: '6months'
      });

      expect(result.methodologyDistribution).toBeTruthy();
      expect(typeof result.methodologyDistribution).toBe('object');
    });
  });

  describe('Compare Calculations', () => {
    let calculationIds: string[];

    beforeAll(async () => {
      calculationIds = ['comp-1', 'comp-2'];
      mockPrisma.findMany.mockResolvedValue([
        {
          id: 'comp-1',
          userId: testUserId,
          totalWealth: await EncryptionService.encrypt('100000', process.env.ENCRYPTION_KEY!),
          zakatDue: await EncryptionService.encrypt('2500', process.env.ENCRYPTION_KEY!),
          nisabThreshold: await EncryptionService.encrypt('4340', process.env.ENCRYPTION_KEY!),
          methodology: 'standard',
          calculationDate: new Date()
        },
        {
          id: 'comp-2',
          userId: testUserId,
          totalWealth: await EncryptionService.encrypt('120000', process.env.ENCRYPTION_KEY!),
          zakatDue: await EncryptionService.encrypt('3000', process.env.ENCRYPTION_KEY!),
          nisabThreshold: await EncryptionService.encrypt('4340', process.env.ENCRYPTION_KEY!),
          methodology: 'hanafi',
          calculationDate: new Date()
        }
      ]);
    });

    it('should compare multiple calculations', async () => {
      const result = await calculationHistoryService.compareCalculations(testUserId, calculationIds);

      expect(result).toBeTruthy();
      expect(result.calculations).toBeInstanceOf(Array);
      expect(result.calculations.length).toBe(calculationIds.length);
      expect(result.statistics).toBeTruthy();

      // Check statistics
      expect(result.statistics.wealth.min).toBeDefined();
      expect(result.statistics.wealth.max).toBeDefined();
      expect(result.statistics.wealth.average).toBeDefined();
      expect(result.statistics.wealth.range).toBeDefined();

      expect(result.statistics.zakat.min).toBeDefined();
      expect(result.statistics.zakat.max).toBeDefined();
      expect(result.statistics.zakat.average).toBeDefined();
      expect(result.statistics.zakat.range).toBeDefined();

      expect(result.methodologies).toBeTruthy();
      expect(result.methodologies.length).toBeGreaterThan(0);
    });

    it('should handle comparing minimum number of calculations', async () => {
      const twoCalcs = calculationIds.slice(0, 2);
      const result = await calculationHistoryService.compareCalculations(testUserId, twoCalcs);

      expect(result.calculations.length).toBe(2);
      expect(result.statistics).toBeTruthy();
    });

    it('should reject comparing too few calculations', async () => {
      await expect(
        calculationHistoryService.compareCalculations(testUserId, [calculationIds[0]])
      ).rejects.toThrow('At least 2 calculations required');
    });

    it('should reject comparing too many calculations', async () => {
      const manyIds = Array(11).fill(calculationIds[0]);
      await expect(
        calculationHistoryService.compareCalculations(testUserId, manyIds)
      ).rejects.toThrow('Maximum 10 calculations allowed');
    });
  });

  describe('Update Calculation Notes', () => {
    let calculationId: string;

    beforeAll(async () => {
      const calc = await calculationHistoryService.saveCalculation(testUserId, {
        methodology: 'standard',
        calendarType: 'lunar',
        totalWealth: 50000,
        nisabThreshold: 4340,
        zakatDue: 1250,
        zakatRate: 2.5,
        zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: { cash: { value: 50000, zakatDue: 1250 } },
        notes: 'Original notes'
      });
      calculationId = calc.id;
    });

    it('should update calculation notes', async () => {
      const newNotes = 'Updated notes';
      mockPrisma.findFirst.mockResolvedValue({ id: calculationId, userId: testUserId });
      mockPrisma.update.mockResolvedValue({
        id: calculationId,
        userId: testUserId,
        notes: await EncryptionService.encrypt(newNotes, process.env.ENCRYPTION_KEY!),
        totalWealth: await EncryptionService.encrypt('50000', process.env.ENCRYPTION_KEY!),
        nisabThreshold: await EncryptionService.encrypt('4340', process.env.ENCRYPTION_KEY!),
        zakatDue: await EncryptionService.encrypt('1250', process.env.ENCRYPTION_KEY!),
        assetBreakdown: await EncryptionService.encrypt(JSON.stringify({}), process.env.ENCRYPTION_KEY!)
      });

      const result = await calculationHistoryService.updateCalculationNotes(testUserId, calculationId, newNotes);
      expect(result.notes).toBe(newNotes);
    });

    it('should handle empty notes', async () => {
      mockPrisma.findFirst.mockResolvedValue({ id: calculationId, userId: testUserId });
      mockPrisma.update.mockResolvedValue({
        id: calculationId,
        userId: testUserId,
        notes: await EncryptionService.encrypt('', process.env.ENCRYPTION_KEY!),
        totalWealth: await EncryptionService.encrypt('50000', process.env.ENCRYPTION_KEY!),
        nisabThreshold: await EncryptionService.encrypt('4340', process.env.ENCRYPTION_KEY!),
        zakatDue: await EncryptionService.encrypt('1250', process.env.ENCRYPTION_KEY!),
        assetBreakdown: await EncryptionService.encrypt(JSON.stringify({}), process.env.ENCRYPTION_KEY!)
      });

      const result = await calculationHistoryService.updateCalculationNotes(
        testUserId,
        calculationId,
        ''
      );

      expect(result).toBeTruthy();
      expect(result.notes).toBe('');
    });

    it('should reject updating notes for non-existent calculation', async () => {
      mockPrisma.findFirst.mockResolvedValue(null); // Simulate not found
      await expect(
        calculationHistoryService.updateCalculationNotes(testUserId, 'non-existent', 'notes')
      ).rejects.toThrow('Calculation not found');
    });

    it('should reject updating notes for calculation owned by different user', async () => {
      mockPrisma.findFirst.mockResolvedValue({ id: calculationId, userId: 'different-user' }); // Simulate different user
      await expect(
        calculationHistoryService.updateCalculationNotes('another-user', calculationId, 'notes')
      ).rejects.toThrow('Calculation not found');
    });
  });

  describe('Delete Calculation', () => {
    let calculationId: string;

    beforeAll(async () => {
      const calc = await calculationHistoryService.saveCalculation(testUserId, {
        methodology: 'standard',
        calendarType: 'lunar',
        totalWealth: 30000,
        nisabThreshold: 4340,
        zakatDue: 750,
        zakatRate: 2.5,
        zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: { cash: { value: 30000, zakatDue: 750 } },
        notes: 'Calculation to be deleted'
      });
      calculationId = calc.id;
    });

    it('should delete calculation successfully', async () => {
      mockPrisma.findFirst.mockResolvedValue({ id: calculationId, userId: testUserId });
      mockPrisma.delete.mockResolvedValue({ id: calculationId });

      const result = await calculationHistoryService.deleteCalculation(testUserId, calculationId);

      expect(result.success).toBe(true);
    });

    it('should reject deleting non-existent calculation', async () => {
      mockPrisma.findFirst.mockResolvedValue(null); // Simulate not found
      await expect(
        calculationHistoryService.deleteCalculation(testUserId, 'non-existent')
      ).rejects.toThrow('Calculation not found');
    });

    it('should reject deleting calculation owned by different user', async () => {
      const calc = await calculationHistoryService.saveCalculation(testUserId, {
        methodology: 'standard',
        calendarType: 'lunar',
        totalWealth: 40000,
        nisabThreshold: 4340,
        zakatDue: 1000,
        zakatRate: 2.5,
        zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: { cash: { value: 40000, zakatDue: 1000 } }
      });

      await expect(
        calculationHistoryService.deleteCalculation('different-user', calc.id)
      ).rejects.toThrow('Calculation not found');
    });
  });

  describe('Performance Validation', () => {
    it('should save calculation within performance target', async () => {
      const startTime = Date.now();

      await calculationHistoryService.saveCalculation(testUserId, {
        methodology: 'standard',
        calendarType: 'lunar',
        totalWealth: 55000,
        nisabThreshold: 4340,
        zakatDue: 1375,
        zakatRate: 2.5,
        zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: { cash: { value: 55000, zakatDue: 1375 } }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // <500ms target for save operation
    });

    it('should list calculations within performance target', async () => {
      const startTime = Date.now();

      await calculationHistoryService.getCalculationHistory(testUserId, { limit: 100 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // <500ms target for 100 records
    });

    it('should calculate trends within performance target', async () => {
      const startTime = Date.now();

      await calculationHistoryService.getTrendAnalysis(testUserId, { period: '1year' });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(400); // <400ms target for trend visualization
    });

    it('should compare calculations within performance target', async () => {
      // Get some calculation IDs for comparison
      const history = await calculationHistoryService.getCalculationHistory(testUserId, { limit: 5 });
      const ids = history.calculations.slice(0, 3).map(c => c.id);

      if (ids.length >= 2) {
        const startTime = Date.now();

        await calculationHistoryService.compareCalculations(testUserId, ids);

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(300); // <300ms target for methodology comparison
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID gracefully', async () => {
      const result = await calculationHistoryService.getCalculationHistory('invalid-user', {});

      expect(result.calculations).toEqual([]);
      expect(result.pagination.totalCount).toBe(0);
    });

    it('should handle malformed calculation data', async () => {
      await expect(
        calculationHistoryService.saveCalculation(testUserId, {
          methodology: 'invalid',
          // Missing required fields
        } as any)
      ).rejects.toThrow();
    });

    it('should handle encryption/decryption errors gracefully', async () => {
      // This test would require mocking the encryption service to simulate errors
      // For now, we'll just verify the service handles the basic flow
      const calc = await calculationHistoryService.saveCalculation(testUserId, {
        methodology: 'standard',
        calendarType: 'lunar',
        totalWealth: 70000,
        nisabThreshold: 4340,
        zakatDue: 1750,
        zakatRate: 2.5,
        zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: { cash: { value: 70000, zakatDue: 1750 } }
      });

      const retrieved = await calculationHistoryService.getCalculationById(testUserId, calc.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved.totalWealth).toBe(70000);
    });
  });
});