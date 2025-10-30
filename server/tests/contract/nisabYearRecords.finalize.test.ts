/**
 * Contract Test: POST /api/nisab-year-records/:id/finalize
 * 
 * Validates API contract compliance for finalizing Nisab Year Records
 * Based on: specs/008-nisab-year-record/contracts/nisab-year-records.openapi.yaml
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt';
import { createNisabYearRecordData, createFinalizedRecord } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('POST /api/nisab-year-records/:id/finalize - Contract Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-finalize@example.com',
        username: 'testfinalize',
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

  describe('Successful Finalization', () => {
    it('should finalize DRAFT record when Hawl is complete', async () => {
      const pastDate = new Date(Date.now() - 355 * 24 * 60 * 60 * 1000); // 355 days ago
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, {
          status: 'DRAFT',
          hawlStartDate: pastDate,
          hawlCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        }),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('FINALIZED');
      expect(response.body.data.finalizedAt).toBeDefined();

      try { await prisma.yearlySnapshot.delete({ where: { id: record.id } }); } catch (e) {}
    });

    it('should allow finalization with override flag even when Hawl early', async () => {
      const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, {
          status: 'DRAFT',
          hawlCompletionDate: futureDate,
        }),
      });

      // First, attempt without override - should fail
      await request(app)
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .set('Authorization', authToken)
        .expect(400);

      // Now finalize with override and acknowledgment
      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .send({ override: true, acknowledgePremature: true })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('FINALIZED');
      expect(response.body.data.finalizedAt).toBeDefined();

      try { await prisma.yearlySnapshot.delete({ where: { id: record.id } }); } catch (e) {}
    });
  });

  describe('Validation Errors', () => {
    it('should reject finalization when Hawl not complete', async () => {
      const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, {
          status: 'DRAFT',
          hawlCompletionDate: futureDate,
        }),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('HAWL_NOT_COMPLETE');
      expect(response.body.daysRemaining).toBeGreaterThan(0);

      try { await prisma.yearlySnapshot.delete({ where: { id: record.id } }); } catch (e) {}
    });

    it('should require acknowledgePremature when override is true', async () => {
      const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, {
          status: 'DRAFT',
          hawlCompletionDate: futureDate,
        }),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .send({ override: true })
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body.success).toBe(false);

      try { await prisma.yearlySnapshot.delete({ where: { id: record.id } }); } catch (e) {}
    });

    it('should reject finalization of already FINALIZED record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createFinalizedRecord(userId),
      });

      const response = await request(app)
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body.success).toBe(false);

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent record', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/nisab-year-records/${fakeId}/finalize`)
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NOT_FOUND');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records/some-id/finalize')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });
});
