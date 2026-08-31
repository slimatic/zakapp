/**
 * Integration Test: Durable session invalidation (#312)
 *
 * Contracts:
 *   - Login/register persist an active UserSession row carrying the tokens
 *   - Logout terminates the session (isActive=false, reason='logout')
 *   - /auth/refresh rejects a refresh token whose session is terminated
 *     — the check reads the DB, so revocation survives a server restart
 *   - Token rotation updates the session row to hold the CURRENT tokens
 */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const EMAIL_A = `sess-a-${Date.now()}@example.com`;
const EMAIL_B = `sess-b-${Date.now()}@example.com`;
const PASSWORD = 'Password1!';

describe('Integration: Durable session invalidation (#312)', () => {
  const prisma = new PrismaClient();
  let userAId = '';
  let userBId = '';

  beforeAll(async () => {
    for (const email of [EMAIL_A, EMAIL_B]) {
      const reg = await request(app).post('/api/auth/register').send({
        email,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        firstName: 'Sess',
        lastName: 'Tester',
      });
      if (reg.status !== 201) {
        throw new Error(`Registration failed: ${JSON.stringify(reg.body)}`);
      }
      if (reg.body.data.user.email === EMAIL_A) {
        userAId = reg.body.data.user.id;
      } else {
        userBId = reg.body.data.user.id;
      }
    }
  });

  afterAll(async () => {
    await prisma.userSession.deleteMany({ where: { userId: { in: [userAId, userBId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('login persists an active session row carrying the tokens', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: EMAIL_A,
      password: PASSWORD,
    });
    expect(login.status).toBe(200);

    const sessions = await prisma.userSession.findMany({
      where: { userId: userAId }
    });
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    const latest = sessions[sessions.length - 1];
    expect(latest.isActive).toBe(true);
    expect(latest.refreshToken).toBeTruthy();
  });

  it('logout terminates the sessionDurably; refresh with revoked token fails', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: EMAIL_A,
      password: PASSWORD,
    });
    expect(login.status).toBe(200);
    const { accessToken, refreshToken } = login.body.data.tokens;

    let row = await prisma.userSession.findFirst({ where: { refreshToken } });
    expect(row).not.toBeNull();
    expect(row!.isActive).toBe(true);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logout.status).toBe(200);
    expect(logout.body.data.sessionsTerminated).toBeGreaterThanOrEqual(1);

    // Durably terminated in DB
    row = await prisma.userSession.findFirst({ where: { refreshToken } });
    expect(row!.isActive).toBe(false);
    expect(row!.terminationReason).toBe('logout');

    // Refresh with the terminated session's refresh token → 401
    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(refresh.status).toBe(401);
  });

  it('refresh rotates tokens and updates the session row', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: EMAIL_B,
      password: PASSWORD,
    });
    expect(login.status).toBe(200);
    const oldRefresh = login.body.data.tokens.refreshToken;

    const session = await prisma.userSession.findFirst({
      where: { userId: userBId, refreshToken: oldRefresh }
    });
    expect(session).not.toBeNull();

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.tokens.refreshToken).not.toBe(oldRefresh);

    // Session row tracks the rotated tokens
    const updated = await prisma.userSession.findUnique({
      where: { id: session!.id }
    });
    expect(updated!.refreshToken).toBe(refresh.body.data.tokens.refreshToken);
    expect(updated!.refreshedAt).not.toBeNull();

    // The OLD refresh token must now be rejected (rotation + revocation)
    const reuseOld = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(reuseOld.status).toBe(401);
  });
});