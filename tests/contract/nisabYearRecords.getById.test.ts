/**
 * Contract Test: GET /api/nisab-year-records/:id
 * 
 * Tests retrieving a specific Nisab Year Record with full details and audit trail
 * 
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import request from 'supertest';
// import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../server/src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/nisab-year-records/:id', () => {
  let authToken: string;
  let userId: string;
  let recordId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-getbyid-nyr-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    });
    userId = user.id;
    authToken = 'mock-jwt-token';

    const record = await prisma.yearlySnapshot.create({
      data: {
        userId,
        calculationDate: new Date(),
        gregorianYear: 2025,
        gregorianMonth: 10,
        gregorianDay: 27,
        hijriYear: 1446,
        hijriMonth: 3,
        hijriDay: 24,
        totalWealth: 'encrypted-amount',
        totalLiabilities: 'encrypted-0',
        zakatableWealth: 'encrypted-amount',
        zakatAmount: 'encrypted-amount',
        methodologyUsed: 'standard',
        nisabThreshold: 'encrypted-5000',
        nisabType: 'gold',
        status: 'DRAFT',
        assetBreakdown: 'encrypted-json',
        calculationDetails: 'encrypted-json',
        hawlStartDate: new Date(),
        hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000),
        nisabBasis: 'gold',
      },
    });
    recordId = record.id;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should return 200 with record details', async () => {
    const res = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.id).toBe(recordId);

    // Verify wealth fields are numeric
    expect(typeof res.body.data.totalWealth).toBe('number');
    expect(typeof res.body.data.totalLiabilities).toBe('number');
    expect(typeof res.body.data.zakatableWealth).toBe('number');
    expect(typeof res.body.data.zakatAmount).toBe('number');
  });

  it('should include audit trail in response', async () => {
    const res = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('auditTrail');
    expect(Array.isArray(res.body.auditTrail)).toBe(true);
  });

  it('should include live tracking fields for DRAFT records', async () => {
    const res = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('currentTotalWealth');
    expect(res.body.data).toHaveProperty('daysRemaining');
    expect(res.body.data).toHaveProperty('isHawlComplete');
    expect(res.body.data).toHaveProperty('canFinalize');
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records/nonexistent-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app).get(`/api/nisab-year-records/${recordId}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('should not return records of other users', async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `test-other-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    });

    const res = await request(app)
      .get(`/api/nisab-year-records/${recordId}`)
      .set('Authorization', 'other-user-token');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');

    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});
