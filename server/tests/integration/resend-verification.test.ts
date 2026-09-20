/**
 * POST /api/auth/resend-verification
 *
 * Exists because a failed send at registration leaves the account unable to log in;
 * previously the only recovery was re-registering or an admin editing the database.
 *
 * The response is deliberately identical whether or not the address exists, so the
 * endpoint cannot be used to enumerate registered emails.
 *
 * Users are created through the real registration route rather than a mocked prisma
 * client, so the endpoint is exercised against actual persisted state.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

const mockGetSettings = vi.fn();
const mockSendVerificationEmail = vi.fn();

vi.mock('../../src/services/SettingsService', () => ({
  SETTINGS_ID: 'global',
  SettingsService: {
    getSettings: (...args: unknown[]) => mockGetSettings(...args),
    getDecryptedSettings: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../src/services/EmailService', () => ({
  emailService: {
    sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
    sendEmail: vi.fn().mockResolvedValue(true),
  },
  EmailService: { getInstance: () => ({ sendVerificationEmail: mockSendVerificationEmail }) },
}));

import app from '../../src/app';

let seq = 0;
const mkEmail = () => `rsv${Date.now()}${seq++}@example.com`;

async function registerUser(email: string): Promise<void> {
  mockGetSettings.mockResolvedValue({ allowRegistration: true, requireEmailVerification: true });
  mockSendVerificationEmail.mockResolvedValue(true);
  const res = await request(app).post('/api/auth/register').send({
    email,
    username: `rsv${Date.now()}${seq++}`,
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!',
    firstName: 'Re',
    lastName: 'Send',
  });
  expect(res.status).toBe(201);
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({ allowRegistration: true, requireEmailVerification: true });
  });

  it('rejects a missing email with 400', async () => {
    const res = await request(app).post('/api/auth/resend-verification').send({});
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
  });

  it('sends a fresh link for a real unverified account', async () => {
    const email = mkEmail();
    await registerUser(email);
    mockSendVerificationEmail.mockClear();

    const res = await request(app).post('/api/auth/resend-verification').send({ email });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(mockSendVerificationEmail).toHaveBeenCalledOnce();
  });

  it('responds identically for an unknown address (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'definitely-not-registered@example.com' });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it('responds identically for an already-verified account', async () => {
    const email = mkEmail();
    await registerUser(email);
    mockSendVerificationEmail.mockClear();

    // Verified accounts must not receive another link.
    const { getPrismaClient } = await import('../../src/utils/prisma');
    await getPrismaClient().user.update({ where: { email }, data: { isVerified: true } });

    const res = await request(app).post('/api/auth/resend-verification').send({ email });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it('surfaces 503 when the send fails, so the user is not told to wait for nothing', async () => {
    const email = mkEmail();
    await registerUser(email);
    mockSendVerificationEmail.mockResolvedValue(false);

    const res = await request(app).post('/api/auth/resend-verification').send({ email });

    expect(res.status).toBe(503);
    expect(res.body?.error?.code).toBe('VERIFICATION_EMAIL_FAILED');
  });
});
