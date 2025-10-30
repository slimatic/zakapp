/**
 * T027: Integration Test - Live Wealth Tracking
 * 
 * Tests real-time wealth aggregation updates as assets change,
 * frontend polling simulation, and <100ms performance requirement.
 * 
 * @see specs/008-nisab-year-record/research.md - Live tracking implementation
 * @see specs/008-nisab-year-record/quickstart.md - Scenario 2
 */

import request from 'supertest';
import moment from 'moment';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration: Live Wealth Tracking', () => {
  let authToken: string;
  let userId: string;
  let draftRecordId: string;

  beforeAll(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'livetrack@example.com',
        password: 'TestPass123!',
        name: 'Live Track User',
      });

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create initial assets to trigger Hawl
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Initial Cash',
        category: 'cash',
        currentValue: 7000,
        isZakatable: true,
      });

    const status = await request(app)
      .get('/api/nisab-year-records/status')
      .set('Authorization', `Bearer ${authToken}`);

    draftRecordId = status.body.recordId;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.asset.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should update DRAFT record when asset is added', async () => {
    // Step 1: Get current DRAFT record wealth
    const before = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const wealthBefore = parseFloat(before.body.totalWealth);

    // Step 2: Add new asset
    const newAssetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Gold Jewelry',
        category: 'gold',
        currentValue: 2000,
        isZakatable: true,
      });

    expect(newAssetResponse.status).toBe(201);

    // Step 3: Verify DRAFT record updated automatically
    const after = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const wealthAfter = parseFloat(after.body.totalWealth);

    expect(wealthAfter).toBe(wealthBefore + 2000);
  });

  it('should update DRAFT record when asset value is modified', async () => {
    // Step 1: Create an asset
    const assetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Investment Portfolio',
        category: 'investment',
        currentValue: 5000,
        isZakatable: true,
      });

    const assetId = assetResponse.body.asset.id;

    // Step 2: Get current wealth
    const before = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const wealthBefore = parseFloat(before.body.totalWealth);

    // Step 3: Update asset value
    await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentValue: 7000, // Increased by 2000
      });

    // Step 4: Verify wealth increased
    const after = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const wealthAfter = parseFloat(after.body.totalWealth);

    expect(wealthAfter).toBe(wealthBefore + 2000);
  });

  it('should update DRAFT record when asset is deleted', async () => {
    // Step 1: Create asset to delete
    const assetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Temporary Asset',
        category: 'cash',
        currentValue: 1500,
        isZakatable: true,
      });

    const assetId = assetResponse.body.asset.id;

    // Step 2: Get current wealth
    const before = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const wealthBefore = parseFloat(before.body.totalWealth);

    // Step 3: Delete asset
    await request(app)
      .delete(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Step 4: Verify wealth decreased
    const after = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const wealthAfter = parseFloat(after.body.totalWealth);

    expect(wealthAfter).toBe(wealthBefore - 1500);
  });

  it('should recalculate Zakat amount when wealth changes', async () => {
    // Step 1: Get current Zakat amount
    const before = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const zakatBefore = parseFloat(before.body.zakatAmount);
    const wealthBefore = parseFloat(before.body.zakatableWealth);

    // Step 2: Add asset
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Additional Cash',
        category: 'cash',
        currentValue: 4000,
        isZakatable: true,
      });

    // Step 3: Verify Zakat recalculated (2.5% of new wealth)
    const after = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const zakatAfter = parseFloat(after.body.zakatAmount);
    const wealthAfter = parseFloat(after.body.zakatableWealth);

    expect(wealthAfter).toBe(wealthBefore + 4000);
    expect(zakatAfter).toBeCloseTo(wealthAfter * 0.025, 2);
    expect(zakatAfter).toBeGreaterThan(zakatBefore);
  });

  it('should handle non-zakatable assets correctly', async () => {
    // Step 1: Get wealth before
    const before = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const wealthBefore = parseFloat(before.body.totalWealth);

    // Step 2: Add non-zakatable asset
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Personal Residence',
        category: 'real_estate',
        currentValue: 300000,
        isZakatable: false, // NOT zakatable
      });

    // Step 3: Verify wealth unchanged
    const after = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const wealthAfter = parseFloat(after.body.totalWealth);

    expect(wealthAfter).toBe(wealthBefore); // Should not include non-zakatable
  });

  it('should meet performance requirement (<100ms for aggregation)', async () => {
    // Create 50 zakatable assets to test performance
    const assetPromises = Array.from({ length: 50 }, (_, i) =>
      request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Asset ${i}`,
          category: i % 2 === 0 ? 'cash' : 'gold',
          currentValue: 100 + i,
          isZakatable: true,
        })
    );

    await Promise.all(assetPromises);

    // Measure aggregation time
    const startTime = Date.now();
    
    const response = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const duration = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100); // Performance requirement
  });

  it('should provide asset breakdown by category', async () => {
    // Get record with breakdown
    const response = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.body.assetBreakdown).toBeDefined();
    expect(response.body.assetBreakdown).toHaveProperty('cash');
    expect(response.body.assetBreakdown).toHaveProperty('gold');
    
    // Verify total matches sum of categories
    const breakdownTotal = Object.values(response.body.assetBreakdown as Record<string, number>)
      .reduce((sum, val) => sum + val, 0);
    
    const recordTotal = parseFloat(response.body.totalWealth);
    
    expect(breakdownTotal).toBeCloseTo(recordTotal, 2);
  });

  it('should update updatedAt timestamp on recalculation', async () => {
    // Step 1: Get current updatedAt
    const before = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const updatedAtBefore = new Date(before.body.updatedAt);

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Modify asset
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'New Asset',
        category: 'cash',
        currentValue: 500,
        isZakatable: true,
      });

    // Step 3: Verify updatedAt changed
    const after = await request(app)
      .get(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const updatedAtAfter = new Date(after.body.updatedAt);

    expect(updatedAtAfter.getTime()).toBeGreaterThan(updatedAtBefore.getTime());
  });
});
