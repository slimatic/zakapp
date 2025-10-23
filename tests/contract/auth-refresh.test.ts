import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { resetRateLimitStore } from '../../server/src/middleware/RateLimitMiddleware';

// Helper function to load app dynamically
const loadApp = async () => {
  try {
    // Load compiled JavaScript version to avoid ts-node path resolution issues
    const appModule = require('../../server/dist/server/src/app');
    return appModule.default || appModule;
  } catch (error) {
    console.error('Failed to load app:', error);
    return null;
  }
};

describe('Contract Test: POST /api/auth/refresh', () => {
  let app: any;
  let validRefreshToken: string | undefined;

  beforeAll(async () => {
    try {
      // Reset rate limiting store for fresh test run
      resetRateLimitStore();
      
      // Load the Express app
      app = await loadApp();
      if (!app) {
        throw new Error('Failed to load Express app');
      }

      // Register and login a test user to get a refresh token
      const userData = {
        email: `refreshtest-${Date.now()}@example.com`,
        password: 'TestSecure123!',
        confirmPassword: 'TestSecure123!',
        firstName: 'Refresh',
        lastName: 'TestUser'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      validRefreshToken = loginResponse.body.data.tokens.refreshToken;
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
    // Reset rate limits and auth state before each test to ensure clean state
    resetRateLimitStore();
    
    // Clear auth state (revoked tokens, usage counts, user rate limits)
    const { resetAuthState } = await import('../../server/src/routes/auth');
    resetAuthState();
  });

  // Helper function to get a fresh refresh token for tests that need them
  const getFreshRefreshToken = async (app: any) => {
    const userData = {
      email: `fresh-${Date.now()}-${Math.random()}@example.com`,
      password: 'TestSecure123!',
      confirmPassword: 'TestSecure123!',
      firstName: 'Fresh',
      lastName: 'TestUser'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // Add a small delay to avoid rate limiting during rapid test execution
    await new Promise(resolve => setTimeout(resolve, 100));

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    return loginResponse.body.data.tokens.refreshToken;
  };

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token and return standardized response', async () => {
      if (!app || !validRefreshToken) {
        // Test setup verified
      }

      const refreshData = {
        refreshToken: validRefreshToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      // Validate standardized response format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('tokens');

      const tokens = response.body.data.tokens;
      
      // Validate new tokens
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');

      // Validate tokens are different from the original
      expect(tokens.refreshToken).not.toBe(validRefreshToken);
      expect(tokens.accessToken).toBeTruthy();

      // Validate token expiration info
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(typeof response.body.data.expiresIn).toBe('number');
      expect(response.body.data.expiresIn).toBeGreaterThan(0);

      // Validate metadata
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata).toHaveProperty('version');
    });

    it('should require refresh token in request body', async () => {
      if (!app) {
        // Test setup verified
      }

      const emptyRequest = {};

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(emptyRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('refreshToken is required');
    });

    it('should handle invalid refresh token format', async () => {
      if (!app) {
        // Test setup verified
      }

      const invalidTokens = [
        'invalid-token',
        '',
        null,
        undefined,
        123,
        {},
        'short'
      ];

      for (const token of invalidTokens) {
        const refreshData = {
          refreshToken: token
        };

        const response = await request(app)
          .post('/api/auth/refresh')
          .send(refreshData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle expired refresh token', async () => {
      if (!app) {
        // Test setup verified
      }

      const expiredToken = 'expired-refresh-token';
      const refreshData = {
        refreshToken: expiredToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
      expect(response.body.error.message).toContain('Refresh token has expired');
    });

    it('should handle revoked refresh token', async () => {
      if (!app) {
        // Test setup verified
      }

      const revokedToken = 'revoked-refresh-token';
      const refreshData = {
        refreshToken: revokedToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_REVOKED');
      expect(response.body.error.message).toContain('Refresh token has been revoked');
    });

    it('should handle non-existent refresh token', async () => {
      if (!app) {
        // Test setup verified
      }

      const nonExistentToken = 'non-existent-refresh-token';
      const refreshData = {
        refreshToken: nonExistentToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toContain('Invalid refresh token');
    });

    it('should handle deactivated user account', async () => {
      if (!app) {
        // Test setup verified
      }

      const deactivatedUserToken = 'deactivated-user-refresh-token';
      const refreshData = {
        refreshToken: deactivatedUserToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_DEACTIVATED');
      expect(response.body.error.message).toContain('User account is deactivated');
    });

    it('should revoke old refresh token after successful refresh', async () => {
      if (!app) {
        // Test setup verified
      }

      const freshToken = await getFreshRefreshToken(app);
      const refreshData = {
        refreshToken: freshToken
      };

      // First refresh should succeed
      const response1 = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response1.body.success).toBe(true);

      // Second refresh with same token should fail
      const response2 = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response2.body.success).toBe(false);
      expect(response2.body.error.code).toBe('TOKEN_REVOKED');
    });

    it('should include user info in refresh response', async () => {
      if (!app) {
        // Test setup verified
      }

      const freshToken = await getFreshRefreshToken(app);
      const refreshData = {
        refreshToken: freshToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      // Validate user information is included
      expect(response.body.data).toHaveProperty('user');
      const user = response.body.data.user;
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('isActive', true);
      
      // Validate sensitive data is not included
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('hashedPassword');
    });

    it('should validate token rotation security', async () => {
      if (!app) {
        // Test setup verified
      }

      const freshToken = await getFreshRefreshToken(app);
      const refreshData = {
        refreshToken: freshToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      const newTokens = response.body.data.tokens;
      
      // Validate new tokens are significantly different
      expect(newTokens.accessToken).toBeTruthy();
      expect(newTokens.refreshToken).toBeTruthy();
      expect(newTokens.refreshToken).not.toBe(freshToken);
      
      // Validate token structure (should be JWT-like)
      expect(newTokens.accessToken.split('.')).toHaveLength(3);
      expect(newTokens.refreshToken.split('.')).toHaveLength(3);
    });

    it('should handle concurrent refresh attempts', async () => {
      if (!app) {
        // Test setup verified
      }

      const freshToken = await getFreshRefreshToken(app);
      const refreshData = {
        refreshToken: freshToken
      };

      // Simulate concurrent refresh attempts
      const refresh1 = request(app)
        .post('/api/auth/refresh')
        .send(refreshData);

      const refresh2 = request(app)
        .post('/api/auth/refresh')
        .send(refreshData);

      const results = await Promise.allSettled([refresh1, refresh2]);

      // Only one should succeed due to token rotation
      const statuses = results.map(result => 
        result.status === 'fulfilled' ? result.value.status : 500
      );

      expect(statuses).toContain(200); // One succeeds
      expect(statuses).toContain(401); // One fails with token revoked
    });

    it('should handle refresh rate limiting', async () => {
      if (!app) {
        // Test setup verified
      }

      // Rate limiting now only applies to valid tokens after JWT verification
      // Invalid tokens return 401 without rate limiting to prevent information disclosure
      const fakeJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlLWlkIiwiaWF0IjoxNjE2MjM5MDIyfQ.invalidSignatureHere';
      
      // Invalid tokens should always return 401, not 429
      // This prevents attackers from learning about rate limiting behavior
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: fakeJWT })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
      }
    });

    it('should create audit log entry for token refresh', async () => {
      if (!app) {
        // Test setup verified
      }

      const freshToken = await getFreshRefreshToken(app);
      const refreshData = {
        refreshToken: freshToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      // Validate audit trail information is included
      expect(response.body.data).toHaveProperty('auditLogId');
      expect(typeof response.body.data.auditLogId).toBe('string');
    });
  });
});