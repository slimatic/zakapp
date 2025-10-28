/**
 * Contract Test: PUT /api/nisab-year-records/:id
 * 
 * Tests updating a Nisab Year Record with status transition validation
 * 
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('PUT /api/nisab-year-records/:id', () => {
  let authToken: string;
  let userId: string;
  let draftRecordId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-put-nyr-${Date.now()}@example.com`,
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
        status: 'DRAFT',
        assetBreakdown: 'encrypted-json',
        calculationDetails: 'encrypted-json',
      },
    });
    draftRecordId = record.id;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should update record fields for DRAFT status', async () => {
    const res = await request(app)
      .put(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        totalLiabilities: 'encrypted-100',
        userNotes: 'Updated notes',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.record.userNotes).toBe('Updated notes');
  });

  it('should transition from DRAFT to FINALIZED', async () => {
    const res = await request(app)
      .put(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'FINALIZED',
      });

    expect(res.status).toBe(200);
    expect(res.body.record.status).toBe('FINALIZED');
  });

  it('should require unlock reason when transitioning to UNLOCKED', async () => {
    const res = await request(app)
      .put(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'UNLOCKED',
        // Missing unlockReason
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'INVALID_TRANSITION');
  });

  it('should reject invalid status transitions', async () => {
    const res = await request(app)
      .put(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'INVALID_STATUS',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .put('/api/nisab-year-records/nonexistent-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userNotes: 'Test',
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .put(`/api/nisab-year-records/${draftRecordId}`)
      .send({
        userNotes: 'Test',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });
});
