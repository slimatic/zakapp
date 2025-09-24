import { ZakatService } from '../services/zakatService';
import type { Asset, ZakatCalculationRequest } from '@zakapp/shared';

describe('Zakat Integration Tests', () => {
  let zakatService: ZakatService;
  
  beforeEach(() => {
    zakatService = new ZakatService();
  });

  describe('Real-world calculation scenarios', () => {
    
    it('should calculate zakat for a typical Muslim household', async () => {
      // Scenario: A family with multiple assets
      const assets: Asset[] = [
        {
          assetId: 'cash-checking',
          name: 'Primary Checking Account',
          category: 'cash',
          subCategory: 'checking',
          value: 8000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Family checking account',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          assetId: 'cash-savings',
          name: 'Emergency Savings',
          category: 'cash',
          subCategory: 'savings',
          value: 12000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Emergency fund',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          assetId: 'gold-jewelry',
          name: 'Gold Jewelry',
          category: 'gold',
          subCategory: 'jewelry',
          value: 3000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Family gold jewelry',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['cash-checking', 'cash-savings', 'gold-jewelry']
      };

      const calculation = await zakatService.calculateZakat(request, assets);

      // Verify calculation results
      expect(calculation.meetsNisab).toBe(true);
      expect(calculation.totals.totalAssets).toBe(23000); // 8000 + 12000 + 3000
      expect(calculation.totals.totalZakatableAssets).toBe(23000);
      expect(calculation.totals.totalZakatDue).toBe(575); // 2.5% of 23000
      expect(calculation.assets).toHaveLength(3);
      
      // Verify individual asset calculations
      const checkingAsset = calculation.assets.find(a => a.assetId === 'cash-checking');
      expect(checkingAsset?.zakatDue).toBe(200); // 2.5% of 8000
      
      const savingsAsset = calculation.assets.find(a => a.assetId === 'cash-savings');
      expect(savingsAsset?.zakatDue).toBe(300); // 2.5% of 12000
      
      const goldAsset = calculation.assets.find(a => a.assetId === 'gold-jewelry');
      expect(goldAsset?.zakatDue).toBe(75); // 2.5% of 3000
    });

    it('should handle assets below nisab threshold', async () => {
      // Scenario: Small amount below nisab
      const assets: Asset[] = [
        {
          assetId: 'small-cash',
          name: 'Petty Cash',
          category: 'cash',
          subCategory: 'cash_on_hand',
          value: 100,
          currency: 'USD',
          zakatEligible: true,
          description: 'Small cash amount',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['small-cash']
      };

      const calculation = await zakatService.calculateZakat(request, assets);

      // Should not meet nisab and have zero zakat due
      expect(calculation.meetsNisab).toBe(false);
      expect(calculation.totals.totalZakatDue).toBe(0);
      expect(calculation.assets[0].zakatDue).toBe(0);
    });

    it('should correctly apply Hanafi method (silver nisab)', async () => {
      const assets: Asset[] = [
        {
          assetId: 'moderate-cash',
          name: 'Moderate Savings',
          category: 'cash',
          subCategory: 'savings',
          value: 500, // Amount between silver and gold nisab
          currency: 'USD',
          zakatEligible: true,
          description: 'Moderate savings amount',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const standardRequest: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['moderate-cash']
      };

      const hanafiRequest: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'hanafi',
        includeAssets: ['moderate-cash']
      };

      const standardCalc = await zakatService.calculateZakat(standardRequest, assets);
      const hanafiCalc = await zakatService.calculateZakat(hanafiRequest, assets);

      // Both should meet nisab since $500 > silver nisab (~$490)
      expect(standardCalc.meetsNisab).toBe(true);
      expect(hanafiCalc.meetsNisab).toBe(true);
      
      // Hanafi method should use silver nisab as effective nisab
      expect(hanafiCalc.nisab.effectiveNisab).toBe(hanafiCalc.nisab.silverNisab);
      expect(standardCalc.nisab.effectiveNisab).toBe(Math.min(
        standardCalc.nisab.goldNisab, 
        standardCalc.nisab.silverNisab
      ));
    });

    it('should handle mixed zakatable and non-zakatable assets', async () => {
      const assets: Asset[] = [
        {
          assetId: 'cash-1',
          name: 'Savings Account',
          category: 'cash',
          subCategory: 'savings',
          value: 10000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Zakatable savings',
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
          description: 'Family home',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const request: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: ['cash-1', 'house-1']
      };

      const calculation = await zakatService.calculateZakat(request, assets);

      // Should only include zakatable assets in calculation
      expect(calculation.assets).toHaveLength(1);
      expect(calculation.assets[0].assetId).toBe('cash-1');
      expect(calculation.totals.totalAssets).toBe(10000); // Only cash counted
      expect(calculation.totals.totalZakatDue).toBe(250); // 2.5% of 10000
    });

    it('should validate edge cases and error conditions', async () => {
      const assets: Asset[] = [
        {
          assetId: 'test-asset',
          name: 'Test Asset',
          category: 'cash',
          subCategory: 'savings',
          value: 1000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Test asset',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Test invalid calculation date
      expect(() => {
        zakatService.validateCalculationRequest({
          calculationDate: 'invalid-date',
          calendarType: 'lunar',
          method: 'standard',
          includeAssets: ['test-asset']
        });
      }).toThrow('Invalid calculation date format');

      // Test empty asset list
      expect(() => {
        zakatService.validateCalculationRequest({
          calculationDate: new Date().toISOString(),
          calendarType: 'lunar',
          method: 'standard',
          includeAssets: []
        });
      }).toThrow('At least one asset must be included');

      // Test invalid method
      expect(() => {
        zakatService.validateCalculationRequest({
          calculationDate: new Date().toISOString(),
          calendarType: 'lunar',
          method: 'invalid-method',
          includeAssets: ['test-asset']
        });
      }).toThrow('Valid calculation method is required');
    });
  });
});