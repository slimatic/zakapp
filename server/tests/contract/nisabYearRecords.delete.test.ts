/**
 * Contract Test: DELETE /api/nisab-year-records/:id
 * 
 * Validates API contract compliance for deleting Nisab Year Records
 * Based on: specs/008-nisab-year-record/contracts/nisab-year-records.openapi.yaml
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt';
import { createNisabYearRecordData, createFinalizedRecord } from '../helpers/nisabYearRecordFactory';

const prisma = new PrismaClient();

describe('DELETE /api/nisab-year-records/:id - Contract Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-delete@example.com',
        username: 'testdelete',
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

  describe('Successful Deletion', () => {
    it('should delete DRAFT record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, { status: 'DRAFT' }),
      });

      const response = await request(app)
        .delete(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify record is actually deleted
      const deletedRecord = await prisma.yearlySnapshot.findUnique({
        where: { id: record.id },
      });
      expect(deletedRecord).toBeNull();
    });
  });

  describe('Delete Restrictions', () => {
    it('should reject delete of FINALIZED record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createFinalizedRecord(userId),
      });

      const response = await request(app)
        .delete(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DELETE_NOT_ALLOWED');
      expect(response.body.message).toContain('FINALIZED');

      // Verify record still exists
      const stillExists = await prisma.yearlySnapshot.findUnique({
        where: { id: record.id },
      });
      expect(stillExists).not.toBeNull();

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should reject delete of UNLOCKED record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createUnlockedRecord(userId),
      });

      const response = await request(app)
        .delete(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DELETE_NOT_ALLOWED');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });

    it('should provide helpful error message for finalized record deletion', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createFinalizedRecord(userId),
      });

      const response = await request(app)
        .delete(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Unlock first');

      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent record', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/nisab-year-records/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NOT_FOUND');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .delete('/api/nisab-year-records/some-id')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 404 when trying to delete another user\'s record', async () => {
      const record = await prisma.yearlySnapshot.create({
        data: createNisabYearRecordData(userId, { status: 'DRAFT' }),
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other-delete@example.com',
          username: 'otherdelete',
          passwordHash: 'hash',
          isActive: true,
        },
      });

      const otherToken = generateAccessToken(otherUser.id);

      const response = await request(app)
        .delete(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);

      // Cleanup
      await prisma.yearlySnapshot.delete({ where: { id: record.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});
