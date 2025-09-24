import { ZakatService } from '../services/zakatService';
import { ZAKAT_RATES, NISAB_THRESHOLDS, ZAKAT_METHODS } from '@zakapp/shared';
import type { Asset, ZakatCalculationRequest } from '@zakapp/shared';

describe('ZakatService', () => {
  let zakatService: ZakatService;
  
  beforeEach(() => {
    zakatService = new ZakatService();
  });

  describe('calculateNisab', () => {
    it('should calculate nisab thresholds correctly', () => {
      const goldPricePerGram = 65; // $65 per gram
      const silverPricePerGram = 0.8; // $0.8 per gram
      
      const nisab = zakatService.calculateNisab(goldPricePerGram, silverPricePerGram, 'standard');
      
      // Expected calculations
      const expectedGoldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram; // 87.48 * 65
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram; // 612.36 * 0.8
      
      expect(nisab.goldNisab).toBeCloseTo(expectedGoldNisab, 2);
      expect(nisab.silverNisab).toBeCloseTo(expectedSilverNisab, 2);
      expect(nisab.effectiveNisab).toBe(Math.min(expectedGoldNisab, expectedSilverNisab));
      expect(nisab.nisabBasis).toBe('silver'); // Silver is lower in this case
      expect(nisab.calculationMethod).toBe('standard');
    });

    it('should use silver nisab for Hanafi method', () => {
      const goldPricePerGram = 65;
      const silverPricePerGram = 0.8;
      
      const nisab = zakatService.calculateNisab(goldPricePerGram, silverPricePerGram, ZAKAT_METHODS.HANAFI.id);
      
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;
      expect(nisab.effectiveNisab).toBe(expectedSilverNisab);
      expect(nisab.nisabBasis).toBe('silver');
      expect(nisab.calculationMethod).toBe(ZAKAT_METHODS.HANAFI.id);
    });

    it('should use dual minimum for Shafi\'i method', () => {
      const goldPricePerGram = 65;
      const silverPricePerGram = 0.8;
      
      const nisab = zakatService.calculateNisab(goldPricePerGram, silverPricePerGram, ZAKAT_METHODS.SHAFII.id);
      
      const expectedGoldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;
      expect(nisab.effectiveNisab).toBe(Math.min(expectedGoldNisab, expectedSilverNisab));
      expect(nisab.nisabBasis).toBe('dual_minimum');
      expect(nisab.calculationMethod).toBe(ZAKAT_METHODS.SHAFII.id);
    });
  });

  describe('isEligibleForZakat', () => {
    it('should return true when asset value meets nisab', () => {
      const assetValue = 1000;
      const nisab = 500;
      
      expect(zakatService.isEligibleForZakat(assetValue, nisab)).toBe(true);
    });

    it('should return false when asset value is below nisab', () => {
      const assetValue = 400;
      const nisab = 500;
      
      expect(zakatService.isEligibleForZakat(assetValue, nisab)).toBe(false);
    });

    it('should return true when asset value equals nisab', () => {
      const assetValue = 500;
      const nisab = 500;
      
      expect(zakatService.isEligibleForZakat(assetValue, nisab)).toBe(true);
    });
  });

  describe('calculateAssetZakat', () => {
    it('should calculate zakat for cash asset correctly', () => {
      const asset: Asset = {
        assetId: 'test-cash-1',
        name: 'Savings Account',
        category: 'cash',
        subCategory: 'savings',
        value: 10000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Test savings account',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const zakatAsset = zakatService.calculateAssetZakat(asset, 'standard');
      
      expect(zakatAsset.assetId).toBe(asset.assetId);
      expect(zakatAsset.name).toBe(asset.name);
      expect(zakatAsset.category).toBe(asset.category);
      expect(zakatAsset.value).toBe(asset.value);
      expect(zakatAsset.zakatableAmount).toBe(asset.value);
      expect(zakatAsset.zakatDue).toBe(asset.value * ZAKAT_RATES.STANDARD_RATE / 100);
    });

    it('should calculate zakat for gold asset correctly', () => {
      const asset: Asset = {
        assetId: 'test-gold-1',
        name: 'Gold Jewelry',
        category: 'gold',
        subCategory: 'jewelry',
        value: 5000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Gold jewelry',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const zakatAsset = zakatService.calculateAssetZakat(asset, 'standard');
      
      expect(zakatAsset.zakatDue).toBe(asset.value * ZAKAT_RATES.STANDARD_RATE / 100);
    });
  });

  describe('calculateZakat', () => {
    const mockAssets: Asset[] = [
      {
        assetId: 'cash-1',
        name: 'Checking Account',
        category: 'cash',
        subCategory: 'checking',
        value: 15000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Primary checking account',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        assetId: 'gold-1',
        name: 'Gold Investment',
        category: 'gold',
        subCategory: 'bars',
        value: 8000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Gold bars investment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        assetId: 'house-1',
        name: 'Primary Residence',
        category: 'property',
        subCategory: 'residential',
        value: 300000,
        currency: 'USD',
        zakatEligible: false, // Primary residence not zakatable
        description: 'Primary home',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    it('should calculate zakat when assets meet nisab threshold', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['cash-1', 'gold-1']
      };

      const calculation = await zakatService.calculateZakat(request, mockAssets);
      
      expect(calculation.calculationId).toBeDefined();
      expect(calculation.calculationDate).toBe(request.calculationDate);
      expect(calculation.calendarType).toBe(request.calendarType);
      expect(calculation.method).toBe(request.method);
      expect(calculation.nisab).toBeDefined();
      expect(calculation.assets).toHaveLength(2);
      expect(calculation.meetsNisab).toBe(true);
      expect(calculation.totals.totalAssets).toBe(23000); // 15000 + 8000
      expect(calculation.totals.totalZakatDue).toBeGreaterThan(0);
    });

    it('should return zero zakat when assets do not meet nisab', async () => {
      // Create assets with very low values
      const lowValueAssets: Asset[] = [
        {
          ...mockAssets[0],
          value: 100, // Very low value
          assetId: 'low-cash-1'
        }
      ];

      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['low-cash-1']
      };

      const calculation = await zakatService.calculateZakat(request, lowValueAssets);
      
      expect(calculation.meetsNisab).toBe(false);
      expect(calculation.totals.totalZakatDue).toBe(0);
      calculation.assets.forEach(asset => {
        expect(asset.zakatDue).toBe(0);
      });
    });

    it('should only include zakatable assets in calculation', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['cash-1', 'gold-1', 'house-1'] // Including non-zakatable house
      };

      const calculation = await zakatService.calculateZakat(request, mockAssets);
      
      // Should only include cash and gold assets (zakatable ones)
      expect(calculation.assets).toHaveLength(2);
      expect(calculation.assets.find(a => a.assetId === 'house-1')).toBeUndefined();
    });

    it('should include calculation breakdown', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'hanafi',
        includeAssets: ['cash-1', 'gold-1']
      };

      const calculation = await zakatService.calculateZakat(request, mockAssets);
      
      expect(calculation.breakdown).toBeDefined();
      expect(calculation.breakdown!.methodology.name).toBe('Hanafi Method');
      expect(calculation.breakdown!.methodology.nisabBasis).toBe('silver');
      expect(calculation.breakdown!.steps).toHaveLength(5);
      expect(calculation.breakdown!.steps[0].step).toBe('1. Nisab Calculation');
    });

    it('should filter assets based on includeAssets parameter', async () => {
      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['cash-1'] // Only include cash asset
      };

      const calculation = await zakatService.calculateZakat(request, mockAssets);
      
      expect(calculation.assets).toHaveLength(1);
      expect(calculation.assets[0].assetId).toBe('cash-1');
    });
  });

  describe('validateCalculationRequest', () => {
    it('should validate a correct calculation request', () => {
      const validRequest: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1', 'asset2']
      };

      expect(() => zakatService.validateCalculationRequest(validRequest)).not.toThrow();
    });

    it('should throw error for missing calculation date', () => {
      const invalidRequest = {
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1']
      } as ZakatCalculationRequest;

      expect(() => zakatService.validateCalculationRequest(invalidRequest))
        .toThrow('Calculation date is required');
    });

    it('should throw error for invalid calendar type', () => {
      const invalidRequest: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'invalid' as any,
        method: 'standard',
        includeAssets: ['asset1']
      };

      expect(() => zakatService.validateCalculationRequest(invalidRequest))
        .toThrow('Valid calendar type is required');
    });

    it('should throw error for invalid method', () => {
      const invalidRequest: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'invalid',
        includeAssets: ['asset1']
      };

      expect(() => zakatService.validateCalculationRequest(invalidRequest))
        .toThrow('Valid calculation method is required');
    });

    it('should throw error for empty asset list', () => {
      const invalidRequest: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: []
      };

      expect(() => zakatService.validateCalculationRequest(invalidRequest))
        .toThrow('At least one asset must be included in calculation');
    });

    it('should throw error for invalid date format', () => {
      const invalidRequest: ZakatCalculationRequest = {
        calculationDate: 'invalid-date',
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1']
      };

      expect(() => zakatService.validateCalculationRequest(invalidRequest))
        .toThrow('Invalid calculation date format');
    });

    it('should throw error for negative custom nisab', () => {
      const invalidRequest: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['asset1'],
        customNisab: -100
      };

      expect(() => zakatService.validateCalculationRequest(invalidRequest))
        .toThrow('Custom nisab must be a positive number');
    });
  });
});