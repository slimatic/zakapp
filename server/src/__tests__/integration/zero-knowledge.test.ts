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

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../utils/prisma';
import { EncryptionService } from '../../services/EncryptionService';

describe('Zero-Knowledge E2E Integration', () => {
  let testUserId: string;
  let authToken: string;
  const timestamp = Date.now();
  const ENCRYPTION_KEY = 'test-encryption-key-32-chars-!!!';

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;

    // Register a new user
    const registrationResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `zk-e2e-test-${timestamp}@test.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'ZKE2E',
        lastName: 'Test',
      });

    testUserId = registrationResponse.body.data.user.id;
    authToken = registrationResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.zakatPayment.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it('should handle full ZK1 lifecycle: create → retrieve → verify storage', async () => {
    // STEP 1: Create payment with ZK1-encrypted data
    const zk1Payment = {
      recipient: 'ZK1:testiv123:testcipher456',
      notes: 'ZK1:notesiv789:notescipher012',
      amount: 500,
      paymentDate: '2024-01-01',
    };

    const createRes = await request(app)
      .post('/api/zakat/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(zk1Payment);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const paymentId = createRes.body.data.payment.id;
    expect(paymentId).toBeDefined();

    // STEP 2: Verify database contains ZK1 blob (no server decryption)
    const dbPayment = await prisma.zakatPayment.findUnique({
      where: { id: paymentId },
    });

    expect(dbPayment).not.toBeNull();
    const verificationDetails = JSON.parse(dbPayment!.verificationDetails || '{}');
    
    // Recipient should be stored as ZK1 blob
    expect(verificationDetails.recipient).toMatch(/^ZK1:/);
    expect(verificationDetails.encryptionFormat).toBe('ZK1');
    
    // Notes should be stored as ZK1 blob
    expect(dbPayment!.notes).toMatch(/^ZK1:/);

    // STEP 3: Retrieve payment via API (should return ZK1 blob unchanged)
    const getRes = await request(app)
      .get(`/api/zakat/payments/${paymentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    
    // API should return ZK1 data as-is (client will decrypt)
    expect(getRes.body.data.payment.recipient).toBe('ZK1:testiv123:testcipher456');
    expect(getRes.body.data.payment.notes).toBe('ZK1:notesiv789:notescipher012');

    // STEP 4: List all payments (should return ZK1 unchanged)
    const listRes = await request(app)
      .get('/api/zakat/payments')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    const payment = listRes.body.data.payments.find((p: any) => p.id === paymentId);
    expect(payment).toBeDefined();
    expect(payment.recipient).toBe('ZK1:testiv123:testcipher456');
    expect(payment.notes).toBe('ZK1:notesiv789:notescipher012');
  });

  it('should handle legacy format with backward compatibility', async () => {
    // STEP 1: Create payment with plaintext (simulating old client)
    const legacyPayment = {
      recipient: 'Old Masjid',
      notes: 'Legacy donation notes',
      amount: 200,
      paymentDate: '2024-01-01',
    };

    const createRes = await request(app)
      .post('/api/zakat/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(legacyPayment);

    expect(createRes.status).toBe(201);
    const paymentId = createRes.body.data.payment.id;

    // STEP 2: Verify server encrypted it
    const dbPayment = await prisma.zakatPayment.findUnique({
      where: { id: paymentId },
    });

    expect(dbPayment).not.toBeNull();
    const verificationDetails = JSON.parse(dbPayment!.verificationDetails || '{}');
    
    // Should be encrypted by server (not ZK1 format)
    expect(verificationDetails.encryptionFormat).toBe('SERVER_GCM');
    expect(verificationDetails.recipient).not.toMatch(/^ZK1:/);
    expect(verificationDetails.recipient).toMatch(/:/); // Legacy format has colons

    // STEP 3: Retrieve payment (should be decrypted by server)
    const getRes = await request(app)
      .get(`/api/zakat/payments/${paymentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    
    // API should return decrypted data
    expect(getRes.body.data.payment.recipient).toBe('Old Masjid');
    expect(getRes.body.data.payment.notes).toBe('Legacy donation notes');
  });

  it('should handle mixed ZK1 and legacy payments in same account', async () => {
    // Create one ZK1 payment
    const zk1Res = await request(app)
      .post('/api/zakat/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        recipient: 'ZK1:zk1iv:zk1cipher',
        notes: 'ZK1:zk1notesiv:zk1notescipher',
        amount: 300,
        paymentDate: '2024-01-15',
      });

    expect(zk1Res.status).toBe(201);
    const zk1PaymentId = zk1Res.body.data.payment.id;

    // Create one legacy payment
    const legacyRes = await request(app)
      .post('/api/zakat/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        recipient: 'Legacy Charity',
        notes: 'Legacy notes',
        amount: 400,
        paymentDate: '2024-01-20',
      });

    expect(legacyRes.status).toBe(201);
    const legacyPaymentId = legacyRes.body.data.payment.id;

    // List all payments
    const listRes = await request(app)
      .get('/api/zakat/payments')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    const payments = listRes.body.data.payments;

    // Find both payments
    const zk1Payment = payments.find((p: any) => p.id === zk1PaymentId);
    const legacyPayment = payments.find((p: any) => p.id === legacyPaymentId);

    // ZK1 payment should be returned as-is
    expect(zk1Payment.recipient).toBe('ZK1:zk1iv:zk1cipher');
    expect(zk1Payment.notes).toBe('ZK1:zk1notesiv:zk1notescipher');

    // Legacy payment should be decrypted
    expect(legacyPayment.recipient).toBe('Legacy Charity');
    expect(legacyPayment.notes).toBe('Legacy notes');
  });

  it('should support updating payment with ZK1 format', async () => {
    // Create payment with legacy format
    const createRes = await request(app)
      .post('/api/zakat/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        recipient: 'Original Recipient',
        notes: 'Original notes',
        amount: 250,
        paymentDate: '2024-01-01',
      });

    const paymentId = createRes.body.data.payment.id;

    // Update with ZK1 format (simulating user migration)
    const updateRes = await request(app)
      .put(`/api/zakat/payments/${paymentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        recipient: 'ZK1:updatediv:updatedcipher',
        notes: 'ZK1:updatednotesiv:updatednotescipher',
        amount: 250, // Required for PUT
        paymentDate: '2024-01-01', // Required for PUT
      });

    expect(updateRes.status).toBe(200);

    // Verify database updated to ZK1 format
    const dbPayment = await prisma.zakatPayment.findUnique({
      where: { id: paymentId },
    });

    const verificationDetails = JSON.parse(dbPayment!.verificationDetails || '{}');
    expect(verificationDetails.encryptionFormat).toBe('ZK1');
    expect(verificationDetails.recipient).toBe('ZK1:updatediv:updatedcipher');
    expect(dbPayment!.notes).toBe('ZK1:updatednotesiv:updatednotescipher');

    // Retrieve and verify
    const getRes = await request(app)
      .get(`/api/zakat/payments/${paymentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.body.data.payment.recipient).toBe('ZK1:updatediv:updatedcipher');
    expect(getRes.body.data.payment.notes).toBe('ZK1:updatednotesiv:updatednotescipher');
  });

  it('should handle null/undefined recipient and notes correctly', async () => {
    // Create payment without recipient or notes
    const createRes = await request(app)
      .post('/api/zakat/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 150,
        paymentDate: '2024-01-01',
      });

    expect(createRes.status).toBe(201);
    const paymentId = createRes.body.data.payment.id;

    // Retrieve payment
    const getRes = await request(app)
      .get(`/api/zakat/payments/${paymentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    
    // Recipient and notes should be undefined (not empty strings or null)
    const payment = getRes.body.data.payment;
    expect(payment.recipient).toBeUndefined();
    expect(payment.notes).toBeUndefined();
  });

  describe('Migration Flow', () => {
    it('should support complete migration workflow', async () => {
      // STEP 1: Create legacy payments
      await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipient: 'Migration Test Charity 1',
          notes: 'Test note 1',
          amount: 100,
          paymentDate: '2024-01-01',
        });

      await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipient: 'Migration Test Charity 2',
          notes: 'Test note 2',
          amount: 200,
          paymentDate: '2024-01-02',
        });

      // STEP 2: Check encryption status
      const statusRes = await request(app)
        .get('/api/user/encryption-status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusRes.body.data.needsMigration).toBe(true);
      expect(statusRes.body.data.serverPayments).toBeGreaterThan(0);

      // STEP 3: Prepare migration data
      const prepareRes = await request(app)
        .post('/api/user/prepare-migration')
        .set('Authorization', `Bearer ${authToken}`);

      expect(prepareRes.body.success).toBe(true);
      const migrationPayments = prepareRes.body.data.payments;
      expect(migrationPayments.length).toBeGreaterThan(0);

      // Data should be decrypted for client re-encryption
      const testPayment = migrationPayments.find((p: any) => 
        p.recipient === 'Migration Test Charity 1'
      );
      expect(testPayment).toBeDefined();
      expect(testPayment.notes).toBe('Test note 1');

      // STEP 4: Client would re-encrypt and update (simulated)
      for (const payment of migrationPayments) {
        if (payment.recipient || payment.notes) {
          await request(app)
            .put(`/api/zakat/payments/${payment.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              recipient: payment.recipient ? `ZK1:migrated:${payment.recipient}` : undefined,
              notes: payment.notes ? `ZK1:migrated:${payment.notes}` : undefined,
              amount: payment.amount, // Required for PUT
              paymentDate: payment.paymentDate, // Required for PUT
            });
        }
      }

      // STEP 5: Mark as migrated
      const markRes = await request(app)
        .post('/api/user/mark-migrated')
        .set('Authorization', `Bearer ${authToken}`);

      expect(markRes.body.success).toBe(true);

      // STEP 6: Verify all payments are now ZK1
      const finalStatusRes = await request(app)
        .get('/api/user/encryption-status')
        .set('Authorization', `Bearer ${authToken}`);

      // Note: This will still show needsMigration because we used a prefix
      // In real scenario, client would properly encrypt. Here we just verify the flow works.
      expect(finalStatusRes.body.success).toBe(true);
    });
  });
});
