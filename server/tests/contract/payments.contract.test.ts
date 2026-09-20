import { describe, it, expect, beforeAll, afterAll } from 'vitest';
/**
 * Contract Test: /api/payments
 *
 * Validates API contract compliance for payment records against the ACTUAL
 * implementation in `server/src/routes/payments.ts`.
 *
 * Note: this file replaces an orphaned root-level `tests/contract/payment-records.contract.test.ts`
 * that was written against a spec that was never implemented (it asserted
 * `/api/zakat/payments`, a `receiptUrl` field, year filtering, and a pagination
 * envelope — none of which exist). This version tests what actually ships.
 *
 * Mount point: `app.use('/api/payments', paymentsRoutes)` (server/src/app.ts:176)
 * Response envelope: `{ success: true, data: {...} }` / `{ success: false, error: <string> }`
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt';
import { createNisabYearRecordData } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('/api/payments - Contract Tests', () => {
  let authToken: string;
  let userId: string;
  let snapshotId: string;

  const validPayment = () => ({
    snapshotId,
    amount: '250.50',
    paymentDate: new Date('2024-03-15T00:00:00.000Z').toISOString(),
    recipientName: 'Local Mosque',
    recipientType: 'mosque' as const,
    recipientCategory: 'general' as const,
    paymentMethod: 'cash' as const,
    notes: 'Ramadan Zakat payment',
  });

  beforeAll(async () => {
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `test-payments-${timestamp}@example.com`,
        username: `testpayments-${timestamp}`,
        passwordHash: 'hashedpassword',
        isActive: true,
      },
    });
    userId = user.id;
    authToken = generateAccessToken(user.id);

    // createPayment validates that the snapshot exists AND belongs to the user
    const snapshot = await prisma.yearlySnapshot.create({
      data: createNisabYearRecordData(userId),
    });
    snapshotId = snapshot.id;
  });

  afterAll(async () => {
    await prisma.paymentRecord.deleteMany({ where: { userId } });
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/payments', () => {
    it('creates a payment record with valid data', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPayment())
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('payment');
      expect(response.body.data.payment).toHaveProperty('id');
    });

    it('rejects a negative amount with 400', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPayment(), amount: '-50' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('rejects a missing required field with 400', async () => {
      const { recipientName, ...incomplete } = validPayment();

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incomplete)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(JSON.stringify(response.body.error)).toMatch(/recipientName/i);
    });

    it('returns 401 when the request is unauthenticated', async () => {
      await request(app).post('/api/payments').send(validPayment()).expect(401);
    });
  });

  describe('GET /api/payments', () => {
    it('returns the payments list envelope', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('payments');
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });

    it('returns 401 when the request is unauthenticated', async () => {
      await request(app).get('/api/payments').expect(401);
    });
  });

  describe('GET /api/payments/:id', () => {
    it('returns 404 for a non-existent payment', async () => {
      const response = await request(app)
        .get('/api/payments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/payments/:id', () => {
    it('returns 404 for a non-existent payment', async () => {
      const response = await request(app)
        .delete('/api/payments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('deletes an existing payment and makes it unavailable', async () => {
      const created = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPayment())
        .expect(201);

      const paymentId = created.body.data.payment.id;

      const deleted = await request(app)
        .delete(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleted.body).toHaveProperty('success', true);

      await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
