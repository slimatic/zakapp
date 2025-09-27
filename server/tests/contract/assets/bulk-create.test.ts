import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/assets/bulk', () => {
  let accessToken: string;

  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'bulkassets@example.com',
        password: 'SecurePassword123!',
        username: 'bulkassetsuser'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bulkassets@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;
  });

  it('should create multiple assets successfully', async () => {
    const assets = [
      {
        type: 'CASH',
        name: 'Checking Account',
        value: 2000.00,
        currency: 'USD'
      },
      {
        type: 'GOLD',
        name: 'Gold Jewelry',
        value: 5000.00,
        currency: 'USD',
        weight: 100.0,
        unit: 'GRAM'
      }
    ];

    const response = await request(app)
      .post('/api/assets/bulk')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ assets })
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Assets created successfully');
    expect(response.body.assets).toHaveLength(2);
    expect(response.body).toHaveProperty('summary');
    expect(response.body.summary).toHaveProperty('created', 2);
    expect(response.body.summary).toHaveProperty('failed', 0);
  });

  it('should handle partial failures gracefully', async () => {
    const assets = [
      {
        type: 'CASH',
        name: 'Valid Asset',
        value: 1000.00,
        currency: 'USD'
      },
      {
        type: 'INVALID_TYPE', // This will fail
        name: 'Invalid Asset',
        value: 1000.00,
        currency: 'USD'
      }
    ];

    const response = await request(app)
      .post('/api/assets/bulk')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ assets })
      .expect(207); // Multi-status

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.summary).toHaveProperty('created', 1);
    expect(response.body.summary).toHaveProperty('failed', 1);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toHaveLength(1);
  });

  it('should return 400 for empty assets array', async () => {
    const response = await request(app)
      .post('/api/assets/bulk')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ assets: [] })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });
});