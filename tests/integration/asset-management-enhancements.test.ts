import { ASSET_CATEGORIES } from '@zakapp/shared';
import { 
  genericAssetSchema, 
  expensesAssetSchema, 
  stocksAssetSchema 
} from '@zakapp/shared';

describe('Asset Management Enhancements', () => {
  describe('New Asset Categories', () => {
    test('should include retirement investment subcategories in stocks', () => {
      const stocksCategory = ASSET_CATEGORIES.STOCKS;
      const subcategoryIds = stocksCategory.subCategories.map(sc => sc.id);
      
      expect(subcategoryIds).toContain('retirement_401k');
      expect(subcategoryIds).toContain('retirement_ira');
      expect(subcategoryIds).toContain('retirement_other');
    });

    test('should have expenses category with proper subcategories', () => {
      const expensesCategory = ASSET_CATEGORIES.EXPENSES;
      
      expect(expensesCategory).toBeDefined();
      expect(expensesCategory.name).toBe('Deductible Expenses');
      expect(expensesCategory.zakatEligible).toBe(false);
      expect(expensesCategory.nisabApplicable).toBe(false);
      
      const subcategoryIds = expensesCategory.subCategories.map(sc => sc.id);
      expect(subcategoryIds).toContain('debts_owed');
      expect(subcategoryIds).toContain('essential_needs');
      expect(subcategoryIds).toContain('family_obligations');
      expect(subcategoryIds).toContain('business_liabilities');
    });
  });

  describe('Schema Validation', () => {
    test('should validate retirement 401k asset', () => {
      const retirement401k = {
        name: 'My 401k Account',
        category: 'stocks',
        subCategory: 'retirement_401k',
        value: 50000,
        currency: 'USD',
        zakatEligible: true,
        employerMatch: 50,
        vestingSchedule: '4 year graded'
      };

      const result = genericAssetSchema.safeParse(retirement401k);
      expect(result.success).toBe(true);
    });

    test('should validate IRA asset', () => {
      const iraAsset = {
        name: 'Roth IRA',
        category: 'stocks',
        subCategory: 'retirement_ira',
        value: 25000,
        currency: 'USD',
        zakatEligible: true,
        iraType: 'roth',
        contributionLimit: 6500
      };

      const result = genericAssetSchema.safeParse(iraAsset);
      expect(result.success).toBe(true);
    });

    test('should validate expense asset', () => {
      const expenseAsset = {
        name: 'Credit Card Debt',
        category: 'expenses',
        subCategory: 'debts_owed',
        value: 5000,
        currency: 'USD',
        zakatEligible: false,
        creditor: 'Bank XYZ',
        interestRate: 18.5
      };

      const result = genericAssetSchema.safeParse(expenseAsset);
      expect(result.success).toBe(true);
    });

    test('should validate family obligations expense', () => {
      const familyObligation = {
        name: 'Child Support',
        category: 'expenses',
        subCategory: 'family_obligations',
        value: 12000,
        currency: 'USD',
        zakatEligible: false,
        dependentCount: 2,
        supportType: 'Child support'
      };

      const result = genericAssetSchema.safeParse(familyObligation);
      expect(result.success).toBe(true);
    });
  });

  describe('Asset Category Properties', () => {
    test('should have correct zakat rates for all categories', () => {
      const categories = Object.values(ASSET_CATEGORIES);
      
      categories.forEach(category => {
        if (category.id === 'expenses') {
          expect(category.zakatRate).toBe(0);
        } else {
          expect(category.zakatRate).toBe(2.5);
        }
      });
    });

    test('should have appropriate nisab applicability', () => {
      const expensesCategory = ASSET_CATEGORIES.EXPENSES;
      expect(expensesCategory.nisabApplicable).toBe(false);
      
      const stocksCategory = ASSET_CATEGORIES.STOCKS;
      expect(stocksCategory.nisabApplicable).toBe(true);
    });
  });
});