/**
 * Contract Test: GET /api/nisab-year-records/:id
 * 
 * Validates API contract compliance for retrieving a specific Nisab Year Record
 * Based on: specs/008-nisab-year-record/contracts/nisab-year-records.openapi.yaml
 */

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
    const user = await prisma.user.create({
      data: {
        email: 'test-getid@example.com',
        username: 'testgetid',
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
      expect(response.body.record).toBeDefined();
      expect(response.body.record.id).toBe(recordId);
    });

    it('should include audit trail in response', async () => {
      const response = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('auditTrail');
      expect(Array.isArray(response.body.auditTrail)).toBe(true);
    });

    it('should include live tracking for DRAFT records', async () => {
      const response = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const record = response.body.record;
      if (record.status === 'DRAFT') {
        expect(record).toHaveProperty('daysRemaining');
        expect(record).toHaveProperty('isHawlComplete');
        expect(record).toHaveProperty('canFinalize');
        expect(record).toHaveProperty('currentTotalWealth');
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
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 404 when accessing another user\'s record', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-getid@example.com',
          username: 'othergetid',
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
      expect(response.body).toHaveProperty('record');
      expect(response.body).toHaveProperty('auditTrail');

      // Record properties
      const record = response.body.record;
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

      // Values should be decrypted numbers, not encrypted strings
      expect(typeof response.body.record.totalWealth).toBe('number');
      expect(typeof response.body.record.zakatableWealth).toBe('number');
      expect(typeof response.body.record.zakatAmount).toBe('number');
    });
  });
});
