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
    });

    it('should use silver nisab for Hanafi method', () => {
      const goldPricePerGram = 60; // $60 per gram
      const silverPricePerGram = 0.8; // $0.80 per gram
      
      const nisab = zakatService.calculateNisab(goldPricePerGram, silverPricePerGram, ZAKAT_METHODS.HANAFI.id);
      
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;
      
      expect(nisab.effectiveNisab).toBe(expectedSilverNisab);
      expect(nisab.nisabBasis).toBe('silver');
      expect(nisab.calculationMethod).toBe('hanafi');
    });

    it('should use dual minimum for Shafi\'i method', () => {
      const goldPricePerGram = 60; // $60 per gram
      const silverPricePerGram = 0.8; // $0.80 per gram
      
      const nisab = zakatService.calculateNisab(goldPricePerGram, silverPricePerGram, ZAKAT_METHODS.SHAFII.id);
      
      const expectedGoldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;
      const expectedMinimum = Math.min(expectedGoldNisab, expectedSilverNisab);
      
      expect(nisab.effectiveNisab).toBe(expectedMinimum);
      expect(nisab.nisabBasis).toBe('dual_minimum');
      expect(nisab.calculationMethod).toBe('shafii');
    });

    it('should use appropriate basis for standard method', () => {
      const goldPricePerGram = 60; // $60 per gram  
      const silverPricePerGram = 0.8; // $0.80 per gram
      
      const nisab = zakatService.calculateNisab(goldPricePerGram, silverPricePerGram, ZAKAT_METHODS.STANDARD.id);
      
      const expectedGoldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;
      const expectedMinimum = Math.min(expectedGoldNisab, expectedSilverNisab);
      
      expect(nisab.effectiveNisab).toBe(expectedMinimum);
      expect(nisab.nisabBasis).toBe(expectedSilverNisab < expectedGoldNisab ? 'silver' : 'gold');
      expect(nisab.calculationMethod).toBe('standard');
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

  describe('Cross-Method Validation Tests', () => {
    const testAssets: Asset[] = [
      {
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
      },
      {
        assetId: 'test-gold-1',
        name: 'Gold Jewelry',
        category: 'gold',
        subCategory: 'jewelry',
        value: 15000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Test gold jewelry',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        assetId: 'test-business-1',
        name: 'Business Inventory',
        category: 'business',
        subCategory: 'inventory',
        value: 20000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Test business inventory',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const createCalculationRequest = (method: string): ZakatCalculationRequest => ({
      calculationDate: new Date().toISOString(),
      calendarType: 'lunar',
      method,
      includeAssets: testAssets.map(asset => asset.assetId)
    });

    it('should produce consistent results across all methods', async () => {
      const results = await Promise.all([
        zakatService.calculateZakat(createCalculationRequest(ZAKAT_METHODS.HANAFI.id), testAssets),
        zakatService.calculateZakat(createCalculationRequest(ZAKAT_METHODS.STANDARD.id), testAssets),
        zakatService.calculateZakat(createCalculationRequest(ZAKAT_METHODS.SHAFII.id), testAssets)
      ]);
      
      results.forEach(result => {
        expect(result.totals.totalZakatDue).toBeGreaterThanOrEqual(0);
        expect(result.method).toBeDefined();
        expect(result.nisab).toBeDefined();
        expect(result.nisab.nisabBasis).toBeDefined();
        expect(result.nisab.calculationMethod).toBeDefined();
      });
    });

    it('should show Hanafi method uses silver nisab preference', async () => {
      const goldPrice = 60; // High gold price
      const silverPrice = 0.8; // Low silver price
      
      const hanafiNisab = zakatService.calculateNisab(goldPrice, silverPrice, ZAKAT_METHODS.HANAFI.id);
      const standardNisab = zakatService.calculateNisab(goldPrice, silverPrice, ZAKAT_METHODS.STANDARD.id);
      
      // Hanafi should use silver nisab exclusively
      expect(hanafiNisab.effectiveNisab).toBe(hanafiNisab.silverNisab);
      expect(hanafiNisab.nisabBasis).toBe('silver');
      
      // Standard should use minimum
      expect(standardNisab.effectiveNisab).toBe(Math.min(standardNisab.goldNisab, standardNisab.silverNisab));
    });

    it('should apply method-specific business asset treatment', async () => {
      const businessAsset: Asset = {
        assetId: 'business-test',
        name: 'Trade Inventory',
        category: 'business',
        subCategory: 'inventory',
        value: 50000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Test business inventory',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const hanafiResult = zakatService.calculateAssetZakat(businessAsset, ZAKAT_METHODS.HANAFI.id);
      const shafiiResult = zakatService.calculateAssetZakat(businessAsset, ZAKAT_METHODS.SHAFII.id);
      const standardResult = zakatService.calculateAssetZakat(businessAsset, ZAKAT_METHODS.STANDARD.id);

      // All methods should calculate some zakat for business assets
      expect(hanafiResult.zakatDue).toBeGreaterThan(0);
      expect(shafiiResult.zakatDue).toBeGreaterThan(0);
      expect(standardResult.zakatDue).toBeGreaterThan(0);
      
      // Verify the zakat rate is applied correctly (2.5%)
      expect(hanafiResult.zakatDue).toBe(businessAsset.value * 0.025);
      expect(shafiiResult.zakatDue).toBe(businessAsset.value * 0.025);
      expect(standardResult.zakatDue).toBe(businessAsset.value * 0.025);
    });

    it('should validate method names are supported', () => {
      const supportedMethods = [ZAKAT_METHODS.HANAFI.id, ZAKAT_METHODS.STANDARD.id, ZAKAT_METHODS.SHAFII.id];
      
      supportedMethods.forEach(method => {
        const request = createCalculationRequest(method);
        expect(() => zakatService.validateCalculationRequest(request)).not.toThrow();
      });
    });

    it('should handle edge case where all methods produce same result', async () => {
      // Create scenario where nisab conditions are clear-cut
      const highValueAssets: Asset[] = [
        {
          assetId: 'high-value-cash',
          name: 'Large Savings',
          category: 'cash',
          subCategory: 'savings',
          value: 100000, // Well above any nisab threshold
          currency: 'USD',
          zakatEligible: true,
          description: 'High value cash asset',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: ZAKAT_METHODS.STANDARD.id,
        includeAssets: ['high-value-cash']
      };

      const calculation = await zakatService.calculateZakat(request, highValueAssets);
      
      expect(calculation.meetsNisab).toBe(true);
      expect(calculation.totals.totalZakatDue).toBe(2500); // 2.5% of 100,000
    });
  });

  describe('Methodology Education and Recommendations', () => {
    it('should get methodology recommendations for specific regions', () => {
      const pakistanRecommendations = zakatService.getMethodologyRecommendations('Pakistan');
      expect(pakistanRecommendations).toContain('hanafi');
      expect(pakistanRecommendations).toContain('standard');

      const indonesiaRecommendations = zakatService.getMethodologyRecommendations('Indonesia');
      expect(indonesiaRecommendations).toContain('shafii');
      expect(indonesiaRecommendations).toContain('standard');

      // Test default recommendations for unknown region
      const unknownRecommendations = zakatService.getMethodologyRecommendations('Unknown Country');
      expect(unknownRecommendations).toContain('standard');
    });

    it('should get methodology recommendations for no region specified', () => {
      const defaultRecommendations = zakatService.getMethodologyRecommendations();
      expect(defaultRecommendations).toHaveLength(3);
      expect(defaultRecommendations).toContain('standard');
      expect(defaultRecommendations).toContain('hanafi');
      expect(defaultRecommendations).toContain('shafii');
    });

    it('should get educational content for each methodology', () => {
      const hanafiEducation = zakatService.getMethodologyEducation(ZAKAT_METHODS.HANAFI.id);
      expect(hanafiEducation).toBeDefined();
      expect(hanafiEducation.historicalBackground).toContain('Abu Hanifa');
      expect(hanafiEducation.pros).toContain('Lower nisab threshold ensures broader zakat eligibility');

      const shafiiEducation = zakatService.getMethodologyEducation(ZAKAT_METHODS.SHAFII.id);
      expect(shafiiEducation).toBeDefined();
      expect(shafiiEducation.historicalBackground).toContain('al-Shafi\'i');
      expect(shafiiEducation.pros).toContain('Balanced nisab calculation approach');

      const standardEducation = zakatService.getMethodologyEducation(ZAKAT_METHODS.STANDARD.id);
      expect(standardEducation).toBeDefined();
      expect(standardEducation.historicalBackground).toContain('AAOIFI');
    });

    it('should get methodology comparison with nisab calculations', () => {
      const goldPrice = 60;
      const silverPrice = 0.8;
      
      const comparison = zakatService.getMethodologyComparison(goldPrice, silverPrice);
      
      expect(comparison).toHaveLength(4); // Standard, Hanafi, Shafi'i, Custom
      
      comparison.forEach(method => {
        expect(method.id).toBeDefined();
        expect(method.name).toBeDefined();
        expect(method.nisab).toBeDefined();
        expect(method.education).toBeDefined();
        expect(method.effectiveNisabValue).toBeGreaterThan(0);
        expect(method.nisabSource).toBeDefined();
      });

      // Verify Hanafi uses silver nisab
      const hanafiMethod = comparison.find(m => m.id === 'hanafi');
      expect(hanafiMethod?.nisabSource).toBe('silver');

      // Verify Shafi'i uses dual minimum
      const shafiiMethod = comparison.find(m => m.id === 'shafii');
      expect(shafiiMethod?.nisabSource).toBe('dual_minimum');
    });
  });
});