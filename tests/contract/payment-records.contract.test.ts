import request from 'supertest';
import app from '../../server/src/app';

describe('Payment Records Contract Tests', () => {
  let accessToken: string;
  let userId: string;
  let paymentId: string;
  let calculationId: string;
  let snapshotId: string;

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

    // Create a calculation
    const calculationData = {
      methodology: 'standard',
      calendarType: 'hijri',
      totalWealth: 10000,
      nisabThreshold: 5000,
      zakatDue: 250,
      assetBreakdown: { cash: 10000 },
      zakatYearStart: new Date().toISOString(),
      zakatYearEnd: new Date().toISOString()
    };

    const calculationResponse = await request(app)
      .post('/api/calculations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(calculationData)
      .expect(201);

    calculationId = calculationResponse.body.calculation.id;

    // Create a dummy asset (Required for snapshot creation)
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: 'cash',
        name: 'Test Cash Asset',
        value: 10000,
        currency: 'USD'
      })
      .expect(201);

    // Create a snapshot (Required for payments)
    const snapshotData = {
      methodology: 'STANDARD'
    };

    const snapshotResponse = await request(app)
      .post('/api/snapshots')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(snapshotData)
      .expect(201);
      
    snapshotId = snapshotResponse.body.data?.snapshot?.id || snapshotResponse.body.snapshot?.id;
  });

  describe('POST /api/payments', () => {
    it('should create new payment record with valid data', async () => {
      const paymentData = {
        calculationId: calculationId,
        snapshotId: snapshotId,
        amount: '250.50',
        paymentDate: '2024-03-15T00:00:00Z',
        recipientName: 'Local Mosque',
        recipientType: 'mosque',
        recipientCategory: 'general',
        paymentMethod: 'cash',
        notes: 'Ramadan Zakat payment'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201)
        .catch(err => {
          if (err.response) {
            console.error('Test Failed. Response Body:', JSON.stringify(err.response.body, null, 2));
          }
          throw err;
        });

      expect(response.body.success).toBe(true);
      const payment = response.body.data.payment;
      
      expect(payment).toMatchObject({
        recipientName: 'Local Mosque',
        recipientType: 'mosque',
        recipientCategory: 'general',
        paymentMethod: 'cash',
        notes: 'Ramadan Zakat payment'
      });
      // Amount is returned as encrypted/decrypted string usually
      // The decryptedAmount field is what we check if available, or just existence
      expect(payment.decryptedAmount || payment.amount).toBe('250.50');
      expect(payment).toHaveProperty('id');
      expect(payment).toHaveProperty('userId', userId);

      paymentId = payment.id;
    });

    it('should create payment record with minimal data', async () => {
      const paymentData = {
        calculationId: calculationId,
        snapshotId: snapshotId,
        amount: '100.00',
        paymentDate: '2024-04-01T00:00:00Z',
        recipientName: 'Unknown',
        recipientType: 'other',
        recipientCategory: 'general',
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      const payment = response.body.data.payment;
      
      expect(payment.decryptedAmount || payment.amount).toBe('100.00');
      expect(payment.paymentDate).toContain('2024-04-01');
    });

    it('should return 400 for invalid amount', async () => {
      const paymentData = {
        calculationId: calculationId,
        snapshotId: snapshotId,
        amount: '-50',
        paymentDate: '2024-03-15T00:00:00Z',
        recipientName: 'Test',
        recipientType: 'other',
        recipientCategory: 'general',
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const paymentData = {
        amount: '100.00'
        // missing required fields
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for unauthorized request', async () => {
      const paymentData = {
        calculationId: calculationId,
        snapshotId: snapshotId,
        amount: '100.00',
        paymentDate: '2024-03-15T00:00:00Z',
        recipientName: 'Test',
        recipientType: 'other',
        recipientCategory: 'general',
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/payments')
        .send(paymentData)
        .expect(401);
    });
  });

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      // Create test payments
      const payments = [
        {
          calculationId: calculationId,
          snapshotId: snapshotId,
          amount: '150.00',
          paymentDate: '2024-01-15T00:00:00Z',
          recipientName: 'Mosque A',
          recipientType: 'mosque',
          recipientCategory: 'general',
          paymentMethod: 'cash'
        },
        {
          calculationId: calculationId,
          snapshotId: snapshotId,
          amount: '200.00',
          paymentDate: '2024-02-20T00:00:00Z',
          recipientName: 'Mosque B',
          recipientType: 'mosque',
          recipientCategory: 'general',
          paymentMethod: 'cash'
        },
        {
          calculationId: calculationId,
          snapshotId: snapshotId,
          amount: '175.00',
          paymentDate: '2023-12-01T00:00:00Z',
          recipientName: 'Mosque C',
          recipientType: 'mosque',
          recipientCategory: 'general',
          paymentMethod: 'cash'
        }
      ];

      for (const payment of payments) {
        await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payment);
      }
    });

    it('should return list of payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.payments)).toBe(true);
      expect(response.body.data.payments.length).toBeGreaterThan(0);

      const payment = response.body.data.payments[0];
      expect(payment).toHaveProperty('id');
      expect(payment).toHaveProperty('paymentDate');
    });

    it('should filter payments by year (date range)', async () => {
      const response = await request(app)
        .get('/api/payments?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.payments)).toBe(true);

      response.body.data.payments.forEach((payment: any) => {
        expect(payment.paymentDate.startsWith('2024')).toBe(true);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/payments?offset=0&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.payments)).toBe(true);
      expect(response.body.data.payments.length).toBeLessThanOrEqual(2);
    });

    it('should return 401 for unauthorized request', async () => {
      await request(app)
        .get('/api/payments')
        .expect(401);
    });
  });

  describe('PUT /api/payments/:id', () => {
    beforeEach(async () => {
      // Create a test payment
      const paymentData = {
        calculationId: calculationId,
        snapshotId: snapshotId,
        amount: '100.00',
        paymentDate: '2024-01-01T00:00:00Z',
        recipientName: 'Original Mosque',
        recipientType: 'mosque',
        recipientCategory: 'general',
        paymentMethod: 'cash'
      };

      const createResponse = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      paymentId = createResponse.body.data.payment.id;
    });

    it('should update payment record', async () => {
      const updateData = {
        amount: '125.00',
        recipientName: 'Updated Mosque',
        notes: 'Updated payment notes'
      };

      const response = await request(app)
        .put(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      const payment = response.body.data.payment;
      
      expect(payment).toMatchObject({
        id: paymentId,
        recipientName: 'Updated Mosque',
        // notes might be encrypted/decrypted, check decryptedNotes if available
      });
      expect(payment.decryptedNotes || payment.notes).toBe('Updated payment notes');
      expect(payment.decryptedAmount || payment.amount).toBe('125.00');
    });

    it('should return 404/400 for non-existent payment', async () => {
      const updateData = { amount: '150.00' };
      const fakeId = '00000000-0000-0000-0000-000000000000'; 

      await request(app)
        .put(`/api/payments/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        // Accepting 400 or 404 as implementation detail varies
        .then(res => {
            if (res.status !== 400 && res.status !== 404) {
                throw new Error(`Expected 400 or 404, got ${res.status}`);
            }
        });
    });

    it('should return 401 for unauthorized request', async () => {
      const updateData = { amount: '150.00' };

      await request(app)
        .put(`/api/payments/${paymentId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/payments/:id', () => {
    beforeEach(async () => {
      // Create a test payment
      const paymentData = {
        calculationId: calculationId,
        snapshotId: snapshotId,
        amount: '75.00',
        paymentDate: '2024-01-01T00:00:00Z',
        recipientName: 'To Delete',
        recipientType: 'other',
        recipientCategory: 'general',
        paymentMethod: 'cash'
      };

      const createResponse = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData)
        .expect(201);

      paymentId = createResponse.body.data.payment.id;
    });

    it('should delete payment record', async () => {
      const response = await request(app)
        .delete(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify payment is no longer accessible
      await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404/400 for non-existent payment', async () => {
       const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/payments/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404); // Route likely returns 404 explicitly
        
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthorized request', async () => {
      await request(app)
        .delete(`/api/payments/${paymentId}`)
        .expect(401);
    });
  });
});
