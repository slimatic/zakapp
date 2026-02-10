/**
 * Contract Test: DELETE /api/nisab-year-records/:id
 *
 * Tests deleting a Nisab Year Record (only DRAFT records allowed)
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

describe('DELETE /api/nisab-year-records/:id', () => {
  let app: any;
  let authToken: string;
  let draftRecordId: string;
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
        email: `test-nyr-delete-${timestamp}@example.com`,
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

      // Create a draft record
      const draftData = {
        hawlStartDate: new Date().toISOString(),
        hawlStartDateHijri: '1445-01-01H',
        hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000).toISOString(),
        hawlCompletionDateHijri: '1446-01-01H',
        nisabBasis: 'GOLD',
        nisabThresholdAtStart: 5000,
        userNotes: 'Draft record for delete test'
      };

      const draftResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(draftData)
        .expect(201);

      draftRecordId = draftResponse.body.data.id;

      // Create and finalize a record
      const finalizedData = {
        hawlStartDate: new Date(Date.now() - 355 * 24 * 60 * 60 * 1000).toISOString(), // Already completed
        hawlStartDateHijri: '1444-01-01H',
        hawlCompletionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Completed yesterday
        hawlCompletionDateHijri: '1445-01-01H',
        nisabBasis: 'GOLD',
        nisabThresholdAtStart: 5000,
        userNotes: 'Finalized record for delete test'
      };

      const finalizedResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(finalizedData)
        .expect(201);

      finalizedRecordId = finalizedResponse.body.data.id;

      // Finalize the record
      await request(app)
        .post(`/api/nisab-year-records/${finalizedRecordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ finalizationNotes: 'Test finalization' })
        .expect(200);

      if (!draftRecordId || !finalizedRecordId) {
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

  it('should delete DRAFT record successfully', async () => {
    const res = await request(app)
      .delete(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Record deleted successfully');
  });

  it('should reject deletion of FINALIZED record', async () => {
    const res = await request(app)
      .delete(`/api/nisab-year-records/${finalizedRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('INVALID_STATE');
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .delete('/api/nisab-year-records/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .delete(`/api/nisab-year-records/${draftRecordId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});