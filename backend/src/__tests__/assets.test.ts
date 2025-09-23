import { describe, it, expect } from '@jest/globals';
// Import from source to avoid ES module issues in Jest
import { ASSET_CATEGORIES } from '../../../shared/src/constants';
import { createAssetSchema, updateAssetSchema } from '../utils/validation';

describe('Asset Type Definitions', () => {
  describe('Asset Categories', () => {
    it('should have all expected asset categories', () => {
      const expectedCategories = [
        'cash',
        'gold',
        'silver',
        'business',
        'property',
        'stocks',
        'crypto',
        'debts',
      ];
      const actualCategories = Object.values(ASSET_CATEGORIES).map(
        cat => cat.id
      );

      expectedCategories.forEach(expectedCat => {
        expect(actualCategories).toContain(expectedCat);
      });
    });

    it('should have subcategories for each asset category', () => {
      Object.values(ASSET_CATEGORIES).forEach(category => {
        expect(category.subCategories).toBeDefined();
        expect(Array.isArray(category.subCategories)).toBe(true);
        expect(category.subCategories.length).toBeGreaterThan(0);
      });
    });

    it('should have debts category with zakatEligible true', () => {
      const debtsCategory = ASSET_CATEGORIES.DEBTS;
      expect(debtsCategory).toBeDefined();
      expect(debtsCategory.zakatEligible).toBe(true);
      expect(debtsCategory.zakatRate).toBe(2.5);
    });

    it('should have all categories with zakatEligible true', () => {
      const allCategories = Object.values(ASSET_CATEGORIES);
      allCategories.forEach(category => {
        expect(category.zakatEligible).toBe(true);
        expect(category.zakatRate).toBe(2.5);
      });
    });
  });

  describe('Asset Validation Schemas', () => {
    it('should validate a basic cash asset', () => {
      const assetData = {
        name: 'Savings Account',
        category: 'cash' as const,
        subCategory: 'savings',
        value: 10000,
        currency: 'USD',
        zakatEligible: true,
      };

      const result = createAssetSchema.safeParse(assetData);
      expect(result.success).toBe(true);
    });

    it('should validate a debt asset', () => {
      const assetData = {
        name: 'Credit Card Debt',
        category: 'debts' as const,
        subCategory: 'credit_cards',
        value: -5000, // Negative value for debt
        currency: 'USD',
        zakatEligible: false,
      };

      const result = createAssetSchema.safeParse(assetData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const assetData = {
        name: 'Invalid Asset',
        category: 'invalid_category',
        subCategory: 'test',
        value: 1000,
        currency: 'USD',
        zakatEligible: true,
      };

      const result = createAssetSchema.safeParse(assetData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid currency code', () => {
      const assetData = {
        name: 'Test Asset',
        category: 'cash' as const,
        subCategory: 'savings',
        value: 1000,
        currency: 'INVALID', // Must be 3 characters
        zakatEligible: true,
      };

      const result = createAssetSchema.safeParse(assetData);
      expect(result.success).toBe(false);
    });

    it('should validate update schema with partial data', () => {
      const updateData = {
        value: 15000,
        description: 'Updated savings account balance',
      };

      const result = updateAssetSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });
});
