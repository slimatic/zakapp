/**
 * Integration Test: Login identifies a user the way the client actually asks.
 *
 * The client sends the login field as `username` (client/src/services/api.ts):
 *
 *     username: credentials.username || credentials.email || ''
 *
 * while registration only stores `username` when the caller supplies one, and
 * lowercases the email. So for any user registered without an explicit username
 * (`username` is NULL) the lookup matched nothing and login always failed with
 * INVALID_CREDENTIALS — the account was reachable only by a caller that sent the
 * `email` key, which this client never does.
 *
 * REGRESSION COVERAGE:
 * - login with `username` set to the account's email
 * - login with `email` (the documented alternative)
 * - login with an explicit username still works
 * - login is case-insensitive on the identifier, matching registration
 * - a wrong password is still rejected
 */

import request from 'supertest';
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Login identifier resolution', () => {
  const stamp = Date.now();
  const password = 'TestPassword123!';
  const email = `login-ident-${stamp}@example.com`;
  const explicitUsername = `loginident${stamp}`;
  let emailOnlyUserId: string;

  beforeAll(async () => {
    // A user registered the normal way: no username supplied, so it stays NULL.
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email, password, confirmPassword: password, firstName: 'Login', lastName: 'Identifier' });

    emailOnlyUserId = response.body?.data?.user?.id;

    // Registration leaves new users unverified; login requires it when the
    // setting is on, so force it instead of depending on env configuration.
    if (emailOnlyUserId) {
      await prisma.user.update({
        where: { id: emailOnlyUserId },
        data: { isVerified: true },
      });
    }
  });

  afterAll(async () => {
    if (emailOnlyUserId) {
      await prisma.userSession.deleteMany({ where: { userId: emailOnlyUserId } });
      await prisma.user.delete({ where: { id: emailOnlyUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('registers without a username, leaving it NULL', async () => {
    const user = await prisma.user.findUnique({ where: { id: emailOnlyUserId } });
    expect(user?.username).toBeNull();
  });

  it('logs in when the identifier arrives as `username` (what the client sends)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: email, password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(email);
  });

  it('logs in when the identifier arrives as `email`', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(email);
  });

  it('is case-insensitive on the identifier, matching registration', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: email.toUpperCase(), password });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(email);
  });

  it('still resolves an explicit username', async () => {
    const created = await request(app)
      .post('/api/auth/register')
      .send({
        email: `login-named-${stamp}@example.com`,
        password,
        confirmPassword: password,
        firstName: 'Named',
        lastName: 'Login',
        username: explicitUsername,
      });

    const id = created.body?.data?.user?.id;
    await prisma.user.update({ where: { id }, data: { isVerified: true } });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: explicitUsername, password });

    expect(response.status).toBe(200);
    expect(response.body.data.user.username).toBe(explicitUsername);

    await prisma.userSession.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } }).catch(() => {});
  });

  it('rejects a wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: email, password: 'WrongPassword123!' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('refuses a username that duplicates another account\'s email', async () => {
    // Login resolves an identifier against BOTH username and email, so a
    // username equal to a different account's email would make one identifier
    // match two rows — and findFirst would return a nondeterministic one.
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `login-clash-${stamp}@example.com`,
        password,
        confirmPassword: password,
        firstName: 'Clash',
        lastName: 'Test',
        username: email,
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('USERNAME_ALREADY_EXISTS');
  });
});
