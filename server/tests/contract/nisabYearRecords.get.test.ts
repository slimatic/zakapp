/**
 * Contract Test: GET /api/nisab-year-records
 * 
 * Validates API contract compliance for listing Nisab Year Records
 * Based on: specs/008-nisab-year-record/contracts/nisab-year-records.openapi.yaml
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt';
import { createNisabYearRecordData, createFinalizedRecord } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('GET /api/nisab-year-records - Contract Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-get@example.com',
        username: 'testget',
      passwordHash: 'hashedpassword',
      isActive: true,
    },
  });
  userId = user.id;
  authToken = generateAccessToken(user.id);
});  afterAll(async () => {
    // Cleanup
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('Response Schema Validation', () => {
    it('should return 200 with valid schema for empty records', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Validate response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('records');
      expect(Array.isArray(response.body.records)).toBe(true);
    });

    it('should return records with correct properties when data exists', async () => {
      // Create test record
      const record = await prisma.yearlySnapshot.create({
        data: {
          userId,
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
        },
      });

      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      
      const returnedRecord = response.body.records[0];
      expect(returnedRecord).toHaveProperty('id');
      expect(returnedRecord).toHaveProperty('userId', userId);
      expect(returnedRecord).toHaveProperty('status');
      expect(returnedRecord).toHaveProperty('nisabBasis');
      expect(returnedRecord).toHaveProperty('createdAt');

      // Cleanup
      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Query Parameter Filtering', () => {
    beforeEach(async () => {
      // Create test records with different statuses
      await prisma.yearlySnapshot.createMany({
        data: [
          {
            userId,
            status: 'DRAFT',
            nisabBasis: 'GOLD',
            calculationDate: new Date('2025-01-01'),
            gregorianYear: 2025,
            gregorianMonth: 1,
            gregorianDay: 1,
            hijriYear: 1446,
            hijriMonth: 6,
            hijriDay: 20,
            totalWealth: '10000',
            totalLiabilities: '1000',
            zakatableWealth: '9000',
            zakatAmount: '225',
            methodologyUsed: 'standard',
          },
          {
            userId,
            status: 'FINALIZED',
            nisabBasis: 'SILVER',
            calculationDate: new Date('2024-01-01'),
            gregorianYear: 2024,
            gregorianMonth: 1,
            gregorianDay: 1,
            hijriYear: 1445,
            hijriMonth: 6,
            hijriDay: 20,
            totalWealth: '15000',
            totalLiabilities: '2000',
            zakatableWealth: '13000',
            zakatAmount: '325',
            methodologyUsed: 'standard',
            finalizedAt: new Date(),
          },
        ],
      });
    });

    afterEach(async () => {
      await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    });

    it('should filter by status=DRAFT', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records?status=DRAFT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.records.length).toBe(1);
      expect(response.body.records[0].status).toBe('DRAFT');
    });

    it('should filter by status=FINALIZED', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records?status=FINALIZED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.records.length).toBe(1);
      expect(response.body.records[0].status).toBe('FINALIZED');
    });

    it('should filter by year=2025', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records?year=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.records.length).toBe(1);
      expect(response.body.records[0].gregorianYear).toBe(2025);
    });

    it('should return all records with status=ALL', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records?status=ALL')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.records.length).toBe(2);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should only return records owned by authenticated user', async () => {
      // Create another user with records
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          username: 'other',
          passwordHash: 'hash',
          isActive: true,
        },
      });

      await prisma.yearlySnapshot.create({
        data: {
          userId: otherUser.id,
          status: 'DRAFT',
          nisabBasis: 'GOLD',
          calculationDate: new Date(),
          gregorianYear: 2025,
          gregorianMonth: 10,
          gregorianDay: 28,
          hijriYear: 1446,
          hijriMonth: 3,
          hijriDay: 15,
          totalWealth: '5000',
          totalLiabilities: '500',
          zakatableWealth: '4500',
          zakatAmount: '112.50',
          methodologyUsed: 'standard',
        },
      });

      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not see other user's records
      const allRecordsAreOwnedByUser = response.body.records.every(
        (record: any) => record.userId === userId
      );
      expect(allRecordsAreOwnedByUser).toBe(true);

      // Cleanup
      await prisma.yearlySnapshot.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Live Tracking for DRAFT Records', () => {
    it('should include live tracking fields for DRAFT records', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: {
          userId,
          status: 'DRAFT',
          nisabBasis: 'GOLD',
          hawlStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          hawlCompletionDate: new Date(Date.now() + 324 * 24 * 60 * 60 * 1000), // 324 days from now
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
        },
      });

      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const draftRecord = response.body.records.find((r: any) => r.status === 'DRAFT');
      expect(draftRecord).toBeDefined();
      
      // Live tracking fields should be present
      expect(draftRecord).toHaveProperty('daysRemaining');
      expect(draftRecord).toHaveProperty('isHawlComplete');
      expect(draftRecord).toHaveProperty('canFinalize');

      // Cleanup
      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });
});
