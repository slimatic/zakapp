/**
 * Unit Tests for Islamic Calculation Service
 * 
 * Constitutional Principles:
 * - Islamic Compliance: Verify calculation accuracy against authentic sources
 * - Transparency & Trust: Test multiple methodologies and edge cases
 * - Quality & Reliability: Comprehensive testing of financial calculations
 */

import { IslamicCalculationService } from '../../server/src/services/IslamicCalculationService';
import { ZakatMethodology, AssetCategory, CalculationResult } from '../../shared/src/types';

describe('IslamicCalculationService', () => {
  let calculationService: IslamicCalculationService;

  beforeEach(() => {
    calculationService = new IslamicCalculationService();
  });

  describe('Nisab Threshold Calculations', () => {
    it('should calculate correct gold nisab threshold', () => {
      // 85 grams of gold (authentic hadith measurement)
      const goldPricePerGram = 60; // Example price in USD
      const expectedNisab = 85 * goldPricePerGram; // 5100
      
      const nisab = calculationService.calculateNisabThreshold('gold', goldPricePerGram);
      expect(nisab).toBe(expectedNisab);
    });

    it('should calculate correct silver nisab threshold', () => {
      // 595 grams of silver (authentic hadith measurement)
      const silverPricePerGram = 0.8; // Example price in USD
      const expectedNisab = 595 * silverPricePerGram; // 476
      
      const nisab = calculationService.calculateNisabThreshold('silver', silverPricePerGram);
      expect(nisab).toBe(expectedNisab);
    });

    it('should use lower of gold and silver nisab for cash calculations', () => {
      const goldNisab = calculationService.calculateNisabThreshold('gold', 60); // 5100
      const silverNisab = calculationService.calculateNisabThreshold('silver', 0.8); // 476
      
      const cashNisab = calculationService.getCashNisabThreshold(60, 0.8);
      expect(cashNisab).toBe(Math.min(goldNisab, silverNisab)); // Should be 476
    });

    it('should handle different currency conversions', () => {
      const goldPriceUSD = 60;
      const usdToEurRate = 0.85;
      
      const nisabUSD = calculationService.calculateNisabThreshold('gold', goldPriceUSD);
      const nisabEUR = calculationService.calculateNisabThreshold('gold', goldPriceUSD * usdToEurRate);
      
      expect(nisabEUR).toBe(nisabUSD * usdToEurRate);
    });
  });

  describe('Zakat Rate Calculations', () => {
    it('should apply 2.5% rate for cash and cash equivalents', () => {
      const amount = 10000;
      const expectedZakat = amount * 0.025; // 250
      
      const zakat = calculationService.calculateZakatAmount(amount, AssetCategory.CASH);
      expect(zakat).toBe(expectedZakat);
    });

    it('should apply 2.5% rate for gold', () => {
      const goldValue = 8000;
      const expectedZakat = goldValue * 0.025; // 200
      
      const zakat = calculationService.calculateZakatAmount(goldValue, AssetCategory.GOLD);
      expect(zakat).toBe(expectedZakat);
    });

    it('should apply 2.5% rate for silver', () => {
      const silverValue = 1000;
      const expectedZakat = silverValue * 0.025; // 25
      
      const zakat = calculationService.calculateZakatAmount(silverValue, AssetCategory.SILVER);
      expect(zakat).toBe(expectedZakat);
    });

    it('should apply 2.5% rate for business assets', () => {
      const businessValue = 50000;
      const expectedZakat = businessValue * 0.025; // 1250
      
      const zakat = calculationService.calculateZakatAmount(businessValue, AssetCategory.BUSINESS);
      expect(zakat).toBe(expectedZakat);
    });

    it('should not apply zakat to property for personal use', () => {
      const propertyValue = 100000;
      const zakat = calculationService.calculateZakatAmount(propertyValue, AssetCategory.PROPERTY);
      
      expect(zakat).toBe(0); // Personal property is not zakatable
    });

    it('should handle cryptocurrency as cash equivalent', () => {
      const cryptoValue = 15000;
      const expectedZakat = cryptoValue * 0.025; // 375
      
      const zakat = calculationService.calculateZakatAmount(cryptoValue, AssetCategory.CRYPTOCURRENCY);
      expect(zakat).toBe(expectedZakat);
    });
  });

  describe('Methodology-Specific Calculations', () => {
    describe('Hanafi Methodology', () => {
      it('should use specific nisab calculations for Hanafi school', () => {
        const assets = {
          cash: 5000,
          gold: 3000,
          silver: 1000
        };
        
        const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
        
        expect(result.methodology).toBe(ZakatMethodology.HANAFI);
        expect(result.nisabThreshold).toBeDefined();
        expect(result.totalZakatable).toBe(9000); // All assets are zakatable
      });

      it('should apply Hanafi rules for mixed assets', () => {
        const assets = {
          cash: 2000,
          gold: 2000,
          silver: 1000,
          business: 3000
        };
        
        const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
        
        expect(result.totalZakatable).toBe(8000);
        expect(result.zakatDue).toBe(8000 * 0.025); // 200
      });
    });

    describe('Shafi Methodology', () => {
      it('should use Shafi-specific rules for calculations', () => {
        const assets = {
          cash: 5000,
          gold: 3000,
          livestock: 2000 // Shafi has specific livestock rules
        };
        
        const result = calculationService.calculateZakat(assets, ZakatMethodology.SHAFI);
        
        expect(result.methodology).toBe(ZakatMethodology.SHAFI);
        expect(result.details).toHaveProperty('livestockCalculation');
      });
    });

    describe('Maliki Methodology', () => {
      it('should apply Maliki school interpretations', () => {
        const assets = {
          cash: 4000,
          gold: 4000,
          business: 2000
        };
        
        const result = calculationService.calculateZakat(assets, ZakatMethodology.MALIKI);
        
        expect(result.methodology).toBe(ZakatMethodology.MALIKI);
        expect(result.totalZakatable).toBe(10000);
      });
    });

    describe('Hanbali Methodology', () => {
      it('should follow Hanbali jurisprudence rules', () => {
        const assets = {
          cash: 6000,
          gold: 2000,
          silver: 1000
        };
        
        const result = calculationService.calculateZakat(assets, ZakatMethodology.HANBALI);
        
        expect(result.methodology).toBe(ZakatMethodology.HANBALI);
        expect(result.zakatDue).toBeGreaterThan(0);
      });
    });
  });

  describe('Lunar Calendar Considerations', () => {
    it('should calculate correct lunar year completion', () => {
      const acquisitionDate = new Date('2023-01-01');
      const calculationDate = new Date('2023-12-20'); // ~354 days later
      
      const isLunarYearComplete = calculationService.hasLunarYearPassed(acquisitionDate, calculationDate);
      expect(isLunarYearComplete).toBe(true);
    });

    it('should handle incomplete lunar year', () => {
      const acquisitionDate = new Date('2023-06-01');
      const calculationDate = new Date('2024-01-01'); // Only ~214 days
      
      const isLunarYearComplete = calculationService.hasLunarYearPassed(acquisitionDate, calculationDate);
      expect(isLunarYearComplete).toBe(false);
    });

    it('should adjust for Hijri calendar differences', () => {
      const gregorianYear = 365;
      const lunarYear = 354; // Approximate lunar year length
      
      const adjustment = calculationService.calculateLunarYearAdjustment(gregorianYear);
      expect(adjustment).toBe(lunarYear);
    });
  });

  describe('Complex Asset Calculations', () => {
    it('should handle mixed asset portfolio calculation', () => {
      const complexAssets = {
        cash: {
          checking: 5000,
          savings: 15000,
          moneyMarket: 8000
        },
        gold: {
          jewelry: 12000,
          coins: 8000,
          bars: 5000
        },
        business: {
          inventory: 30000,
          receivables: 10000,
          equipment: 50000 // Not zakatable
        },
        investments: {
          stocks: 20000,
          bonds: 15000, // May have Islamic compliance considerations
          mutualFunds: 12000
        }
      };
      
      const result = calculationService.calculateComplexPortfolio(complexAssets, ZakatMethodology.HANAFI);
      
      expect(result.breakdown).toHaveProperty('cash');
      expect(result.breakdown).toHaveProperty('gold');
      expect(result.breakdown).toHaveProperty('business');
      expect(result.breakdown).toHaveProperty('investments');
      
      expect(result.totalZakatable).toBeGreaterThan(0);
      expect(result.zakatDue).toBe(result.totalZakatable * 0.025);
    });

    it('should exclude non-zakatable business assets', () => {
      const businessAssets = {
        inventory: 50000, // Zakatable
        receivables: 15000, // Zakatable
        equipment: 100000, // Not zakatable
        buildings: 200000, // Not zakatable
        vehicles: 30000 // Not zakatable
      };
      
      const zakatableAmount = calculationService.calculateBusinessZakat(businessAssets);
      expect(zakatableAmount).toBe(65000); // Only inventory + receivables
    });

    it('should handle debt deductions correctly', () => {
      const assets = {
        cash: 20000,
        gold: 10000
      };
      
      const debts = {
        creditCard: 5000,
        personalLoan: 8000,
        mortgage: 150000 // May not be deductible in some methodologies
      };
      
      const result = calculationService.calculateZakatWithDebts(
        assets, 
        debts, 
        ZakatMethodology.HANAFI
      );
      
      // Should deduct short-term debts only
      expect(result.deductibleDebts).toBe(13000); // creditCard + personalLoan
      expect(result.netZakatable).toBe(30000 - 13000); // 17000
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero or negative asset values', () => {
      const assets = {
        cash: 0,
        gold: -1000, // Invalid
        silver: 5000
      };
      
      const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
      
      expect(result.totalZakatable).toBe(5000); // Only valid positive assets
      expect(result.zakatDue).toBe(5000 * 0.025);
    });

    it('should handle assets below nisab threshold', () => {
      const assets = {
        cash: 400, // Below typical nisab
        gold: 100
      };
      
      const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
      
      expect(result.zakatDue).toBe(0); // Below nisab, no zakat due
      expect(result.belowNisab).toBe(true);
    });

    it('should validate input data types', () => {
      const invalidAssets = {
        cash: 'invalid',
        gold: null,
        silver: undefined
      };
      
      expect(() => {
        calculationService.calculateZakat(invalidAssets as any, ZakatMethodology.HANAFI);
      }).toThrow('Invalid asset values provided');
    });

    it('should handle very large numbers correctly', () => {
      const largeAssets = {
        cash: 999999999999.99,
        gold: 888888888888.88
      };
      
      const result = calculationService.calculateZakat(largeAssets, ZakatMethodology.HANAFI);
      
      expect(result.totalZakatable).toBe(1888888888888.87);
      expect(result.zakatDue).toBe(1888888888888.87 * 0.025);
      expect(Number.isFinite(result.zakatDue)).toBe(true);
    });

    it('should maintain precision with decimal calculations', () => {
      const preciseAssets = {
        cash: 10000.33,
        gold: 5000.67,
        silver: 1500.99
      };
      
      const result = calculationService.calculateZakat(preciseAssets, ZakatMethodology.HANAFI);
      
      expect(result.totalZakatable).toBe(16501.99);
      expect(result.zakatDue).toBeCloseTo(412.55, 2); // 16501.99 * 0.025
    });
  });

  describe('Historical Accuracy Validation', () => {
    it('should match traditional Islamic scholarship calculations', () => {
      // Test case based on classical fiqh examples
      const classicExample = {
        goldDinars: 20, // Historical minimum
        silverDirhams: 200 // Historical minimum
      };
      
      // Convert to modern equivalents (approximate weights)
      const goldValue = 20 * 4.25 * 60; // 20 dinars × 4.25g × $60/g
      const silverValue = 200 * 2.975 * 0.8; // 200 dirhams × 2.975g × $0.8/g
      
      const assets = {
        gold: goldValue,
        silver: silverValue
      };
      
      const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
      
      expect(result.zakatDue).toBeGreaterThan(0);
      expect(result.zakatDue).toBe((goldValue + silverValue) * 0.025);
    });

    it('should validate against contemporary Islamic finance standards', () => {
      // Modern AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions) standards
      const modernPortfolio = {
        cash: 50000,
        islamicBonds: 30000, // Sukuk
        shariahCompliantStocks: 25000,
        gold: 15000
      };
      
      const result = calculationService.calculateZakat(modernPortfolio, ZakatMethodology.CONTEMPORARY);
      
      expect(result.totalZakatable).toBe(120000);
      expect(result.zakatDue).toBe(3000); // 2.5% of total
      expect(result.shariahCompliant).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete calculations within reasonable time', () => {
      const largePortfolio = {
        assets: Array.from({ length: 1000 }, (_, i) => ({
          type: 'cash',
          value: Math.random() * 10000
        }))
      };
      
      const startTime = Date.now();
      const result = calculationService.calculateLargePortfolio(largePortfolio, ZakatMethodology.HANAFI);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
      expect(result.zakatDue).toBeGreaterThanOrEqual(0);
    });

    it('should cache nisab calculations for performance', () => {
      const goldPrice = 60;
      const silverPrice = 0.8;
      
      // First calculation
      const start1 = Date.now();
      const nisab1 = calculationService.calculateNisabThreshold('gold', goldPrice);
      const time1 = Date.now() - start1;
      
      // Second calculation with same prices (should be cached)
      const start2 = Date.now();
      const nisab2 = calculationService.calculateNisabThreshold('gold', goldPrice);
      const time2 = Date.now() - start2;
      
      expect(nisab1).toBe(nisab2);
      expect(time2).toBeLessThanOrEqual(time1); // Second call should be faster or equal
    });
  });
});