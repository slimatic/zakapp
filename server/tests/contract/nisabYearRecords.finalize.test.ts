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
import { createNisabYearRecordData } from '../helpers/nisabYearRecordFactory';

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
        data: {
          user: { connect: { id: userId } },
          status: 'DRAFT',
          nisabBasis: 'GOLD',
          hawlStartDate: pastDate,
          hawlCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
          calculationDate: new Date(),
          gregorianYear: 2024,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1445,
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
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.record.status).toBe('FINALIZED');
      expect(response.body.record.finalizedAt).toBeDefined();

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should allow premature finalization with override flag', async () => {
      const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000); // 100 days from now
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'DRAFT',
          nisabBasis: 'GOLD',
          hawlStartDate: new Date(),
          hawlCompletionDate: futureDate,
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
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .set('Authorization', authToken)
        .send({ 
          override: true,
          acknowledgePremature: true 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.record.status).toBe('FINALIZED');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Validation Errors', () => {
    it('should reject finalization when Hawl not complete', async () => {
      const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'DRAFT',
          nisabBasis: 'GOLD',
          hawlStartDate: new Date(),
          hawlCompletionDate: futureDate,
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
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('HAWL_NOT_COMPLETE');
      expect(response.body.daysRemaining).toBeGreaterThan(0);

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should reject premature finalization without acknowledgement', async () => {
      const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
      const record = await prisma.yearlySnapshot.create({
        data: {
          user: { connect: { id: userId } },
          status: 'DRAFT',
          nisabBasis: 'GOLD',
          hawlStartDate: new Date(),
          hawlCompletionDate: futureDate,
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
        .post(`/api/nisab-year-records/${record.id}/finalize`)
        .set('Authorization', authToken)
        .send({ override: true }) // Missing acknowledgePremature
        .expect(400);

      expect(response.body.success).toBe(false);

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should reject finalization of already FINALIZED record', async () => {
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
