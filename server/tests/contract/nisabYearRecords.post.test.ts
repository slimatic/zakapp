/**
 * Contract Test: POST /api/nisab-year-records
 * 
 * Validates API contract compliance for creating Nisab Year Records
 * Based on: specs/008-nisab-year-record/contracts/nisab-year-records.openapi.yaml
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt';
import { createNisabYearRecordData } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('POST /api/nisab-year-records - Contract Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-post@example.com',
        username: 'testpost',
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

  afterEach(async () => {
    // Clean up records created in tests
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
  });

  describe('Successful Record Creation', () => {
    it('should create DRAFT record with required fields', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.record).toBeDefined();
      expect(response.body.record.id).toBeDefined();
      expect(response.body.record.status).toBe('DRAFT');
      expect(response.body.record.nisabBasis).toBe('gold');
      expect(response.body.record.userId).toBe(userId);
    });

    it('should create record with silver nisab basis', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'silver',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.record.nisabBasis).toBe('silver');
    });

    it('should calculate nisabThresholdAtStart if not provided', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.record.nisabThresholdAtStart).toBeDefined();
      expect(typeof response.body.record.nisabThresholdAtStart).toBe('number');
      expect(response.body.record.nisabThresholdAtStart).toBeGreaterThan(0);
    });

    it('should accept user-provided nisabThresholdAtStart', async () => {
      const customNisab = 5687.20; // Example custom threshold
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
        nisabThresholdAtStart: customNisab,
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.record.nisabThresholdAtStart).toBe(customNisab);
    });

    it('should accept optional userNotes field', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
        userNotes: 'First Zakat calculation for 2025',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.record.userNotes).toBe('First Zakat calculation for 2025');
    });

    it('should calculate hawlCompletionDate (354 days after start)', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const requestBody = {
        hawlStartDate: startDate.toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.record.hawlCompletionDate).toBeDefined();
      
      const completionDate = new Date(response.body.record.hawlCompletionDate);
      const daysDiff = Math.round((completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(354); // Islamic lunar year
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when hawlStartDate is missing', async () => {
      const requestBody = {
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when nisabBasis is missing', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when nisabBasis is invalid', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'platinum', // Invalid - only gold/silver allowed
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when hawlStartDate is invalid format', async () => {
      const requestBody = {
        hawlStartDate: 'not-a-date',
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when nisabThresholdAtStart is negative', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
        nisabThresholdAtStart: -100,
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 without auth token', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .send(requestBody)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', 'Bearer invalid-token')
        .send(requestBody)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should create record with authenticated user ID', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.record.userId).toBe(userId);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return correct response structure', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      // Top-level structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('record');

      // Record structure
      const record = response.body.record;
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('userId');
      expect(record).toHaveProperty('status');
      expect(record).toHaveProperty('nisabBasis');
      expect(record).toHaveProperty('hawlStartDate');
      expect(record).toHaveProperty('hawlCompletionDate');
      expect(record).toHaveProperty('nisabThresholdAtStart');
      expect(record).toHaveProperty('createdAt');
    });

    it('should include Hijri dates in response', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.record).toHaveProperty('hawlStartDateHijri');
      expect(response.body.record).toHaveProperty('hawlCompletionDateHijri');
      
      // Hijri date format: YYYY-MM-DD
      expect(response.body.record.hawlStartDateHijri).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Business Logic Validation', () => {
    it('should encrypt sensitive fields in database', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      // Fetch record directly from database
      const dbRecord = await prisma.yearlySnapshot.findUnique({
        where: { id: response.body.record.id },
      });

      // Encrypted fields should be different from displayed values
      expect(dbRecord?.nisabThresholdAtStart).toBeDefined();
      expect(dbRecord?.nisabThresholdAtStart).not.toBe(
        response.body.record.nisabThresholdAtStart.toString()
      );
    });

    it('should set correct initial status to DRAFT', async () => {
      const requestBody = {
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      };

      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.record.status).toBe('DRAFT');
      expect(response.body.record.finalizedAt).toBeNull();
    });
  });
});
