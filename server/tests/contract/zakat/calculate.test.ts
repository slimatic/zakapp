import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app
import { clearAllAssets } from '../../../src/controllers/AssetController';

describe('POST /api/zakat/calculate', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    // Clear all assets from previous tests
    clearAllAssets();
    
    const timestamp = Date.now();
    await request(app)
      .post('/api/auth/register')
      .send({
        email: `zakat${timestamp}@example.com`,
        password: 'SecurePassword123!',
        username: `zakatuser${timestamp}`
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: `zakat${timestamp}@example.com`,
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;

    // Create test assets for calculation
    const assets = [
      { type: 'CASH', name: 'Savings', value: 10000.00, currency: 'USD' },
      { type: 'GOLD', name: 'Gold Jewelry', value: 5000.00, currency: 'USD', weight: 100.0, unit: 'GRAM' },
      { type: 'CRYPTOCURRENCY', name: 'Bitcoin', value: 15000.00, currency: 'USD', cryptoType: 'BTC', quantity: 0.5 }
    ];

    for (const asset of assets) {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(asset);
    }
  });

  it('should calculate Zakat with standard methodology', async () => {
    const calculationRequest = {
      methodologyId: 'standard', // Will use seeded standard methodology
      year: 2024,
      includeAssetTypes: ['CASH', 'GOLD', 'CRYPTOCURRENCY'],
      excludeAssetIds: []
    };

    const response = await request(app)
      .post('/api/zakat/calculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(calculationRequest)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('calculation');
    expect(response.body.calculation).toHaveProperty('id');
    expect(response.body.calculation).toHaveProperty('userId', userId);
    expect(response.body.calculation).toHaveProperty('methodology');
    expect(response.body.calculation).toHaveProperty('totalAssetValue', 30000.00); // 10k + 5k + 15k
    expect(response.body.calculation).toHaveProperty('zakatableAmount');
    expect(response.body.calculation).toHaveProperty('zakatOwed');
    expect(response.body.calculation).toHaveProperty('nisabThreshold');
    expect(response.body.calculation).toHaveProperty('isAboveNisab', true);
    expect(response.body.calculation).toHaveProperty('zakatRate', 2.5);
  });

  it('should calculate Zakat with Hanafi methodology', async () => {
    const calculationRequest = {
      methodologyId: 'hanafi',
      year: 2024,
      includeAssetTypes: ['CASH', 'GOLD']
    };

    const response = await request(app)
      .post('/api/zakat/calculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(calculationRequest)
      .expect(200);

    expect(response.body.calculation.methodology).toHaveProperty('name', 'Hanafi');
    expect(response.body.calculation).toHaveProperty('nisabMethod', 'SILVER');
  });

  it('should return detailed asset breakdown', async () => {
    const response = await request(app)
      .post('/api/zakat/calculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ methodologyId: 'standard', year: 2024 })
      .expect(200);

    expect(response.body.calculation).toHaveProperty('assetBreakdown');
    expect(response.body.calculation.assetBreakdown).toBeInstanceOf(Array);
    expect(response.body.calculation.assetBreakdown).toHaveLength(3);

    const cashBreakdown = response.body.calculation.assetBreakdown.find((a: any) => a.type === 'CASH');
    expect(cashBreakdown).toHaveProperty('totalValue', 10000.00);
    expect(cashBreakdown).toHaveProperty('zakatableAmount', 10000.00);
    expect(cashBreakdown).toHaveProperty('zakatOwed', 250.00); // 2.5% of 10000
  });

  it('should handle assets below nisab threshold', async () => {
    // Create user with small assets
    const smallTimestamp = Date.now() + 999; // Make sure it's unique
    await request(app)
      .post('/api/auth/register')
      .send({
        email: `smallzakat${smallTimestamp}@example.com`,
        password: 'SecurePassword123!',
        username: `smallzakatuser${smallTimestamp}`
      });

    const smallUserLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: `smallzakat${smallTimestamp}@example.com`,
        password: 'SecurePassword123!'
      });

    // Create small asset below nisab
    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${smallUserLogin.body.accessToken}`)
      .send({
        type: 'CASH',
        name: 'Small Savings',
        value: 300.00, // Below nisab threshold (357 silver nisab)
        currency: 'USD'
      });

    const response = await request(app)
      .post('/api/zakat/calculate')
      .set('Authorization', `Bearer ${smallUserLogin.body.accessToken}`)
      .send({ methodologyId: 'standard', year: 2024 })
      .expect(200);

    expect(response.body.calculation).toHaveProperty('isAboveNisab', false);
    expect(response.body.calculation).toHaveProperty('zakatOwed', 0);
    expect(response.body.calculation).toHaveProperty('reason', 'Below nisab threshold');
  });

  it('should exclude specified assets from calculation', async () => {
    // Get asset ID to exclude
    const assetsResponse = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`);

    const goldAsset = assetsResponse.body.assets.find((a: any) => a.type === 'GOLD');

    const response = await request(app)
      .post('/api/zakat/calculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        methodologyId: 'standard',
        year: 2024,
        excludeAssetIds: [goldAsset.id]
      })
      .expect(200);

    expect(response.body.calculation.totalAssetValue).toBe(25000.00); // Excluding 5k gold
    expect(response.body.calculation.assetBreakdown).toHaveLength(2);
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/zakat/calculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({}) // Missing required fields
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });
});