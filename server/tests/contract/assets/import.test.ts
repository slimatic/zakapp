import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/assets/import', () => {
  let accessToken: string;

  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'import@example.com',
        password: 'SecurePassword123!',
        username: 'importuser'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'import@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;
  });

  it('should import assets from CSV format', async () => {
    const csvData = `type,name,value,currency,description
CASH,Savings Account,5000.00,USD,Primary savings
GOLD,Gold Coins,3000.00,USD,Investment gold
CRYPTOCURRENCY,Bitcoin,10000.00,USD,Bitcoin holdings`;

    const response = await request(app)
      .post('/api/assets/import')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ format: 'CSV', data: csvData })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('imported', 3);
    expect(response.body).toHaveProperty('failed', 0);
  });

  it('should import assets from JSON format', async () => {
    const jsonData = [
      {
        type: 'CASH',
        name: 'Checking Account',
        value: 2000.00,
        currency: 'USD'
      },
      {
        type: 'BUSINESS',
        name: 'Store Inventory',
        value: 15000.00,
        currency: 'USD',
        businessType: 'RETAIL'
      }
    ];

    const response = await request(app)
      .post('/api/assets/import')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ format: 'JSON', data: jsonData })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('imported', 2);
  });

  it('should handle validation errors during import', async () => {
    const invalidData = [
      {
        type: 'CASH',
        name: 'Valid Asset',
        value: 1000.00,
        currency: 'USD'
      },
      {
        type: 'INVALID_TYPE', // Invalid
        name: 'Invalid Asset',
        value: -500.00, // Invalid negative value
        currency: 'INVALID' // Invalid currency
      }
    ];

    const response = await request(app)
      .post('/api/assets/import')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ format: 'JSON', data: invalidData })
      .expect(207);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('imported', 1);
    expect(response.body).toHaveProperty('failed', 1);
    expect(response.body).toHaveProperty('errors');
  });
});