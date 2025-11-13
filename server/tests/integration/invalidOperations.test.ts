/**
 * T032: Integration Test - Invalid Operations and Error Handling
 * 
 * Tests proper error responses for invalid operations, authorization failures,
 * and edge cases across all Nisab Year Record endpoints.
 */

import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration: Invalid Operations and Error Handling', () => {
  let authToken1: string;
  let authToken2: string;
  let userId1: string;
  let userId2: string;

  beforeAll(async () => {
    // Create two users for authorization tests
    const user1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'errors1@example.com',
        password: 'TestPass123!',
        name: 'Errors User 1',
      });

    const user2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'errors2@example.com',
        password: 'TestPass123!',
        name: 'Errors User 2',
      });

    authToken1 = user1.body.accessToken;
    userId1 = user1.body.user.id;
    authToken2 = user2.body.accessToken;
    userId2 = user2.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId1 } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId2 } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Authentication Errors', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(response.status).toBe(401);
    });

    it('should reject requests with expired token', async () => {
      // Use a pre-expired JWT token (would need to generate one)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjB9.placeholder';
      
      const response = await request(app)
        .get('/api/nisab-year-records')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization Errors', () => {
    it('should prevent user from accessing another user\'s records', async () => {
      // User 1 creates a record
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      const recordId = createResponse.body.record.id;

      // User 2 attempts to access it
      const accessAttempt = await request(app)
        .get(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(accessAttempt.status).toBe(403);
      expect(accessAttempt.body.error).toContain('Not authorized');
    });

    it('should prevent user from modifying another user\'s records', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 8000,
          zakatableWealth: 8000,
          zakatAmount: 200,
        });

      const recordId = createResponse.body.record.id;

      const updateAttempt = await request(app)
        .put(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ totalWealth: 15000 });

      expect(updateAttempt.status).toBe(403);
    });

    it('should prevent user from deleting another user\'s records', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 7000,
          zakatableWealth: 7000,
          zakatAmount: 175,
        });

      const recordId = createResponse.body.record.id;

      const deleteAttempt = await request(app)
        .delete(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(deleteAttempt.status).toBe(403);
    });
  });

  describe('Validation Errors', () => {
    it('should reject creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          // Missing hawlStartDate, hawlCompletionDate, etc.
          nisabBasis: 'gold',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid nisabBasis value', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000),
          nisabBasis: 'platinum', // Invalid - must be "gold" or "silver"
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('nisabBasis');
    });

    it('should reject invalid Hawl completion date (not 354 days)', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date('2024-01-01'),
          hawlCompletionDate: new Date('2025-01-01'), // 365 days (invalid)
          nisabBasis: 'gold',
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('354 days');
    });

    it('should reject negative wealth values', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: -5000, // Invalid
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      expect(response.status).toBe(400);
    });

    it('should reject Zakat amount not equal to 2.5% of zakatable wealth', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 500, // Should be 250 (2.5%)
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('2.5%');
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .get('/api/nisab-year-records/nonexistent_id_12345')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 when finalizing non-existent record', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records/fake_id/finalize')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 when unlocking non-existent record', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records/fake_id/unlock')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ reason: 'Testing non-existent record' });

      expect(response.status).toBe(404);
    });
  });

  describe('Business Logic Errors', () => {
    it('should reject finalization before Hawl completion without override', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      const recordId = createResponse.body.record.id;

      const finalizeResponse = await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(finalizeResponse.status).toBe(400);
      expect(finalizeResponse.body.error).toContain('Hawl completion');
    });

    it('should reject unlock without reason', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      const recordId = createResponse.body.record.id;

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken1}`);

      const unlockResponse = await request(app)
        .post(`/api/nisab-year-records/${recordId}/unlock`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({}); // No reason provided

      expect(unlockResponse.status).toBe(400);
      expect(unlockResponse.body.error).toContain('reason');
    });

    it('should reject unlock with reason too short', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 9000,
          zakatableWealth: 9000,
          zakatAmount: 225,
        });

      const recordId = createResponse.body.record.id;

      await request(app)
        .post(`/api/nisab-year-records/${recordId}/finalize`)
        .set('Authorization', `Bearer ${authToken1}`);

      const unlockResponse = await request(app)
        .post(`/api/nisab-year-records/${recordId}/unlock`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ reason: 'Too short' }); // < 10 chars

      expect(unlockResponse.status).toBe(400);
      expect(unlockResponse.body.error).toContain('10 characters');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large wealth values', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 999999999999, // Very large
          zakatableWealth: 999999999999,
          zakatAmount: 24999999999.975, // 2.5%
        });

      expect([200, 201, 400]).toContain(response.status);
      // Either accepts it or rejects with validation error
    });

    it('should handle concurrent edits to same record', async () => {
      const createResponse = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          hawlStartDate: new Date(),
          hawlCompletionDate: new Date(Date.now() + 354 * 24 * 60 * 60 * 1000),
          nisabBasis: 'gold',
          totalWealth: 10000,
          zakatableWealth: 10000,
          zakatAmount: 250,
        });

      const recordId = createResponse.body.record.id;

      const update1 = request(app)
        .put(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ totalWealth: 11000, zakatableWealth: 11000, zakatAmount: 275 });

      const update2 = request(app)
        .put(`/api/nisab-year-records/${recordId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ totalWealth: 12000, zakatableWealth: 12000, zakatAmount: 300 });

      const results = await Promise.all([update1, update2]);

      // At least one should succeed
      expect(results.some(r => r.status === 200)).toBe(true);
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/nisab-year-records')
        .set('Authorization', `Bearer ${authToken1}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json here }');

      expect(response.status).toBe(400);
    });
  });
});
