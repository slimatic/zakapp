import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Note: This test will fail until the implementation exists
// This is intentional as per TDD methodology

// Helper function to load app dynamically
const loadApp = async () => {
  try {
    // Load compiled JavaScript version to avoid ts-node path resolution issues
    const appModule = require('../../server/dist/app');
    return appModule.default || appModule;
  } catch (error) {
    console.error('Failed to load app:', error);
    return null;
  }
};

describe('Contract Test: POST /api/auth/register', () => {
  let app: any;

  beforeAll(async () => {
    try {
      // Load the Express app
      app = await loadApp();
      if (!app) {
        throw new Error('Failed to load Express app');
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

  beforeEach(async () => {
    // Clear user store and rate limit store before each test to ensure test isolation
    try {
      const { UserStore } = await import('../../server/src/utils/userStore');
      UserStore.clear();
      
      // Clear rate limit store for test isolation
      const { resetRateLimitStore } = await import('../../server/src/middleware/RateLimitMiddleware');
      resetRateLimitStore();
    } catch (error) {
      // Ignore if imports not available
    }
  });

  afterEach(async () => {
    // Clear rate limit store after each test to prevent accumulation
    try {
      const { resetRateLimitStore } = await import('../../server/src/middleware/RateLimitMiddleware');
      resetRateLimitStore();
    } catch (error) {
      // Ignore if imports not available
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register user with valid data and return standardized response', async () => {
      if (!app) {
        // Test setup verified
      }

      const registrationData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      // Validate standardized response format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');

      const user = response.body.data.user;
      const tokens = response.body.data.tokens;
      
      // Validate EncryptedUser schema compliance
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', registrationData.email.toLowerCase());
      expect(user).toHaveProperty('encryptedProfile');
      expect(user).toHaveProperty('isActive', true);
      expect(user).toHaveProperty('createdAt');

      // Validate field types
      expect(typeof user.id).toBe('string');
      expect(typeof user.encryptedProfile).toBe('string');
      expect(typeof user.createdAt).toBe('string');

      // Validate tokens
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');

      // Validate sensitive data is not included
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('hashedPassword');
      expect(user).not.toHaveProperty('firstName');
      expect(user).not.toHaveProperty('lastName');

      // Validate metadata
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata).toHaveProperty('version');
    });

    it('should validate required fields', async () => {
      if (!app) {
        // Test setup verified
      }

      // Test missing email
      const missingEmail = {
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      let response = await request(app)
        .post('/api/auth/register')
        .send(missingEmail)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.some((detail: any) => detail.field === 'email')).toBe(true);

      // Test missing password
      const missingPassword = {
        email: 'test@example.com',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      response = await request(app)
        .post('/api/auth/register')
        .send(missingPassword)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.some((detail: any) => detail.field === 'password')).toBe(true);

      // Test missing firstName
      const missingFirstName = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        lastName: 'Doe'
      };

      response = await request(app)
        .post('/api/auth/register')
        .send(missingFirstName)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.some((detail: any) => detail.field === 'firstName')).toBe(true);
    });

    it('should validate email format', async () => {
      if (!app) {
        // Test setup verified
      }

      const invalidEmailFormats = [
        'invalid-email',
        'invalid@',
        '@invalid.com',
        'invalid..email@test.com',
        'invalid email@test.com'
      ];

      for (const email of invalidEmailFormats) {
        const registrationData = {
          email,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(registrationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details.some((detail: any) => detail.field === 'email')).toBe(true);
      }
    });

    it('should validate password strength requirements', async () => {
      if (!app) {
        // Test setup verified
      }

      const weakPasswords = [
        'short',           // Too short
        'password',        // No numbers/symbols
        'Password',        // No numbers/symbols
        'password123',     // No symbols
        'PASSWORD123!',    // No lowercase
        'password123!',    // No uppercase
        '12345678!'        // No letters
      ];

      let index = 0;
      for (const password of weakPasswords) {
        const registrationData = {
          email: `test${index}@example.com`, // Use unique email to avoid rate limiting
          password,
          confirmPassword: password,
          firstName: 'John',
          lastName: 'Doe'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(registrationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details.some((detail: any) => detail.field === 'password')).toBe(true);
        
        index++;
      }
    });

    it('should validate password confirmation match', async () => {
      if (!app) {
        // Test setup verified
      }

      const registrationData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.some((detail: any) => detail.message && detail.message.includes('Password confirmation does not match'))).toBe(true);
    });

    it('should validate name fields format', async () => {
      if (!app) {
        // Test setup verified
      }

      // Test invalid firstName (too short)
      let registrationData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'A',
        lastName: 'Doe'
      };

      let response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.some((detail: any) => detail.field === 'firstName')).toBe(true);

      // Test invalid lastName (too long)
      registrationData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'A'.repeat(51) // Exceeds 50 character limit
      };

      response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.some((detail: any) => detail.field === 'lastName')).toBe(true);
    });

    it('should handle duplicate email registration', async () => {
      if (!app) {
        // Test setup verified
      }

      const registrationData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should normalize email to lowercase', async () => {
      if (!app) {
        // Test setup verified
      }

      const registrationData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should validate optional fields when provided', async () => {
      if (!app) {
        // Test setup verified
      }

      // Test with optional phone number
      const registrationWithPhone = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationWithPhone)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
    });

    it('should create user audit log entry', async () => {
      if (!app) {
        // Test setup verified
      }

      const registrationData = {
        email: 'audit@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      // Validate audit trail information is included
      expect(response.body.data).toHaveProperty('auditLogId');
      expect(typeof response.body.data.auditLogId).toBe('string');
    });

    it('should handle registration rate limiting', async () => {
      if (!app) {
        // Test setup verified
      }

      // Set rate limit to 5 for this specific test
      const { setRegistrationRateLimitMax, resetRateLimitStore } = await import('../../server/src/middleware/RateLimitMiddleware');
      resetRateLimitStore();
      setRegistrationRateLimitMax(5);

      // Simulate multiple registration attempts
      const attempts = Array.from({ length: 6 }, (_, i) => ({
        email: `test${i}@example.com`,
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      }));

      // First 5 should succeed (typical rate limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/register')
          .send(attempts[i])
          .expect(201);
      }

      // 6th should be rate limited
      const response = await request(app)
        .post('/api/auth/register')
        .send(attempts[5])
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      
      // Reset rate limit back to default for other tests
      setRegistrationRateLimitMax(50);
    });
  });
});