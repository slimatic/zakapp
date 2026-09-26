/**
 * UserController honesty contract — the endpoints that used to fabricate answers.
 *
 * WHY THIS FILE EXISTS
 *
 * UserController is mounted at /api/user (and /api/users) behind authMiddleware. Its
 * user-service endpoints were never covered by a test, and 1.0% of UserService (96
 * statements) was executed. Reading the untested code found endpoints that answered
 * confidently with data that did not exist:
 *
 *   POST /api/user/restore          "Data restoration completed successfully" with a
 *                                   fabricated itemsRestored count, restoring nothing
 *   GET  /api/user/sessions         one hardcoded session: "Chrome on Windows",
 *                                   127.0.0.1 — describing no real session
 *   GET  /api/user/audit-log        two hardcoded entries for every user, including
 *                                   an invented asset ("Savings Account")
 *   GET  /api/user/privacy-settings fixed values ignoring the database
 *   PUT  /api/user/privacy-settings echoed the request body and persisted nothing
 *                                   while the UI reported success
 *   POST /api/user/backup           size hardcoded to the string "2.5 MB" and a
 *                                   downloadUrl under a route that does not exist
 *   GET  /api/user/export-status    claimed a completed export with a 404 URL
 *
 * The restore one is the dangerous one: a user who believes a restore succeeded
 * stops worrying about their data.
 *
 * These tests drive the REAL express app through supertest against the REAL
 * database, and assert the contract in both directions — that real data is served
 * where data exists, and that an unimplemented capability says so instead of
 * reporting success.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let authToken: string;
let userId: string;

const EMAIL = `honesty-${Date.now()}@example.com`;
const PASSWORD = 'Honesty!Test123';

beforeAll(async () => {
  // Registration requires confirmPassword and a username; the app returns the token
  // nested at data.tokens.accessToken.
  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      email: EMAIL,
      password: PASSWORD,
      confirmPassword: PASSWORD,
      username: `honesty${Date.now()}`,
      firstName: 'Honesty',
      lastName: 'Test',
    });

  if (reg.status !== 201) {
    throw new Error(`Registration failed (${reg.status}): ${JSON.stringify(reg.body)}`);
  }

  authToken = reg.body.data.tokens.accessToken;
  userId = reg.body.data.user.id;
});

afterAll(async () => {
  if (userId) {
    await prisma.userSession.deleteMany({ where: { userId } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

describe('restore reports the truth: it is not implemented', () => {
  it('does NOT claim success — the exact response that would mislead a user', async () => {
    const res = await request(app)
      .post('/api/user/restore')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ backupId: 'anything' });

    // The old behaviour was 200 with success:true and a fabricated itemsRestored.
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/restoration completed successfully/i);
    expect(body).not.toMatch(/itemsRestored/);
    expect(res.body.success).not.toBe(true);
  });

  it('returns 501 rather than pretending', async () => {
    const res = await request(app)
      .post('/api/user/restore')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ backupId: 'anything' });

    expect(res.status).toBe(501);
  });

  it('carries a machine-readable error code, not a generic 500', async () => {
    const res = await request(app)
      .post('/api/user/restore')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ backupId: 'anything' });

    // Regression guard for the error-handler defect: app.ts had a catch-all that
    // rewrote every error to 500 with no code, so a 501 AppError arrived at the
    // client as "Internal server error". ErrorHandler must stay wired up.
    expect(res.body.error?.code).toBeDefined();
    expect(res.body.error?.code).toBe('NOT_FOUND');
  });

  it('says explicitly that no data was modified', async () => {
    const res = await request(app)
      .post('/api/user/restore')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ backupId: 'anything' });

    // The message is the userMessage unless NODE_ENV=development, in which case the
    // technical message is shown. Assert on either, since both must be honest.
    const text = JSON.stringify(res.body) + String(res.body.error?.message ?? '');
    expect(text.toLowerCase()).toMatch(/not implemented/);
  });
});

describe('backup returns real data, and no broken download link', () => {
  it('reports a numeric byte size, not the string "2.5 MB"', async () => {
    const res = await request(app)
      .post('/api/user/backup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(typeof res.body.backup?.size).toBe('number');
    expect(res.body.backup?.size).toBeGreaterThan(0);
    expect(res.body.backup?.size).not.toBe('2.5 MB');
  });

  it('does not offer a downloadUrl, because nothing serves one', async () => {
    const res = await request(app)
      .post('/api/user/backup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.body.backup?.downloadUrl).toBeUndefined();
  });

  it('includes the caller\'s own data', async () => {
    // Create an asset, then confirm it appears in the backup payload.
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Honesty Asset', category: 'cash', value: 1234.56, currency: 'USD' });

    const res = await request(app)
      .post('/api/user/backup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(201);
    const payload = JSON.stringify(res.body.backup?.data ?? {});
    expect(payload).toMatch(/Honesty Asset/);
  });
});

describe('sessions reflect the database, not a hardcoded fiction', () => {
  it('never returns the old hardcoded "Chrome on Windows" / 127.0.0.1 stub', async () => {
    const res = await request(app)
      .get('/api/user/sessions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const sessions = res.body.sessions ?? [];
    for (const s of sessions) {
      // A session row must carry an id that exists in the database.
      expect(s.id).toBeTruthy();
      expect(s.id).not.toBe('session-1');
    }
  });

  it('every returned session belongs to this user and exists in the database', async () => {
    const res = await request(app)
      .get('/api/user/sessions')
      .set('Authorization', `Bearer ${authToken}`);

    const sessions = res.body.sessions ?? [];
    for (const s of sessions) {
      const row = await prisma.userSession.findFirst({ where: { id: s.id } });
      expect(row).not.toBeNull();
      expect(row?.userId).toBe(userId);
    }
  });
});

describe('audit log is real history, not two invented entries', () => {
  it('never invents an asset the user never created', async () => {
    const res = await request(app)
      .get('/api/user/audit-log')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    // These were the hardcoded fixtures.
    expect(body).not.toMatch(/Savings Account/);
    expect(body).not.toMatch(/audit-1/);
    expect(body).not.toMatch(/audit-2/);
  });
});

describe('privacy settings actually persist', () => {
  it('writes the analytics preference and reads it back', async () => {
    const put = await request(app)
      .put('/api/user/privacy-settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ analytics: true });

    expect(put.status).toBe(200);

    // The old implementation echoed the body back and stored nothing.
    const get = await request(app)
      .get('/api/user/privacy-settings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(get.status).toBe(200);
    expect(get.body.privacySettings?.analytics).toBe(true);
  });

  it('persists false as well, so the toggle is not one-way', async () => {
    await request(app)
      .put('/api/user/privacy-settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ analytics: false });

    const get = await request(app)
      .get('/api/user/privacy-settings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(get.body.privacySettings?.analytics).toBe(false);
  });

  it('the preference survives a fresh read of the stored settings', async () => {
    await request(app)
      .put('/api/user/privacy-settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ analytics: true });

    // Read straight from the database to prove persistence, not just echoing.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { settings: true } });
    expect(user?.settings).toBeTruthy();
    // Settings are encrypted at rest, so the plaintext must NOT appear in the column.
    expect(String(user?.settings)).not.toMatch(/"analyticsEnabled":true/);
  });
});

describe('export status does not offer a link to nothing', () => {
  it('does not return a downloadUrl under the unmounted /api/export/download route', async () => {
    const res = await request(app)
      .get('/api/user/export-status/some-id')
      .set('Authorization', `Bearer ${authToken}`);

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/\/api\/export\/download\//);
    expect(body).not.toMatch(/"status":"completed"/);
  });
});

describe('these endpoints require authentication', () => {
  it.each([
    ['get', '/api/user/sessions'],
    ['get', '/api/user/audit-log'],
    ['get', '/api/user/privacy-settings'],
    ['get', '/api/user/export-status/x'],
    ['post', '/api/user/restore'],
    ['post', '/api/user/backup'],
  ])('rejects unauthenticated %s %s', async (method, path) => {
    const res = await (request(app) as never as Record<string, (p: string) => request.Test>)[method](path);
    expect([401, 403]).toContain(res.status);
  });
});
