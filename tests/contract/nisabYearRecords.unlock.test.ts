/**
 * Contract Test: POST /api/nisab-year-records/:id/unlock
 *
 * Tests unlocking a FINALIZED Nisab Year Record for editing
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

describe('POST /api/nisab-year-records/:id/unlock', () => {
  let app: any;
  let authToken: string;
  let finalizedRecordId: string;

  beforeAll(async () => {
    try {
      app = await loadApp();

      if (!app) {
        throw new Error('Failed to load Express app');
      }

      // Set up test user and get auth token
      const timestamp = Date.now();
      const registerData = {
        email: `test-nyr-unlock-${timestamp}@example.com`,
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

      // Create and finalize a record
      const recordData = {
        hawlStartDate: new Date(Date.now() - 355 * 24 * 60 * 60 * 1000).toISOString(),
        hawlStartDateHijri: '1444-01-01H',
        hawlCompletionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        hawlCompletionDateHijri: '1445-01-01H',
        nisabBasis: 'GOLD',
        nisabThresholdAtStart: 5000,
        userNotes: 'Record for unlock test'
      };

      const recordResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recordData)
        .expect(201);

      finalizedRecordId = recordResponse.body.data.id;

      // Finalize the record
      await request(app)
        .post(`/api/nisab-year-records/${finalizedRecordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ finalizationNotes: 'Test finalization for unlock' })
        .expect(200);

      if (!finalizedRecordId) {
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

  it('should unlock FINALIZED record successfully', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Testing unlock functionality for development purposes' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UNLOCKED');
  });

  it('should reject unlock without reason', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject unlock with reason too short', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Too short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject unlock with reason too long', async () => {
    const longReason = 'A'.repeat(501);
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: longReason });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject unlock of non-FINALIZED record', async () => {
    // Create a new DRAFT record
    const draftData = {
      hawlStartDate: new Date().toISOString(),
      hawlStartDateHijri: '1445-01-01H',
      hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000).toISOString(),
      hawlCompletionDateHijri: '1446-01-01H',
      nisabBasis: 'GOLD',
      nisabThresholdAtStart: 5000,
      userNotes: 'Draft record'
    };

    const draftResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send(draftData)
      .expect(201);

    const draftRecordId = draftResponse.body.data.id;

    const res = await request(app)
      .post(`/api/nisab-year-records/${draftRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Testing unlock of draft record' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_STATE');
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records/non-existent-id/unlock')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Testing non-existent record' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .send({ unlockReason: 'Testing unauthenticated request' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });
});