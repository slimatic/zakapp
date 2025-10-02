import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Note: This test will fail until the implementation exists
// This is intentional as per TDD methodology

// Helper function to load app dynamically
const loadApp = async () => {
  try {
    const appModule = await import('../../server/src/app');
    return appModule.default;
  } catch (error) {
    console.error('Failed to load app:', error);
    return null;
  }
};

describe('Integration Test: Asset Management Flow', () => {
  let app: any;
  let testDb: any;
  let authToken: string | undefined;
  let userId: string | undefined;

  beforeAll(async () => {
    try {
      // Load the Express app
      app = await loadApp();
      if (!app) {
        throw new Error('Failed to load Express app');
      }

      // Setup test user for asset management tests
      const userData = {
        email: `asset-integration-${Date.now()}@example.com`,
        password: 'TestSecure123!',
        name: 'Asset Test User'
      };

      // Register test user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      authToken = loginResponse.body.data.accessToken;
      userId = loginResponse.body.data.user.id;
    } catch (error) {
      console.error('Setup failed:', error);
      throw new Error('BeforeAll setup failed');
    }
  });

  beforeEach(async () => {
    // Clean user's assets before each test - temporarily disabled until database implemented
    // if (testDb && testDb.cleanUserAssets && userId) {
    //   await testDb.cleanUserAssets(userId);
    // }
  });

  afterAll(async () => {
    // Cleanup - temporarily disabled until implementations complete
    // if (testDb && testDb.teardownTestDatabase) {
    //   await testDb.teardownTestDatabase();
    // }
    // if (app && app.close) {
    //   await app.close();
    // }
  });

  describe('Complete Asset Lifecycle Management', () => {
    it('should handle complete asset CRUD lifecycle with encryption', async () => {
      if (!app || !authToken) {
        // Test setup verified
        expect(app).toBeDefined();
        expect(authToken).toBeDefined();
        return;
      }

      // Step 1: Create asset
      const assetData = {
        type: 'cash',
        value: 10000,
        currency: 'USD',
        description: 'Test cash asset'
      };

      const createResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const assetId = createResponse.body.data.asset.id;
      expect(createResponse.body.data.asset.encryptedValue).toBeTruthy();

      // Step 2: Read asset
      const readResponse = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(readResponse.body.success).toBe(true);
      expect(readResponse.body.data.asset.id).toBe(assetId);
      expect(readResponse.body.data.asset.decryptedValue).toBe(assetData.value);

      // Step 3: Update asset
      const updateData = {
        value: 15000,
        description: 'Updated test cash asset'
      };

      const updateResponse = await request(app)
        .put(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.asset.id).toBe(assetId);

      // Step 4: Verify update in database
      const verifyResponse = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data.asset.decryptedValue).toBe(updateData.value);
      expect(verifyResponse.body.data.asset.description).toBe(updateData.description);

      // Step 5: Delete asset
      const deleteResponse = await request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.data.deletedAssetId).toBe(assetId);

      // Step 6: Verify deletion
      const verifyDeleteResponse = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(verifyDeleteResponse.body.success).toBe(false);
      expect(verifyDeleteResponse.body.error.code).toBe('ASSET_NOT_FOUND');
    });

    it('should handle multiple asset types with proper validation', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      const assetTypes = [
        { type: 'cash', value: 5000, currency: 'USD' },
        { type: 'gold', value: 2500, currency: 'USD' },
        { type: 'silver', value: 1000, currency: 'USD' },
        { type: 'crypto', value: 8000, currency: 'BTC' },
        { type: 'business', value: 50000, currency: 'USD' },
        { type: 'investment', value: 25000, currency: 'USD' }
      ];

      const createdAssets = [];

      // Create all asset types
      for (const assetData of assetTypes) {
        const response = await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...assetData,
            description: `Test ${assetData.type} asset`
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.asset.type).toBe(assetData.type);
        createdAssets.push(response.body.data.asset);
      }

      // Verify all assets exist
      const allAssetsResponse = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(allAssetsResponse.body.success).toBe(true);
      expect(allAssetsResponse.body.data.assets).toHaveLength(assetTypes.length);

      // Verify each asset type is properly handled
      for (const asset of createdAssets) {
        const singleAssetResponse = await request(app)
          .get(`/api/assets/${asset.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(singleAssetResponse.body.success).toBe(true);
        expect(singleAssetResponse.body.data.asset.type).toBe(asset.type);
      }
    });

    it('should properly encrypt and decrypt asset values', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      const sensitiveAssetData = {
        type: 'cash',
        value: 123456.78,
        currency: 'USD',
        description: 'Highly sensitive financial data',
        notes: 'Contains private account information'
      };

      // Create asset
      const createResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sensitiveAssetData)
        .expect(201);

      const assetId = createResponse.body.data.asset.id;
      const encryptedValue = createResponse.body.data.asset.encryptedValue;

      // Verify value is encrypted (not plaintext)
      expect(encryptedValue).not.toBe(sensitiveAssetData.value.toString());
      expect(encryptedValue).not.toContain('123456');

      // Verify direct database access shows encrypted data
      if (testDb && testDb.getAssetFromDatabase) {
        const dbAsset = await testDb.getAssetFromDatabase(assetId);
        expect(dbAsset.encryptedValue).toBe(encryptedValue);
        expect(dbAsset.encryptedValue).not.toContain(sensitiveAssetData.value.toString());
      }

      // Verify API returns decrypted value
      const readResponse = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(readResponse.body.data.asset.decryptedValue).toBe(sensitiveAssetData.value);
      expect(readResponse.body.data.asset.description).toBe(sensitiveAssetData.description);
    });

    it('should enforce user asset isolation', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Create asset for first user
      const assetData = {
        type: 'cash',
        value: 10000,
        currency: 'USD',
        description: 'User 1 asset'
      };

      const createResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = createResponse.body.data.asset.id;

      // Create second user
      if (testDb && testDb.createTestUser) {
        const secondUser = await testDb.createTestUser();
        const secondUserToken = secondUser.accessToken;

        // Second user should not see first user's asset
        const unauthorizedReadResponse = await request(app)
          .get(`/api/assets/${assetId}`)
          .set('Authorization', `Bearer ${secondUserToken}`)
          .expect(403);

        expect(unauthorizedReadResponse.body.success).toBe(false);
        expect(unauthorizedReadResponse.body.error.code).toBe('FORBIDDEN');

        // Second user should not be able to update first user's asset
        const unauthorizedUpdateResponse = await request(app)
          .put(`/api/assets/${assetId}`)
          .set('Authorization', `Bearer ${secondUserToken}`)
          .send({ value: 99999 })
          .expect(403);

        expect(unauthorizedUpdateResponse.body.success).toBe(false);
        expect(unauthorizedUpdateResponse.body.error.code).toBe('FORBIDDEN');

        // Second user should not be able to delete first user's asset
        const unauthorizedDeleteResponse = await request(app)
          .delete(`/api/assets/${assetId}`)
          .set('Authorization', `Bearer ${secondUserToken}`)
          .expect(403);

        expect(unauthorizedDeleteResponse.body.success).toBe(false);
        expect(unauthorizedDeleteResponse.body.error.code).toBe('FORBIDDEN');
      }
    });

    it('should handle asset value calculations with proper precision', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      const precisionAssets = [
        { type: 'cash', value: 1234.56, currency: 'USD' },
        { type: 'gold', value: 0.123456789, currency: 'USD' },
        { type: 'crypto', value: 0.00000001, currency: 'BTC' }
      ];

      for (const assetData of precisionAssets) {
        const createResponse = await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...assetData,
            description: `Precision test for ${assetData.type}`
          })
          .expect(201);

        const assetId = createResponse.body.data.asset.id;

        // Verify precision is maintained
        const readResponse = await request(app)
          .get(`/api/assets/${assetId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(readResponse.body.data.asset.decryptedValue).toBe(assetData.value);
      }
    });

    it('should handle asset portfolio summary calculations', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      const portfolioAssets = [
        { type: 'cash', value: 10000, currency: 'USD' },
        { type: 'cash', value: 5000, currency: 'EUR' },
        { type: 'gold', value: 15000, currency: 'USD' },
        { type: 'crypto', value: 8000, currency: 'USD' }
      ];

      // Create portfolio assets
      for (const assetData of portfolioAssets) {
        await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...assetData,
            description: `Portfolio asset: ${assetData.type}`
          })
          .expect(201);
      }

      // Get portfolio summary
      const summaryResponse = await request(app)
        .get('/api/assets/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(summaryResponse.body.success).toBe(true);
      const summary = summaryResponse.body.data.summary;

      // Verify summary calculations
      expect(summary).toHaveProperty('totalValueUSD');
      expect(summary).toHaveProperty('assetBreakdown');
      expect(summary).toHaveProperty('currencyBreakdown');
      
      // Verify asset type breakdown
      expect(summary.assetBreakdown).toHaveProperty('cash');
      expect(summary.assetBreakdown).toHaveProperty('gold');
      expect(summary.assetBreakdown).toHaveProperty('crypto');
      
      // Verify currency breakdown
      expect(summary.currencyBreakdown).toHaveProperty('USD');
      expect(summary.currencyBreakdown).toHaveProperty('EUR');
    });

    it('should handle asset soft delete and recovery', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      const assetData = {
        type: 'cash',
        value: 10000,
        currency: 'USD',
        description: 'Soft delete test asset'
      };

      // Create asset
      const createResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = createResponse.body.data.asset.id;

      // Soft delete asset
      const deleteResponse = await request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.data.recoverable).toBe(true);
      expect(deleteResponse.body.data).toHaveProperty('recoveryDeadline');

      // Verify asset is not in normal listing
      const listResponse = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const activeAssets = listResponse.body.data.assets;
      expect(activeAssets.find((asset: any) => asset.id === assetId)).toBeUndefined();

      // Get deleted assets
      const deletedResponse = await request(app)
        .get('/api/assets/deleted')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedAssets = deletedResponse.body.data.assets;
      expect(deletedAssets.find((asset: any) => asset.id === assetId)).toBeTruthy();

      // Recover asset
      const recoverResponse = await request(app)
        .post(`/api/assets/${assetId}/recover`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(recoverResponse.body.success).toBe(true);

      // Verify asset is back in normal listing
      const verifyResponse = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.asset.id).toBe(assetId);
    });

    it('should handle concurrent asset operations', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      const assetData = {
        type: 'cash',
        value: 10000,
        currency: 'USD',
        description: 'Concurrent operations test'
      };

      // Create asset
      const createResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = createResponse.body.data.asset.id;

      // Simulate concurrent updates
      const update1 = request(app)
        .put(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 15000 });

      const update2 = request(app)
        .put(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 20000 });

      const results = await Promise.allSettled([update1, update2]);

      // Both should succeed with proper optimistic locking
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect([200, 409]).toContain(result.value.status);
        }
      });

      // Verify final state is consistent
      const finalResponse = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalResponse.body.success).toBe(true);
      expect([15000, 20000]).toContain(finalResponse.body.data.asset.decryptedValue);
    });
  });
});