import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Note: This test will fail until the implementation exists
// This is intentional as per TDD methodology

// Helper function to load app dynamically
const loadApp = async () => {
  try {
    const appModule = await import('../../server/src/app');
    return appModule.default || appModule;
  } catch (error) {
    console.error('Failed to load app:', error);
    return null;
  }
};

describe('Contract Test: DELETE /api/assets/:id', () => {
  let app: any;
  let authToken: string | undefined;
  let testAssetId: string | undefined;

  beforeAll(async () => {
    try {
      // Load the Express app
      app = await loadApp();
      if (!app) {
        throw new Error('Failed to load Express app');
      }

      // Register a test user with guaranteed unique email
      const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}-${process.hrtime.bigint()}`;
      const userData = {
        email: `deletetest-${uniqueId}@example.com`,
        password: 'TestSecure123!',
        confirmPassword: 'TestSecure123!',
        firstName: 'Delete',
        lastName: 'TestUser'
      };

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

      authToken = loginResponse.body.data.tokens.accessToken;

      // Create a test asset for deletion tests
      const assetData = {
        category: 'cash',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        description: 'Test asset for deletion'
      };

      const assetResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      testAssetId = assetResponse.body.data.asset.assetId;
    } catch (error) {
      console.error('Setup failed:', error);
      throw new Error('BeforeAll setup failed');
    }
  });

  afterAll(async () => {
    // Cleanup if app exists
    if (app && app.close) {
      await app.close();
    }
  });

  describe('DELETE /api/assets/:id', () => {
    it('should require authentication', async () => {
      if (!app || !testAssetId) {
        // Test setup verified
      }

      const response = await request(app)
        .delete(`/api/assets/${testAssetId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should delete asset and return standardized response', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Create a fresh asset for this test
      const assetData = {
        category: 'cash',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        description: 'Test asset for basic deletion'
      };

      const assetResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = assetResponse.body.data.asset.assetId;

      const response = await request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Validate standardized response format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('message', 'Asset deleted successfully');
      expect(response.body.data).toHaveProperty('deletedAssetId', assetId);

      // Validate metadata
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata).toHaveProperty('version');
    });

    it('should handle asset not found', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      const nonExistentId = '12345678-1234-4123-a123-123456789012'; // Valid UUID format but non-existent

      const response = await request(app)
        .delete(`/api/assets/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ASSET_NOT_FOUND');
    });

    it('should handle unauthorized access to other users assets', async () => {
      if (!app || !testAssetId) {
        // Test setup verified
      }

      // Simulate different user token
      const otherUserToken = 'other-user-token';

      const response = await request(app)
        .delete(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should validate UUID format for asset ID', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      const invalidId = 'invalid-uuid';

      const response = await request(app)
        .delete(`/api/assets/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('Invalid asset ID format');
    });

    it.skip('should prevent deletion of asset with dependent zakat calculations', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Simulate asset with existing zakat calculations - use valid UUID format
      const assetWithCalculations = '12345678-1234-4abc-a123-123456789abc';

      const response = await request(app)
        .delete(`/api/assets/${assetWithCalculations}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('Cannot delete asset with existing zakat calculations');
    });

    it('should verify asset is actually deleted from database', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Create a fresh asset for this test
      const assetData = {
        category: 'cash',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        description: 'Test asset for verification deletion'
      };

      const assetResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = assetResponse.body.data.asset.assetId;

      // First delete the asset
      await request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Then verify it's gone by trying to fetch it
      const response = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ASSET_NOT_FOUND');
    });

    it('should create audit log entry for deletion', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Create a fresh asset for this test
      const assetData = {
        category: 'cash',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        description: 'Test asset for audit deletion'
      };

      const assetResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = assetResponse.body.data.asset.assetId;

      const response = await request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Validate audit trail is created
      expect(response.body.data).toHaveProperty('auditLogId');
      expect(typeof response.body.data.auditLogId).toBe('string');
    });

    it('should handle soft delete with recovery option', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Create a fresh asset for this test
      const assetData = {
        category: 'cash',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        description: 'Test asset for soft deletion'
      };

      const assetResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = assetResponse.body.data.asset.assetId;

      const response = await request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Validate soft delete response includes recovery information
      expect(response.body.data).toHaveProperty('recoverable', true);
      expect(response.body.data).toHaveProperty('recoveryDeadline');
      
      // Validate recovery deadline is a valid ISO date string
      const recoveryDeadline = new Date(response.body.data.recoveryDeadline);
      expect(recoveryDeadline).toBeInstanceOf(Date);
      expect(recoveryDeadline.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle force delete option for immediate permanent deletion', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Create a fresh asset for this test
      const assetData = {
        category: 'cash',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        description: 'Test asset for force deletion'
      };

      const assetResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = assetResponse.body.data.asset.assetId;

      const response = await request(app)
        .delete(`/api/assets/${assetId}?force=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Validate permanent deletion response
      expect(response.body.data).toHaveProperty('recoverable', false);
      expect(response.body.data).toHaveProperty('message', 'Asset permanently deleted');
      expect(response.body.data).not.toHaveProperty('recoveryDeadline');
    });

    it('should include deleted asset summary in response', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Create a fresh asset for this test
      const assetData = {
        category: 'cash',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        description: 'Test asset for summary deletion'
      };

      const assetResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = assetResponse.body.data.asset.assetId;

      const response = await request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Validate deleted asset summary
      expect(response.body.data).toHaveProperty('deletedAsset');
      const deletedAsset = response.body.data.deletedAsset;
      
      expect(deletedAsset).toHaveProperty('id', assetId);
      expect(deletedAsset).toHaveProperty('type');
      expect(deletedAsset).toHaveProperty('description');
      expect(deletedAsset).toHaveProperty('deletedAt');
      
      // Validate sensitive data is not included
      expect(deletedAsset).not.toHaveProperty('encryptedValue');
      expect(deletedAsset).not.toHaveProperty('value');
    });

    it('should handle concurrent deletion attempts', async () => {
      if (!app || !authToken) {
        // Test setup verified
      }

      // Create a fresh asset for this test
      const assetData = {
        category: 'cash',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        description: 'Test asset for concurrent deletion'
      };

      const assetResponse = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      const assetId = assetResponse.body.data.asset.assetId;

      // Simulate concurrent deletions
      const deletion1 = request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const deletion2 = request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const results = await Promise.allSettled([deletion1, deletion2]);

      // One should succeed, one should fail
      const statuses = results.map(result => 
        result.status === 'fulfilled' ? result.value.status : 500
      );

      expect(statuses).toContain(200); // One succeeds
      expect(statuses).toContain(404); // One fails with not found
    });
  });
});