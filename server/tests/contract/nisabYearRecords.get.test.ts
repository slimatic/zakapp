import { vi, type Mock } from 'vitest';
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
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `test-get-${timestamp}@example.com`,
        username: `testget-${timestamp}`,
        passwordHash: 'hashedpassword',
        isActive: true,
      },
    });
    userId = user.id;
    authToken = generateAccessToken(user.id);
  });

  afterAll(async () => {
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
      expect(response.body.data).toHaveProperty('records');
      expect(Array.isArray(response.body.data.records)).toBe(true);
    });

    it('should return records with correct properties when data exists', async () => {
      // Create test record using factory
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId),
      });

      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.records.length).toBeGreaterThan(0);
      
      const returnedRecord = response.body.data.records[0];
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
      // Create test records with different statuses using factory
      await prisma.yearlySnapshot.createMany({
        data: [
          createNisabYearRecordData(userId, {
            status: 'DRAFT',
            nisabBasis: 'GOLD',
            calculationDate: new Date('2025-01-01'),
            gregorianYear: 2025,
            gregorianMonth: 1,
            gregorianDay: 1,
          }),
          createFinalizedRecord(userId, {
            nisabBasis: 'SILVER',
            calculationDate: new Date('2024-01-01'),
            gregorianYear: 2024,
            gregorianMonth: 1,
            gregorianDay: 1,
          }),
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

      expect(response.body.data.records.length).toBe(1);
      expect(response.body.data.records[0].status).toBe('DRAFT');
    });

    it('should filter by status=FINALIZED', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records?status=FINALIZED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.records.length).toBe(1);
      expect(response.body.data.records[0].status).toBe('FINALIZED');
    });

    it('should filter by year=2025', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records?year=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.records.length).toBe(1);
      expect(response.body.data.records[0].gregorianYear).toBe(2025);
    });

    it('should return all records with status=ALL', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records?status=ALL')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.records.length).toBe(2);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records')
        .expect(401);

      expect(response.body.success).toBe(false);
      // The error is typically an object { code: 'UNAUTHORIZED', message: ... } or similar
      // Or simply check success is false and status is 401
      expect(response.body.error).toBeDefined();
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
      const timestamp = Date.now();
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${timestamp}@example.com`,
          username: `other-${timestamp}`,
          passwordHash: 'hash',
          isActive: true,
        },
      });

      // Create record for another user
      const otherRecord = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(otherUser.id),
      });

      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not see other user's records
      const allRecordsAreOwnedByUser = response.body.data.records.every(
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
        data: createNisabYearRecordData(userId, {
          status: 'DRAFT',
          hawlStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          hawlCompletionDate: new Date(Date.now() + 324 * 24 * 60 * 60 * 1000), // 324 days from now
        }),
      });

      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const draftRecord = response.body.data;
      expect(draftRecord).toBeDefined();
      expect(draftRecord.id).toBe(record.id);
      
      // Live tracking fields should be present in the liveTracking object
      // Note: The service wraps these in a 'liveTracking' property for detailed views
      // or merges them depending on implementation. Let's check both or adjust based on service.
      // Looking at service: return liveTrackingData ? ({ ...baseRecord, liveTracking: liveTrackingData } ...
      // So it is nested under 'liveTracking'.
      
      expect(draftRecord).toHaveProperty('liveTracking');
      expect(draftRecord.liveTracking).toHaveProperty('daysRemaining');
      expect(draftRecord.liveTracking).toHaveProperty('isHawlComplete');
      expect(draftRecord.liveTracking).toHaveProperty('canFinalize');

      // Cleanup
      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });
});
