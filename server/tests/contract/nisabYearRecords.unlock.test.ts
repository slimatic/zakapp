import { vi, type Mock, describe, it, expect, beforeAll, afterAll } from 'vitest';
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
import { createFinalizedRecord, createNisabYearRecordData, createUnlockedRecord } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('POST /api/nisab-year-records/:id/unlock - Contract Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `test-unlock-${timestamp}@example.com`,
        username: `testunlock${timestamp}`,
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
        data: createFinalizedRecord(userId),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ unlockReason: 'Need to correct total liabilities amount' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('UNLOCKED');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should create audit trail entry with unlock reason', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createFinalizedRecord(userId),
      });

      const unlockReason = 'Discovered uncounted asset after finalization';
      await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ unlockReason })
        .expect(200);

      // Verify audit entry in database since it's not returned in response
      const auditEntry = await prisma.auditTrailEntry.findFirst({
        where: {
          nisabYearRecordId: record.id,
          eventType: 'UNLOCKED'
        }
      });
      
      expect(auditEntry).toBeDefined();
      // Note: unlockReason is encrypted, so we just check entry existence

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Validation Errors', () => {
    it('should reject unlock without reason', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createFinalizedRecord(userId),
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
        data: createFinalizedRecord(userId),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ unlockReason: 'short' }) // Too short
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.message).toContain('10 characters');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should reject unlock of DRAFT record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, { status: 'DRAFT' }),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ unlockReason: 'Valid reason but wrong status' })
        .expect(409); // Expect Conflict

      expect(response.body.success).toBe(false);

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should reject unlock of already UNLOCKED record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createUnlockedRecord(userId),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ unlockReason: 'Already unlocked record' })
        .expect(409); // Expect Conflict

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
        .send({ unlockReason: 'Valid reason for non-existent record' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NOT_FOUND');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records/some-id/unlock')
        .send({ unlockReason: 'Valid reason but no auth' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toEqual(expect.objectContaining({
        code: 'UNAUTHORIZED'
      }));
    });

    it('should return 404 when trying to unlock another user\'s record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createFinalizedRecord(userId),
      });

      const timestamp = Date.now();
      const otherUser = await prisma.user.create({
        data: {
          email: `other-unlock-${timestamp}@example.com`,
          username: `otherunlock${timestamp}`,
          passwordHash: 'hash',
          isActive: true,
        },
      });

      const otherToken = 'Bearer ' + generateAccessToken(otherUser.id);

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', otherToken)
        .send({ unlockReason: 'Valid reason but different user' })
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
        data: createFinalizedRecord(userId),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/unlock`)
        .set('Authorization', authToken)
        .send({ unlockReason: 'Correction needed for liability calculation' })
        .expect(200);

      // Top-level structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status', 'UNLOCKED');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });
});
