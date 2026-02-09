/**
 * Contract Test: GET /api/nisab-year-records/:id
 *
 * Tests retrieving a specific Nisab Year Record with full details and audit trail
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const loadApp = async () => {
  try {
    const appModule = await import('../../server/src/app');
    return appModule.default || appModule;
  } catch (error) {
    console.error('Failed to load app:', error);
    return null;
  }
};

describe('GET /api/nisab-year-records/:id', () => {
  let app: any;
  let authToken: string;
  let testRecordId: string;

  beforeAll(async () => {
    try {
      app = await loadApp();

      if (!app) {
        throw new Error('Failed to load Express app');
      }

      // Set up test user and get auth token
      const timestamp = Date.now();
      const registerData = {
        email: `test-nyr-getbyid-${timestamp}@example.com`,
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

      // Create a test record for GET tests
      const recordData = {
        hawlStartDate: new Date().toISOString(),
        hawlStartDateHijri: '1445-01-01H',
        hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000).toISOString(),
        hawlCompletionDateHijri: '1446-01-01H',
        nisabBasis: 'GOLD',
        nisabThresholdAtStart: 5000,
        userNotes: 'Test record for GET operations'
      };

      const recordResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recordData)
        .expect(201);

      testRecordId = recordResponse.body.data.id;

      if (!testRecordId) {
        throw new Error('Failed to create test record');
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

  it('should return record details for authenticated user', async () => {
    const res = await request(app)
      .get(`/api/nisab-year-records/${testRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testRecordId);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.nisabBasis).toBe('GOLD');
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .get(`/api/nisab-year-records/${testRecordId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('should return 404 for record owned by different user', async () => {
    // Create another user
    const otherUserData = {
      email: `other-user-${Date.now()}@example.com`,
      password: 'OtherPass123!',
      confirmPassword: 'OtherPass123!',
      firstName: 'Other',
      lastName: 'User'
    };

    await request(app)
      .post('/api/auth/register')
      .send(otherUserData)
      .expect(201);

    const otherLoginResponse = await request(app)
      .post('/api/auth/login')
      .send(otherUserData)
      .expect(200);

    const otherAuthToken = otherLoginResponse.body.data.tokens?.accessToken || otherLoginResponse.body.data.accessToken;

    const res = await request(app)
      .get(`/api/nisab-year-records/${testRecordId}`)
      .set('Authorization', `Bearer ${otherAuthToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});