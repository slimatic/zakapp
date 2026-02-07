import { vi, type Mock, describe, it, expect, beforeAll, afterAll } from 'vitest';
/**
 * T029: Integration Test - Finalization Workflow
 * 
 * Tests the complete workflow of finalizing a Nisab Year Record
 * after Hawl completion, including validation and state transitions.
 * 
 * @see specs/008-nisab-year-record/quickstart.md - Scenario 4
 */

import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration: Finalization Workflow', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `finalization-${Date.now()}@example.com`,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Finalization',
        lastName: 'Test User',
      });

    authToken = registerResponse.body.data.tokens.accessToken;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('should finalize DRAFT record after Hawl completion date', async () => {
    // Step 1: Create a DRAFT record with past completion date
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        hawlStartDateHijri: '1445-01-01',
        hawlCompletionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        hawlCompletionDateHijri: '1446-01-01',
        nisabBasis: 'GOLD',
        totalWealth: 10000,
        zakatableWealth: 10000,
        zakatAmount: 250,
      });

    const recordId = createResponse.body.data.id;

    // Step 2: Finalize the record
    const finalizeResponse = await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(finalizeResponse.status).toBe(200);
    expect(finalizeResponse.body.data.status).toBe('FINALIZED');
    expect(finalizeResponse.body.data.finalizedAt).toBeDefined();

    // Step 3: Verify record is now read-only
    const updateAttempt = await request(app)
      .put(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ totalWealth: 15000 });

    expect(updateAttempt.status).toBe(403);
    expect(updateAttempt.body.error).toContain('Cannot update finalized record');
  });

  it('should NOT finalize before Hawl completion date without override', async () => {
    // Step 1: Create DRAFT with future completion date
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(),
        hawlStartDateHijri: '1446-01-01',
        hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000), // 300 days from now
        hawlCompletionDateHijri: '1447-01-01',
        nisabBasis: 'GOLD',
        totalWealth: 8000,
        zakatableWealth: 8000,
        zakatAmount: 200,
      });

    const recordId = createResponse.body.data.id;

    // Step 2: Attempt to finalize
    const finalizeResponse = await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(finalizeResponse.status).toBe(400);
    expect(finalizeResponse.body.error).toContain('Cannot finalize before Hawl completion');
  });

  it('should allow early finalization with override flag', async () => {
    // Step 1: Create DRAFT with future completion date
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1445-02-01',
        hawlCompletionDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days future
        hawlCompletionDateHijri: '1446-02-01',
        nisabBasis: 'SILVER',
        totalWealth: 7000,
        zakatableWealth: 7000,
        zakatAmount: 175,
      });

    const recordId = createResponse.body.data.id;

    // Step 2: Finalize with override
    const finalizeResponse = await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ override: true });

    expect(finalizeResponse.status).toBe(200);
    expect(finalizeResponse.body.data.status).toBe('FINALIZED');
  });

  it('should record FINALIZED event in audit trail', async () => {
    // Step 1: Create and finalize record
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1445-01-01',
        hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1446-01-01',
        nisabBasis: 'GOLD',
        totalWealth: 12000,
        zakatableWealth: 12000,
        zakatAmount: 300,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 2: Check audit trail
    const auditResponse = await request(app)
      .get(`/api/nisab-year-records/${recordId}/audit-trail`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(auditResponse.status).toBe(200);
    
    const finalizedEvent = auditResponse.body.auditTrail.find(
      (entry: { eventType: string }) => entry.eventType === 'FINALIZED'
    );

    expect(finalizedEvent).toBeDefined();
    expect(finalizedEvent.beforeState.status).toBe('DRAFT');
    expect(finalizedEvent.afterState.status).toBe('FINALIZED');
    expect(finalizedEvent.timestamp).toBeDefined();
  });

  it('should prevent deletion of FINALIZED record', async () => {
    // Step 1: Create and finalize record
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1445-01-01',
        hawlCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1446-01-01',
        nisabBasis: 'GOLD',
        totalWealth: 9000,
        zakatableWealth: 9000,
        zakatAmount: 225,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 2: Attempt to delete
    const deleteResponse = await request(app)
      .delete(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteResponse.status).toBe(403);
    expect(deleteResponse.body.error).toContain('Cannot delete finalized record');
  });

  it('should lock all financial values on finalization', async () => {
    // Step 1: Create DRAFT record
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1445-01-01',
        hawlCompletionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1446-01-01',
        nisabBasis: 'GOLD',
        totalWealth: 11000,
        zakatableWealth: 11000,
        zakatAmount: 275,
      });

    const recordId = createResponse.body.data.id;
    const beforeWealth = createResponse.body.data.totalWealth;
    const beforeZakat = createResponse.body.data.zakatAmount;

    // Step 2: Finalize
    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 3: Verify values unchanged
    const afterResponse = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(afterResponse.body.data.totalWealth).toBe(beforeWealth);
    expect(afterResponse.body.data.zakatAmount).toBe(beforeZakat);
    expect(afterResponse.body.data.status).toBe('FINALIZED');
  });

  it('should NOT allow re-finalization of already FINALIZED record', async () => {
    // Step 1: Create and finalize
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1445-01-01',
        hawlCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1446-01-01',
        nisabBasis: 'GOLD',
        totalWealth: 10000,
        zakatableWealth: 10000,
        zakatAmount: 250,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 2: Attempt to finalize again
    const secondFinalizeResponse = await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(secondFinalizeResponse.status).toBe(400);
    expect(secondFinalizeResponse.body.error).toContain('already finalized');
  });

  it('should include finalizedAt timestamp', async () => {
    // Step 1: Create and finalize
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1445-01-01',
        hawlCompletionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1446-01-01',
        nisabBasis: 'GOLD',
        totalWealth: 8500,
        zakatableWealth: 8500,
        zakatAmount: 212.5,
      });

    const recordId = createResponse.body.data.id;

    const beforeFinalize = Date.now();

    const finalizeResponse = await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    const afterFinalize = Date.now();

    const finalizedAt = new Date(finalizeResponse.body.data.finalizedAt);

    expect(finalizedAt.getTime()).toBeGreaterThanOrEqual(beforeFinalize);
    expect(finalizedAt.getTime()).toBeLessThanOrEqual(afterFinalize);
  });
});
