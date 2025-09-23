import request from 'supertest';
import app from '../index.js';
import { Asset, AssetCategoryType } from '@zakapp/shared';

describe('Enhanced Asset Management', () => {
  let authToken: string;
  const testUser = {
    username: 'enhanceduser',
    email: 'enhanceduser@example.com',
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123',
  };

  beforeAll(async () => {
    // Register and login user for testing
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password,
      });

    authToken = loginResponse.body.data.token;
  });

  describe('Asset CRUD Operations', () => {
    let createdAssetId: string;

    it('should create a comprehensive asset with all fields', async () => {
      const comprehensiveAsset = {
        name: 'Comprehensive Test Asset',
        category: 'gold',
        subCategory: 'jewelry',
        value: 5000,
        currency: 'USD',
        description: 'A detailed test asset with all possible fields',
        zakatEligible: true,
        weight: 25.5,
        purity: 22,
      };

      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(comprehensiveAsset)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.asset).toBeDefined();
      
      const asset = response.body.data.asset;
      createdAssetId = asset.assetId;
      
      expect(asset.name).toBe(comprehensiveAsset.name);
      expect(asset.category).toBe(comprehensiveAsset.category);
      expect(asset.subCategory).toBe(comprehensiveAsset.subCategory);
      expect(asset.value).toBe(comprehensiveAsset.value);
      expect(asset.currency).toBe(comprehensiveAsset.currency);
      expect(asset.description).toBe(comprehensiveAsset.description);
      expect(asset.zakatEligible).toBe(comprehensiveAsset.zakatEligible);
      expect(asset.createdAt).toBeDefined();
      expect(asset.updatedAt).toBeDefined();
    });

    it('should retrieve the created asset by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/assets/${createdAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.asset.assetId).toBe(createdAssetId);
      expect(response.body.data.asset.name).toBe('Comprehensive Test Asset');
    });

    it('should update the asset with new values', async () => {
      const updateData = {
        value: 6000,
        description: 'Updated description with new value',
      };

      const response = await request(app)
        .put(`/api/v1/assets/${createdAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.asset.value).toBe(updateData.value);
      expect(response.body.data.asset.description).toBe(updateData.description);
      expect(response.body.data.asset.updatedAt).not.toBe(response.body.data.asset.createdAt);
    });

    it('should delete the asset', async () => {
      await request(app)
        .delete(`/api/v1/assets/${createdAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify asset is deleted
      await request(app)
        .get(`/api/v1/assets/${createdAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Asset Category Management', () => {
    it('should get all available asset categories', async () => {
      const response = await request(app)
        .get('/api/v1/assets/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThan(0);

      // Check for expected categories
      const categoryIds = response.body.data.categories.map((cat: any) => cat.id);
      expect(categoryIds).toContain('cash');
      expect(categoryIds).toContain('gold');
      expect(categoryIds).toContain('silver');
      expect(categoryIds).toContain('business');
      expect(categoryIds).toContain('property');
      expect(categoryIds).toContain('stocks');
      expect(categoryIds).toContain('crypto');
      expect(categoryIds).toContain('debts');
    });

    it('should get subcategories for a specific category', async () => {
      const response = await request(app)
        .get('/api/v1/assets/categories/cash/subcategories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subcategories).toBeDefined();
      expect(Array.isArray(response.body.data.subcategories)).toBe(true);
      expect(response.body.data.subcategories.length).toBeGreaterThan(0);

      // Check for expected cash subcategories
      const subCategoryIds = response.body.data.subcategories.map((sub: any) => sub.id);
      expect(subCategoryIds).toContain('savings');
      expect(subCategoryIds).toContain('checking');
      expect(subCategoryIds).toContain('cash_on_hand');
    });

    it('should return 404 for non-existent category', async () => {
      await request(app)
        .get('/api/v1/assets/categories/nonexistent/subcategories')
        .expect(404);
    });
  });

  describe('Asset Filtering and Grouping', () => {
    beforeAll(async () => {
      // Create test assets across different categories
      const testAssets = [
        {
          name: 'Savings Account',
          category: 'cash',
          subCategory: 'savings',
          value: 10000,
          currency: 'USD',
          zakatEligible: true,
        },
        {
          name: 'Checking Account',
          category: 'cash',
          subCategory: 'checking',
          value: 5000,
          currency: 'USD',
          zakatEligible: true,
        },
        {
          name: 'Gold Necklace',
          category: 'gold',
          subCategory: 'jewelry',
          value: 3000,
          currency: 'USD',
          zakatEligible: true,
          weight: 20,
          purity: 18,
        },
        {
          name: 'Investment Property',
          category: 'property',
          subCategory: 'residential_investment',
          value: 200000,
          currency: 'USD',
          zakatEligible: true,
          location: 'New York',
          rentalIncome: 2000,
        },
      ];

      for (const asset of testAssets) {
        await request(app)
          .post('/api/v1/assets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(asset);
      }
    });

    it('should get all user assets with totals', async () => {
      const response = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assets).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.totalZakatEligible).toBeDefined();
      expect(response.body.data.assets.length).toBeGreaterThanOrEqual(4);
      expect(response.body.data.totalValue).toBeGreaterThan(200000);
    });

    it('should filter assets by category', async () => {
      const response = await request(app)
        .get('/api/v1/assets?category=cash')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assets).toBeDefined();
      
      // All returned assets should be cash category
      const assets = response.body.data.assets;
      expect(assets.length).toBeGreaterThanOrEqual(2);
      assets.forEach((asset: Asset) => {
        expect(asset.category).toBe('cash');
      });
    });

    it('should get grouped assets by category', async () => {
      const response = await request(app)
        .get('/api/v1/assets/grouped')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groupedAssets).toBeDefined();
      
      const groupedAssets = response.body.data.groupedAssets;
      expect(groupedAssets.cash).toBeDefined();
      expect(groupedAssets.gold).toBeDefined();
      expect(groupedAssets.property).toBeDefined();
      expect(Array.isArray(groupedAssets.cash)).toBe(true);
      expect(groupedAssets.cash.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Asset Statistics', () => {
    it('should get comprehensive asset statistics', async () => {
      const response = await request(app)
        .get('/api/v1/assets/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      
      const stats = response.body.data.statistics;
      expect(stats.totalAssets).toBeGreaterThan(0);
      expect(stats.totalValue).toBeGreaterThan(0);
      expect(stats.totalZakatEligible).toBeGreaterThan(0);
      expect(stats.assetsByCategory).toBeDefined();
      expect(typeof stats.assetsByCategory).toBe('object');
    });
  });

  describe('Asset History Tracking', () => {
    let trackingAssetId: string;

    it('should track asset creation in history', async () => {
      // Create an asset
      const newAsset = {
        name: 'History Tracked Asset',
        category: 'stocks',
        subCategory: 'individual_stocks',
        value: 15000,
        currency: 'USD',
        zakatEligible: true,
        ticker: 'TSLA',
        shares: 50,
      };

      const createResponse = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newAsset)
        .expect(201);

      trackingAssetId = createResponse.body.data.asset.assetId;

      // Check history
      const historyResponse = await request(app)
        .get(`/api/v1/assets/${trackingAssetId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(historyResponse.body.success).toBe(true);
      expect(historyResponse.body.data.history).toBeDefined();
      expect(Array.isArray(historyResponse.body.data.history)).toBe(true);
      expect(historyResponse.body.data.history.length).toBeGreaterThan(0);
      
      const createHistory = historyResponse.body.data.history.find(
        (h: any) => h.action === 'created'
      );
      expect(createHistory).toBeDefined();
    });

    it('should track asset updates in history', async () => {
      // Update the asset
      const updateData = {
        value: 18000,
        shares: 60,
      };

      await request(app)
        .put(`/api/v1/assets/${trackingAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Check updated history
      const historyResponse = await request(app)
        .get(`/api/v1/assets/${trackingAssetId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const history = historyResponse.body.data.history;
      expect(history.length).toBeGreaterThanOrEqual(2);
      
      const updateHistory = history.find((h: any) => h.action === 'updated');
      expect(updateHistory).toBeDefined();
    });

    it('should get all asset history for user', async () => {
      const response = await request(app)
        .get('/api/v1/assets/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toBeDefined();
      expect(Array.isArray(response.body.data.history)).toBe(true);
      expect(response.body.data.history.length).toBeGreaterThan(0);
    });
  });

  describe('Asset Value Validation', () => {
    it('should reject assets with negative values', async () => {
      const invalidAsset = {
        name: 'Invalid Asset',
        category: 'cash',
        subCategory: 'savings',
        value: -1000, // Invalid negative value
        currency: 'USD',
        zakatEligible: true,
      };

      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAsset)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject assets with missing required fields', async () => {
      const incompleteAsset = {
        name: 'Incomplete Asset',
        // Missing category and subCategory
        value: 1000,
        currency: 'USD',
        zakatEligible: true,
      };

      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteAsset)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate currency format', async () => {
      const invalidCurrencyAsset = {
        name: 'Invalid Currency Asset',
        category: 'cash',
        subCategory: 'savings',
        value: 1000,
        currency: 'INVALID', // Invalid currency format
        zakatEligible: true,
      };

      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCurrencyAsset)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});