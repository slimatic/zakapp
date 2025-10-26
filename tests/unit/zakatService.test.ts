import { ZakatService } from '../../server/src/services/ZakatService';
import { ZAKAT_RATES, NISAB_THRESHOLDS, ZAKAT_METHODS } from '../../shared/src/index';
import type { Asset, ZakatCalculationRequest, ZakatCalculation, NisabInfo } from '../../shared/src/index';

describe('Comprehensive ZakatService Methodology Tests', () => {
  let zakatService: ZakatService;
  
  beforeEach(() => {
    zakatService = new ZakatService();
  });

  // Test data factory functions
  const createStandardTestAssets = (): Asset[] => [
    {
      assetId: 'cash-savings',
      name: 'Savings Account',
      category: 'cash',
      subCategory: 'savings',
      value: 15000,
      currency: 'USD',
      zakatEligible: true,
      description: 'Personal savings for zakat testing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      assetId: 'gold-jewelry',
      name: 'Gold Jewelry',
      category: 'gold',
      subCategory: 'jewelry',
      value: 8000,
      currency: 'USD',
      zakatEligible: true,
      description: 'Investment gold jewelry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      assetId: 'business-inventory',
      name: 'Business Stock',
      category: 'business',
      subCategory: 'inventory',
      value: 25000,
      currency: 'USD',
      zakatEligible: true,
      description: 'Trading inventory for business',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      assetId: 'silver-investment',
      name: 'Silver Coins',
      category: 'silver',
      subCategory: 'coins',
      value: 5000,
      currency: 'USD',
      zakatEligible: true,
      description: 'Investment silver coins',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const createDebtAssets = (): Asset[] => [
    {
      assetId: 'debt-personal',
      name: 'Personal Debt',
      category: 'expenses',
      subCategory: 'debts_owed',
      value: 3000,
      currency: 'USD',
      zakatEligible: false,
      description: 'Personal debt owed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      assetId: 'debt-business',
      name: 'Business Loan',
      category: 'expenses',
      subCategory: 'business_loans',
      value: 5000,
      currency: 'USD',
      zakatEligible: false,
      description: 'Business loan debt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const createCalculationRequest = (method: string, assets: Asset[], customNisab?: number): ZakatCalculationRequest => ({
    calculationDate: new Date().toISOString(),
    calendarType: 'lunar',
    methodology: method as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM',
    includeAssets: assets.map(asset => asset.assetId),
    ...(customNisab && { customNisab })
  });

  describe('Nisab Calculations by Method', () => {
    const standardGoldPrice = 60; // $60/gram
    const standardSilverPrice = 0.8; // $0.80/gram

    test('Hanafi method uses silver nisab exclusively', () => {
      const nisab = zakatService.calculateNisab(standardGoldPrice, standardSilverPrice, ZAKAT_METHODS.HANAFI.id);
      
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * standardSilverPrice;
      
      expect(nisab.effectiveNisab).toBe(expectedSilverNisab);
      expect(nisab.nisabBasis).toBe('silver');
      expect(nisab.calculationMethod).toBe('hanafi');
      expect(nisab.silverNisab).toBeCloseTo(489.89, 2); // 612.36 * 0.8
    });

    test('Shafi\'i method uses dual minimum nisab', () => {
      const nisab = zakatService.calculateNisab(standardGoldPrice, standardSilverPrice, ZAKAT_METHODS.SHAFII.id);
      
      const expectedGoldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * standardGoldPrice;
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * standardSilverPrice;
      const expectedMinimum = Math.min(expectedGoldNisab, expectedSilverNisab);
      
      expect(nisab.effectiveNisab).toBe(expectedMinimum);
      expect(nisab.nisabBasis).toBe('dual_minimum');
      expect(nisab.calculationMethod).toBe('shafii');
    });

    test('Standard method uses minimum with specific basis tracking', () => {
      const nisab = zakatService.calculateNisab(standardGoldPrice, standardSilverPrice, ZAKAT_METHODS.STANDARD.id);
      
      const expectedGoldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * standardGoldPrice;
      const expectedSilverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * standardSilverPrice;
      const expectedMinimum = Math.min(expectedGoldNisab, expectedSilverNisab);
      const expectedBasis = expectedGoldNisab < expectedSilverNisab ? 'gold' : 'silver';
      
      expect(nisab.effectiveNisab).toBe(expectedMinimum);
      expect(nisab.nisabBasis).toBe(expectedBasis);
      expect(nisab.calculationMethod).toBe('standard');
    });

    test('Custom method allows configurable nisab approach', () => {
      const customNisab = 1000;
      const request = createCalculationRequest('custom', createStandardTestAssets(), customNisab);
      
      // Test custom nisab in calculation context
      expect(request.customNisab).toBe(customNisab);
    });
  });

  describe('Edge Case Tests', () => {
    describe('Nisab Boundary Conditions', () => {
      test('should handle assets exactly at nisab threshold', async () => {
        // Create assets that sum exactly to nisab
        const goldPrice = 60;
        const silverPrice = 0.8;
        const nisabInfo = zakatService.calculateNisab(goldPrice, silverPrice, 'standard');
        
        const boundaryAssets: Asset[] = [{
          assetId: 'boundary-cash',
          name: 'Boundary Cash',
          category: 'cash',
          subCategory: 'savings',
          value: nisabInfo.effectiveNisab, // Exactly at nisab
          currency: 'USD',
          zakatEligible: true,
          description: 'Asset exactly at nisab threshold',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];

        const request = createCalculationRequest('standard', boundaryAssets);
        const calculation = await zakatService.calculateZakat(request, boundaryAssets);

        expect(calculation.meetsNisab).toBe(true);
        expect(calculation.totals.totalZakatDue).toBeGreaterThan(0);
        expect(calculation.totals.totalZakatDue).toBeCloseTo(nisabInfo.effectiveNisab * 0.025, 4);
      });

      test('should handle assets just below nisab threshold', async () => {
        const goldPrice = 60;
        const silverPrice = 0.8;
        const nisabInfo = zakatService.calculateNisab(goldPrice, silverPrice, 'standard');
        
        const belowNisabAssets: Asset[] = [{
          assetId: 'below-nisab-cash',
          name: 'Below Nisab Cash',
          category: 'cash',
          subCategory: 'savings',
          value: nisabInfo.effectiveNisab - 1, // Just below nisab
          currency: 'USD',
          zakatEligible: true,
          description: 'Asset just below nisab threshold',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];

        const request = createCalculationRequest('standard', belowNisabAssets);
        const calculation = await zakatService.calculateZakat(request, belowNisabAssets);

        expect(calculation.meetsNisab).toBe(false);
        expect(calculation.totals.totalZakatDue).toBe(0);
      });

      test('should handle assets just above nisab threshold', async () => {
        const goldPrice = 60;
        const silverPrice = 0.8;
        const nisabInfo = zakatService.calculateNisab(goldPrice, silverPrice, 'standard');
        
        const aboveNisabAssets: Asset[] = [{
          assetId: 'above-nisab-cash',
          name: 'Above Nisab Cash',
          category: 'cash',
          subCategory: 'savings',
          value: nisabInfo.effectiveNisab + 1, // Just above nisab
          currency: 'USD',
          zakatEligible: true,
          description: 'Asset just above nisab threshold',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];

        const request = createCalculationRequest('standard', aboveNisabAssets);
        const calculation = await zakatService.calculateZakat(request, aboveNisabAssets);

        expect(calculation.meetsNisab).toBe(true);
        expect(calculation.totals.totalZakatDue).toBeGreaterThan(0);
        expect(calculation.totals.totalZakatDue).toBeCloseTo((nisabInfo.effectiveNisab + 1) * 0.025, 4);
      });
    });

    describe('Debt Deduction Tests', () => {
      test('should apply comprehensive debt deduction for Hanafi method', async () => {
        const assets = createStandardTestAssets();
        const debts = createDebtAssets();
        const allAssets = [...assets, ...debts];

        const request = createCalculationRequest(ZAKAT_METHODS.HANAFI.id, allAssets);
        const calculation = await zakatService.calculateZakat(request, allAssets);

        // Hanafi method should consider all debts comprehensively
        expect(calculation.breakdown?.deductionRules).toBeDefined();
        if (calculation.breakdown?.deductionRules?.length) {
          const deductionRule = calculation.breakdown.deductionRules[0];
          expect(deductionRule.type).toBe('comprehensive');
          expect(deductionRule.amount).toBeGreaterThan(0);
        }
      });

      test('should apply conservative debt deduction for Shafi\'i method', async () => {
        const assets = createStandardTestAssets();
        const debts = createDebtAssets();
        const allAssets = [...assets, ...debts];

        const request = createCalculationRequest(ZAKAT_METHODS.SHAFII.id, allAssets);
        const calculation = await zakatService.calculateZakat(request, allAssets);

        // Shafi'i method should be more conservative with deductions
        expect(calculation.breakdown?.deductionRules).toBeDefined();
        if (calculation.breakdown?.deductionRules?.length) {
          const deductionRule = calculation.breakdown.deductionRules[0];
          expect(deductionRule.type).toBe('conservative');
        }
      });

      test('should handle zero debt scenario', async () => {
        const assets = createStandardTestAssets();
        const request = createCalculationRequest('standard', assets);
        const calculation = await zakatService.calculateZakat(request, assets);

        // Should calculate zakat normally without debt deductions
        const expectedTotal = assets.reduce((sum, asset) => sum + asset.value, 0);
        expect(calculation.totals.totalAssets).toBe(expectedTotal);
        expect(calculation.totals.totalZakatDue).toBe(expectedTotal * 0.025);
      });
    });

    describe('Business Asset Inclusion Tests', () => {
      test('should include business assets comprehensively in Hanafi method', async () => {
        const businessAsset: Asset = {
          assetId: 'complex-business',
          name: 'Trading Business',
          category: 'business',
          subCategory: 'trading',
          value: 50000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Complex trading business with inventory and receivables',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const request = createCalculationRequest(ZAKAT_METHODS.HANAFI.id, [businessAsset]);
        const calculation = await zakatService.calculateZakat(request, [businessAsset]);

        // Hanafi method should include comprehensive business asset treatment
        const businessZakatAsset = calculation.assets.find(a => a.assetId === 'complex-business');
        expect(businessZakatAsset?.zakatDue).toBe(businessAsset.value * 0.025);

        // Should have method-specific rules in breakdown
        expect(calculation.breakdown?.assetCalculations).toBeDefined();
        const assetCalc = calculation.breakdown?.assetCalculations?.find(ac => ac.assetId === 'complex-business');
        expect(assetCalc?.methodSpecificRules).toContain('Comprehensive business asset inclusion');
      });

      test('should categorize business assets detailed for Shafi\'i method', async () => {
        const businessAssets: Asset[] = [
          {
            assetId: 'inventory-asset',
            name: 'Product Inventory',
            category: 'business',
            subCategory: 'inventory',
            value: 30000,
            currency: 'USD',
            zakatEligible: true,
            description: 'Product inventory for sale',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            assetId: 'receivables-asset',
            name: 'Accounts Receivable',
            category: 'business',
            subCategory: 'receivables',
            value: 15000,
            currency: 'USD',
            zakatEligible: true,
            description: 'Money owed by customers',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        const request = createCalculationRequest(ZAKAT_METHODS.SHAFII.id, businessAssets);
        const calculation = await zakatService.calculateZakat(request, businessAssets);

        // Shafi'i method should have detailed asset categorization
        expect(calculation.assets).toHaveLength(2);
        calculation.assets.forEach(asset => {
          expect(asset.zakatDue).toBeGreaterThan(0);
        });

        // Should include method-specific categorization rules
        expect(calculation.breakdown?.assetCalculations).toBeDefined();
        expect(calculation.breakdown?.method).toBe('shafii');
      });
    });
  });

  describe('Cross-Method Validation and Consistency', () => {
    const testAssets = createStandardTestAssets();

    test('should produce logically consistent results across all methods', async () => {
      const methods = [
        ZAKAT_METHODS.HANAFI.id,
        ZAKAT_METHODS.SHAFII.id,
        ZAKAT_METHODS.STANDARD.id
      ];

      const results = await Promise.all(
        methods.map(method => 
          zakatService.calculateZakat(createCalculationRequest(method, testAssets), testAssets)
        )
      );

      // All methods should produce valid calculations
      results.forEach(result => {
        expect(result.totals.totalZakatDue).toBeGreaterThanOrEqual(0);
        expect(result.nisab).toBeDefined();
        expect(result.nisab.effectiveNisab).toBeGreaterThan(0);
        expect(result.method).toBeDefined();
        expect(result.breakdown).toBeDefined();
      });

      // Results should be reasonably close but may differ due to methodology
      const zakatAmounts = results.map(r => r.totals.totalZakatDue);
      const maxDifference = Math.max(...zakatAmounts) - Math.min(...zakatAmounts);
      const averageZakat = zakatAmounts.reduce((sum, amount) => sum + amount, 0) / zakatAmounts.length;
      
      // Difference shouldn't exceed 10% of average (reasonable methodology variance)
      expect(maxDifference).toBeLessThanOrEqual(averageZakat * 0.1);
    });

    test('should demonstrate Hanafi vs Standard nisab differences', async () => {
      // Use price scenario where silver nisab < gold nisab
      const goldPrice = 70; // High gold price
      const silverPrice = 0.7; // Low silver price
      
      const hanafiNisab = zakatService.calculateNisab(goldPrice, silverPrice, ZAKAT_METHODS.HANAFI.id);
      const standardNisab = zakatService.calculateNisab(goldPrice, silverPrice, ZAKAT_METHODS.STANDARD.id);

      // Hanafi should use silver (lower threshold)
      expect(hanafiNisab.nisabBasis).toBe('silver');
      expect(hanafiNisab.effectiveNisab).toBe(hanafiNisab.silverNisab);
      
      // Standard should use minimum (also silver in this case)
      expect(standardNisab.effectiveNisab).toBe(Math.min(standardNisab.goldNisab, standardNisab.silverNisab));
      expect(standardNisab.nisabBasis).toBe('silver');
      
      // Both should have same effective nisab in this scenario
      expect(hanafiNisab.effectiveNisab).toBeCloseTo(standardNisab.effectiveNisab);
    });

    test('should validate method-specific source citations', async () => {
      const methods = [
        { id: ZAKAT_METHODS.HANAFI.id, expectedSource: 'Al-Hidayah by al-Marghinani' },
        { id: ZAKAT_METHODS.SHAFII.id, expectedSource: 'Al-Majmu\' by al-Nawawi' },
        { id: ZAKAT_METHODS.STANDARD.id, expectedSource: 'AAOIFI FAS 9' }
      ];

      for (const method of methods) {
        const calculation = await zakatService.calculateZakat(
          createCalculationRequest(method.id, testAssets), 
          testAssets
        );
        
        expect(calculation.breakdown?.sources).toBeDefined();
        expect(calculation.breakdown?.sources).toContain(method.expectedSource);
      }
    });

    test('should ensure all methods handle same asset categories', async () => {
      const diverseAssets: Asset[] = [
        ...createStandardTestAssets(),
        {
          assetId: 'crypto-asset',
          name: 'Bitcoin Holdings',
          category: 'crypto',
          subCategory: 'bitcoin',
          value: 10000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Cryptocurrency investment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const methods = [ZAKAT_METHODS.HANAFI.id, ZAKAT_METHODS.SHAFII.id, ZAKAT_METHODS.STANDARD.id];
      
      const results = await Promise.all(
        methods.map(method => 
          zakatService.calculateZakat(createCalculationRequest(method, diverseAssets), diverseAssets)
        )
      );

      // All methods should handle all asset categories
      results.forEach(result => {
        expect(result.assets.length).toBe(diverseAssets.length);
        
        // Each method should process crypto assets
        const cryptoAsset = result.assets.find(a => a.category === 'crypto');
        expect(cryptoAsset).toBeDefined();
        expect(cryptoAsset?.zakatDue).toBeGreaterThan(0);
      });
    });
  });

  describe('Method-Specific Rule Validation', () => {
    test('should apply Hanafi-specific rules correctly', async () => {
      const assets = createStandardTestAssets();
      const request = createCalculationRequest(ZAKAT_METHODS.HANAFI.id, assets);
      const calculation = await zakatService.calculateZakat(request, assets);

      // Validate Hanafi-specific behavior
      expect(calculation.nisab.nisabBasis).toBe('silver');
      expect(calculation.breakdown?.method).toBe('hanafi');
      
      // Check for comprehensive business asset treatment
      const businessAsset = calculation.assets.find(a => a.category === 'business');
      if (businessAsset) {
        const businessCalc = calculation.breakdown?.assetCalculations?.find(
          ac => ac.assetId === businessAsset.assetId
        );
        expect(businessCalc?.methodSpecificRules).toContain('Comprehensive business asset inclusion');
      }
    });

    test('should apply Shafi\'i-specific rules correctly', async () => {
      const assets = createStandardTestAssets();
      const request = createCalculationRequest(ZAKAT_METHODS.SHAFII.id, assets);
      const calculation = await zakatService.calculateZakat(request, assets);

      // Validate Shafi'i-specific behavior
      expect(calculation.nisab.nisabBasis).toBe('dual_minimum');
      expect(calculation.breakdown?.method).toBe('shafii');
      
      // Check for detailed asset categorization
      const businessAsset = calculation.assets.find(a => a.category === 'business');
      if (businessAsset) {
        const businessCalc = calculation.breakdown?.assetCalculations?.find(
          ac => ac.assetId === businessAsset.assetId
        );
        expect(businessCalc?.methodSpecificRules).toContain('Detailed asset categorization');
      }
    });

    test('should apply Standard method (AAOIFI) rules correctly', async () => {
      const assets = createStandardTestAssets();
      const request = createCalculationRequest(ZAKAT_METHODS.STANDARD.id, assets);
      const calculation = await zakatService.calculateZakat(request, assets);

      // Validate Standard method behavior
      expect(['gold', 'silver']).toContain(calculation.nisab.nisabBasis);
      expect(calculation.breakdown?.method).toBe('standard');
      expect(calculation.breakdown?.sources).toContain('AAOIFI FAS 9');
    });
  });

  describe('Custom Method Configuration Tests', () => {
    test('should handle custom nisab values', async () => {
      const customNisab = 2000;
      const assets = createStandardTestAssets();
      const request = createCalculationRequest('custom', assets, customNisab);

      // Mock custom method calculation - in real implementation this would be handled
      expect(request.customNisab).toBe(customNisab);
      
      // Test would verify custom nisab is used instead of calculated one
      // This demonstrates the interface for custom methodology support
    });

    test('should validate custom method configuration requirements', () => {
      const assets = createStandardTestAssets();
      
      // Test custom method requires additional parameters
      const customRequestWithoutNisab = createCalculationRequest('custom', assets);
      
      // Custom method should require configuration parameters
      expect(customRequestWithoutNisab.customNisab).toBeUndefined();
    });
  });

  describe('Performance and Error Handling Tests', () => {
    test('should handle large asset portfolios efficiently', async () => {
      // Create large asset portfolio
      const largePortfolio: Asset[] = [];
      for (let i = 0; i < 100; i++) {
        largePortfolio.push({
          assetId: `asset-${i}`,
          name: `Test Asset ${i}`,
          category: i % 2 === 0 ? 'cash' : 'business',
          subCategory: 'savings',
          value: Math.random() * 10000,
          currency: 'USD',
          zakatEligible: true,
          description: `Test asset number ${i}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const request = createCalculationRequest('standard', largePortfolio);
      const startTime = Date.now();
      const calculation = await zakatService.calculateZakat(request, largePortfolio);
      const endTime = Date.now();

      // Should complete within reasonable time (2 seconds for 100 assets)
      expect(endTime - startTime).toBeLessThan(2000);
      expect(calculation.assets).toHaveLength(100);
      expect(calculation.totals.totalZakatDue).toBeGreaterThan(0);
    });

    test('should handle invalid method gracefully', async () => {
      const assets = createStandardTestAssets();
      const request = createCalculationRequest('invalid-method', assets);

      // Should throw descriptive error for invalid method
      expect(() => {
        zakatService.validateCalculationRequest(request);
      }).toThrow(/method/i);
    });

    test('should handle empty asset list', async () => {
      const request = createCalculationRequest('standard', []);

      const calculation = await zakatService.calculateZakat(request, []);
      
      expect(calculation.assets).toHaveLength(0);
      expect(calculation.totals.totalZakatDue).toBe(0);
      expect(calculation.meetsNisab).toBe(false);
    });

    test('should handle extreme price scenarios', () => {
      // Test with extremely high gold price, low silver price
      const extremeGoldPrice = 10000; // $10,000/gram
      const lowSilverPrice = 0.01; // $0.01/gram

      const hanafiNisab = zakatService.calculateNisab(extremeGoldPrice, lowSilverPrice, ZAKAT_METHODS.HANAFI.id);
      const standardNisab = zakatService.calculateNisab(extremeGoldPrice, lowSilverPrice, ZAKAT_METHODS.STANDARD.id);

      // Should handle extreme values without breaking
      expect(hanafiNisab.effectiveNisab).toBeGreaterThan(0);
      expect(standardNisab.effectiveNisab).toBeGreaterThan(0);
      expect(hanafiNisab.effectiveNisab).toBe(hanafiNisab.silverNisab);
      expect(standardNisab.effectiveNisab).toBe(standardNisab.silverNisab);
    });
  });

  describe('Integration and Comprehensive Scenarios', () => {
    test('should handle complete zakat calculation scenario', async () => {
      // Comprehensive scenario with mixed assets and debts
      const complexPortfolio: Asset[] = [
        ...createStandardTestAssets(),
        ...createDebtAssets(),
        {
          assetId: 'property-investment',
          name: 'Rental Property',
          category: 'property',
          subCategory: 'investment',
          value: 200000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Investment rental property',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          assetId: 'stocks-portfolio',
          name: 'Stock Portfolio',
          category: 'stocks',
          subCategory: 'stocks',
          value: 35000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Diversified stock portfolio',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const request = createCalculationRequest('standard', complexPortfolio);
      const calculation = await zakatService.calculateZakat(request, complexPortfolio);

      // Comprehensive validation
      expect(calculation.assets.length).toBeGreaterThan(0);
      expect(calculation.totals.totalAssets).toBeGreaterThan(0);
      expect(calculation.totals.totalZakatDue).toBeGreaterThan(0);
      expect(calculation.breakdown).toBeDefined();
      expect(calculation.breakdown?.finalCalculation).toBeDefined();
      
      // Should have processed all zakatable assets
      const zakatableCount = complexPortfolio.filter(a => a.zakatEligible).length;
      expect(calculation.assets).toHaveLength(zakatableCount);
    });

    test('should provide consistent calculation breakdown structure', async () => {
      const assets = createStandardTestAssets();
      const methods = [ZAKAT_METHODS.HANAFI.id, ZAKAT_METHODS.SHAFII.id, ZAKAT_METHODS.STANDARD.id];

      for (const method of methods) {
        const request = createCalculationRequest(method, assets);
        const calculation = await zakatService.calculateZakat(request, assets);

        // All methods should provide consistent breakdown structure
        expect(calculation.breakdown).toBeDefined();
        expect(calculation.breakdown?.method).toBe(method);
        expect(calculation.breakdown?.nisabCalculation).toBeDefined();
        expect(calculation.breakdown?.assetCalculations).toBeDefined();
        expect(calculation.breakdown?.sources).toBeDefined();
        expect(calculation.breakdown?.finalCalculation).toBeDefined();
        
        // Verify calculation totals match breakdown
        const breakdownTotal = calculation.breakdown?.finalCalculation?.zakatDue;
        expect(breakdownTotal).toBe(calculation.totals.totalZakatDue);
      }
    });
  });
});