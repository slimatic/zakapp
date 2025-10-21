/**
 * Contract Test: POST /api/auth/login
 * 
 * Constitutional Principles:
 * - Privacy & Security First: JWT token security and authentication validation
 * - Spec-Driven Development: API contract compliance testing
 * - Quality & Reliability: Comprehensive test coverage for authentication
 */

import request from 'supertest';

describe('Contract Test: POST /api/auth/login', () => {
  let app: any;

  beforeAll(async () => {
    try {
      // Load compiled JavaScript version to avoid ts-node path resolution issues
      const appModule = require('../../server/dist/app');
      app = appModule.default || appModule;
    } catch (error) {
      console.error('Failed to load app:', error);
      app = null;
    }
  });

  describe('POST /api/auth/login', () => {
    it('should accept valid login credentials and return standardized response', async () => {
      // This test MUST FAIL until implementation exists
      if (!app) {
        expect(true).toBe(false); // Force failure
        return;
      }

      // First register a test user
      const testUser = {
        email: 'contracttest@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        firstName: 'Contract',
        lastName: 'Test'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      if (registerResponse.status !== 201) {
        console.log('Registration failed:', registerResponse.status, JSON.stringify(registerResponse.body, null, 2));
      }
      expect(registerResponse.status).toBe(201);

      // Now test login
      const loginData = {
        email: 'contracttest@example.com',
        password: 'SecurePassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Validate standardized response format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');

      // Validate JWT token structure
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken).toBe('string');
      expect(response.body.data.accessToken.split('.').length).toBe(3); // JWT has 3 parts

      // Validate user data (must not contain sensitive info)
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email', loginData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid credentials with standardized error response', async () => {
      if (!app) {
        expect(true).toBe(false); // Force failure
        return;
      }

      const invalidLogin = {
        email: 'contracttest@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(401);

      // Validate standardized error response format
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      if (!app) {
        expect(true).toBe(false); // Force failure
        return;
      }

      // Test missing email
      const missingEmail = { password: 'SecurePassword123!' };
      const response1 = await request(app)
        .post('/api/auth/login')
        .send(missingEmail)
        .expect(400);

      expect(response1.body).toHaveProperty('success', false);
      expect(response1.body).toHaveProperty('error.code', 'VALIDATION_ERROR');

      // Test missing password
      const missingPassword = { email: 'test@example.com' };
      const response2 = await request(app)
        .post('/api/auth/login')
        .send(missingPassword)
        .expect(400);

      expect(response2.body).toHaveProperty('success', false);
      expect(response2.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
    });

    it('should validate email format', async () => {
      if (!app) {
        expect(true).toBe(false); // Force failure
        return;
      }

      const invalidEmail = {
        email: 'invalid-email-format',
        password: 'SecurePassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidEmail)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
    });

    it('should enforce minimum password length', async () => {
      if (!app) {
        expect(true).toBe(false); // Force failure
        return;
      }

      const shortPassword = {
        email: 'test@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(shortPassword)
        .expect(401); // Short password treated as invalid credentials

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });
});