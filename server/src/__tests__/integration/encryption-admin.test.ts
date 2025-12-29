/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const request = require('supertest');
// Mock shared module to avoid ESM parsing issues in Jest runtime
jest.mock('@zakapp/shared', () => ({
  VALID_ASSET_CATEGORY_VALUES: ['cash','gold','silver'],
  PASSIVE_INVESTMENT_TYPES: [],
  RESTRICTED_ACCOUNT_TYPES: [],
  ZAKAT_METHODS: [],
}));
const { app } = require('../../app');
const { EncryptionService } = require('../../services/EncryptionService');
const { PaymentRecordService } = require('../../services/payment-record.service');
const { PrismaClient } = require('@prisma/client');

let prisma;
async function initTestDatabase() {
  prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL || 'file:./data/test.db' } } });
  await prisma.$connect();
  return prisma;
}

async function seedTestDatabase() {
  // Create or find a test user
  let testUser = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
  if (!testUser) {
    testUser = await prisma.user.create({ data: { email: 'test@example.com', passwordHash: '$2b$04$test.hash.for.testing', profile: '{}', isActive: true } });
  }
  return { testUser };
}

async function closeTestDatabase() {
  if (prisma) await prisma.$disconnect();
}

describe('Admin Encryption Remediation API', () => {
  let testUser: any;
  let adminToken: string;
  let prevKey: string;
  let currKey: string;
  let paymentId: string;

  beforeAll(async () => {
    await initTestDatabase();
    const seeded = await seedTestDatabase();
    testUser = seeded.testUser;

    // Login as admin to get token (we will use X-Test-Admin header to bypass DB role check)
    await request(app).post('/api/auth/register').send({ email: 'admin2@example.com', password: 'Password1!' });
    const loginResp = await request(app).post('/api/auth/login').send({ email: 'admin2@example.com', password: 'Password1!' });
    adminToken = loginResp.body.tokens?.accessToken || '';

    // Generate keys
    prevKey = EncryptionService.generateKey();
    currKey = EncryptionService.generateKey();

    // Create a zakat calculation for the test user so payment creation succeeds
    const calculation = await prisma.zakatCalculation.create({ data: {
      userId: testUser.id,
      calculationDate: new Date(),
      methodology: 'standard',
      calendarType: 'solar',
      totalAssets: 1000,
      totalLiabilities: 0,
      netWorth: 1000,
      nisabThreshold: 0,
      nisabSource: 'gold',
      isZakatObligatory: false,
      zakatAmount: 0,
      zakatRate: 0.025,
      breakdown: '{}',
      assetsIncluded: '[]',
      liabilitiesIncluded: '[]'
    }});

    // Create a payment encrypted with prevKey by temporarily setting ENCRYPTION_KEY
    process.env.ENCRYPTION_KEY = prevKey;
    const paymentSvc = new PaymentRecordService();
    const created = await paymentSvc.createPayment(testUser.id, {
      calculationId: calculation.id,
      amount: 42,
      paymentDate: new Date().toISOString(),
      recipientName: 'Recipient PrevKey',
      recipientType: 'individual',
      recipientCategory: 'fakir',
      paymentMethod: 'cash',
      currency: 'USD',
      exchangeRate: 1.0,
    } as any);
    paymentId = (created as any).id;

    // Restore current key
    process.env.ENCRYPTION_KEY = currKey;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  test('scan creates remediation for prev-key encrypted payment', async () => {
    const res = await request(app).post('/api/admin/encryption/scan').set('Authorization', `Bearer ${adminToken}`).set('X-Test-Admin','1').send();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('created');
    expect(res.body.created).toBeGreaterThanOrEqual(1);

    const list = await request(app).get('/api/admin/encryption/issues').set('Authorization', `Bearer ${adminToken}`).set('X-Test-Admin','1');
    expect(list.status).toBe(200);
    expect(list.body).toHaveProperty('issues');
    const issues = list.body.issues;
    const found = issues.find((i: any) => i.targetId === paymentId && i.targetType === 'payment');
    expect(found).toBeTruthy();
  });

  test('retry with correct previous key resolves remediation and re-encrypts', async () => {
    const listResp = await request(app).get('/api/admin/encryption/issues').set('Authorization', `Bearer ${adminToken}`);
    const issue = listResp.body.issues.find((i: any) => i.targetId === paymentId && i.targetType === 'payment');
    expect(issue).toBeTruthy();

    const retryResp = await request(app).post(`/api/admin/encryption/${issue.id}/retry`).set('Authorization', `Bearer ${adminToken}`).set('X-Test-Admin','1').send({ key: prevKey });
    expect(retryResp.status).toBe(200);
    expect(retryResp.body.success).toBe(true);

    // Reload payment and attempt to decrypt with current key
    const payment = await prisma.paymentRecord.findUnique({ where: { id: paymentId } });
    expect(payment).toBeTruthy();

    // Should be decryptable with current key now
    const dec = await EncryptionService.decrypt((payment as any).recipientName, currKey);
    expect(dec).toContain('Recipient PrevKey');

    const updatedIssue = await prisma.encryptionRemediation.findUnique({ where: { id: issue.id } });
    expect(updatedIssue?.status).toBe('RESOLVED');
  });
});
