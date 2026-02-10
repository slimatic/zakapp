/**
 * Contract Test: POST /api/nisab-year-records/:id/finalize
 *
 * Tests finalizing a DRAFT Nisab Year Record (locking it for immutability)
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

describe('POST /api/nisab-year-records/:id/finalize', () => {
  let app: any;
  let authToken: string;
  let draftRecordId: string;
  let prematureRecordId: string;

  beforeAll(async () => {
    try {
      app = await loadApp();

      if (!app) {
        throw new Error('Failed to load Express app');
      }

      // Set up test user and get auth token
      const timestamp = Date.now();
      const registerData = {
        email: `test-nyr-finalize-${timestamp}@example.com`,
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

      // Create record with completed Hawl (already finished)
      const completedData = {
        hawlStartDate: new Date(Date.now() - 355 * 24 * 60 * 60 * 1000).toISOString(), // Started over a year ago
        hawlStartDateHijri: '1444-01-01H',
        hawlCompletionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Completed yesterday
        hawlCompletionDateHijri: '1445-01-01H',
        nisabBasis: 'GOLD',
        nisabThresholdAtStart: 5000,
        userNotes: 'Completed Hawl record'
      };

      const completedResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(completedData)
        .expect(201);

      draftRecordId = completedResponse.body.data.id;

      // Create record with premature Hawl (not yet completed)
      const prematureData = {
        hawlStartDate: new Date().toISOString(),
        hawlStartDateHijri: '1445-01-01H',
        hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000).toISOString(), // Future completion
        hawlCompletionDateHijri: '1446-01-01H',
        nisabBasis: 'GOLD',
        nisabThresholdAtStart: 5000,
        userNotes: 'Premature Hawl record'
      };

      const prematureResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(prematureData)
        .expect(201);

      prematureRecordId = prematureResponse.body.data.id;

      if (!draftRecordId || !prematureRecordId) {
        throw new Error('Failed to create test records');
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

  it('should finalize completed DRAFT record successfully', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${draftRecordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ finalizationNotes: 'Test finalization' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('FINALIZED');
  });

  it('should reject finalization of premature record without override', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${prematureRecordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ finalizationNotes: 'Test finalization' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('INVALID_STATE');
  });

  it('should allow premature finalization with override', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${prematureRecordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        finalizationNotes: 'Test finalization',
        acknowledgePremature: true,
        overrideNote: 'Testing premature finalization'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('FINALIZED');
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records/non-existent-id/finalize')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ finalizationNotes: 'Test' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${draftRecordId}/finalize`)
      .send({ finalizationNotes: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});