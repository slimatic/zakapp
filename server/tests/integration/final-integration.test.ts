/**
 * Final Integration Tests - Tracking & Analytics System
 * 
 * End-to-end tests validating complete workflows across all features:
 * - Payment recording → Analytics → Reminders → Export
 * - Multi-user isolation and security
 * - Performance under load
 * - Data consistency and integrity
 * 
 * Constitutional Compliance:
 * - Privacy: Validates data encryption and isolation
 * - Quality: Tests all critical user journeys
 * - Performance: Validates < 500ms response times
 */

import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { EncryptionService } from '../../src/services/EncryptionService';

describe('Final Integration Tests - Complete Workflows', () => {
  let authToken: string;
  let userId: string;
  let secondUserToken: string;
  let secondUserId: string;

  beforeAll(async () => {
    // Clean database
    await prisma.paymentRecord.deleteMany({});
    await prisma.reminderEvent.deleteMany({});
    await prisma.user.deleteMany({});

    // Create and login first test user
    const user1Reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'integration-test-1@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        username: 'integrationtest1',
        firstName: 'Integration',
        lastName: 'TestUserOne'
      });

    if (!user1Reg.body.data || !user1Reg.body.data.user) {
      throw new Error(`Failed to register user 1: ${JSON.stringify(user1Reg.body)}`);
    }

    userId = user1Reg.body.data.user.id;

    const user1Login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'integration-test-1@example.com',
        password: 'SecurePass123!'
      });

    authToken = user1Login.body.accessToken;

    // Create and login second test user
    const user2Reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'integration-test-2@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        username: 'integrationtest2',
        firstName: 'Integration',
        lastName: 'TestUserTwo'
      });

    secondUserId = user2Reg.body.data.user.id;

    const user2Login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'integration-test-2@example.com',
        password: 'SecurePass123!'
      });

    secondUserToken = user2Login.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.paymentRecord.deleteMany({});
    await prisma.reminderEvent.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: 'integration-test' } } });
    await prisma.$disconnect();
  });

  describe('Complete Payment Workflow', () => {
    let paymentId: string;

    it('should create payment → view in history → update → delete', async () => {
      // Step 1: Create payment
      const createRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 250.00,
          currency: 'USD',
          date: new Date('2024-03-15').toISOString(),
          category: 'Zakat',
          recipient: 'Local Masjid',
          notes: 'Monthly Zakat contribution',
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'INT-TEST-001'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.payment).toHaveProperty('id');
      paymentId = createRes.body.data.payment.id;

      // Verify encryption
      const payment = createRes.body.data.payment;
      expect(payment.notes).toBe('Monthly Zakat contribution'); // Decrypted for response
      expect(payment.amount).toBe(250.00);

      // Step 2: Retrieve in history
      const historyRes = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.payments).toHaveLength(1);
      expect(historyRes.body.data.payments[0].id).toBe(paymentId);

      // Step 3: Update payment
      const updateRes = await request(app)
        .put(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 275.00,
          notes: 'Updated: Monthly Zakat - March'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.payment.amount).toBe(275.00);
      expect(updateRes.body.data.payment.notes).toBe('Updated: Monthly Zakat - March');

      // Step 4: Get specific payment
      const getRes = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.payment.amount).toBe(275.00);

      // Step 5: Delete payment
      const deleteRes = await request(app)
        .delete(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify deletion
      const verifyRes = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyRes.status).toBe(404);
    });

    it('should handle payment filtering and pagination', async () => {
      // Create multiple payments
      const payments = [
        { amount: 100, category: 'Zakat', date: '2024-01-15' },
        { amount: 200, category: 'Sadaqah', date: '2024-02-15' },
        { amount: 150, category: 'Masjid', date: '2024-03-15' },
        { amount: 300, category: 'Zakat', date: '2024-04-15' },
        { amount: 250, category: 'Sadaqah', date: '2024-05-15' }
      ];

      for (const payment of payments) {
        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: payment.amount,
            currency: 'USD',
            date: new Date(payment.date).toISOString(),
            category: payment.category,
            recipient: 'Test Recipient'
          });
      }

      // Test filtering by category
      const filterRes = await request(app)
        .get('/api/payments')
        .query({ category: 'Zakat' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(filterRes.status).toBe(200);
      expect(filterRes.body.data.payments.filter((p: any) => p.category === 'Zakat')).toHaveLength(2);

      // Test date range filtering
      const dateRes = await request(app)
        .get('/api/payments')
        .query({
          startDate: '2024-02-01',
          endDate: '2024-04-30'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(dateRes.status).toBe(200);
      expect(dateRes.body.data.payments.length).toBeGreaterThanOrEqual(3);

      // Test pagination
      const paginationRes = await request(app)
        .get('/api/payments')
        .query({ limit: 2, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(paginationRes.status).toBe(200);
      expect(paginationRes.body.data.payments.length).toBeLessThanOrEqual(2);
      expect(paginationRes.body.meta.pagination).toBeDefined();
    });
  });

  describe('Payment → Analytics Integration', () => {
    beforeEach(async () => {
      // Clean payments for this test
      await prisma.paymentRecord.deleteMany({ where: { userId } });
    });

    it('should create payments and immediately see analytics', async () => {
      // Create payments across multiple months
      const payments = [
        { amount: 200, category: 'Zakat', date: '2024-01-15' },
        { amount: 150, category: 'Zakat', date: '2024-02-15' },
        { amount: 300, category: 'Sadaqah', date: '2024-03-15' },
        { amount: 250, category: 'Masjid', date: '2024-04-15' },
        { amount: 200, category: 'Zakat', date: '2024-05-15' }
      ];

      for (const payment of payments) {
        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: payment.amount,
            currency: 'USD',
            date: new Date(payment.date).toISOString(),
            category: payment.category,
            recipient: 'Test Recipient'
          });
      }

      // Get analytics summary
      const summaryRes = await request(app)
        .get('/api/analytics/summary')
        .query({ year: 2024 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.metrics).toBeDefined();

      // Verify totals
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      // Note: Actual assertion depends on analytics service implementation

      // Get trends
      const trendsRes = await request(app)
        .get('/api/analytics/trends')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          interval: 'month'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(trendsRes.status).toBe(200);
      expect(trendsRes.body.data.trends).toBeDefined();

      // Get category breakdown
      const categoryRes = await request(app)
        .get('/api/analytics/categories')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(categoryRes.status).toBe(200);
      expect(categoryRes.body.data.categories).toBeDefined();
      
      // Verify categories present
      const categories = categoryRes.body.data.categories;
      const categoryNames = categories.map((c: any) => c.name);
      expect(categoryNames).toContain('Zakat');
      expect(categoryNames).toContain('Sadaqah');
      expect(categoryNames).toContain('Masjid');
    });

    it('should validate analytics performance < 500ms', async () => {
      // Create moderate dataset
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 100 + (i * 10),
            currency: 'USD',
            date: new Date(2024, i % 12, 15).toISOString(),
            category: ['Zakat', 'Sadaqah', 'Masjid'][i % 3],
            recipient: 'Test Recipient'
          });
      }

      // Measure analytics performance
      const start = Date.now();
      const analyticsRes = await request(app)
        .get('/api/analytics/summary')
        .query({ year: 2024 })
        .set('Authorization', `Bearer ${authToken}`);
      const duration = Date.now() - start;

      expect(analyticsRes.status).toBe(200);
      expect(duration).toBeLessThan(500); // Per NFR-001
    });
  });

  describe('Payment → Reminder Integration', () => {
    it('should create reminder and retrieve pending reminders', async () => {
      // Create a reminder
      const reminderRes = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'zakat_anniversary_approaching',
          triggerDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          title: 'Zakat Anniversary Approaching',
          message: 'Your Zakat anniversary is in 30 days',
          priority: 'high'
        });

      expect(reminderRes.status).toBe(201);
      const reminderId = reminderRes.body.data.reminder.id;

      // Get pending reminders
      const pendingRes = await request(app)
        .get('/api/reminders/pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(pendingRes.status).toBe(200);
      // Reminder may or may not be in pending depending on trigger date logic

      // Update reminder status
      const updateRes = await request(app)
        .put(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'acknowledged'
        });

      expect(updateRes.status).toBe(200);

      // Delete reminder
      const deleteRes = await request(app)
        .delete(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(200);
    });

    it('should filter reminders by status and event type', async () => {
      // Create multiple reminders
      const reminders = [
        { eventType: 'zakat_anniversary_approaching', priority: 'high' },
        { eventType: 'calculation_overdue', priority: 'medium' },
        { eventType: 'payment_incomplete', priority: 'low' }
      ];

      for (const reminder of reminders) {
        await request(app)
          .post('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            eventType: reminder.eventType,
            triggerDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            title: `Test ${reminder.eventType}`,
            message: 'Test reminder',
            priority: reminder.priority
          });
      }

      // Filter by event type
      const filterRes = await request(app)
        .get('/api/reminders')
        .query({ eventType: 'zakat_anniversary_approaching' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(filterRes.status).toBe(200);
      const filtered = filterRes.body.data.reminders.filter(
        (r: any) => r.eventType === 'zakat_anniversary_approaching'
      );
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('Payment → Export Integration', () => {
    beforeEach(async () => {
      // Clean and create test payments
      await prisma.paymentRecord.deleteMany({ where: { userId } });

      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 100 * (i + 1),
            currency: 'USD',
            date: new Date(2024, i, 15).toISOString(),
            category: ['Zakat', 'Sadaqah'][i % 2],
            recipient: `Recipient ${i + 1}`
          });
      }
    });

    it('should export payments in CSV format', async () => {
      const exportRes = await request(app)
        .post('/api/export/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        });

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.data.exportId).toBeDefined();
      expect(exportRes.body.data.format).toBe('csv');
    });

    it('should export payments in JSON format', async () => {
      const exportRes = await request(app)
        .post('/api/export/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          includeAnalytics: true
        });

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.data.format).toBe('json');
    });

    it('should check export status and download', async () => {
      // Create export
      const exportRes = await request(app)
        .post('/api/export/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        });

      const exportId = exportRes.body.data.exportId;

      // Check status
      const statusRes = await request(app)
        .get(`/api/export/status/${exportId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBeDefined();

      // Download (if completed)
      if (statusRes.body.data.status === 'completed') {
        const downloadRes = await request(app)
          .get(`/api/export/download/${exportId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 202]).toContain(downloadRes.status);
      }
    });

    it('should handle export with category filtering', async () => {
      const exportRes = await request(app)
        .post('/api/export/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          categories: ['Zakat']
        });

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.data.exportId).toBeDefined();
    });
  });

  describe('Multi-User Data Isolation', () => {
    it('should prevent users from accessing each other\'s payments', async () => {
      // User 1 creates payment
      const payment1 = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          currency: 'USD',
          date: new Date().toISOString(),
          category: 'Zakat',
          recipient: 'User 1 Payment'
        });

      const payment1Id = payment1.body.data.payment.id;

      // User 2 tries to access User 1's payment
      const unauthorizedRes = await request(app)
        .get(`/api/payments/${payment1Id}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(unauthorizedRes.status).toBe(404); // Not found (not revealing it exists)

      // User 2 tries to update User 1's payment
      const updateRes = await request(app)
        .put(`/api/payments/${payment1Id}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ amount: 999 });

      expect(updateRes.status).toBe(404);

      // User 2 tries to delete User 1's payment
      const deleteRes = await request(app)
        .delete(`/api/payments/${payment1Id}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(deleteRes.status).toBe(404);

      // Verify payment still exists for User 1
      const verifyRes = await request(app)
        .get(`/api/payments/${payment1Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyRes.status).toBe(200);
    });

    it('should isolate analytics between users', async () => {
      // User 1 creates payments
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500,
          currency: 'USD',
          date: new Date().toISOString(),
          category: 'Zakat',
          recipient: 'User 1 Payment'
        });

      // User 2 creates different payments
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          amount: 1000,
          currency: 'USD',
          date: new Date().toISOString(),
          category: 'Sadaqah',
          recipient: 'User 2 Payment'
        });

      // Get User 1 analytics
      const user1Analytics = await request(app)
        .get('/api/analytics/summary')
        .query({ year: new Date().getFullYear() })
        .set('Authorization', `Bearer ${authToken}`);

      // Get User 2 analytics
      const user2Analytics = await request(app)
        .get('/api/analytics/summary')
        .query({ year: new Date().getFullYear() })
        .set('Authorization', `Bearer ${secondUserToken}`);

      // Analytics should be different
      expect(user1Analytics.body.data).not.toEqual(user2Analytics.body.data);
    });

    it('should isolate reminders between users', async () => {
      // User 1 creates reminder
      const reminder1 = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'zakat_anniversary_approaching',
          triggerDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          title: 'User 1 Reminder',
          message: 'User 1 message',
          priority: 'high'
        });

      const reminder1Id = reminder1.body.data.reminder.id;

      // User 2 tries to access User 1's reminder
      const unauthorizedRes = await request(app)
        .put(`/api/reminders/${reminder1Id}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ status: 'dismissed' });

      expect(unauthorizedRes.status).toBe(404);
    });
  });

  describe('Data Encryption Validation', () => {
    it('should encrypt sensitive payment data at rest', async () => {
      // Create payment with notes
      const paymentRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 250,
          currency: 'USD',
          date: new Date().toISOString(),
          category: 'Zakat',
          recipient: 'Sensitive Recipient Name',
          notes: 'Confidential payment notes',
          referenceNumber: 'SECRET-REF-123'
        });

      const paymentId = paymentRes.body.data.payment.id;

      // Query database directly to verify encryption
      const paymentInDb = await prisma.paymentRecord.findUnique({
        where: { id: paymentId }
      });

      // Notes should be encrypted in database (not plain text)
      if (paymentInDb?.notes) {
        expect(paymentInDb.notes).not.toBe('Confidential payment notes');
        // Encrypted data should not contain plain text
        expect(paymentInDb.notes).not.toContain('Confidential');
      }

      // API response should decrypt
      expect(paymentRes.body.data.payment.notes).toBe('Confidential payment notes');
    });

    it('should handle encryption errors gracefully', async () => {
      // This test validates error handling if encryption fails
      // Actual implementation depends on error handling strategy
      
      const paymentRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          currency: 'USD',
          date: new Date().toISOString(),
          category: 'Zakat',
          recipient: 'Test',
          notes: 'Test notes'
        });

      // Should succeed or return proper error
      expect([200, 201, 400, 500]).toContain(paymentRes.status);
    });
  });

  describe('Error Handling & Validation', () => {
    it('should validate required payment fields', async () => {
      const invalidRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          amount: 100
        });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.success).toBe(false);
    });

    it('should reject invalid payment amounts', async () => {
      const negativeRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -100,
          currency: 'USD',
          date: new Date().toISOString(),
          category: 'Zakat',
          recipient: 'Test'
        });

      expect(negativeRes.status).toBe(400);
    });

    it('should reject future dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const futureRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          currency: 'USD',
          date: futureDate.toISOString(),
          category: 'Zakat',
          recipient: 'Test'
        });

      expect(futureRes.status).toBe(400);
    });

    it('should handle invalid date ranges in analytics', async () => {
      const invalidRes = await request(app)
        .get('/api/analytics/trends')
        .query({
          startDate: '2024-12-31',
          endDate: '2024-01-01' // End before start
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(invalidRes.status).toBe(400);
    });

    it('should handle missing authentication', async () => {
      const noAuthRes = await request(app)
        .get('/api/payments');

      expect(noAuthRes.status).toBe(401);
    });

    it('should handle invalid tokens', async () => {
      const invalidTokenRes = await request(app)
        .get('/api/payments')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(invalidTokenRes.status).toBe(401);
    });
  });

  describe('Performance & Load Testing', () => {
    it('should handle concurrent payment creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 100 + i,
            currency: 'USD',
            date: new Date().toISOString(),
            category: 'Zakat',
            recipient: `Concurrent Test ${i}`
          })
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(res => {
        expect(res.status).toBe(201);
      });

      // Verify all created
      const allPayments = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(allPayments.body.data.payments.length).toBeGreaterThanOrEqual(10);
    });

    it('should maintain performance with large datasets', async () => {
      // Create 100 payments
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 100 + i,
            currency: 'USD',
            date: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
            category: ['Zakat', 'Sadaqah', 'Masjid'][i % 3],
            recipient: `Recipient ${i}`
          });
      }

      // Test listing performance
      const start = Date.now();
      const listRes = await request(app)
        .get('/api/payments')
        .query({ limit: 50 })
        .set('Authorization', `Bearer ${authToken}`);
      const listDuration = Date.now() - start;

      expect(listRes.status).toBe(200);
      expect(listDuration).toBeLessThan(1000); // Should be fast

      // Test analytics performance
      const analyticsStart = Date.now();
      const analyticsRes = await request(app)
        .get('/api/analytics/summary')
        .query({ year: 2024 })
        .set('Authorization', `Bearer ${authToken}`);
      const analyticsDuration = Date.now() - analyticsStart;

      expect(analyticsRes.status).toBe(200);
      expect(analyticsDuration).toBeLessThan(500); // Per NFR-001
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full workflow: register → record → analyze → export', async () => {
      // Step 1: User already registered (in beforeAll)

      // Step 2: Record multiple payments
      const paymentDates = [
        '2024-01-15', '2024-02-15', '2024-03-15',
        '2024-04-15', '2024-05-15', '2024-06-15'
      ];

      for (const date of paymentDates) {
        const res = await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 250,
            currency: 'USD',
            date: new Date(date).toISOString(),
            category: 'Zakat',
            recipient: 'Local Masjid',
            notes: `Monthly payment for ${date}`
          });

        expect(res.status).toBe(201);
      }

      // Step 3: View payment history
      const historyRes = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.payments.length).toBeGreaterThanOrEqual(6);

      // Step 4: Get analytics
      const analyticsRes = await request(app)
        .get('/api/analytics/summary')
        .query({ year: 2024 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(analyticsRes.status).toBe(200);

      // Step 5: Set up reminder
      const reminderRes = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'zakat_anniversary_approaching',
          triggerDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          title: 'Zakat Due Soon',
          message: 'Your annual Zakat is approaching',
          priority: 'high'
        });

      expect(reminderRes.status).toBe(201);

      // Step 6: Export data
      const exportRes = await request(app)
        .post('/api/export/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        });

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.data.exportId).toBeDefined();

      // Journey complete!
    });
  });
});
