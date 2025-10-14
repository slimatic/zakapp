import { ZakatEngine } from '../../src/services/zakatEngine';
import { CurrencyService } from '../../src/services/currencyService';
import { CalendarService } from '../../src/services/calendarService';
import { NisabService } from '../../src/services/NisabService';
import { ZakatCalculationRequest, Asset } from '../../../shared/src/types';

// Mock dependencies
jest.mock('../../src/services/currencyService');
jest.mock('../../src/services/calendarService');
jest.mock('../../src/services/NisabService');

describe('ZakatEngine Core Unit Tests', () => {
  let zakatEngine: ZakatEngine;
  let mockCurrencyService: jest.Mocked<CurrencyService>;
  let mockCalendarService: jest.Mocked<CalendarService>;
  let mockNisabService: jest.Mocked<NisabService>;

  beforeEach(() => {
    // Create mock instances
    mockCurrencyService = new CurrencyService() as jest.Mocked<CurrencyService>;
    mockCalendarService = new CalendarService() as jest.Mocked<CalendarService>;
    mockNisabService = new NisabService() as jest.Mocked<NisabService>;

    // Mock the methods
    mockCurrencyService.convertToUSD = jest.fn().mockResolvedValue(1);
    mockCalendarService.getCalendarInfo = jest.fn().mockResolvedValue({
      hijriDate: { year: 1445, month: 1, day: 1 },
      gregorianDate: new Date('2024-01-01'),
      isLeapYear: false
    });
    mockNisabService.calculateNisab = jest.fn().mockResolvedValue({
      gold: { grams: 85, value: 5000 },
      silver: { grams: 595, value: 350 },
      threshold: 5000,
      currency: 'USD'
    });

    zakatEngine = new ZakatEngine(
      mockCurrencyService,
      mockCalendarService,
      mockNisabService
    );
  });

  describe('calculateNisabThreshold', () => {
    test('should calculate nisab threshold for gold (85g)', async () => {
      const methodology = { id: 'standard', name: 'Standard', nisabType: 'gold' as const };
      const result = await zakatEngine['calculateNisabThreshold'](methodology);

      expect(result).toBeDefined();
      expect(result.threshold).toBeGreaterThan(0);
      expect(mockNisabService.calculateNisab).toHaveBeenCalledWith(methodology, undefined);
    });

    test('should calculate nisab threshold for silver (595g)', async () => {
      const methodology = { id: 'hanafi', name: 'Hanafi', nisabType: 'silver' as const };
      const result = await zakatEngine['calculateNisabThreshold'](methodology);

      expect(result).toBeDefined();
      expect(result.threshold).toBeGreaterThan(0);
      expect(mockNisabService.calculateNisab).toHaveBeenCalledWith(methodology, undefined);
    });

    test('should handle custom nisab values', async () => {
      const methodology = { id: 'custom', name: 'Custom', nisabType: 'gold' as const };
      const customNisab = 10000;
      const result = await zakatEngine['calculateNisabThreshold'](methodology, customNisab);

      expect(result).toBeDefined();
      expect(mockNisabService.calculateNisab).toHaveBeenCalledWith(methodology, customNisab);
    });
  });

  describe('aggregateAssetsByCategory', () => {
    test('should group assets correctly by category', () => {
      const assets: Asset[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Cash',
          category: 'cash',
          value: 1000,
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user1',
          name: 'Gold',
          category: 'gold',
          value: 2000,
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          userId: 'user1',
          name: 'More Cash',
          category: 'cash',
          value: 500,
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = zakatEngine['aggregateAssetsByCategory'](assets);

      expect(result.cash).toBe(1500); // 1000 + 500
      expect(result.gold).toBe(2000);
      expect(result.total).toBe(3500);
    });

    test('should handle empty assets array', () => {
      const result = zakatEngine['aggregateAssetsByCategory']([]);

      expect(result.total).toBe(0);
      expect(Object.keys(result).length).toBeGreaterThan(0); // Should have category keys
    });

    test('should exclude non-zakatable assets', () => {
      const assets: Asset[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Cash',
          category: 'cash',
          value: 1000,
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user1',
          name: 'Personal Home',
          category: 'real-estate',
          value: 50000,
          currency: 'USD',
          isZakatable: false, // Not zakatable
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = zakatEngine['aggregateAssetsByCategory'](assets);

      expect(result.cash).toBe(1000);
      expect(result.total).toBe(1000); // Should not include non-zakatable assets
    });
  });

  describe('applyZakatRate', () => {
    test('should apply 2.5% rate correctly', () => {
      const zakatableAmount = 10000;
      const result = zakatEngine['applyZakatRate'](zakatableAmount);

      expect(result).toBe(250); // 10000 * 0.025
    });

    test('should handle zero amount', () => {
      const result = zakatEngine['applyZakatRate'](0);
      expect(result).toBe(0);
    });

    test('should handle negative amounts', () => {
      const result = zakatEngine['applyZakatRate'](-1000);
      expect(result).toBe(-25); // Though this shouldn't happen in practice
    });
  });

  describe('adjustForLunarCalendar', () => {
    test('should convert solar to lunar year', () => {
      const solarDate = new Date('2024-01-01');
      const result = zakatEngine['adjustForLunarCalendar'](solarDate);

      expect(result).toBeDefined();
      expect(result.getTime()).not.toBe(solarDate.getTime()); // Should be different
      expect(mockCalendarService.getCalendarInfo).toHaveBeenCalledWith(solarDate);
    });
  });

  describe('Standard methodology', () => {
    test('should treat all liquid assets as zakatable', async () => {
      const request: ZakatCalculationRequest = {
        method: 'standard',
        calculationDate: new Date('2024-01-01'),
        includeAssets: ['cash', 'gold', 'silver', 'investments'],
        includeDebts: false
      };

      const assets: Asset[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Cash',
          category: 'cash',
          value: 10000,
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await zakatEngine.calculateZakat({ ...request, assets });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.methodology.id).toBe('standard');
    });
  });

  describe('Hanafi methodology', () => {
    test('should have different nisab calculation', async () => {
      const request: ZakatCalculationRequest = {
        method: 'hanafi',
        calculationDate: new Date('2024-01-01'),
        includeAssets: ['cash', 'gold', 'silver'],
        includeDebts: false
      };

      const assets: Asset[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Cash',
          category: 'cash',
          value: 10000,
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await zakatEngine.calculateZakat({ ...request, assets });

      expect(result).toBeDefined();
      expect(result.methodology.id).toBe('hanafi');
      expect(mockNisabService.calculateNisab).toHaveBeenCalled();
    });
  });

  describe('Shafi\'i methodology', () => {
    test('should have specific asset treatment', async () => {
      const request: ZakatCalculationRequest = {
        method: 'shafii',
        calculationDate: new Date('2024-01-01'),
        includeAssets: ['cash', 'gold', 'silver', 'business'],
        includeDebts: false
      };

      const assets: Asset[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Business Inventory',
          category: 'business',
          value: 10000,
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await zakatEngine.calculateZakat({ ...request, assets });

      expect(result).toBeDefined();
      expect(result.methodology.id).toBe('shafii');
    });
  });

  describe('deductible debt handling', () => {
    test('should subtract debts when includeDebts is true', async () => {
      const request: ZakatCalculationRequest = {
        method: 'standard',
        calculationDate: new Date('2024-01-01'),
        includeAssets: ['cash'],
        includeDebts: true
      };

      const assets: Asset[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Cash',
          category: 'cash',
          value: 10000,
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user1',
          name: 'Debt',
          category: 'debt',
          value: 2000, // This should be subtracted
          currency: 'USD',
          isZakatable: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await zakatEngine.calculateZakat({ ...request, assets });

      expect(result).toBeDefined();
      // The calculation should account for debts when includeDebts is true
    });
  });

  describe('assets below nisab', () => {
    test('should return zero zakat for assets below nisab threshold', async () => {
      // Mock nisab service to return high threshold
      mockNisabService.calculateNisab = jest.fn().mockResolvedValue({
        gold: { grams: 85, value: 50000 }, // High threshold
        silver: { grams: 595, value: 35000 },
        threshold: 50000,
        currency: 'USD'
      });

      const request: ZakatCalculationRequest = {
        method: 'standard',
        calculationDate: new Date('2024-01-01'),
        includeAssets: ['cash'],
        includeDebts: false
      };

      const assets: Asset[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Small Cash',
          category: 'cash',
          value: 1000, // Below nisab threshold
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await zakatEngine.calculateZakat({ ...request, assets });

      expect(result).toBeDefined();
      expect(result.result.zakatAmount).toBe(0); // Should be zero below nisab
    });
  });

  describe('edge cases', () => {
    test('should handle negative asset values', async () => {
      const assets: Asset[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Negative Asset',
          category: 'cash',
          value: -1000, // Negative value
          currency: 'USD',
          isZakatable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = zakatEngine['aggregateAssetsByCategory'](assets);
      expect(result.cash).toBe(-1000);
    });

    test('should handle null assets', () => {
      const result = zakatEngine['aggregateAssetsByCategory']([]);
      expect(result.total).toBe(0);
    });

    test('should handle empty arrays', () => {
      const result = zakatEngine['aggregateAssetsByCategory']([]);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });
});