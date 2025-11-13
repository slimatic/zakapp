/**
 * Contract Test: DELETE /api/nisab-year-records/:id
 * 
 * Tests deleting a Nisab Year Record (only DRAFT records allowed)
 * 
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('DELETE /api/nisab-year-records/:id', () => {
  let authToken: string;
  let userId: string;
  let draftRecordId: string;
  let finalizedRecordId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-delete-nyr-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    });
    userId = user.id;
    authToken = 'mock-jwt-token';

    const draftRecord = await prisma.yearlySnapshot.create({
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
    draftRecordId = draftRecord.id;

    const finalizedRecord = await prisma.yearlySnapshot.create({
      data: {
        userId,
        calculationDate: new Date(),
        gregorianYear: 2024,
        gregorianMonth: 10,
        gregorianDay: 27,
        hijriYear: 1445,
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
    finalizedRecordId = finalizedRecord.id;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should delete a DRAFT record', async () => {
    const res = await request(app)
      .delete(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Record deleted successfully');
  });

  it('should not delete FINALIZED records', async () => {
    const res = await request(app)
      .delete(`/api/nisab-year-records/${finalizedRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'DELETE_NOT_ALLOWED');
    expect(res.body.message).toContain('Cannot delete FINALIZED');
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .delete('/api/nisab-year-records/nonexistent-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .delete(`/api/nisab-year-records/${draftRecordId}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('should not return deleted record in subsequent GET', async () => {
    const deleteRes = await request(app)
      .delete(`/api/nisab-year-records/${draftRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);

    if (deleteRes.status === 200) {
      const getRes = await request(app)
        .get(`/api/nisab-year-records/${draftRecordId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);
    }
  });
});
