/**
 * T031: Integration Test - Status Transition Validation
 * 
 * Tests enforcement of valid state transitions and prevention of invalid ones.
 * 
 * @see specs/008-nisab-year-record/data-model.md - State transition rules
 */

import request from 'supertest';
import { app } from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration: Status Transition Validation', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'transitions@example.com',
        password: 'TestPass123!',
        name: 'Transitions Test User',
      });

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Valid Transitions', () => {
    it('should allow DRAFT → FINALIZED transition', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      const recordId = createResponse.body.record.id;
      expect(createResponse.body.record.status).toBe('DRAFT');

      const finalizeResponse = await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalizeResponse.status).toBe(200);
      expect(finalizeResponse.body.record.status).toBe('FINALIZED');
    });

    it('should allow FINALIZED → UNLOCKED transition', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 9000,
          zakatableWealth: 9000,
          zakatAmount: 225,
        });

      const recordId = createResponse.body.record.id;

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      const unlockResponse = await request(app)
        .post(`/api/nisab-year-records/${recordId}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Valid reason for unlocking the record here' });

      expect(unlockResponse.status).toBe(200);
      expect(unlockResponse.body.record.status).toBe('UNLOCKED');
    });

    it('should allow UNLOCKED → FINALIZED transition (re-finalization)', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 8000,
          zakatableWealth: 8000,
          zakatAmount: 200,
        });

      const recordId = createResponse.body.record.id;

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Unlocking for necessary corrections' });

      const refinalize = await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(refinalize.status).toBe(200);
      expect(refinalize.body.record.status).toBe('FINALIZED');
    });
  });

  describe('Invalid Transitions', () => {
    it('should NOT allow DRAFT → UNLOCKED transition', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 7000,
          zakatableWealth: 7000,
          zakatAmount: 175,
        });

      const recordId = createResponse.body.record.id;
      expect(createResponse.body.record.status).toBe('DRAFT');

      const unlockAttempt = await request(app)
        .post(`/api/nisab-year-records/${recordId}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Attempting invalid transition' });

      expect(unlockAttempt.status).toBe(400);
      expect(unlockAttempt.body.error).toContain('Only FINALIZED records can be unlocked');
    });

    it('should NOT allow FINALIZED → DRAFT transition', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 9000,
          zakatableWealth: 9000,
          zakatAmount: 225,
        });

      const recordId = createResponse.body.record.id;

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      // Attempt to manually update status to DRAFT
      const updateAttempt = await request(app)
        .put(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'DRAFT' });

      expect([400, 403]).toContain(updateAttempt.status);
      expect(updateAttempt.body.error).toBeDefined();
    });

    it('should NOT allow UNLOCKED → DRAFT transition', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 8500,
          zakatableWealth: 8500,
          zakatAmount: 212.5,
        });

      const recordId = createResponse.body.record.id;

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Unlocking for corrections' });

      // Attempt to set status to DRAFT
      const updateAttempt = await request(app)
        .put(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'DRAFT' });

      expect([400, 403]).toContain(updateAttempt.status);
    });

    it('should NOT allow direct status field updates', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 7500,
          zakatableWealth: 7500,
          zakatAmount: 187.5,
        });

      const recordId = createResponse.body.record.id;

      const updateAttempt = await request(app)
        .put(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'FINALIZED' });

      expect(updateAttempt.status).toBe(400);
      expect(updateAttempt.body.error).toContain('Status can only be changed via finalize/unlock endpoints');
    });
  });

  describe('State Transition Constraints', () => {
    it('should maintain status integrity across multiple operations', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      const recordId = createResponse.body.record.id;

      // Check status at each stage
      let record = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(record.body.status).toBe('DRAFT');

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      record = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(record.body.status).toBe('FINALIZED');

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Correction needed after review' });

      record = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(record.body.status).toBe('UNLOCKED');
    });

    it('should prevent concurrent status changes', async () => {
      // This test would require actual concurrent requests
      // Simplified version: verify atomic transitions
      
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 9500,
          zakatableWealth: 9500,
          zakatAmount: 237.5,
        });

      const recordId = createResponse.body.record.id;

      const finalize1 = request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      const finalize2 = request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken}`);

      const results = await Promise.all([finalize1, finalize2]);

      // One should succeed, one should fail (already finalized)
      const statuses = results.map(r => r.status);
      expect(statuses).toContain(200);
      expect(statuses.filter(s => s === 400 || s === 409).length).toBeGreaterThanOrEqual(1);
    });
  });
});
