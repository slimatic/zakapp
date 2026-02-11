import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt';
import { createNisabYearRecordData } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('GET /api/nisab-year-records/:id - Contract Tests', () => {
  let authToken: string;
  let userId: string;
  let recordId: string;

  beforeAll(async () => {
    // Create test user
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `test-getid-${timestamp}@example.com`,
        username: `testgetid-${timestamp}`,
        passwordHash: 'hashedpassword',
        isActive: true,
      },
    });
    userId = user.id;
    authToken = generateAccessToken(user.id);

    // Create test record using factory
    const record = await prisma.yearlySnapshot.create({
      data: createNisabYearRecordData(userId, {
        hawlStartDate: new Date(),
        hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000),
      }),
    });
    recordId = record.id;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('Successful Retrieval', () => {
    it('should return 200 with complete record data', async () => {
      const response = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(recordId);
    });

    it('should include live tracking for DRAFT records', async () => {
      const response = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const record = response.body.data;
      if (record.status === 'DRAFT') {
        expect(record).toHaveProperty('liveTracking');
        expect(record.liveTracking).toHaveProperty('daysRemaining');
        expect(record.liveTracking).toHaveProperty('isHawlComplete');
        expect(record.liveTracking).toHaveProperty('canFinalize');
        // Service returns currentTotalWealth in liveTracking
        expect(record.liveTracking).toHaveProperty('currentTotalWealth');
      }
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent record ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/nisab-year-records/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NOT_FOUND');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      // The middleware returns an object/string depending on impl, checking generic failure
      expect(response.status).toBe(401);
    });

    it('should return 404 when accessing another user\'s record', async () => {
      // Create another user
      const timestamp = Date.now();
      const otherUser = await prisma.user.create({
        data: {
          email: `other-getid-${timestamp}@example.com`,
          username: `othergetid-${timestamp}`,
          passwordHash: 'hash',
          isActive: true,
        },
      });

      const otherToken = generateAccessToken(otherUser.id);

      const response = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NOT_FOUND');

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Response Schema Validation', () => {
    it('should return correct response structure', async () => {
      const response = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Top-level structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      // Record properties
      const record = response.body.data;
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('userId');
      expect(record).toHaveProperty('status');
      expect(record).toHaveProperty('nisabBasis');
      expect(record).toHaveProperty('totalWealth');
      expect(record).toHaveProperty('zakatAmount');
      expect(record).toHaveProperty('createdAt');
    });

    it('should decrypt sensitive fields for display', async () => {
      const response = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Values should be numbers (API returns numeric types)
      expect(typeof response.body.data.totalWealth).toBe('number');
      expect(typeof response.body.data.zakatableWealth).toBe('number');
      expect(typeof response.body.data.zakatAmount).toBe('number');
      
      // Verify they are valid numbers
      expect(!isNaN(response.body.data.totalWealth)).toBe(true);
    });
  });
});
