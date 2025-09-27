import request from 'supertest';
import app from '../../../src/app';

describe('POST /api/zakat/payments', () => {
  let accessToken: string;
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({email: 'recordpayment@example.com', password: 'SecurePassword123!', username: 'recorduser'});
    const loginResponse = await request(app).post('/api/auth/login').send({email: 'recordpayment@example.com', password: 'SecurePassword123!'});
    accessToken = loginResponse.body.accessToken;
  });
  it('should record Zakat payment', async () => {
    const response = await request(app).post('/api/zakat/payments').set('Authorization', `Bearer ${accessToken}`)
      .send({amount: 250.00, currency: 'USD', recipient: 'Local Mosque', date: '2024-01-15'}).expect(201);
    expect(response.body).toHaveProperty('success', true);
  });
});