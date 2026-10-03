/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * `isActive` is the admin's activate/deactivate toggle, and for a long time no
 * authentication path read it: login had no `isActive` branch and this middleware
 * never looked at the row, so a deactivated account logged in normally and an
 * already-issued token kept working forever. The badge in the user list changed
 * nothing.
 *
 * These pin the two halves that make the toggle real:
 *   - login refuses a deactivated account (routes/auth/login.ts)
 *   - this middleware refuses an existing token for one (here)
 *
 * The second is the durable half: the in-memory denylist only covers tokens
 * revoked while the process is alive, so a restart would resurrect a session
 * unless the row itself is consulted.
 */

const prismaMock = {
  user: { findUnique: vi.fn() },
};

vi.mock('../../utils/prisma', () => ({ prisma: prismaMock }));
vi.mock('../../utils/logger', () => {
  const instance = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return {
    Logger: class {
      info = instance.info;
      warn = instance.warn;
      error = instance.error;
      debug = instance.debug;
    },
    logger: instance,
    default: instance,
  };
});
vi.mock('../../services/JWTService', () => ({
  jwtService: {
    createAccessToken: vi.fn(),
    createRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn().mockReturnValue({ userId: 'u1', email: 'a@example.com' }),
  },
}));
vi.mock('../../routes/auth/_shared', () => ({
  isTokenRevoked: vi.fn().mockReturnValue(false),
  revokeToken: vi.fn(),
}));

const { authenticate } = await import('../../middleware/AuthMiddleware');

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const req = () => ({ headers: { authorization: 'Bearer a-valid-token' } }) as any;
const codeOf = (res: any) => res.json.mock.calls[0][0]?.error?.code;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthMiddleware.authenticate - account status', () => {
  it('lets an active account through', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isActive: true });
    const next = vi.fn();

    await authenticate(req(), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('refuses a deactivated account even with a valid token', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isActive: false });
    const next = vi.fn();
    const res = mockRes();

    await authenticate(req(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(codeOf(res)).toBe('ACCOUNT_DEACTIVATED');
  });

  it('refuses a token whose account no longer exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const next = vi.fn();
    const res = mockRes();

    await authenticate(req(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
