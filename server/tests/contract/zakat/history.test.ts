import request from 'supertest';
import app from '../../../src/app';

describe('GET /api/zakat/history', () => {
  let accessToken: string;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'zakathistory@example.com',
      password: 'SecurePassword123!',
      username: 'zakathistoryuser'
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'zakathistory@example.com',
      password: 'SecurePassword123!'
    });
    accessToken = loginResponse.body.accessToken;
  });

  it('should return user Zakat calculation history', async () => {
    const response = await request(app)
      .get('/api/zakat/history')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('calculations');
    expect(response.body.calculations).toBeInstanceOf(Array);
  });
});