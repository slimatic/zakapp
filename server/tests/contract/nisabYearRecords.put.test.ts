import { vi, type Mock } from 'vitest';
/**
 * Contract Test: PUT /api/nisab-year-records/:id
 * 
 * Validates API contract compliance for updating Nisab Year Records
 * Based on: specs/008-nisab-year-record/contracts/nisab-year-records.openapi.yaml
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt';
import { createNisabYearRecordData, createFinalizedRecord, createUnlockedRecord } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('PUT /api/nisab-year-records/:id - Contract Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `test-put-${timestamp}@example.com`,
        username: `testput-${timestamp}`,
        passwordHash: 'hashedpassword',
        isActive: true,
      },
    });
    userId = user.id;
    authToken = generateAccessToken(user.id);
  });

  afterAll(async () => {
    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('Update Records', () => {
    it('should update userNotes on DRAFT record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, {
          status: 'DRAFT',
          userNotes: null,
        }),
      });

      const response = await request(app)
        .put(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userNotes: 'Updated notes' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userNotes).toBe('Updated notes');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should update totalLiabilities on DRAFT record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, { status: 'DRAFT' }),
      });

      const response = await request(app)
        .put(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ totalLiabilities: 1500 })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Note: Values might come back as strings due to Decimal/encryption handling in service response mapping
      expect(String(response.body.data.totalLiabilities)).toBe('1500');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should update UNLOCKED record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createUnlockedRecord(userId),
      });

      const response = await request(app)
        .put(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userNotes: 'Correction after unlock' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userNotes).toBe('Correction after unlock');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Update Restriction Validation', () => {
    it('should reject updates to FINALIZED records', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createFinalizedRecord(userId),
      });

      const response = await request(app)
        .put(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userNotes: 'Trying to update finalized' })
        .expect(409); // Expect 409 Conflict for invalid state

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_STATE');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent record', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/nisab-year-records/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userNotes: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NOT_FOUND');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .put('/api/nisab-year-records/some-id')
        .send({ userNotes: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
