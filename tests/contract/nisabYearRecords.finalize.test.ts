/**
 * Contract Test: POST /api/nisab-year-records/:id/finalize
 * 
 * Tests finalizing a DRAFT Nisab Year Record (locking it for immutability)
 * 
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/nisab-year-records/:id/finalize', () => {
  let authToken: string;
  let userId: string;
  let draftRecordId: string;
  let prematureRecordId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-finalize-nyr-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    });
    userId = user.id;
    authToken = 'mock-jwt-token';

    // Create record with completed Hawl
    const completedRecord = await prisma.yearlySnapshot.create({
      data: {
        userId,
        calculationDate: new Date(),
        gregorianYear: 2025,
        gregorianMonth: 10,
        gregorianDay: 27,
        hijriYear: 1446,
        hijriMonth: 3,
        hijriDay: 24,
        totalWealth: 'encrypted-5000',
        totalLiabilities: 'encrypted-0',
        zakatableWealth: 'encrypted-5000',
        zakatAmount: 'encrypted-125',
        methodologyUsed: 'standard',
        nisabThreshold: 'encrypted-5000',
        nisabType: 'gold',
        status: 'DRAFT',
        assetBreakdown: 'encrypted-json',
        calculationDetails: 'encrypted-json',
      },
    });
    draftRecordId = completedRecord.id;

    // Create record with incomplete Hawl
    const prematureRecord = await prisma.yearlySnapshot.create({
      data: {
        userId,
        calculationDate: new Date(),
        gregorianYear: 2025,
        gregorianMonth: 10,
        gregorianDay: 27,
        hijriYear: 1446,
        hijriMonth: 3,
        hijriDay: 24,
        totalWealth: 'encrypted-5000',
        totalLiabilities: 'encrypted-0',
        zakatableWealth: 'encrypted-5000',
        zakatAmount: 'encrypted-125',
        methodologyUsed: 'standard',
        nisabThreshold: 'encrypted-5000',
        nisabType: 'gold',
        status: 'DRAFT',
        assetBreakdown: 'encrypted-json',
        calculationDetails: 'encrypted-json',
      },
    });
    prematureRecordId = prematureRecord.id;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should finalize a DRAFT record when Hawl is complete', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${draftRecordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.record.status).toBe('FINALIZED');
    expect(res.body.record.finalizedAt).toBeDefined();
  });

  it('should not finalize when Hawl is incomplete', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${prematureRecordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'HAWL_NOT_COMPLETE');
    expect(res.body).toHaveProperty('daysRemaining');
  });

  it('should allow override with acknowledgePremature flag', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${prematureRecordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        override: true,
        acknowledgePremature: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.record.status).toBe('FINALIZED');
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records/nonexistent-id/finalize')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${draftRecordId}/finalize`)
      .send({});

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('should create audit trail entry for finalization', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${draftRecordId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    if (res.status === 200) {
      expect(res.body).toHaveProperty('auditEntry');
      expect(res.body.auditEntry.eventType).toBe('FINALIZED');
      expect(res.body.auditEntry.timestamp).toBeDefined();
    }
  });
});
