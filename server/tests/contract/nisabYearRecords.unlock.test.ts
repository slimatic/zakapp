/**
 * Contract Test: POST /api/nisab-year-records/:id/unlock
 * 
 * Validates API contract compliance for unlocking finalized Nisab Year Records
 * Based on: specs/008-nisab-year-record/contracts/nisab-year-records.openapi.yaml
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt';
import { createFinalizedRecord } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('POST /api/nisab-year-records/:id/unlock - Contract Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-unlock@example.com',
        username: 'testunlock',
        passwordHash: 'hashedpassword',
        isActive: true,
      },
    });
    userId = user.id;
    authToken = 'Bearer ' + generateAccessToken(user.id);
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('Successful Unlock', () => {
    it('should unlock FINALIZED record with valid reason', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'FINALIZED',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '10000',
          totalLiabilities: '1000',
          zakatableWealth: '9000',
          zakatAmount: '225',
          methodologyUsed: 'standard',
          finalizedAt: new Date(),
        } as any,
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ reason: 'Need to correct total liabilities amount' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.record.status).toBe('UNLOCKED');
      expect(response.body.auditEntry).toBeDefined();
      expect(response.body.auditEntry.eventType).toBe('UNLOCKED');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should create audit trail entry with unlock reason', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'FINALIZED',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '10000',
          totalLiabilities: '1000',
          zakatableWealth: '9000',
          zakatAmount: '225',
          methodologyUsed: 'standard',
          finalizedAt: new Date(),
        } as any,
      });

      const unlockReason = 'Discovered uncounted asset after finalization';
      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ reason: unlockReason })
        .expect(200);

      expect(response.body.auditEntry.unlockReason).toBeDefined();
      // Note: unlockReason will be encrypted in the database

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Validation Errors', () => {
    it('should reject unlock without reason', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'FINALIZED',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '10000',
          totalLiabilities: '1000',
          zakatableWealth: '9000',
          zakatAmount: '225',
          methodologyUsed: 'standard',
          finalizedAt: new Date(),
        } as any,
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({}) // Missing reason
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should reject unlock with reason too short (< 10 chars)', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'FINALIZED',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '10000',
          totalLiabilities: '1000',
          zakatableWealth: '9000',
          zakatAmount: '225',
          methodologyUsed: 'standard',
          finalizedAt: new Date(),
        } as any,
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ reason: 'short' }) // Too short
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_UNLOCK_REASON');
      expect(response.body.message).toContain('10 characters');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should reject unlock of DRAFT record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'DRAFT',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '10000',
          totalLiabilities: '1000',
          zakatableWealth: '9000',
          zakatAmount: '225',
          methodologyUsed: 'standard',
        } as any,
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ reason: 'Valid reason but wrong status' })
        .expect(400);

      expect(response.body.success).toBe(false);

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should reject unlock of already UNLOCKED record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'UNLOCKED',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '10000',
          totalLiabilities: '1000',
          zakatableWealth: '9000',
          zakatAmount: '225',
          methodologyUsed: 'standard',
        } as any,
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ reason: 'Already unlocked record' })
        .expect(400);

      expect(response.body.success).toBe(false);

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent record', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/nisab-year-records/${fakeId}/unlock`)
        .set('Authorization', authToken)
        .send({ reason: 'Valid reason for non-existent record' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NOT_FOUND');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records/some-id/unlock')
        .send({ reason: 'Valid reason but no auth' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 404 when trying to unlock another user\'s record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'FINALIZED',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '10000',
          totalLiabilities: '1000',
          zakatableWealth: '9000',
          zakatAmount: '225',
          methodologyUsed: 'standard',
          finalizedAt: new Date(),
        } as any,
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other-unlock@example.com',
          username: 'otherunlock',
          passwordHash: 'hash',
          isActive: true,
        },
      });

      const otherToken = 'Bearer ' + generateAccessToken(otherUser.id);

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', otherToken)
        .send({ reason: 'Valid reason but different user' })
        .expect(404);

      expect(response.body.success).toBe(false);

      // Cleanup
      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Response Schema Validation', () => {
    it('should return correct response structure', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'FINALIZED',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '10000',
          totalLiabilities: '1000',
          zakatableWealth: '9000',
          zakatAmount: '225',
          methodologyUsed: 'standard',
          finalizedAt: new Date(),
        } as any,
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ reason: 'Correction needed for liability calculation' })
        .expect(200);

      // Top-level structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('record');
      expect(response.body).toHaveProperty('auditEntry');

      // Audit entry structure
      const auditEntry = response.body.auditEntry;
      expect(auditEntry).toHaveProperty('id');
      expect(auditEntry).toHaveProperty('nisabYearRecordId', record.id);
      expect(auditEntry).toHaveProperty('userId', userId);
      expect(auditEntry).toHaveProperty('eventType', 'UNLOCKED');
      expect(auditEntry).toHaveProperty('timestamp');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });
});
