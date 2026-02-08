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

    accessToken = loginResponse.body.data.tokens.accessToken;
  });

  describe('POST /api/zakat/payments', () => {
    it('should create new payment record with valid data', async () => {
      const paymentData = {
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
      expect(response.body.data.payment).toMatchObject({
        amount: 250.50,
        paymentDate: '2024-03-15',
        recipient: 'Local Mosque',
        notes: 'Ramadan Zakat payment'
      });
      expect(response.body.data.payment).toHaveProperty('id');
      expect(response.body.data.payment).toHaveProperty('receiptUrl');

      paymentId = response.body.data.payment.id;
    });

    it('should create payment record with minimal data', async () => {
      const paymentData = {
        amount: 100.00,
        paymentDate: '2024-04-01'
      };

      const response = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toMatchObject({
        amount: 100.00,
        paymentDate: '2024-04-01'
      });
    });

    it('should return 400 for invalid amount', async () => {
      const paymentData = {
        amount: -50,
        paymentDate: '2024-03-15'
      };

      const response = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
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
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for unauthorized request', async () => {
      const paymentData = {
        amount: 100.00,
        paymentDate: '2024-03-15'
      };

      const response = await request(app)
        .post('/api/zakat/payments')
        .send(paymentData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/zakat/payments', () => {
    beforeEach(async () => {
      // Create test payments
      const payments = [
        {
          amount: 150.00,
          paymentDate: '2024-01-15',
          recipient: 'Mosque A'
        },
        {
          amount: 200.00,
          paymentDate: '2024-02-20',
          recipient: 'Mosque B'
        },
        {
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
      expect(Array.isArray(response.body.data.payments)).toBe(true);
      expect(response.body.data.payments.length).toBeGreaterThan(0);

      const payment = response.body.data.payments[0];
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
      expect(Array.isArray(response.body.data.payments)).toBe(true);

      // Should only return 2024 payments
      response.body.data.payments.forEach((payment: any) => {
        expect(payment.paymentDate.startsWith('2024')).toBe(true);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/zakat/payments?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.payments)).toBe(true);
      expect(response.body.data.payments.length).toBeLessThanOrEqual(2);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get('/api/zakat/payments')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/zakat/payments/:id', () => {
    beforeEach(async () => {
      // Create a test payment
      const paymentData = {
        amount: 100.00,
        paymentDate: '2024-01-01',
        recipient: 'Original Mosque'
      };

      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      paymentId = createResponse.body.data.payment.id;
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
      expect(response.body.data.payment).toMatchObject({
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
      expect(response.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return 401 for unauthorized request', async () => {
      const updateData = { amount: 150.00 };

      const response = await request(app)
        .put(`/api/zakat/payments/${paymentId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE /api/zakat/payments/:id', () => {
    beforeEach(async () => {
      // Create a test payment
      const paymentData = {
        amount: 75.00,
        paymentDate: '2024-01-01'
      };

      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      paymentId = createResponse.body.data.payment.id;
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
      expect(getResponse.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .delete('/api/zakat/payments/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .delete(`/api/zakat/payments/${paymentId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Receipt URL Generation', () => {
    beforeEach(async () => {
      // Create a test payment
      const paymentData = {
        amount: 300.00,
        paymentDate: '2024-03-01',
        recipient: 'Receipt Test Mosque'
      };

      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      paymentId = createResponse.body.data.payment.id;
    });

    it('should generate valid receipt URL', async () => {
      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 200.00,
          paymentDate: '2024-04-01'
        })
        .expect(201);

      expect(createResponse.body.data.payment).toHaveProperty('receiptUrl');
      expect(typeof createResponse.body.data.payment.receiptUrl).toBe('string');
      expect(createResponse.body.data.payment.receiptUrl).toMatch(/^\/api\/zakat\/receipts\//);
    });

    it('should allow access to receipt via generated URL', async () => {
      const createResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 150.00,
          paymentDate: '2024-05-01'
        })
        .expect(201);

      const receiptUrl = createResponse.body.data.payment.receiptUrl;

      // Access receipt without authentication (public access)
      const receiptResponse = await request(app)
        .get(receiptUrl)
        .expect(200);

      expect(receiptResponse.body).toHaveProperty('data');
      expect(receiptResponse.body.data.receipt.amount).toBe(150.00);
    });
  });
});