import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('GET /api/assets/export', () => {
  let accessToken: string;

  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'exportassets@example.com',
        password: 'SecurePassword123!',
        username: 'exportuser'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'exportassets@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;

    // Create test assets
    const assets = [
      { type: 'CASH', name: 'Savings', value: 5000.00, currency: 'USD' },
      { type: 'GOLD', name: 'Gold Jewelry', value: 3000.00, currency: 'USD', weight: 50.0, unit: 'GRAM' }
    ];

    for (const asset of assets) {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(asset);
    }
  });

  it('should export assets in CSV format', async () => {
    const response = await request(app)
      .get('/api/assets/export?format=CSV')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('format', 'CSV');
    expect(response.body).toHaveProperty('data');
    expect(typeof response.body.data).toBe('string');
    expect(response.body.data).toContain('type,name,value,currency');
    expect(response.body.data).toContain('CASH,Savings,5000,USD');
  });

  it('should export assets in JSON format', async () => {
    const response = await request(app)
      .get('/api/assets/export?format=JSON')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('format', 'JSON');
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });

  it('should export assets in PDF format', async () => {
    const response = await request(app)
      .get('/api/assets/export?format=PDF')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('format', 'PDF');
    expect(response.body).toHaveProperty('downloadUrl');
    expect(response.body).toHaveProperty('expiresAt');
  });

  it('should filter exported assets by type', async () => {
    const response = await request(app)
      .get('/api/assets/export?format=JSON&type=CASH')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toHaveProperty('type', 'CASH');
  });
});