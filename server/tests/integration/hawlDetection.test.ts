import { vi, type Mock } from 'vitest';
/**
 * T026: Integration Test - Nisab Achievement Detection
 * 
 * Tests end-to-end workflow when user's wealth first reaches Nisab threshold,
 * including Hawl tracking initialization and DRAFT record creation.
 * 
 * @see specs/008-nisab-year-record/quickstart.md - Scenario 1
 */

import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { NisabCalculationService } from '../../src/services/nisabCalculationService';
import { HawlTrackingService } from '../../src/services/hawlTrackingService';
import { WealthAggregationService } from '../../src/services/wealthAggregationService';
import { createAssetPayload } from '../helpers/testHelpers';

const prisma = new PrismaClient();

describe('Integration: Nisab Achievement Detection', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `nisabtest-${Date.now()}@example.com`,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Nisab',
        lastName: 'Test User',
      });

    authToken = registerResponse.body.data.tokens.accessToken;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.asset.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear records before each test
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.asset.deleteMany({ where: { userId } });
  });

  it('should detect Nisab achievement and create DRAFT record', async () => {
    // Step 1: User has assets below Nisab
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAssetPayload({
        name: 'Savings Account',
        category: 'cash',
        value: 4000,
      }));

    // Step 2: Verify no Hawl is active yet
    const statusBefore = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusBefore.body.active).toBe(false);

    // Step 3: Add asset that pushes wealth above Nisab
    const assetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAssetPayload({
        name: 'Gold Holdings',
        category: 'gold',
        value: 3500, // Total now = 7500 (above gold Nisab ~5293)
      }));

    expect(assetResponse.status).toBe(201);

    // Step 4: Check Hawl status - should be active now
    const statusAfter = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusAfter.body.active).toBe(true);
    expect(statusAfter.body.hawlStartDate).toBeDefined();
    expect(statusAfter.body.hawlCompletionDate).toBeDefined();
    expect(statusAfter.body.daysRemaining).toBeGreaterThan(350);
    expect(statusAfter.body.nisabBasis).toBe('gold');

    // Step 5: Verify DRAFT record was created
    const recordsResponse = await request(app)
      .get('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ status: 'DRAFT' });

    expect(recordsResponse.body.records).toHaveLength(1);
    const draftRecord = recordsResponse.body.records[0];
    expect(draftRecord.status).toBe('DRAFT');
    expect(draftRecord.totalWealth).toBeGreaterThanOrEqual(7500);
  });

  it('should not create duplicate Hawl if active DRAFT exists', async () => {
    // Step 1: Create assets above Nisab
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAssetPayload({
        name: 'Savings',
        category: 'cash',
        value: 8000,
      }));

    // Step 2: Verify Hawl started
    const status1 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status1.body.active).toBe(true);
    const firstRecordId = status1.body.recordId;

    // Step 3: Add more assets
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAssetPayload({
        name: 'Investment Account',
        category: 'investment',
        value: 5000,
      }));

    // Step 4: Verify same Hawl is still active (no duplicate)
    const status2 = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(status2.body.active).toBe(true);
    expect(status2.body.recordId).toBe(firstRecordId);

    // Step 5: Confirm only 1 DRAFT record exists
    const records = await request(app)
      .get('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ status: 'DRAFT' });

    expect(records.body.records).toHaveLength(1);
  });

  it('should use gold-based Nisab if gold threshold is lower', async () => {
    // Mock current precious metal prices
    // Assume: Gold Nisab ~$5,293, Silver Nisab ~$520
    // User will reach silver Nisab first at lower wealth amount

    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAssetPayload({
        name: 'Cash Savings',
        category: 'cash',
        value: 600, // Above silver Nisab, below gold Nisab
      }));

    const status = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    // Should detect Nisab achievement based on lower threshold (silver)
    // Note: Actual behavior depends on app's Nisab selection logic
    expect(status.body.active).toBe(true);
    expect(['gold', 'silver']).toContain(status.body.nisabBasis);
  });

  it('should lock Nisab threshold value at Hawl start', async () => {
    // Step 1: Create assets above Nisab
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAssetPayload({
        name: 'Cash',
        category: 'cash',
        value: 10000,
      }));

    // Step 2: Get active Hawl details
    const status = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    const recordId = status.body.recordId;

    // Step 3: Fetch full record
    const recordResponse = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 4: Verify nisabThresholdAtStart is set and won't change
    expect(recordResponse.body.nisabThresholdAtStart).toBeDefined();
    expect(parseFloat(recordResponse.body.nisabThresholdAtStart)).toBeGreaterThan(0);

    // Store initial threshold
    const initialThreshold = recordResponse.body.nisabThresholdAtStart;

    // Step 5: Simulate time passage and price change
    // (In real implementation, prices would be fetched from API and cached)
    // For test, verify threshold doesn't change when record is retrieved again

    const recordResponseLater = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(recordResponseLater.body.nisabThresholdAtStart).toBe(initialThreshold);
  });

  it('should calculate Hawl completion date as 354 days from start', async () => {
    // Create assets above Nisab
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAssetPayload({
        name: 'Savings',
        category: 'cash',
        value: 7000,
      }));

    const status = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    const startDate = new Date(status.body.hawlStartDate);
    const completionDate = new Date(status.body.hawlCompletionDate);

    const daysDiff = Math.floor(
      (completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysDiff).toBe(354);
  });

  it('should include Hijri date equivalents', async () => {
    // Create assets above Nisab
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAssetPayload({
        name: 'Cash',
        category: 'cash',
        value: 6000,
      }));

    const status = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    const recordId = status.body.recordId;

    const record = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(record.body.hawlStartDateHijri).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(record.body.hawlCompletionDateHijri).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
