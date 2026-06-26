/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

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

describe.skip('Contract Test: POST /api/assets', () => {
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

      // Tokens are nested under data.tokens
      authToken = loginResponse.body.data?.tokens?.accessToken || loginResponse.body.data?.accessToken;
      
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
        name: 'Test cash asset',
        value: 1000,
        currency: 'USD',
        description: 'Test cash asset'
      };

      const response = await request(app)
        .post('/api/assets')
        .send(assetData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should create asset with valid data and return standardized response', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const assetData = {
        category: 'cash',
        name: 'Savings Account',
        value: 1000,
        currency: 'USD',
        description: 'Primary savings'
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
      
      // Validate asset schema compliance — API uses `category`, not `type`
      // Response uses `assetId` and returns decrypted values
      expect(asset).toHaveProperty('assetId');
      expect(asset).toHaveProperty('category', assetData.category);
      expect(asset).toHaveProperty('currency', assetData.currency);
      expect(asset).toHaveProperty('value', assetData.value);
      
      // Validate field types
      expect(typeof asset.assetId).toBe('string');
      expect(typeof asset.value).toBe('number');
      expect(typeof asset.lastUpdated || asset.updatedAt).toBe('string');
    });

    it('should validate required fields', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      // Test missing category
      const missingCategory = {
        name: 'Test asset',
        value: 1000,
        currency: 'USD'
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
        name: 'Test asset',
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
        category: 'cash',
        name: 'Test asset',
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

    it('should validate asset category enum', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const invalidCategory = {
        category: 'invalid-category',
        name: 'Bad asset',
        value: 1000,
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCategory)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details?.some((detail: string) => detail.toLowerCase().includes('category'))).toBe(true);
    });

    it('should validate currency format (ISO 4217)', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const invalidCurrency = {
        category: 'cash',
        name: 'Test asset',
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
      expect(response.body.details?.some((detail: string) => detail.toLowerCase().includes('currency'))).toBe(true);
    });

    it('should validate minimum asset value', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const negativeValue = {
        category: 'cash',
        name: 'Test asset',
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
      expect(response.body.details?.some((detail: string) => detail.toLowerCase().includes('value'))).toBe(true);
    });

    it('should validate description length limit', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const longDescription = {
        category: 'cash',
        name: 'Test asset',
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
      expect(response.body.details?.some((detail: string) => detail.toLowerCase().includes('description'))).toBe(true);
    });

    it('should handle all valid asset categories', async () => {
      if (!app || !authToken) {
        throw new Error('App or auth token not available');
      }

      const validCategories = ['cash', 'gold', 'silver', 'crypto', 'business', 'stocks', 'property'];
      
      for (const category of validCategories) {
        const assetData = {
          category,
          name: `Test ${category} asset`,
          value: 1000,
          currency: 'USD',
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
