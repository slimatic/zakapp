import request from 'supertest';
import app from '../../../src/app';

describe('GET /api/zakat/payments', () => {
  let accessToken: string;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'payments@example.com', password: 'SecurePassword123!', username: 'paymentsuser'
    });
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'payments@example.com', password: 'SecurePassword123!'
    });
    accessToken = loginResponse.body.accessToken;
  });

  it('should return user payment history', async () => {
    const response = await request(app)
      .get('/api/zakat/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('payments');
  });
});