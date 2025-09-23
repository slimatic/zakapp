import request from 'supertest';
import app from '../index.js';
import { generateEncryptionKey, encryptData, decryptData } from '../utils/encryption.js';
import { 
  generateTokenPair, 
  refreshAccessToken, 
  blacklistToken, 
  isTokenBlacklisted 
} from '../utils/session.js';
import fs from 'fs-extra';
import path from 'path';

// Test database cleanup
const TEST_DATA_DIR = path.join(process.cwd(), 'data_test');

beforeAll(async () => {
  // Set up test data directory
  process.env.DATA_DIR = TEST_DATA_DIR;
});

afterAll(async () => {
  // Clean up test data
  if (await fs.pathExists(TEST_DATA_DIR)) {
    await fs.remove(TEST_DATA_DIR);
  }
});

describe('Security Features', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    if (await fs.pathExists(TEST_DATA_DIR)) {
      await fs.remove(TEST_DATA_DIR);
    }
  });

  describe('Data Encryption', () => {
    it('should generate a valid encryption key', () => {
      const key = generateEncryptionKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should encrypt and decrypt data correctly', () => {
      const testData = 'This is sensitive user data';
      const encrypted = encryptData(testData);
      const decrypted = decryptData(encrypted);
      
      expect(encrypted).not.toBe(testData);
      expect(decrypted).toBe(testData);
    });

    it('should encrypt and decrypt with custom key', () => {
      const testData = 'Custom key encryption test';
      const customKey = generateEncryptionKey();
      
      const encrypted = encryptData(testData, customKey);
      const decrypted = decryptData(encrypted, customKey);
      
      expect(decrypted).toBe(testData);
    });

    it('should fail to decrypt with wrong key', () => {
      const testData = 'Secret data';
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      const encrypted = encryptData(testData, key1);
      
      expect(() => {
        decryptData(encrypted, key2);
      }).toThrow('Decryption failed');
    });
  });

  describe('Session Management', () => {
    const testUser = {
      userId: 'test-user-123',
      username: 'testuser',
      email: 'test@example.com',
    };

    it('should generate token pair', () => {
      const tokens = generateTokenPair(testUser);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeGreaterThan(0);
      expect(tokens.refreshExpiresIn).toBeGreaterThan(tokens.expiresIn);
    });

    it('should refresh access token with valid refresh token', () => {
      const tokens = generateTokenPair(testUser);
      const result = refreshAccessToken(tokens.refreshToken);
      
      expect(result).toBeDefined();
      expect(result?.accessToken).toBeDefined();
      expect(result?.expiresIn).toBeGreaterThan(0);
    });

    it('should fail to refresh with invalid token', () => {
      const result = refreshAccessToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should blacklist tokens', () => {
      const tokens = generateTokenPair(testUser);
      
      expect(isTokenBlacklisted(tokens.accessToken)).toBe(false);
      
      blacklistToken(tokens.accessToken);
      
      expect(isTokenBlacklisted(tokens.accessToken)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    const testUser = {
      username: 'ratetest',
      email: 'ratetest@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
    };

    it('should apply rate limiting to auth endpoints', async () => {
      // Make multiple rapid requests to trigger rate limit
      const requests = Array(6).fill(0).map(() => 
        request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'nonexistent',
            password: 'wrongpassword',
          })
      );
      
      const responses = await Promise.all(requests);
      
      // First 5 should be normal auth failures, 6th should be rate limited
      expect(responses[4].status).toBe(401); // Auth failure
      expect(responses[5].status).toBe(429); // Rate limited
    }, 10000);
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', async () => {
      const maliciousInput = {
        username: 'test<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(maliciousInput);

      // Should not contain the script tag in any response
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('<script>');
      expect(responseText).not.toContain('alert("xss")');
    });
  });

  describe('Enhanced Authentication Flow', () => {
    const testUser = {
      username: 'authtest',
      email: 'authtest@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
    };

    it('should complete full auth flow with refresh tokens', async () => {
      // Register user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body.data.accessToken).toBeDefined();
      expect(loginResponse.body.data.refreshToken).toBeDefined();

      const { accessToken, refreshToken } = loginResponse.body.data;

      // Use access token to access protected resource
      const profileResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.data.username).toBe(testUser.username);

      // Refresh the access token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.data.accessToken).toBeDefined();
      expect(refreshResponse.body.data.accessToken).not.toBe(accessToken);

      // Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutResponse.body.message).toBe('Logged out successfully');

      // Try to use the original token after logout (should fail)
      await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });
});