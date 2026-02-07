import request from 'supertest';
import app from '../../server/src/app';

describe('Payment Records Contract Tests', () => {
  let accessToken: string;
  let userId: string;
  let paymentId: string;

  beforeEach(async () => {
    // Register and login user
    const uniqueId = Date.now();
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `payments-test-${uniqueId}@example.com`,
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
      .expect(201);

    userId = registerResponse.body.data.user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: `payments-test-${uniqueId}@example.com`,
        password: 'SecurePassword123!'
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  describe('POST /api/zakat/payments', () => {
    it('should create new payment record with valid data', async () => {
      const paymentData = {
        calculationId: 'calc-123',
        amount: 250.50,
        paymentDate: '2024-03-15',
        recipient: 'Local Mosque',
        notes: 'Ramadan Zakat payment'
      };

      const response = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toMatchObject({
        amount: 250.50,
        paymentDate: '2024-03-15',
        recipient: 'Local Mosque',
        notes: 'Ramadan Zakat payment'
      });
      expect(response.body.payment).toHaveProperty('id');
      expect(response.body.payment).toHaveProperty('receiptUrl');

      paymentId = response.body.payment.id;
    });

    it('should create payment record with minimal data', async () => {
      const paymentData = {
        calculationId: 'calc-456',
        amount: 100.00,
        paymentDate: '2024-04-01'
      };

      const response = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toMatchObject({
        amount: 100.00,
        paymentDate: '2024-04-01'
      });
    });

    it('should return 400 for invalid amount', async () => {
      const paymentData = {
        calculationId: 'calc-123',
        amount: -50,
        paymentDate: '2024-03-15'
      };

      const response = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      const paymentData = {
        amount: 100.00
        // missing calculationId and paymentDate
      };

      const response = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for unauthorized request', async () => {
      const paymentData = {
        calculationId: 'calc-123',
        amount: 100.00,
        paymentDate: '2024-03-15'
      };

      const response = await request(app)
        .post('/api/zakat/payments')
        .send(paymentData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/zakat/payments', () => {
    beforeEach(async () => {
      // Create test payments
      const payments = [
        {
          calculationId: 'calc-2024-01',
          amount: 150.00,
          paymentDate: '2024-01-15',
          recipient: 'Mosque A'
        },
        {
          calculationId: 'calc-2024-02',
          amount: 200.00,
          paymentDate: '2024-02-20',
          recipient: 'Mosque B'
        },
        {
          calculationId: 'calc-2023-01',
          amount: 175.00,
          paymentDate: '2023-12-01',
          recipient: 'Mosque C'
        }
      ];

      for (const payment of payments) {
        await request(app)
          .post('/api/zakat/payments')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payment);
      }
    });

    it('should return paginated list of payments', async () => {
      const response = await request(app)
        .get('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.payments.length).toBeGreaterThan(0);

      const payment = response.body.payments[0];
      expect(payment).toHaveProperty('id');
      expect(payment).toHaveProperty('amount');
      expect(payment).toHaveProperty('paymentDate');
      expect(payment).toHaveProperty('receiptUrl');
    });

    it('should filter payments by year', async () => {
      const response = await request(app)
        .get('/api/zakat/payments?year=2024')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);

      // Should only return 2024 payments
      response.body.payments.forEach((payment: any) => {
        expect(payment.paymentDate.startsWith('2024')).toBe(true);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/zakat/payments?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.payments.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get('/api/zakat/payments')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/zakat/payments/:id', () => {
    beforeEach(async () => {
      // Create a test payment
      const paymentData = {
        calculationId: 'calc-update-test',
        amount: 100.00,
        paymentDate: '2024-01-01',
        recipient: 'Original Mosque'
      };

      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      paymentId = createResponse.body.payment.id;
    });

    it('should update payment record', async () => {
      const updateData = {
        amount: 125.00,
        recipient: 'Updated Mosque',
        notes: 'Updated payment notes'
      };

      const response = await request(app)
        .put(`/api/zakat/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toMatchObject({
        id: paymentId,
        amount: 125.00,
        recipient: 'Updated Mosque',
        notes: 'Updated payment notes'
      });
    });

    it('should return 404 for non-existent payment', async () => {
      const updateData = { amount: 150.00 };

      const response = await request(app)
        .put('/api/zakat/payments/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return 401 for unauthorized request', async () => {
      const updateData = { amount: 150.00 };

      const response = await request(app)
        .put(`/api/zakat/payments/${paymentId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE /api/zakat/payments/:id', () => {
    beforeEach(async () => {
      // Create a test payment
      const paymentData = {
        calculationId: 'calc-delete-test',
        amount: 75.00,
        paymentDate: '2024-01-01'
      };

      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      paymentId = createResponse.body.payment.id;
    });

    it('should soft delete payment record', async () => {
      const response = await request(app)
        .delete(`/api/zakat/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify payment is no longer accessible
      const getResponse = await request(app)
        .get(`/api/zakat/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
      expect(getResponse.body.error).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .delete('/api/zakat/payments/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .delete(`/api/zakat/payments/${paymentId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Receipt URL Generation', () => {
    beforeEach(async () => {
      // Create a test payment
      const paymentData = {
        calculationId: 'calc-receipt-test',
        amount: 300.00,
        paymentDate: '2024-03-01',
        recipient: 'Receipt Test Mosque'
      };

      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      paymentId = createResponse.body.payment.id;
    });

    it('should generate valid receipt URL', async () => {
      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          calculationId: 'calc-receipt-test-2',
          amount: 200.00,
          paymentDate: '2024-04-01'
        })
        .expect(201);

      expect(createResponse.body.payment).toHaveProperty('receiptUrl');
      expect(typeof createResponse.body.payment.receiptUrl).toBe('string');
      expect(createResponse.body.payment.receiptUrl).toMatch(/^\/api\/receipts\//);
    });

    it('should allow access to receipt via generated URL', async () => {
      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          calculationId: 'calc-receipt-access-test',
          amount: 150.00,
          paymentDate: '2024-05-01'
        })
        .expect(201);

      const receiptUrl = createResponse.body.payment.receiptUrl;

      // Access receipt without authentication (public access)
      const receiptResponse = await request(app)
        .get(receiptUrl)
        .expect(200);

      expect(receiptResponse.body).toHaveProperty('payment');
      expect(receiptResponse.body.payment.amount).toBe(150.00);
    });
  });
});