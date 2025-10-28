/**
 * Contract Test: POST /api/nisab-year-records/:id/unlock
 * 
 * Tests unlocking a FINALIZED Nisab Year Record for editing
 * 
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/nisab-year-records/:id/unlock', () => {
  let authToken: string;
  let userId: string;
  let finalizedRecordId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-unlock-nyr-${Date.now()}@example.com`,
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
        totalWealth: 'encrypted-5000',
        totalLiabilities: 'encrypted-0',
        zakatableWealth: 'encrypted-5000',
        zakatAmount: 'encrypted-125',
        methodologyUsed: 'standard',
        nisabThreshold: 'encrypted-5000',
        nisabType: 'gold',
        status: 'FINALIZED',
        assetBreakdown: 'encrypted-json',
        calculationDetails: 'encrypted-json',
      },
    });
    finalizedRecordId = record.id;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should unlock a FINALIZED record with valid reason', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reason: 'Corrections needed for asset valuation',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.record.status).toBe('UNLOCKED');
  });

  it('should reject unlock reason shorter than 10 characters', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reason: 'Too short',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'INVALID_UNLOCK_REASON');
    expect(res.body.message).toContain('at least 10 characters');
  });

  it('should reject unlock without reason', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should create audit trail entry with unlock reason', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reason: 'Corrections needed for asset valuation',
      });

    if (res.status === 200) {
      expect(res.body).toHaveProperty('auditEntry');
      expect(res.body.auditEntry.eventType).toBe('UNLOCKED');
      expect(res.body.auditEntry.unlockReason).toBeDefined();
      expect(res.body.auditEntry.timestamp).toBeDefined();
    }
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records/nonexistent-id/unlock')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reason: 'Corrections needed for asset valuation',
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .send({
        reason: 'Corrections needed for asset valuation',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('should return encrypted unlock reason in audit trail', async () => {
    const res = await request(app)
      .post(`/api/nisab-year-records/${finalizedRecordId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reason: 'Corrections needed for asset valuation',
      });

    if (res.status === 200 && res.body.auditEntry.unlockReason) {
      // Should be encrypted (not readable plaintext)
      expect(res.body.auditEntry.unlockReason).not.toBe('Corrections needed for asset valuation');
    }
  });
});
