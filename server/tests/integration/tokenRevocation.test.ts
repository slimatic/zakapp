/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { sqliteAdapter } from '../../src/config/prismaAdapter';

const EMAIL = `revoke-${Date.now()}@example.com`;
const OLD_PASSWORD = 'OldPass123!';
const NEW_PASSWORD = 'NewStrong456!';

describe('Integration: changing the password revokes issued access tokens', () => {
  const prisma = new PrismaClient({ adapter: sqliteAdapter() });
  let token = '';

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: EMAIL,
        password: OLD_PASSWORD,
        confirmPassword: OLD_PASSWORD,
        firstName: 'Revoke',
        lastName: 'Tester',
      });
    if (reg.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(reg.body)}`);
    token = reg.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.$disconnect();
  });

  it('accepts the token before the change', async () => {
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
  });

  it('rejects that same token once the password has changed', async () => {
    // `iat` is second-precision and the gate keeps a one-second grace, so the
    // token must be older than that for this assertion to be deterministic.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const changed = await request(app)
      .post('/api/user/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD, allowVaultLockout: true });
    expect(changed.status).toBe(200);

    // This is the window that used to survive a reset: the session row was
    // deactivated, but `authenticate` never looked at it, so the access token
    // kept working until it expired.
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
    expect(me.body.error.code).toBe('TOKEN_REVOKED');
  });

  it('lets a token minted after the change through', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: NEW_PASSWORD });
    expect(login.status).toBe(200);

    const fresh = login.body.data.tokens.accessToken;
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${fresh}`);
    expect(me.status).toBe(200);
  });
});
