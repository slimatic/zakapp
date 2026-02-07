/**
 * Contract Test: GET /api/nisab-year-records
 * 
 * Tests the endpoint for listing all Nisab Year Records for authenticated user
 * with optional filtering by status and year.
 * 
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import request from 'supertest';
// import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../server/src/app';
import { jwtService } from '../../server/src/services/JWTService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/nisab-year-records', () => {
  let authToken: string;
  let userId: string;
  let testRecordId: string;

  beforeAll(async () => {
    // Setup: Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-get-nyr-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    });
    userId = user.id;

    // Generate valid JWT token
    authToken = jwtService.createAccessToken({
      userId: user.id,
      email: user.email,
    });

    // Create test records
    const record = await prisma.yearlySnapshot.create({
      data: {
        userId,
        calculationDate: new Date(),
        gregorianYear: 2025,
        gregorianMonth: 10,
        gregorianDay: 27,
        hijriYear: 1446,
        hijriMonth: 3,
        hijriDay: 24,
        totalWealth: 'encrypted-amount',
        totalLiabilities: 'encrypted-0',
        zakatableWealth: 'encrypted-amount',
        zakatAmount: 'encrypted-amount',
        methodologyUsed: 'standard',
        nisabThreshold: 'encrypted-5000',
        nisabType: 'gold',
        status: 'DRAFT',
        assetBreakdown: 'encrypted-json',
        calculationDetails: 'encrypted-json',
        hawlStartDate: new Date(),
        hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000),
        nisabBasis: 'gold',
      },
    });
    testRecordId = record.id;
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should return 200 with all records for authenticated user', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('records');
    expect(Array.isArray(res.body.records)).toBe(true);
    
    // Verify wealth fields are numeric
    if (res.body.records.length > 0) {
      const record = res.body.records[0];
      expect(typeof record.totalWealth).toBe('number');
      expect(typeof record.totalLiabilities).toBe('number');
      expect(typeof record.zakatableWealth).toBe('number');
      expect(typeof record.zakatAmount).toBe('number');
    }
  });

  it('should filter records by status=DRAFT', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records?status=DRAFT')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: testRecordId,
          status: 'DRAFT',
        }),
      ])
    );
  });

  it('should filter records by year parameter', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records?year=2025')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toBeDefined();
    expect(res.body.records.length).toBeGreaterThan(0);
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app).get('/api/nisab-year-records');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('should return empty array when no records match filter', async () => {
    const res = await request(app)
      .get('/api/nisab-year-records?status=FINALIZED&year=1900')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toEqual([]);
  });
});
