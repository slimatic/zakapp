import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
// Import from source to avoid ES module issues in Jest
import { ASSET_CATEGORIES } from '../../../shared/src/constants';
import {
  createAssetSchema,
  updateAssetSchema,
  createAssetSchemaEnhanced,
  assetHistorySchema,
} from '../utils/validation';

describe('Asset Type Definitions', () => {
  describe('Asset Categories', () => {
    it('should have all expected asset categories', () => {
      const expectedCategories = ['cash', 'gold', 'silver', 'business', 'property', 'stocks', 'crypto', 'debt'];
      const actualCategories = Object.values(ASSET_CATEGORIES).map(cat => cat.id);
      
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

    it('should have debt category with zakatEligible false', () => {
      const debtCategory = ASSET_CATEGORIES.DEBT;
      expect(debtCategory).toBeDefined();
      expect(debtCategory.zakatEligible).toBe(false);
      expect(debtCategory.zakatRate).toBe(0);
    });

    it('should have non-debt categories with zakatEligible true', () => {
      const nonDebtCategories = Object.values(ASSET_CATEGORIES).filter(cat => cat.id !== 'debt');
      nonDebtCategories.forEach(category => {
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
        category: 'debt' as const,
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

  describe('Asset History Schema', () => {
    it('should validate asset history entry', () => {
      const historyEntry = {
        historyId: 'hist-123',
        assetId: 'asset-456',
        action: 'created' as const,
        timestamp: new Date().toISOString(),
        newData: {
          assetId: 'asset-456',
          name: 'Test Asset',
          category: 'cash',
          value: 1000,
        },
      };

      const result = assetHistorySchema.safeParse(historyEntry);
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const historyEntry = {
        historyId: 'hist-123',
        assetId: 'asset-456',
        action: 'invalid_action',
        timestamp: new Date().toISOString(),
        newData: {},
      };

      const result = assetHistorySchema.safeParse(historyEntry);
      expect(result.success).toBe(false);
    });
  });
});