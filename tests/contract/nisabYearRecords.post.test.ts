/**
 * Contract Test: POST /api/nisab-year-records
 * 
 * Tests creating a new Nisab Year Record in DRAFT status
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

describe('POST /api/nisab-year-records', () => {
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
        email: `test-nyr-post-${timestamp}@example.com`,
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

  it('should create a new DRAFT record with valid data', async () => {
    const hawlStartDate = new Date();
    const hawlCompletionDate = new Date(hawlStartDate.getTime() + 354 * 24 * 60 * 60 * 1000);

    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: hawlStartDate.toISOString(),
        hawlStartDateHijri: '1445-01-01H', // Required Hijri date
        hawlCompletionDate: hawlCompletionDate.toISOString(),
        hawlCompletionDateHijri: '1446-01-01H', // Required Hijri completion date
        nisabBasis: 'GOLD', // Must be uppercase
        nisabThresholdAtStart: 5000,
        userNotes: 'Test record creation',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toMatchObject({
      status: 'DRAFT',
      nisabBasis: 'GOLD',
      hawlStartDate: expect.any(String),
      nisabThresholdAtStart: expect.any(Number),
    });
  });

  it('should reject request without required hawlStartDate', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDateHijri: '1445-01-01H',
        hawlCompletionDate: new Date().toISOString(),
        hawlCompletionDateHijri: '1446-01-01H',
        nisabBasis: 'GOLD',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should reject request without required nisabBasis', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date().toISOString(),
        hawlStartDateHijri: '1445-01-01H',
        hawlCompletionDate: new Date().toISOString(),
        hawlCompletionDateHijri: '1446-01-01H',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should reject invalid nisabBasis value', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date().toISOString(),
        hawlStartDateHijri: '1445-01-01H',
        hawlCompletionDate: new Date().toISOString(),
        hawlCompletionDateHijri: '1446-01-01H',
        nisabBasis: 'platinum', // Invalid
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .send({
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('should calculate nisabThresholdAtStart if not provided', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date().toISOString(),
        hawlStartDateHijri: '1445-01-01H',
        hawlCompletionDate: new Date().toISOString(),
        hawlCompletionDateHijri: '1446-01-01H',
        nisabBasis: 'GOLD',
        // Note: No nisabThresholdAtStart provided
      });

    expect(res.status).toBe(201);
    expect(res.body.data.nisabThresholdAtStart).toBeDefined();
  });
});
