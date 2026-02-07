import request from 'supertest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';
import { describe, beforeAll, afterAll, test, expect } from 'vitest';

let prisma: PrismaClient;

async function initTestDatabase() {
  prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL || 'file:./data/test.db' } } });
  await prisma.$connect();
  return prisma;
}

async function closeTestDatabase() {
  if (prisma) await prisma.$disconnect();
}

describe('Admin System API', () => {
  let adminToken: string;
  const adminEmail = 'admin-system-test@example.com';
  const regularEmail = 'regular-system-test@example.com';

  beforeAll(async () => {
    await initTestDatabase();

    // Clean up potentially existing users from aborted tests
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminEmail, regularEmail] }
      }
    });

    // Create an admin user/token
    // In test env, we can use X-Test-Admin header, but we still need a valid token for authentication middleware
    await request(app).post('/api/auth/register').send({
      email: adminEmail,
      password: 'Password1!',
      confirmPassword: 'Password1!',
      firstName: 'Admin',
      lastName: 'System',
      username: 'adminsystemtest'
    });
    const loginResp = await request(app).post('/api/auth/login').send({ email: adminEmail, password: 'Password1!' });
    adminToken = loginResp.body.data?.tokens?.accessToken || '';
  });

  afterAll(async () => {
    // Clean up test users
    if (prisma) {
        await prisma.user.deleteMany({
            where: {
              email: { in: [adminEmail, regularEmail] }
            }
          });
    }
    await closeTestDatabase();
  });

  test('GET /api/admin/system/status returns system status', async () => {
    const res = await request(app)
      .get('/api/admin/system/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Test-Admin', '1'); // Bypass role check in test env

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.version).toBeDefined();
    expect(res.body.data.uptime).toBeDefined();
    expect(res.body.data.database.connected).toBe(true);
    expect(res.body.data.memory).toBeDefined();
    expect(res.body.data.memory.heapUsed).toBeDefined();
    expect(res.body.data.environment).toHaveProperty('NODE_ENV');
    expect(res.body.data.timestamp).toBeDefined();
    expect(res.body.data.database.schemaUpToDate).toBeDefined();
    expect(res.body.data.database.pendingMigrations).toBeDefined();
  });

  test('GET /api/admin/system/status/schema returns detailed schema info', async () => {
    const res = await request(app)
      .get('/api/admin/system/status/schema')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Test-Admin', '1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upToDate).toBeDefined();
    expect(res.body.data.applied).toBeInstanceOf(Array);
    expect(res.body.data.pending).toBeInstanceOf(Array);
  });

  test('GET /api/admin/system/status requires admin privileges', async () => {
     // Create a regular user
     await request(app).post('/api/auth/register').send({
        email: regularEmail,
        password: 'Password1!',
        confirmPassword: 'Password1!',
        firstName: 'Regular',
        lastName: 'User',
        username: 'regularsystemtest'
      });
      const loginResp = await request(app).post('/api/auth/login').send({ email: regularEmail, password: 'Password1!' });
      const userToken = loginResp.body.data?.tokens?.accessToken || '';

    const res = await request(app)
      .get('/api/admin/system/status')
      .set('Authorization', `Bearer ${userToken}`);
      // No X-Test-Admin header

    expect(res.status).toBe(403);
  });
});
