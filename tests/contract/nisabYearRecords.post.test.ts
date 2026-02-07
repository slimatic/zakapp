/**
 * Contract Test: POST /api/nisab-year-records
 * 
 * Tests creating a new Nisab Year Record in DRAFT status
 * 
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import request from 'supertest';
// import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../server/src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/nisab-year-records', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-post-nyr-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    });
    userId = user.id;
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should create a new DRAFT record with valid data', async () => {
    const hawlStartDate = new Date();
    const hawlCompletionDate = new Date(hawlStartDate.getTime() + 354 * 24 * 60 * 60 * 1000);

    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: hawlStartDate.toISOString(),
        nisabBasis: 'gold',
        nisabThresholdAtStart: 5000,
        userNotes: 'Test record creation',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toMatchObject({
      status: 'DRAFT',
      nisabBasis: 'gold',
      hawlStartDate: expect.any(String),
      nisabThresholdAtStart: expect.any(Number),
    });
  });

  it('should reject request without required hawlStartDate', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nisabBasis: 'gold',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should reject request without required nisabBasis', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should reject invalid nisabBasis value', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'platinum', // Invalid
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .send({
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('should calculate nisabThresholdAtStart if not provided', async () => {
    const res = await request(app)
      .post('/api/nisab-year-records')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hawlStartDate: new Date().toISOString(),
        nisabBasis: 'gold',
        // Note: No nisabThresholdAtStart provided
      });

    expect(res.status).toBe(201);
    expect(res.body.data.nisabThresholdAtStart).toBeDefined();
  });
});
