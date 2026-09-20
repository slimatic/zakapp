/**
 * Registration must not report success when the required verification email fails.
 *
 * History: the token write and the send sat in one try/catch that only logged. A failed
 * send still returned 201, so the client was told to check an inbox that would never
 * receive anything — and with requireEmailVerification on, that account could not log in.
 * The failure was invisible until an operator read the server logs.
 *
 * This drives the real express app through supertest, so it exercises the mounted
 * handler rather than a module nothing imports (the mistake that made the v0.16.4
 * allowRegistration gate ineffective while its unit test passed).
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
  EmailService: {
    getInstance: () => ({ sendVerificationEmail: mockSendVerificationEmail }),
  },
}));

import app from '../../src/app';

const unique = () => `efail${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`;

const payload = () => ({
  email: unique(),
  username: `u${Date.now()}${Math.floor(Math.random() * 1e5)}`,
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  firstName: 'New',
  lastName: 'User',
});

describe('registration: a failed verification email must not report success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 when verification is required and the email was sent', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: true, requireEmailVerification: true });
    mockSendVerificationEmail.mockResolvedValue(true);

    const res = await request(app).post('/api/auth/register').send(payload());

    expect(res.status).toBe(201);
    expect(mockSendVerificationEmail).toHaveBeenCalled();
  });

  it('does NOT return 201 when the send returns false and verification is required', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: true, requireEmailVerification: true });
    // The exact shape of the production failure: send fails without throwing.
    mockSendVerificationEmail.mockResolvedValue(false);

    const res = await request(app).post('/api/auth/register').send(payload());

    expect(res.status).toBe(503);
    expect(res.body?.error?.code).toBe('VERIFICATION_EMAIL_FAILED');
  });

  it('does NOT return 201 when the send throws and verification is required', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: true, requireEmailVerification: true });
    // The 535 SMTP failure surfaced as a throw.
    mockSendVerificationEmail.mockRejectedValue(
      new Error('Invalid login: 535 Authentication credentials invalid')
    );

    const res = await request(app).post('/api/auth/register').send(payload());

    expect(res.status).toBe(503);
    expect(res.body?.error?.code).toBe('VERIFICATION_EMAIL_FAILED');
  });

  it('still returns 201 when verification is NOT required, even if the email fails', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: true, requireEmailVerification: false });
    mockSendVerificationEmail.mockResolvedValue(false);

    const res = await request(app).post('/api/auth/register').send(payload());

    // Email is not needed to log in here, so a send failure must not block signup.
    expect(res.status).toBe(201);
  });
});
