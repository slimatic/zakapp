/**
 * Regression test for the allowRegistration gate on the LIVE registration route.
 *
 * Important history: an earlier attempt at this fix patched
 * `server/src/routes/auth/register.ts`, which nothing imports — it is dead code.
 * The route actually mounted at `/api/auth/register` is defined in
 * `server/src/routes/auth.ts`. The fix appeared deployed but registration stayed
 * open, because the patched file was never executed.
 *
 * This test therefore drives the real express app through supertest rather than
 * calling a handler directly, so it fails if the gate is present only in an
 * unused module.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

const mockGetSettings = vi.fn();

vi.mock('../../src/services/SettingsService', () => ({
  SETTINGS_ID: 'global',
  SettingsService: {
    getSettings: (...args: unknown[]) => mockGetSettings(...args),
    getDecryptedSettings: vi.fn().mockResolvedValue(null),
  },
}));

import app from '../../src/app';

const unique = () => `gate${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`;

describe('POST /api/auth/register — allowRegistration gate (live route)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses with 403 REGISTRATION_DISABLED when the setting is false', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: false, requireEmailVerification: false });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: unique(),
        username: `u${Date.now()}`,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(res.status).toBe(403);
    expect(res.body?.error?.code).toBe('REGISTRATION_DISABLED');
  });

  it('does not create a user when the setting is false', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: false, requireEmailVerification: false });

    const email = unique();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        username: `u${Date.now()}`,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(res.status).toBe(403);
    // The gate must run before the existence check, so no lookup or write occurs.
    expect(res.body?.data).toBeUndefined();
  });

  it('fails closed with 503 when the setting cannot be read', async () => {
    mockGetSettings.mockRejectedValue(new Error('settings unavailable'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: unique(),
        username: `u${Date.now()}`,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(res.status).toBe(503);
    expect(res.body?.error?.code).toBe('REGISTRATION_UNAVAILABLE');
  });

  it('allows registration to proceed when the setting is true', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: true, requireEmailVerification: false });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: unique(),
        username: `u${Date.now()}`,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

    // Must not be blocked by the gate (may still fail validation for other reasons,
    // but never with the gate's codes).
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(503);
    expect(res.body?.error?.code).not.toBe('REGISTRATION_DISABLED');
  });
});
