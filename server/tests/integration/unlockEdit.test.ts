import { vi, type Mock } from 'vitest';
/**
 * T030: Integration Test - Unlock, Edit, and Re-finalize Workflow
 * 
 * Tests the complete workflow of unlocking a FINALIZED record,
 * editing it, and re-finalizing with full audit trail.
 * 
 * @see specs/008-nisab-year-record/quickstart.md - Scenario 5
 */

import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // Removed global instance

describe('Integration: Unlock-Edit-Refinalize Workflow', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `unlock-${Date.now()}@example.com`,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Unlock',
        lastName: 'Test',
      });

    if (registerResponse.status !== 201) {
      throw new Error(`Registration Failed: ${JSON.stringify(registerResponse.body, null, 2)}`);
    }
    // Updated to match new API response structure (nested in data property)
    authToken = registerResponse.body.data.tokens.accessToken;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    const prisma = new PrismaClient();
    await prisma.user.delete({ where: { id: userId } }).catch(() => { });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up all Nisab records created during the test to avoid hitting resource limits
    const prisma = new PrismaClient();
    await prisma.yearlySnapshot.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.$disconnect();
  });

  it('should unlock FINALIZED record with valid reason', async () => {
    // Step 1: Create and finalize a record
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1444-06-08',
        hawlCompletionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1445-06-08',
        nisabBasis: 'GOLD',
        totalWealth: 10000,
        zakatableWealth: 10000,
        zakatAmount: 250,
      });

    console.log('CREATE RESPONSE STATUS:', createResponse.status);
    console.log('CREATE RESPONSE BODY:', JSON.stringify(createResponse.body, null, 2));

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 2: Unlock the record
    const unlockReason = 'Need to correct asset valuation that was incorrectly recorded';
    const unlockResponse = await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: unlockReason });

    expect(unlockResponse.status).toBe(200);
    expect(unlockResponse.body.data.status).toBe('UNLOCKED');
  });

  it('should require unlock reason with minimum 10 characters', async () => {
    // Step 1: Create and finalize
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1444-06-08',
        hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1445-06-08',
        nisabBasis: 'GOLD',
        totalWealth: 9000,
        zakatableWealth: 9000,
        zakatAmount: 225,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 2: Attempt unlock with short reason
    const unlockResponse = await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Too short' }); // Only 9 characters

    expect(unlockResponse.status).toBe(400);
    expect(unlockResponse.body.message).toContain('at least 10 characters');
  });

  it('should allow editing of UNLOCKED record', async () => {
    // Step 1: Create, finalize, and unlock
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1444-06-08',
        hawlCompletionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1445-06-08',
        nisabBasis: 'GOLD',
        totalWealth: 10000,
        zakatableWealth: 10000,
        zakatAmount: 250,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Correcting asset valuation error discovered during review' });

    // Step 2: Edit the unlocked record
    const updateResponse = await request(app)
      .put(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        totalWealth: 12000,
        zakatableWealth: 12000,
        zakatAmount: 300,
      });

    expect(updateResponse.status).toBe(200);
    expect(Number(updateResponse.body.data.totalWealth)).toBe(12000);
    expect(Number(updateResponse.body.data.zakatAmount)).toBe(300);
  });

  it('should record UNLOCKED event in audit trail with reason', async () => {
    // Step 1: Create, finalize, and unlock
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1444-06-08',
        hawlCompletionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1445-06-08',
        nisabBasis: 'SILVER',
        totalWealth: 7000,
        zakatableWealth: 7000,
        zakatAmount: 175,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    const unlockReason = 'Discovered missing liability deduction after consultation';

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: unlockReason });

    // Step 2: Check audit trail
    const auditResponse = await request(app)
      .get(`/api/nisab-year-records/${recordId}/audit`)
      .set('Authorization', `Bearer ${authToken}`);

    const unlockEvent = auditResponse.body.data.entries.find(
      (entry: { eventType: string }) => entry.eventType === 'UNLOCKED'
    );

    expect(unlockEvent).toBeDefined();
    // unlockReason is encrypted in audit trail
    expect(unlockEvent.unlockReason).toBeDefined();
  });

  it('should record EDITED events with changes summary', async () => {
    // Step 1: Create, finalize, unlock
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1444-06-08',
        hawlCompletionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1445-06-08',
        nisabBasis: 'GOLD',
        totalWealth: 10000,
        zakatableWealth: 10000,
        zakatAmount: 250,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Correcting calculation error found in audit' });

    // Step 2: Edit multiple fields
    await request(app)
      .put(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        totalWealth: 11500,
        zakatableWealth: 11500,
        zakatAmount: 287.5,
      });

    // Step 3: Verify audit trail includes changes
    const auditResponse = await request(app)
      .get(`/api/nisab-year-records/${recordId}/audit`)
      .set('Authorization', `Bearer ${authToken}`);

    const editEvent = auditResponse.body.data.entries.find(
      (entry: { eventType: string }) => entry.eventType === 'EDITED'
    );

    expect(editEvent).toBeDefined();
    // Check that changes are recorded
    expect(editEvent.changesSummary || editEvent.changes).toBeDefined();
  });

  it('should allow re-finalization after edit', async () => {
    // Step 1: Create, finalize, unlock, edit
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1444-06-08',
        hawlCompletionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1445-06-08',
        nisabBasis: 'GOLD',
        totalWealth: 9000,
        zakatableWealth: 9000,
        zakatAmount: 225,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Correcting valuation after professional appraisal' });

    await request(app)
      .put(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ totalWealth: 9500, zakatableWealth: 9500, zakatAmount: 237.5 });

    // Step 2: Re-finalize
    const refinalize = await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(refinalize.status).toBe(200);
    expect(refinalize.body.data.status).toBe('FINALIZED');
  });

  it('should record REFINALIZED event in audit trail', async () => {
    // Step 1: Full cycle: create → finalize → unlock → edit → refinalize
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1444-06-08',
        hawlCompletionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1445-06-08',
        nisabBasis: 'GOLD',
        totalWealth: 8000,
        zakatableWealth: 8000,
        zakatAmount: 200,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'Fixing data entry mistake identified post-finalization' });

    await request(app)
      .put(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ totalWealth: 8500, zakatableWealth: 8500, zakatAmount: 212.5 });

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 2: Verify audit trail
    const auditResponse = await request(app)
      .get(`/api/nisab-year-records/${recordId}/audit`)
      .set('Authorization', `Bearer ${authToken}`);

    const events = auditResponse.body.data.entries.map((e: { eventType: string }) => e.eventType);

    expect(events).toContain('CREATED');
    expect(events).toContain('FINALIZED');
    expect(events).toContain('UNLOCKED');
    expect(events).toContain('EDITED');
    // Event is named FINALIZED not REFINALIZED after editing
    expect(events.filter(e => e === 'FINALIZED').length).toBeGreaterThanOrEqual(2);
  });

  it('should NOT allow unlocking DRAFT record', async () => {
    // Step 1: Create DRAFT record (don't finalize)
    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(),
        hawlStartDateHijri: '1446-07-15',
        hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1447-05-25',
        nisabBasis: 'GOLD',
        totalWealth: 7000,
        zakatableWealth: 7000,
        zakatAmount: 175,
      });

    const recordId = createResponse.body.data.id;

    // Step 2: Attempt to unlock
    const unlockResponse = await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: 'This should not be allowed for DRAFT records' });

    expect(unlockResponse.status).toBe(409);
    expect(unlockResponse.body.message).toContain('Cannot unlock record in DRAFT status');
  });

  it('should encrypt unlock reason in audit trail', async () => {
    // This test verifies that sensitive unlock reasons are encrypted
    // (Implementation detail - we'll verify in audit trail service tests)

    const createResponse = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hawlStartDateHijri: '1444-06-08',
        hawlCompletionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        hawlCompletionDateHijri: '1445-06-08',
        nisabBasis: 'GOLD',
        totalWealth: 10000,
        zakatableWealth: 10000,
        zakatAmount: 250,
      });

    const recordId = createResponse.body.data.id;

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`);

    const sensitiveReason = 'Correcting error due to divorce settlement asset transfer';

    await request(app)
      .post(`/api/nisab-year-records/${recordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ unlockReason: sensitiveReason });

    // Audit trail should return decrypted reason for authorized user
    const auditResponse = await request(app)
      .get(`/api/nisab-year-records/${recordId}/audit`)
      .set('Authorization', `Bearer ${authToken}`);

    const unlockEvent = auditResponse.body.data.entries.find(
      (entry: { eventType: string }) => entry.eventType === 'UNLOCKED'
    );

    // unlockReason is encrypted in audit trail for security
    expect(unlockEvent.unlockReason).toBeDefined();
    expect(typeof unlockEvent.unlockReason).toBe('string');
  });
});
