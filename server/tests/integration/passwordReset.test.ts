/**
 * Integration Test: Password reset flow (#311)
 *
 * Full reset cycle against the live Express app:
 *   1. POST /api/auth/register        → create user
 *   2. POST /api/auth/reset-password  → token persisted to PasswordReset
 *   3. POST /api/auth/confirm-reset   → token consumed, password changed
 *   4. POST /api/auth/login           → new password works, old rejected
 *
 * Security contracts asserted:
 *   - Request response never reveals whether the email exists (enumeration safety)
 *   - Token is one-time (mark-used on consume)
 *   - Token format is crypto-grade (64 hex chars)
 */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const TEST_EMAIL = `pwdreset-${Date.now()}@example.com`;
const NEW_PASSWORD = 'NewStrong456!';

describe('Integration: Password reset flow (#311)', () => {
  const prisma = new PrismaClient();
  const OLD_PASSWORD = 'OldPass123!';
  let userId = '';

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: TEST_EMAIL,
        password: OLD_PASSWORD,
        confirmPassword: OLD_PASSWORD,
        firstName: 'Reset',
        lastName: 'Tester',
      });
    if (reg.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(reg.body)}`);
    }
    userId = reg.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.passwordReset.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('reset request returns 200 with identical generic response for known and unknown emails', async () => {
    const known = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: TEST_EMAIL });
    const unknown = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'ghost-unknown@example.com' });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    // Enumeration guard: identical success shape regardless of account existence
    expect(known.body.success).toBe(unknown.body.success);
    expect(known.body.data.message).toBe(unknown.body.data.message);
  });

  it('rejects request with missing email', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects confirm-reset with missing fields or weak password', async () => {
    const res = await request(app)
      .post('/api/auth/confirm-reset')
      .send({ password: 'Whatever123!' });
    expect(res.status).toBe(400);

    const res2 = await request(app)
      .post('/api/auth/confirm-reset')
      .send({ token: 'some-token', password: 'weak' });
    expect(res2.status).toBe(400);
  });

  it('rejects a fabricated token', async () => {
    const res = await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: 'definitely-not-a-real-token-123456789abcdef',
        password: 'Whatever19!',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).toMatch(/INVALID_RESET_TOKEN|Invalid or expired/i);
  });

  it('completes the full cycle: request → token in DB → confirm → new password works', async () => {
    // 1) Request reset for the registered user
    const reqRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: TEST_EMAIL });
    expect(reqRes.status).toBe(200);

    // 2) Token persisted: crypto-grade, unused, ~1h expiry
    const stored = await prisma.passwordReset.findFirst({
      where: { user: { email: TEST_EMAIL }, used: false },
      orderBy: { createdAt: 'desc' },
    });
    expect(stored).not.toBeNull();
    expect(stored!.token).toMatch(/^[0-9a-f]{64}$/);
    expect(stored!.used).toBe(false);
    const minutesLeft = (stored!.expiresAt.getTime() - Date.now()) / 60000;
    expect(minutesLeft).toBeGreaterThan(55);
    expect(minutesLeft).toBeLessThan(65);

    // 3) Confirm with the token
    const confirm = await request(app)
      .post('/api/auth/confirm-reset')
      .send({ token: stored!.token, password: NEW_PASSWORD });
    expect(confirm.status).toBe(200);

    // 4) Token consumed (single-use)
    const after = await prisma.passwordReset.findUnique({ where: { id: stored!.id } });
    expect(after!.used).toBe(true);

    // 5) New password logs in
    const loginNew = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: NEW_PASSWORD });
    expect(loginNew.status).toBe(200);

    // 6) Old password rejected
    const loginOld = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: OLD_PASSWORD });
    expect([400, 401]).toContain(loginOld.status);
  });

  it('a used token cannot be reused (single-use contract)', async () => {
    // Request another reset
    await request(app).post('/api/auth/reset-password').send({ email: TEST_EMAIL });
    const stored = await prisma.passwordReset.findFirst({
      where: { user: { email: TEST_EMAIL }, used: false },
      orderBy: { createdAt: 'desc' },
    });
    expect(stored).not.toBeNull();

    // First confirm succeeds
    const first = await request(app)
      .post('/api/auth/confirm-reset')
      .send({ token: stored!.token, password: 'ReuseBlock1!' });
    expect(first.status).toBe(200);

    // Second use of the same token must fail
    const reuse = await request(app)
      .post('/api/auth/confirm-reset')
      .send({ token: stored!.token, password: 'AnotherPass78!' });
    expect(reuse.status).toBe(400);
  });
});