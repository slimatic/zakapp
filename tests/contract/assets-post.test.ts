import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Test setup utilities
const loadApp = async () => {
  try {
    const appModule = await import('../../server/src/app');
    return appModule.default;
  } catch (error) {
    console.error('Failed to load app:', error);
    return null;
  }
};

// Note: This test will fail until the implementation exists
// This is intentional as per TDD methodology

describe('Contract Test: POST /api/assets', () => {
  let app: any;
  let authToken: string | undefined;

  beforeAll(async () => {
    try {
      app = await loadApp();
      
      if (!app) {
        throw new Error('App not available');
      }

      // Set up test user and get auth token
      const timestamp = Date.now();
      const registerData = {
        email: `testuser-${timestamp}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      if (registerResponse.status !== 201) {
        console.error('Registration failed:', registerResponse.status, registerResponse.body);
        throw new Error(`Registration failed with status ${registerResponse.status}`);
      }

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(registerData)
        .expect(200);

      authToken = loginResponse.body.data.accessToken;
      
      if (!authToken) {
        throw new Error('Failed to get auth token');
      }
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

  describe('POST /api/assets', () => {
    it('should require authentication', async () => {
      if (!app) {
        throw new Error('App not available');
      }

      const assetData = {
        type: 'cash',
        value: 1000,
        currency: 'USD',
        description: 'Test cash asset'
      };

      const response = await request(app)
        .post('/api/assets')
        .send(assetData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should create asset with valid data and return standardized response', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const assetData = {
        type: 'cash',
        value: 1000,
        currency: 'USD',
        description: 'Test cash asset'
      };

      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData);

      // Debug: log response if not 201
      if (response.status !== 201) {
        console.log('Asset creation failed:', response.status, JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);

      // Validate standardized response format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('asset');

      const asset = response.body.data.asset;
      
      // Validate EncryptedAsset schema compliance
      expect(asset).toHaveProperty('id');
      expect(asset).toHaveProperty('type', assetData.type);
      expect(asset).toHaveProperty('encryptedValue');
      expect(asset).toHaveProperty('currency', assetData.currency);
      expect(asset).toHaveProperty('lastUpdated');

      // Validate field types
      expect(typeof asset.id).toBe('string');
      expect(typeof asset.encryptedValue).toBe('string');
      expect(typeof asset.lastUpdated).toBe('string');

      // Validate that value is encrypted (not plaintext)
      expect(asset.encryptedValue).not.toBe(assetData.value.toString());

      // Validate metadata
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata).toHaveProperty('version');
    });

    it('should validate required fields', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      // Test missing type
      const missingType = {
        value: 1000,
        currency: 'USD'
      };

      let response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(missingType)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');

      // Test missing value
      const missingValue = {
        type: 'cash',
        currency: 'USD'
      };

      response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(missingValue)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');

      // Test missing currency
      const missingCurrency = {
        type: 'cash',
        value: 1000
      };

      response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(missingCurrency)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should validate asset type enum', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const invalidType = {
        type: 'invalid-type',
        value: 1000,
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidType)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.some((detail: string) => detail.toLowerCase().includes('type'))).toBe(true);
    });

    it('should validate currency format (ISO 4217)', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const invalidCurrency = {
        type: 'cash',
        value: 1000,
        currency: 'invalid'
      };

      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCurrency)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.some((detail: string) => detail.toLowerCase().includes('currency'))).toBe(true);
    });

    it('should validate minimum asset value', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const negativeValue = {
        type: 'cash',
        value: -100,
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(negativeValue)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.some((detail: string) => detail.toLowerCase().includes('value'))).toBe(true);
    });

    it('should validate description length limit', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const longDescription = {
        type: 'cash',
        value: 1000,
        currency: 'USD',
        description: 'A'.repeat(501) // Exceeds 500 character limit
      };

      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(longDescription)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.some((detail: string) => detail.toLowerCase().includes('description'))).toBe(true);
    });

    it('should handle all valid asset types', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const validTypes = ['cash', 'gold', 'silver', 'crypto', 'business', 'investment'];
      
      for (const type of validTypes) {
        const assetData = {
          type,
          value: 1000,
          currency: 'USD',
          description: `Test ${type} asset`
        };

        const response = await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(assetData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.asset.type).toBe(type);
      }
    });
  });
});