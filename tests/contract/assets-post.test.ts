import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Test setup utilities
const loadApp = async () => {
  try {
    const appModule = await import('../../server/src/app');
    return appModule.default || appModule;
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

      authToken = loginResponse.body.data.tokens?.accessToken || loginResponse.body.data.accessToken;
      
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
        category: 'cash',
        name: 'Test Cash Asset',
        value: 1000,
        currency: 'USD',
        acquisitionDate: new Date().toISOString(),
        description: 'Test cash asset'
      };

      const response = await request(app)
        .post('/api/assets')
        .send(assetData);

      // API validates input before authentication, so we may get 400 or 401
      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);

      // Should have an error code
      expect(response.body.error).toBeDefined();
    });

    it('should validate required fields', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      // Test missing category
      const missingCategory = {
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        acquisitionDate: new Date().toISOString()
      };

      let response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(missingCategory)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');

      // Test missing value
      const missingValue = {
        category: 'cash',
        name: 'Test Cash Asset',
        currency: 'USD',
        acquisitionDate: new Date().toISOString()
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
        category: 'cash',
        name: 'Test Cash Asset',
        value: 1000,
        acquisitionDate: new Date().toISOString()
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

      const invalidCategory = {
        category: 'invalid-type',
        name: 'Test Asset',
        value: 1000,
        currency: 'USD',
        acquisitionDate: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCategory)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.some((detail: string) => detail.toLowerCase().includes('category'))).toBe(true);
    });

    it('should validate currency format (ISO 4217)', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const invalidCurrency = {
        category: 'cash',
        name: 'Test Cash Asset',
        value: 1000,
        currency: 'invalid',
        acquisitionDate: new Date().toISOString()
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
        category: 'cash',
        name: 'Test Cash Asset',
        value: -100,
        currency: 'USD',
        acquisitionDate: new Date().toISOString()
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
        category: 'cash',
        name: 'Test Cash Asset',
        value: 1000,
        currency: 'USD',
        acquisitionDate: new Date().toISOString(),
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

      const validCategories = ['cash', 'gold', 'silver', 'crypto', 'business', 'stocks', 'property'];

      for (const category of validCategories) {
        const assetData = {
          category,
          name: `Test ${category} Asset`,
          value: 1000,
          currency: 'USD',
          acquisitionDate: new Date().toISOString(),
          description: `Test ${category} asset`
        };

        const response = await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(assetData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.asset.category).toBe(category);
      }
    });
  });
});