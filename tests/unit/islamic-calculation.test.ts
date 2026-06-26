/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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
 * Unit Tests for Islamic Calculation Service
 * 
 * Constitutional Principles:
 * - Islamic Compliance: Verify calculation accuracy against authentic sources
 * - Transparency & Trust: Test multiple methodologies and edge cases
 * - Quality & Reliability: Comprehensive testing of financial calculations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IslamicCalculationService } from '../../server/src/services/IslamicCalculationService';

// String constants matching the service's category/methodology interface
const AssetCategory = {
  CASH: 'CASH',
  GOLD: 'GOLD',
  SILVER: 'SILVER',
  BUSINESS: 'BUSINESS',
  PROPERTY: 'PROPERTY',
  CRYPTOCURRENCY: 'CRYPTOCURRENCY',
} as const;

const ZakatMethodology = {
  HANAFI: 'hanafi',
  SHAFI: 'shafii',
  MALIKI: 'maliki',
  HANBALI: 'standard',
  CONTEMPORARY: 'standard',
} as const;

describe('IslamicCalculationService', () => {
  let calculationService: IslamicCalculationService;

  beforeEach(() => {
    calculationService = new IslamicCalculationService();
  });

  describe('Zakat Rate Calculations', () => {
    it('should apply 2.5% rate for cash and cash equivalents', () => {
      const amount = 10000;
      const expectedZakat = amount * 0.025;
      const zakat = calculationService.calculateZakatAmount(amount, AssetCategory.CASH);
      expect(zakat).toBe(expectedZakat);
    });

    it('should apply 2.5% rate for gold', () => {
      const goldValue = 8000;
      const expectedZakat = goldValue * 0.025;
      const zakat = calculationService.calculateZakatAmount(goldValue, AssetCategory.GOLD);
      expect(zakat).toBe(expectedZakat);
    });

    it('should apply 2.5% rate for silver', () => {
      const silverValue = 1000;
      const expectedZakat = silverValue * 0.025;
      const zakat = calculationService.calculateZakatAmount(silverValue, AssetCategory.SILVER);
      expect(zakat).toBe(expectedZakat);
    });

    it('should apply 2.5% rate for business assets', () => {
      const businessValue = 50000;
      const expectedZakat = businessValue * 0.025;
      const zakat = calculationService.calculateZakatAmount(businessValue, AssetCategory.BUSINESS);
      expect(zakat).toBe(expectedZakat);
    });

    it('should not apply zakat to property for personal use', () => {
      const propertyValue = 100000;
      const zakat = calculationService.calculateZakatAmount(propertyValue, AssetCategory.PROPERTY);
      expect(zakat).toBe(0);
    });

    it('should handle cryptocurrency as cash equivalent', () => {
      const cryptoValue = 15000;
      const expectedZakat = cryptoValue * 0.025;
      const zakat = calculationService.calculateZakatAmount(cryptoValue, AssetCategory.CRYPTOCURRENCY);
      expect(zakat).toBe(expectedZakat);
    });
  });

  describe('Methodology-Specific Calculations', () => {
    describe('Hanafi Methodology', () => {
      it('should use specific nisab calculations for Hanafi school', () => {
        const assets = { cash: 5000, gold: 3000, silver: 1000 };
        const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
        expect(result.methodology).toBe(ZakatMethodology.HANAFI);
        expect(result.nisabThreshold).toBeDefined();
        expect(result.totalZakatable).toBe(9000);
      });

      it('should apply Hanafi rules for mixed assets', () => {
        const assets = { cash: 2000, gold: 2000, silver: 1000, business: 3000 };
        const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
        expect(result.totalZakatable).toBe(8000);
        expect(result.zakatDue).toBe(8000 * 0.025);
      });
    });

    describe('Shafi Methodology', () => {
      it('should use Shafi-specific rules for calculations', () => {
        const assets = { cash: 5000, gold: 3000, livestock: 2000 };
        const result = calculationService.calculateZakat(assets, ZakatMethodology.SHAFI);
        expect(result.methodology).toBe(ZakatMethodology.SHAFI);
        expect(result.nisabThreshold).toBeDefined();
      });
    });

    describe('Maliki Methodology', () => {
      it('should apply Maliki school interpretations', () => {
        const assets = { cash: 4000, gold: 4000, business: 2000 };
        const result = calculationService.calculateZakat(assets, ZakatMethodology.MALIKI);
        expect(result.methodology).toBe(ZakatMethodology.MALIKI);
        expect(result.totalZakatable).toBe(10000);
      });
    });

    describe('Hanbali Methodology', () => {
      it('should follow Hanbali jurisprudence rules', () => {
        const assets = { cash: 6000, gold: 2000, silver: 1000 };
        const result = calculationService.calculateZakat(assets, ZakatMethodology.HANBALI);
        expect(result.zakatDue).toBeGreaterThan(0);
      });
    });
  });

  describe('Lunar Calendar Considerations', () => {
    it('should calculate correct lunar year completion', () => {
      const acquisitionDate = new Date('2023-01-01');
      const calculationDate = new Date('2023-12-21'); // 354 days later (lunar year)
      const isLunarYearComplete = calculationService.hasLunarYearPassed(acquisitionDate, calculationDate);
      expect(isLunarYearComplete).toBe(true);
    });

    it('should handle incomplete lunar year', () => {
      const acquisitionDate = new Date('2023-06-01');
      const calculationDate = new Date('2024-01-01');
      const isLunarYearComplete = calculationService.hasLunarYearPassed(acquisitionDate, calculationDate);
      expect(isLunarYearComplete).toBe(false);
    });

    it('should adjust for Hijri calendar differences', () => {
      const adjustment = calculationService.calculateLunarYearAdjustment(365);
      expect(adjustment).toBe(354);
    });
  });

  describe('Complex Asset Calculations', () => {
    it('should handle mixed asset portfolio calculation', () => {
      const complexAssets = {
        cash: { checking: 5000, savings: 15000, moneyMarket: 8000 },
        gold: { jewelry: 12000, coins: 8000, bars: 5000 },
        business: { inventory: 30000, receivables: 10000, equipment: 50000 },
        investments: { stocks: 20000, bonds: 15000, mutualFunds: 12000 }
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
        inventory: 50000,
        receivables: 15000,
        equipment: 100000,
        buildings: 200000,
        vehicles: 30000
      };
      const zakatableAmount = calculationService.calculateBusinessZakat(businessAssets);
      expect(zakatableAmount).toBe(65000);
    });

    it('should handle debt deductions correctly', () => {
      const assets = { cash: 20000, gold: 10000 };
      const debts = { creditCard: 5000, personalLoan: 8000, mortgage: 150000 };
      const result = calculationService.calculateZakatWithDebts(assets, debts, ZakatMethodology.HANAFI);
      expect(result.deductibleDebts).toBe(13000);
      expect(result.netZakatable).toBe(30000 - 13000);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero or negative asset values', () => {
      const assets = { cash: 0, gold: -1000, silver: 5000 };
      const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
      expect(result.totalZakatable).toBe(5000);
      expect(result.zakatDue).toBe(5000 * 0.025);
    });

    it('should handle assets below nisab threshold', () => {
      const assets = { cash: 400, gold: 100 };
      const result = calculationService.calculateZakat(assets, ZakatMethodology.HANAFI);
      expect(result).toBeDefined();
      expect(result.totalZakatable).toBe(500);
    });

    it('should validate input data types', () => {
      const zakat = calculationService.calculateZakatAmount(-1000, AssetCategory.CASH);
      expect(zakat).toBe(0);
    });

    it('should handle very large numbers correctly', () => {
      const largeAmount = 1_000_000_000;
      const expectedZakat = largeAmount * 0.025;
      const zakat = calculationService.calculateZakatAmount(largeAmount, AssetCategory.CASH);
      expect(zakat).toBe(expectedZakat);
    });

    it('should maintain precision with decimal calculations', () => {
      const amount = 10000.33;
      const expectedZakat = amount * 0.025;
      const zakat = calculationService.calculateZakatAmount(amount, AssetCategory.CASH);
      expect(zakat).toBeCloseTo(expectedZakat, 2);
    });
  });

  describe('Historical Accuracy Validation', () => {
    it('should match traditional Islamic scholarship calculations', () => {
      const cashAmount = 10000;
      const zakat = calculationService.calculateZakatAmount(cashAmount, AssetCategory.CASH);
      expect(zakat).toBe(250);
    });

    it('should validate against contemporary Islamic finance standards', () => {
      const zakatableWealth = 50000;
      const zakat = calculationService.calculateZakatAmount(zakatableWealth, AssetCategory.CASH);
      expect(zakat).toBe(1250);
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete calculations within reasonable time', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        calculationService.calculateZakatAmount(10000 + i, AssetCategory.CASH);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should cache nisab calculations for performance', () => {
      const goldPrice = 60;
      const start1 = Date.now();
      const nisab1 = calculationService.calculateNisabThreshold('gold', goldPrice);
      const time1 = Date.now() - start1;
      const start2 = Date.now();
      const nisab2 = calculationService.calculateNisabThreshold('gold', goldPrice);
      const time2 = Date.now() - start2;
      expect(nisab1).toBe(nisab2);
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });
});
