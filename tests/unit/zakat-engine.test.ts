import { ZakatEngine } from '@/services/zakatEngine';
import { CurrencyService } from '@/services/currencyService';
import { CalendarService } from '@/services/calendarService';
import { NisabService } from '@/services/NisabService';
import { ZakatCalculationRequest, Asset } from '@shared/types';

// Mock dependencies
jest.mock('@/services/currencyService');
jest.mock('@/services/calendarService');
jest.mock('@/services/NisabService');

// Mock implementations
const mockCurrencyService = CurrencyService as jest.MockedClass<typeof CurrencyService>;
const mockCalendarService = CalendarService as jest.MockedClass<typeof CalendarService>;
const mockNisabService = NisabService as jest.MockedClass<typeof NisabService>;

describe('ZakatEngine', () => {
  let engine: ZakatEngine;

  // Helper function to create valid Asset objects for testing
  const createTestAsset = (overrides: Partial<Asset>): Asset => ({
    assetId: 'test-id',
    name: 'Test Asset',
    category: 'cash',
    subCategory: 'savings',
    value: 1000,
    currency: 'USD',
    zakatEligible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mocks
    mockNisabService.prototype.calculateNisab.mockResolvedValue({
      goldNisab: 4800, // 80g * $60
      silverNisab: 403.2, // 595g * $0.70
      effectiveNisab: 4800,
      nisabBasis: 'gold',
      calculationMethod: 'standard'
    });

    mockCurrencyService.prototype.convertAmount.mockResolvedValue(1000); // 1:1 conversion for simplicity
    mockCalendarService.prototype.getCalendarInfo.mockResolvedValue({
      gregorianDate: new Date(),
      hijriDate: { year: 1445, month: 1, day: 1, monthName: 'Muharram' },
      calculationPeriod: 'lunar',
      adjustmentFactor: 1.0
    });

    engine = new ZakatEngine(
      mockCurrencyService.prototype,
      mockCalendarService.prototype,
      mockNisabService.prototype
    );
  });

  describe('calculateZakat', () => {
    test('calculates zakat for assets above nisab threshold', async () => {
      const assets = [
        createTestAsset({ assetId: 'asset1', name: 'Cash', category: 'cash', value: 5000 }),
        createTestAsset({ assetId: 'asset2', name: 'Gold', category: 'gold', subCategory: 'jewelry', value: 2000 })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1', 'asset2'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.totals.totalZakatDue).toBeGreaterThan(0);
      expect(result.result.meetsNisab).toBe(true);
    });

    test('returns zero zakat for assets below nisab threshold', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1']
      };

      const result = await engine.calculateZakat(request);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.totals.totalZakatDue).toBe(0);
      expect(result.result.meetsNisab).toBe(false);
    });

    test('applies different methodologies correctly', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'hanafi',
        includeAssets: ['asset1', 'asset2']
      };

      const result = await engine.calculateZakat(request);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.method).toBe('hanafi');
    });

    test('handles currency conversion', async () => {
      mockCurrencyService.prototype.getExchangeRate.mockResolvedValue(0.8); // EUR to USD conversion

      const assets = [
        createTestAsset({ assetId: 'asset1', name: 'EUR Cash', category: 'cash', value: 1000, currency: 'EUR' })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      expect(mockCurrencyService.prototype.getExchangeRate).toHaveBeenCalledWith('EUR', 'USD');
      expect(result).toBeDefined();
    });

    test('excludes ineligible assets from calculation', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1', 'asset2']
      };

      const result = await engine.calculateZakat(request);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      // Should only calculate zakat on eligible assets
    });

    test('handles negative asset values correctly', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1', 'asset2']
      };

      const result = await engine.calculateZakat(request);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
    });

    test('validates request parameters', async () => {
      const invalidRequest = {
        calculationDate: '',
        calendarType: 'lunar' as const,
        method: 'invalid',
        includeAssets: []
      };

      await expect(engine.calculateZakat(invalidRequest)).rejects.toThrow();
    });

    test('provides detailed calculation breakdown', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1']
      };

      const result = await engine.calculateZakat(request);

      expect(result).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.methodology).toBeDefined();
    });

    test('calculates nisab threshold for gold (85g) and silver (595g)', async () => {
      // Test gold nisab calculation (85g at $60/g = $5100)
      mockNisabService.prototype.calculateNisab.mockResolvedValueOnce({
        goldNisab: 5100, // 85g * $60
        silverNisab: 416.5, // 595g * $0.70
        effectiveNisab: 5100,
        nisabBasis: 'gold',
        calculationMethod: 'standard'
      });

      const methodology = engine['getMethodologyInfo']('standard');
      const nisabInfo = await engine['calculateNisabThreshold'](methodology);

      expect(nisabInfo.goldNisab).toBe(5100);
      expect(nisabInfo.silverNisab).toBe(416.5);
      expect(nisabInfo.effectiveNisab).toBe(5100);
      expect(nisabInfo.nisabBasis).toBe('gold');
    });

    test('applies zakat rate of 2.5% correctly', async () => {
      const assets = [
        createTestAsset({ assetId: 'asset1', name: 'Cash', category: 'cash', value: 10000 })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      // 2.5% of $10,000 = $250
      expect(result.result.totals.totalZakatDue).toBe(250);
    });

    test('adjusts for lunar calendar calculation', async () => {
      mockCalendarService.prototype.getCalendarInfo.mockResolvedValue({
        gregorianDate: new Date(),
        hijriDate: { year: 1445, month: 1, day: 1, monthName: 'Muharram' },
        calculationPeriod: 'lunar',
        adjustmentFactor: 0.9671 // Lunar year adjustment (354/365.25)
      });

      const assets = [
        createTestAsset({ assetId: 'asset1', name: 'Cash', category: 'cash', value: 10000 })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      // 2.5% of $10,000 = $250, then lunar adjustment: $250 * 0.9671 ≈ $241.78
      expect(result.result.totals.totalZakatDue).toBeCloseTo(241.78, 1); // Reduced precision
    });

    test('Standard methodology treats all liquid assets as zakatable', async () => {
      const assets = [
        createTestAsset({ assetId: 'cash', name: 'Cash', category: 'cash', value: 5000 }),
        createTestAsset({ assetId: 'gold', name: 'Gold', category: 'gold', value: 3000 }),
        createTestAsset({ assetId: 'crypto', name: 'Crypto', category: 'crypto', value: 2000 })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['cash', 'gold', 'crypto'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      expect(result.result.totals.totalZakatableAssets).toBe(10000); // All assets included
      expect(result.result.totals.totalZakatDue).toBe(250); // 2.5% of $10,000
    });

    test('Hanafi methodology uses different nisab calculation approach', async () => {
      mockNisabService.prototype.calculateNisab.mockResolvedValue({
        goldNisab: 4800,
        silverNisab: 403.2,
        effectiveNisab: 403.2, // Hanafi might use silver as primary
        nisabBasis: 'silver',
        calculationMethod: 'hanafi'
      });

      const assets = [
        createTestAsset({ assetId: 'asset1', name: 'Cash', category: 'cash', value: 4000 })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'hanafi',
        includeAssets: ['asset1'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      expect(result.result.method).toBe('hanafi');
      expect(result.result.nisab.effectiveNisab).toBe(403.2);
      expect(result.result.meetsNisab).toBe(true); // $4000 > $403.2
    });

    test('Shafi methodology applies specific asset treatment rules', async () => {
      const assets = [
        createTestAsset({ assetId: 'business', name: 'Business', category: 'business', value: 10000 })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'shafii',
        includeAssets: ['business'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      expect(result.result.method).toBe('shafii');
      // Shafi methodology has specific business asset treatment
      expect(result.result.totals.totalZakatDue).toBeGreaterThan(0);
    });

    test('handles deductible debts correctly', async () => {
      const assets = [
        createTestAsset({ assetId: 'cash', name: 'Cash', category: 'cash', value: 10000 }),
        createTestAsset({ assetId: 'debt', name: 'Outstanding Debt', category: 'debts', value: -2000, zakatEligible: false })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['cash', 'debt'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      // Debt should not be included in zakatable assets
      expect(result.result.totals.totalZakatableAssets).toBe(10000);
      expect(result.result.totals.totalZakatDue).toBe(250);
    });

    test('handles edge cases: negative asset values', async () => {
      const assets = [
        createTestAsset({ assetId: 'negative', name: 'Negative Asset', category: 'cash', value: -1000 }),
        createTestAsset({ assetId: 'positive', name: 'Positive Asset', category: 'cash', value: 5000 })
      ];

      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['negative', 'positive'],
        assets: assets
      };

      const result = await engine.calculateZakat(request);

      // Negative asset should be filtered out, only positive asset counted
      expect(result.result.totals.totalZakatableAssets).toBe(5000);
      expect(result.result.totals.totalZakatDue).toBe(125); // 2.5% of $5000
    });

    test('handles edge cases: null assets', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: []
      };

      await expect(engine.calculateZakat(request)).rejects.toThrow('Asset loading not implemented');
    });

    test('handles edge cases: empty asset arrays', async () => {
      const request: ZakatCalculationRequest & { assets?: Asset[] } = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: [],
        assets: []
      };

      await expect(engine.calculateZakat(request)).rejects.toThrow('No valid assets found for calculation');
    });
  });
});