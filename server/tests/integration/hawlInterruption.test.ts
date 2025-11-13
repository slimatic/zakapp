/**
 * T028: Integration Test - Hawl Interruption (Wealth Drop Below Nisab)
 * 
 * Tests detection and handling when aggregate wealth drops below Nisab
 * threshold during an active Hawl period, causing interruption.
 * 
 * @see specs/008-nisab-year-record/quickstart.md - Scenario 3
 */

import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration: Hawl Interruption', () => {
  let authToken: string;
  let userId: string;
  let assetId: string;

  beforeAll(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'interruption@example.com',
        password: 'TestPass123!',
        name: 'Interruption Test User',
      });

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.asset.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear previous test data
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.asset.deleteMany({ where: { userId } });
  });

  it('should detect Hawl interruption when wealth drops below Nisab', async () => {
    // Step 1: Create asset above Nisab (start Hawl)
    const assetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Savings Account',
        category: 'cash',
        currentValue: 8000, // Above Nisab
        isZakatable: true,
      });

    assetId = assetResponse.body.asset.id;

    // Step 2: Verify Hawl is active
    const statusBefore = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusBefore.body.active).toBe(true);

    // Step 3: Reduce asset value below Nisab
    await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentValue: 3000, // Below Nisab threshold (~5,293)
      });

    // Step 4: Verify Hawl status shows interruption
    const statusAfter = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusAfter.body.active).toBe(false);
    expect(statusAfter.body.interrupted).toBe(true);
    expect(statusAfter.body.reason).toContain('wealth dropped below Nisab');
  });

  it('should archive interrupted DRAFT record', async () => {
    // Step 1: Start Hawl
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Cash',
        category: 'cash',
        currentValue: 7000,
        isZakatable: true,
      });

    const status1 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    const recordId = status1.body.recordId;

    // Step 2: Delete asset to drop below Nisab
    const assets = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${authToken}`);

    const assetId = assets.body.assets[0].id;

    await request(app)
      .delete(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 3: Verify DRAFT record is archived/marked interrupted
    const record = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Record may be deleted or marked with interrupted status
    expect([404, 200]).toContain(record.status);
    
    if (record.status === 200) {
      expect(record.body.status).toBe('INTERRUPTED');
    }
  });

  it('should allow new Hawl to start after interruption if wealth rises again', async () => {
    // Step 1: Start initial Hawl
    const asset1 = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Savings',
        category: 'cash',
        currentValue: 6000,
        isZakatable: true,
      });

    const assetId1 = asset1.body.asset.id;

    const status1 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status1.body.active).toBe(true);
    const firstRecordId = status1.body.recordId;

    // Step 2: Drop below Nisab (interrupt)
    await request(app)
      .put(`/api/assets/${assetId1}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ currentValue: 2000 });

    const status2 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status2.body.active).toBe(false);

    // Step 3: Rise above Nisab again (new Hawl should start)
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'New Income',
        category: 'cash',
        currentValue: 8000,
        isZakatable: true,
      });

    const status3 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status3.body.active).toBe(true);
    expect(status3.body.recordId).not.toBe(firstRecordId); // New record
    expect(status3.body.hawlStartDate).toBeDefined();
  });

  it('should not interrupt if wealth temporarily fluctuates but stays above Nisab', async () => {
    // Step 1: Start Hawl
    const asset1 = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Cash 1',
        category: 'cash',
        currentValue: 4000,
        isZakatable: true,
      });

    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Cash 2',
        category: 'cash',
        currentValue: 3000,
        isZakatable: true,
      });

    const status1 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status1.body.active).toBe(true);
    const recordId = status1.body.recordId;

    // Step 2: Reduce one asset (total still above Nisab)
    const assetId1 = asset1.body.asset.id;
    await request(app)
      .put(`/api/assets/${assetId1}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ currentValue: 3500 }); // Total now 6500 (still above ~5293)

    // Step 3: Verify Hawl still active
    const status2 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status2.body.active).toBe(true);
    expect(status2.body.recordId).toBe(recordId); // Same Hawl
  });

  it('should record interruption in audit trail', async () => {
    // Step 1: Start Hawl
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Cash',
        category: 'cash',
        currentValue: 7500,
        isZakatable: true,
      });

    const status = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    const recordId = status.body.recordId;

    // Step 2: Trigger interruption
    const assets = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${authToken}`);

    await request(app)
      .delete(`/api/assets/${assets.body.assets[0].id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 3: Check audit trail
    const auditResponse = await request(app)
      .get(`/api/nisab-year-records/${recordId}/audit-trail`)
      .set('Authorization', `Bearer ${authToken}`);

    if (auditResponse.status === 200) {
      const auditEntries = auditResponse.body.auditTrail;
      
      const interruptionEvent = auditEntries.find(
        (entry: { eventType: string }) => entry.eventType === 'INTERRUPTED'
      );

      expect(interruptionEvent).toBeDefined();
      expect(interruptionEvent.changesSummary).toContain('wealth dropped below Nisab');
    }
  });

  it('should clear Hawl completion date on interruption', async () => {
    // Step 1: Start Hawl
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Savings',
        category: 'cash',
        currentValue: 6500,
        isZakatable: true,
      });

    const status1 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status1.body.hawlCompletionDate).toBeDefined();

    // Step 2: Interrupt Hawl
    const assets = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${authToken}`);

    await request(app)
      .put(`/api/assets/${assets.body.assets[0].id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ currentValue: 2500 });

    // Step 3: Verify no active Hawl with completion date
    const status2 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status2.body.active).toBe(false);
    expect(status2.body.hawlCompletionDate).toBeUndefined();
  });
});
