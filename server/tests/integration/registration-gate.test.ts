/**
 * Regression tests for the allowRegistration gate.
 *
 * History: the `allowRegistration` system setting was stored, exposed through the
 * admin API, and toggled by a working-looking UI control — but read nowhere on the
 * registration path. An operator who turned signups off still accepted public
 * registrations, and the UI created false assurance about who could create accounts.
 *
 * These tests assert the setting is actually enforced, and that failure to read it
 * fails closed rather than open.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGetSettings = vi.fn();

vi.mock('../../src/services/SettingsService', () => ({
  SettingsService: {
    getSettings: (...args: unknown[]) => mockGetSettings(...args),
  },
}));

// The handler chain pulls in a lot; stub the pieces that would touch the DB or network.
vi.mock('../../src/services/JWTService', () => ({
  jwtService: { generateToken: vi.fn(), generateRefreshToken: vi.fn() },
}));
vi.mock('../../src/services/EncryptionService', () => ({
  EncryptionService: vi.fn().mockImplementation(() => ({
    encrypt: (v: string) => v,
    decrypt: (v: string) => v,
  })),
}));
vi.mock('../../src/services/EmailService', () => ({
  emailService: { sendVerificationEmail: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('../../src/middleware/RateLimitMiddleware', () => ({
  registrationRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
vi.mock('../../src/routes/auth/utils', () => ({
  getPrismaClient: () => ({
    user: { findUnique: mockFindUnique, create: mockCreate },
  }),
  ENCRYPTION_KEY: 'PLACEHOLDER-NOT-A-SECRET',
}));

import { registerHandler } from '../../src/routes/auth/register';

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const validBody = {
  email: 'newuser@example.com',
  username: 'newuser',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
};

describe('POST /api/auth/register — allowRegistration gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'u1', email: validBody.email });
  });

  it('returns 403 REGISTRATION_DISABLED and creates no user when the flag is false', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: false });
    const req: any = { body: { ...validBody } };
    const res = makeRes();

    await registerHandler(req, res, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'REGISTRATION_DISABLED' }),
      }),
    );
    // The critical assertion: no account was created.
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('refuses before touching the database, so a malformed body cannot reach the gate', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: false });
    // Deliberately invalid: only email present.
    const req: any = { body: { email: 'someone@example.com' } };
    const res = makeRes();

    await registerHandler(req, res, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('fails closed (503) when the setting cannot be read', async () => {
    mockGetSettings.mockRejectedValue(new Error('database unavailable'));
    const req: any = { body: { ...validBody } };
    const res = makeRes();

    await registerHandler(req, res, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'REGISTRATION_UNAVAILABLE' }),
      }),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('proceeds past the gate when the flag is true', async () => {
    mockGetSettings.mockResolvedValue({ allowRegistration: true });
    const req: any = { body: { ...validBody } };
    const res = makeRes();

    await registerHandler(req, res, (() => {}) as any);

    // Must NOT be blocked by the gate.
    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.status).not.toHaveBeenCalledWith(503);
    // Reaches the existence check, proving it got past the gate.
    expect(mockFindUnique).toHaveBeenCalled();
  });
});
