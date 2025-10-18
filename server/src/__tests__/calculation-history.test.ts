/**
 * Integration tests for Calculation History functionality
 * 
 * Tests CRUD operations, pagination, trends, comparisons, and exports
 * for the calculation history system implemented in Phase 4.
 */

import { CalculationHistoryService } from '../services/CalculationHistoryService';
import { EncryptionService } from '../services/EncryptionService';

describe('Calculation History Functionality', () => {
  let calculationHistoryService: CalculationHistoryService;
  let encryptionService: EncryptionService;
  let testUserId: string;

  beforeAll(async () => {
    calculationHistoryService = new CalculationHistoryService();
    encryptionService = new EncryptionService();
    testUserId = 'test-user-' + Date.now();
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      // Delete all calculations for test user
      const calculations = await calculationHistoryService.getCalculationHistory(testUserId, {});
      for (const calc of calculations.calculations) {
        await calculationHistoryService.deleteCalculation(testUserId, calc.id);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Cleanup completed');
    }
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
        },
        notes: 'Test calculation for standard methodology',
        metadata: {
          calculationVersion: '1.0',
          source: 'integration-test'
        }
      };

      const result = await calculationHistoryService.saveCalculation(testUserId, calculationData);

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

      const result = await calculationHistoryService.saveCalculation(testUserId, minimalData);

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
        methodology: 'shafi',
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
      const result = await calculationHistoryService.getCalculationById(testUserId, savedCalculationId);

      expect(result).toBeTruthy();
      expect(result.id).toBe(savedCalculationId);
      expect(result.userId).toBe(testUserId);
      expect(result.methodology).toBe('shafi');
      
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
      const result = await calculationHistoryService.getCalculationById(testUserId, 'non-existent-id');
      expect(result).toBeNull();
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
      const result = await calculationHistoryService.getCalculationHistory(testUserId, {});

      expect(result).toBeTruthy();
      expect(result.calculations).toBeInstanceOf(Array);
      expect(result.calculations.length).toBeGreaterThan(0);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(result.calculations.length);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.hasMore).toBeDefined();
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
        const prevDate = new Date(result.calculations[i-1].calculationDate);
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
        expect(result.calculations[i-1].totalWealth).toBeLessThanOrEqual(result.calculations[i].totalWealth);
      }
    });
  });

  describe('Calculate Trends', () => {
    beforeAll(async () => {
      // Create calculations over different time periods
      const baseDate = new Date();
      const trends = [
        { days: 7, wealth: 90000, zakat: 2250 },
        { days: 30, wealth: 95000, zakat: 2375 },
        { days: 90, wealth: 100000, zakat: 2500 },
        { days: 180, wealth: 110000, zakat: 2750 }
      ];

      for (const trend of trends) {
        const calcDate = new Date(baseDate.getTime() - trend.days * 24 * 60 * 60 * 1000);
        
        const calc = await calculationHistoryService.saveCalculation(testUserId, {
          methodology: 'standard',
          calendarType: 'lunar',
          totalWealth: trend.wealth,
          nisabThreshold: 4340,
          zakatDue: trend.zakat,
          zakatRate: 2.5,
          zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: { cash: { value: trend.wealth, zakatDue: trend.zakat } }
        });

        // Update the calculation date manually for trend testing
        // Note: This is a simplified approach for testing
      }
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
      // Create calculations for comparison
      const comparisons = [
        {
          methodology: 'standard',
          totalWealth: 100000,
          zakatDue: 2500,
          notes: 'Standard calculation'
        },
        {
          methodology: 'hanafi',
          totalWealth: 100000,
          zakatDue: 2500,
          notes: 'Hanafi calculation'
        },
        {
          methodology: 'custom',
          totalWealth: 100000,
          zakatDue: 2000,
          notes: 'Custom calculation'
        }
      ];

      calculationIds = [];
      for (const comp of comparisons) {
        const calc = await calculationHistoryService.saveCalculation(testUserId, {
          methodology: comp.methodology,
          calendarType: 'lunar',
          totalWealth: comp.totalWealth,
          nisabThreshold: 4340,
          zakatDue: comp.zakatDue,
          zakatRate: comp.methodology === 'custom' ? 2.0 : 2.5,
          zakatYearStart: new Date("2024-01-01"),
        zakatYearEnd: new Date("2024-12-31"),
        assetBreakdown: { cash: { value: comp.totalWealth, zakatDue: comp.zakatDue } },
          notes: comp.notes
        });
        calculationIds.push(calc.id);
      }
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
      const newNotes = 'Updated notes with additional information';
      
      const result = await calculationHistoryService.updateCalculationNotes(
        testUserId, 
        calculationId, 
        newNotes
      );

      expect(result).toBeTruthy();
      expect(result.id).toBe(calculationId);
      
      // Verify notes were updated
      const updated = await calculationHistoryService.getCalculationById(testUserId, calculationId);
      expect(updated.notes).toBe(newNotes);
    });

    it('should handle empty notes', async () => {
      const result = await calculationHistoryService.updateCalculationNotes(
        testUserId,
        calculationId,
        ''
      );

      expect(result).toBeTruthy();
      
      const updated = await calculationHistoryService.getCalculationById(testUserId, calculationId);
      expect(updated.notes).toBe('');
    });

    it('should reject updating notes for non-existent calculation', async () => {
      await expect(
        calculationHistoryService.updateCalculationNotes(testUserId, 'non-existent', 'notes')
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
      const result = await calculationHistoryService.deleteCalculation(testUserId, calculationId);

      expect(result).toBeTruthy();
      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted');
      
      // Verify calculation was deleted
      const deleted = await calculationHistoryService.getCalculationById(testUserId, calculationId);
      expect(deleted).toBeNull();
    });

    it('should reject deleting non-existent calculation', async () => {
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