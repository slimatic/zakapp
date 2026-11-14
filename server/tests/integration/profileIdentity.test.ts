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

const A_EMAIL = `identity-a-${Date.now()}@example.com`;
const B_EMAIL = `identity-b-${Date.now()}@example.com`;
// Generated, not a literal: the repo's credential guard rejects committed
// credential-shaped literals, and a test password is still one.
const makePassword = () => `Aa1!${Math.random().toString(36).slice(2, 10)}`;
const PASSWORD = makePassword();

describe('Integration: profile identity changes are collision-checked', () => {
  const prisma = new PrismaClient({ adapter: sqliteAdapter() });
  let tokenB = '';

  beforeAll(async () => {
    const a = await request(app).post('/api/auth/register').send({
      email: A_EMAIL,
      password: PASSWORD,
      confirmPassword: PASSWORD,
      firstName: 'Alpha',
      lastName: 'Tester',
    });
    if (a.status !== 201) throw new Error(`A registration failed: ${JSON.stringify(a.body)}`);

    const b = await request(app).post('/api/auth/register').send({
      email: B_EMAIL,
      password: PASSWORD,
      confirmPassword: PASSWORD,
      firstName: 'Beta',
      lastName: 'Tester',
    });
    if (b.status !== 201) throw new Error(`B registration failed: ${JSON.stringify(b.body)}`);
    tokenB = b.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [A_EMAIL, B_EMAIL] } } });
    await prisma.$disconnect();
  });

  it("refuses another account's email as your own", async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ email: A_EMAIL });

    expect(res.status).not.toBe(200);
  });

  it("refuses another account's email disguised as a username", async () => {
    // Login resolves one identifier against both columns, so this would make
    // the match ambiguous and could lock the real owner out.
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ username: A_EMAIL });

    expect(res.status).not.toBe(200);
  });

  it('accepts an unused address', async () => {
    const next = `identity-b2-${Date.now()}@example.com`;
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ email: next });

    expect(res.status).toBe(200);
    const row = await prisma.user.findUnique({ where: { email: next } });
    expect(row).not.toBeNull();
  });

  it('refuses an address listed in ADMIN_EMAILS, case-insensitively', async () => {
    const reserved = `ops-${Date.now()}@example.com`;
    process.env.ADMIN_EMAILS = reserved;

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ email: reserved.toUpperCase() });

    expect(res.status).not.toBe(200);
    delete process.env.ADMIN_EMAILS;
  });

  it('cannot overwrite the vault salt through the profile blob', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ salt: 'attacker-chosen-salt', firstName: 'Beta' });

    expect(res.status).toBe(200);
    // The merge is whitelisted; an unknown key must not reach the encrypted blob.
    expect(res.body.data.salt).toBeUndefined();
  });
});
