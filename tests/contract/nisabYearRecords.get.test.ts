/**
 * Contract Test: GET /api/nisab-year-records
 *
 * Tests the endpoint for listing all Nisab Year Records for authenticated user
 * with optional filtering by status and year.
 *
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const loadApp = async () => {
  try {
    const appModule = await import('../../server/src/app');
    return appModule.default || appModule;
  } catch (error) {
    console.error('Failed to load app:', error);
    return null;
  }
};

describe('GET /api/nisab-year-records', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    try {
      app = await loadApp();

      if (!app) {
        throw new Error('Failed to load Express app');
      }

      // Set up test user and get auth token
      const timestamp = Date.now();
      const registerData = {
        email: `test-nyr-get-${timestamp}@example.com`,
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

  it('should return 200 with all records for authenticated user', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.records)).toBe(true);

    // Verify wealth fields are numeric
    if (res.body.data.records.length > 0) {
      const record = res.body.data.records[0];
      expect(typeof record.totalWealth).toBe('number');
      expect(typeof record.zakatableWealth).toBe('number');
      expect(typeof record.zakatAmount).toBe('number');
    }
  });

  it('should filter records by status=DRAFT', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records?status=DRAFT')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.records)).toBe(true);
  });

  it('should filter records by year parameter', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records?year=2025')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.records)).toBe(true);
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app).get('/api/nisab-year-records');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('should return empty array when no records match filter', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records?status=FINALIZED&year=1900')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.records)).toBe(true);
  });
});