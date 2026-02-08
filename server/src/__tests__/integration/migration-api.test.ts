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

describe('Migration API Endpoints', () => {
  let testUserId: string;
  let authToken: string;
  const ENCRYPTION_KEY = 'test-encryption-key-32-chars-!!!';
  const timestamp = Date.now();

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;

    // Register a new user to get valid auth token
    const registrationResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `migration-test-${timestamp}@test.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Migration',
        lastName: 'Test',
      });

    if (registrationResponse.status !== 201) {
      throw new Error(`Registration Failed: ${JSON.stringify(registrationResponse.body, null, 2)}`);
    }

    testUserId = registrationResponse.body.data.user.id;
    authToken = registrationResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.zakatPayment.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('GET /api/user/encryption-status', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/user/encryption-status');

      expect(response.status).toBe(401);
    });

    it('should return encryption status for user with no payments', async () => {
      const response = await request(app)
        .get('/api/user/encryption-status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        needsMigration: false,
        totalPayments: 0,
        zkPayments: 0,
        serverPayments: 0,
      });
    });

    it('should return encryption status for user with ZK1 payments', async () => {
      // Create ZK1 payment
      await prisma.zakatPayment.create({
        data: {
          userId: testUserId,
          amount: 500,
          currency: 'USD',
          paymentDate: new Date('2024-01-15'),
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1445',
          status: 'completed',
          notes: 'ZK1:zknotesiv:zknotescipher',
          verificationDetails: JSON.stringify({
            recipient: 'ZK1:zkrecipiv:zkrecipcipher',
            encryptionFormat: 'ZK1',
          }),
        },
      });

      const response = await request(app)
        .get('/api/user/encryption-status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPayments).toBe(1);
      expect(response.body.data.zkPayments).toBe(1);
      expect(response.body.data.serverPayments).toBe(0);
      expect(response.body.data.needsMigration).toBe(false);

      // Clean up
      await prisma.zakatPayment.deleteMany({ where: { userId: testUserId } });
    });

    it('should return encryption status for user with legacy payments', async () => {
      // Create legacy payment
      const encryptedRecipient = await EncryptionService.encrypt('Test Charity', ENCRYPTION_KEY);
      const encryptedNotes = await EncryptionService.encrypt('Test notes', ENCRYPTION_KEY);

      await prisma.zakatPayment.create({
        data: {
          userId: testUserId,
          amount: 300,
          currency: 'USD',
          paymentDate: new Date('2024-01-10'),
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1445',
          status: 'completed',
          notes: encryptedNotes,
          verificationDetails: JSON.stringify({
            recipient: encryptedRecipient,
            encryptionFormat: 'SERVER_GCM',
          }),
        },
      });

      const response = await request(app)
        .get('/api/user/encryption-status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPayments).toBe(1);
      expect(response.body.data.zkPayments).toBe(0);
      expect(response.body.data.serverPayments).toBe(1);
      expect(response.body.data.needsMigration).toBe(true);

      // Clean up
      await prisma.zakatPayment.deleteMany({ where: { userId: testUserId } });
    });
  });

  describe('POST /api/user/prepare-migration', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/user/prepare-migration');

      expect(response.status).toBe(401);
    });

    it('should return empty array for user with no legacy payments', async () => {
      const response = await request(app)
        .post('/api/user/prepare-migration')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toEqual([]);
    });

    it('should return decrypted legacy payments for migration', async () => {
      // Create legacy payments
      const encryptedRecipient1 = await EncryptionService.encrypt('Local Masjid', ENCRYPTION_KEY);
      const encryptedNotes1 = await EncryptionService.encrypt('Ramadan donation', ENCRYPTION_KEY);

      const payment1 = await prisma.zakatPayment.create({
        data: {
          userId: testUserId,
          amount: 500,
          currency: 'USD',
          paymentDate: new Date('2024-01-15'),
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1445',
          status: 'completed',
          notes: encryptedNotes1,
          verificationDetails: JSON.stringify({
            recipient: encryptedRecipient1,
            encryptionFormat: 'SERVER_GCM',
          }),
        },
      });

      const response = await request(app)
        .post('/api/user/prepare-migration')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toHaveLength(1);
      
      const migrationPayment = response.body.data.payments[0];
      expect(migrationPayment.id).toBe(payment1.id);
      expect(migrationPayment.recipient).toBe('Local Masjid');
      expect(migrationPayment.notes).toBe('Ramadan donation');
      expect(migrationPayment.amount).toBe(500);

      // Clean up
      await prisma.zakatPayment.deleteMany({ where: { userId: testUserId } });
    });

    it('should exclude ZK1 payments from migration data', async () => {
      // Create mixed payments
      const encryptedRecipient = await EncryptionService.encrypt('Legacy Charity', ENCRYPTION_KEY);
      
      await prisma.zakatPayment.create({
        data: {
          userId: testUserId,
          amount: 300,
          currency: 'USD',
          paymentDate: new Date('2024-01-10'),
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1445',
          status: 'completed',
          notes: null,
          verificationDetails: JSON.stringify({
            recipient: encryptedRecipient,
            encryptionFormat: 'SERVER_GCM',
          }),
        },
      });

      await prisma.zakatPayment.create({
        data: {
          userId: testUserId,
          amount: 500,
          currency: 'USD',
          paymentDate: new Date('2024-01-15'),
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1445',
          status: 'completed',
          notes: 'ZK1:zknotesiv:zknotescipher',
          verificationDetails: JSON.stringify({
            recipient: 'ZK1:zkrecipiv:zkrecipcipher',
            encryptionFormat: 'ZK1',
          }),
        },
      });

      const response = await request(app)
        .post('/api/user/prepare-migration')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should only return the legacy payment
      expect(response.body.data.payments).toHaveLength(1);
      expect(response.body.data.payments[0].recipient).toBe('Legacy Charity');

      // Clean up
      await prisma.zakatPayment.deleteMany({ where: { userId: testUserId } });
    });
  });

  describe('POST /api/user/mark-migrated', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/user/mark-migrated');

      expect(response.status).toBe(401);
    });

    it('should mark user as migrated', async () => {
      const response = await request(app)
        .post('/api/user/mark-migrated')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('migrated');

      // Verify user settings were updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.settings).toBeDefined();
      
      // Decrypt settings to verify migration flag
      if (updatedUser!.settings) {
        const decryptedSettings = await EncryptionService.decrypt(updatedUser!.settings, ENCRYPTION_KEY);
        const settings = JSON.parse(decryptedSettings);
        expect(settings.encryptionMigrated).toBe(true);
        expect(settings.migratedAt).toBeDefined();
      }
    });
  });
});
