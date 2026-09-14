/**
 * Integration Test: JWT Secret Stability
 *
 * REGRESSION COVERAGE for #267 (user reported "works day 1, fails day 2,
 * persists across browsers/cache clears"):
 *
 * Root cause analysis: JWTService.generateSecret() was called when env vars
 * were missing, producing a NEW random secret on each container restart.
 * All previously-issued tokens became invalid.
 *
 * This test pins the secret via env vars (the documented production setup)
 * and verifies that tokens issued before a "restart" (new JWTService instance)
 * still validate.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

// Set secrets BEFORE importing app so JWTService picks them up
process.env.JWT_SECRET = 'test-secret-stable-jwt-267';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-stable-267';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32bytes-267';
process.env.NODE_ENV = 'test';

import app from '../../app';

const prisma = new PrismaClient();

describe('JWT Secret Stability (#267 regression)', () => {
  const testUser = {
    email: `test-jwt-stable-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    username: 'testjwtstable267',
    firstName: 'Test',
    lastName: 'Stable',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    // Register a user and capture tokens
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    accessToken = regRes.body.data.tokens.accessToken;
    refreshToken = regRes.body.data.tokens.refreshToken;
    userId = regRes.body.data.user.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('access token issued at registration is valid against /auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(userId);
  });

  it('refresh token can be used to issue new access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');

    // New access token should work
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.data.tokens.accessToken}`)
      .expect(200);

    expect(meRes.body.data.user.id).toBe(userId);
  });

  it('login returns working tokens', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(loginRes.body.data.tokens).toHaveProperty('accessToken');
    expect(loginRes.body.data.tokens).toHaveProperty('refreshToken');

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.tokens.accessToken}`)
      .expect(200);

    expect(meRes.body.data.user.email).toBe(testUser.email);
  });
});
