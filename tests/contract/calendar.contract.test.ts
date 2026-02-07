/**
 * Calendar API Contract Tests
 * 
 * Tests calendar conversion and Zakat year calculation endpoints
 * per contracts/calendar.yaml specification
 * 
 * Endpoints tested:
 * - POST /api/calendar/convert - Date conversion between Gregorian and Hijri
 * - POST /api/calendar/zakat-year - Calculate Zakat year boundaries
 * - GET /api/user/calendar-preference - Get user's calendar preference  
 * - PUT /api/user/calendar-preference - Update user's calendar preference
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Calendar API Contract Tests', () => {
  let app: any;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const appModule = await import('../../server/src/app');
    app = appModule.default || appModule;

    // Create test user
    const hashedPassword = await bcrypt.hash('testPassword123', 12);
    const user = await prisma.user.create({
      data: {
        email: 'calendar-test@example.com',
        passwordHash: hashedPassword,
        profile: JSON.stringify({ firstName: 'Calendar', lastName: 'Tester' }),
        preferredCalendar: 'gregorian'
      }
    });
    testUserId = user.id;

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'calendar-test@example.com',
        password: 'testPassword123'
      });
    
    authToken = loginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('POST /api/calendar/convert', () => {
    it('should convert Gregorian date to Hijri', async () => {
      const response = await request(app)
        .post('/api/calendar/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-15',
          fromCalendar: 'GREGORIAN',
          toCalendar: 'HIJRI'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('convertedDate');
      expect(response.body).toHaveProperty('originalDate');
      expect(response.body.convertedDate).toHaveProperty('year');
      expect(response.body.convertedDate).toHaveProperty('month');
      expect(response.body.convertedDate).toHaveProperty('day');
      expect(response.body.convertedDate).toHaveProperty('formatted');
      expect(response.body.convertedDate.formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should convert Hijri date to Gregorian', async () => {
      const response = await request(app)
        .post('/api/calendar/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '1445-07-05',
          fromCalendar: 'HIJRI',
          toCalendar: 'GREGORIAN'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.convertedDate).toHaveProperty('year');
      expect(response.body.convertedDate).toHaveProperty('month');
      expect(response.body.convertedDate).toHaveProperty('day');
      expect(response.body.convertedDate.formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should reject missing date', async () => {
      const response = await request(app)
        .post('/api/calendar/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromCalendar: 'GREGORIAN',
          toCalendar: 'HIJRI'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid date format', async () => {
      const response = await request(app)
        .post('/api/calendar/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: 'invalid-date',
          fromCalendar: 'GREGORIAN',
          toCalendar: 'HIJRI'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject same source and target calendar', async () => {
      const response = await request(app)
        .post('/api/calendar/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-15',
          fromCalendar: 'GREGORIAN',
          toCalendar: 'GREGORIAN'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/calendar/convert')
        .send({
          date: '2024-01-15',
          fromCalendar: 'GREGORIAN',
          toCalendar: 'HIJRI'
        })
        .expect(401);
    });
  });

  describe('POST /api/calendar/zakat-year', () => {
    it('should calculate Hijri Zakat year (354 days)', async () => {
      const response = await request(app)
        .post('/api/calendar/zakat-year')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          referenceDate: '2024-01-15',
          calendarType: 'HIJRI'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.zakatYear).toHaveProperty('startDate');
      expect(response.body.zakatYear).toHaveProperty('endDate');
      expect(response.body.zakatYear.calendarType).toBe('HIJRI');
      expect(response.body.zakatYear.daysInYear).toBe(354);
      expect(response.body.zakatYear).toHaveProperty('hijriStart');
      expect(response.body.zakatYear).toHaveProperty('hijriEnd');
      expect(response.body.zakatYear.hijriStart).toHaveProperty('formatted');
      expect(response.body.zakatYear.hijriEnd).toHaveProperty('formatted');
    });

    it('should calculate Gregorian Zakat year (365 days)', async () => {
      const response = await request(app)
        .post('/api/calendar/zakat-year')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          referenceDate: '2024-01-15',
          calendarType: 'GREGORIAN'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.zakatYear.calendarType).toBe('GREGORIAN');
      expect(response.body.zakatYear.daysInYear).toBe(365);
      expect(response.body.zakatYear).toHaveProperty('startDate');
      expect(response.body.zakatYear).toHaveProperty('endDate');
      
      // Verify date difference is 365 days
      const startDate = new Date(response.body.zakatYear.startDate);
      const endDate = new Date(response.body.zakatYear.endDate);
      const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(365);
    });

    it('should reject missing referenceDate', async () => {
      const response = await request(app)
        .post('/api/calendar/zakat-year')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          calendarType: 'HIJRI'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid calendar type', async () => {
      const response = await request(app)
        .post('/api/calendar/zakat-year')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          referenceDate: '2024-01-15',
          calendarType: 'INVALID'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/calendar/zakat-year')
        .send({
          referenceDate: '2024-01-15',
          calendarType: 'HIJRI'
        })
        .expect(401);
    });
  });

  describe('GET /api/calendar/preference', () => {
    it('should return user calendar preference', async () => {
      const response = await request(app)
        .get('/api/calendar/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('calendarType');
      expect(['GREGORIAN', 'HIJRI']).toContain(response.body.calendarType);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/calendar/preference')
        .expect(401);
    });
  });

  describe('PUT /api/calendar/preference', () => {
    it('should update calendar preference to HIJRI', async () => {
      const response = await request(app)
        .put('/api/calendar/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferredCalendar: 'HIJRI'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferredCalendar).toBe('hijri');

      // Verify persistence
      const verifyResponse = await request(app)
        .get('/api/calendar/preference')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(verifyResponse.body.calendarType).toBe('HIJRI');
    });

    it('should update calendar preference to GREGORIAN', async () => {
      const response = await request(app)
        .put('/api/calendar/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferredCalendar: 'GREGORIAN'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferredCalendar).toBe('gregorian');
    });

    it('should reject invalid calendar preference', async () => {
      const response = await request(app)
        .put('/api/calendar/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferredCalendar: 'INVALID'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject missing calendarPreference', async () => {
      const response = await request(app)
        .put('/api/calendar/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .put('/api/calendar/preference')
        .send({
          preferredCalendar: 'HIJRI'
        })
        .expect(401);
    });
  });
});
