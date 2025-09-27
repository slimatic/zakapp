import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('GET /api/assets', () => {
  let accessToken: string;
  let userId: string;
  let createdAssets: any[] = [];

  beforeEach(async () => {
    // Register and login to get tokens
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'getassets@example.com',
        password: 'SecurePassword123!',
        username: 'getassetsuser'
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'getassets@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;

    // Create test assets
    const assetTypes = [
      {
        type: 'CASH',
        name: 'Checking Account',
        value: 2000.00,
        currency: 'USD',
        description: 'Primary checking account'
      },
      {
        type: 'GOLD',
        name: 'Gold Coins',
        value: 5000.00,
        currency: 'USD',
        weight: 100.0,
        unit: 'GRAM',
        description: 'Investment gold coins'
      },
      {
        type: 'CRYPTOCURRENCY',
        name: 'Ethereum Holdings',
        value: 3000.00,
        currency: 'USD',
        cryptoType: 'ETH',
        quantity: 2.0,
        description: 'Ethereum investment'
      }
    ];

    for (const assetData of assetTypes) {
      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(assetData);
      createdAssets.push(response.body.asset);
    }
  });

  it('should return all user assets with valid authentication', async () => {
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('assets');
    expect(response.body.assets).toBeInstanceOf(Array);
    expect(response.body.assets).toHaveLength(3);
    
    // Verify assets belong to authenticated user
    response.body.assets.forEach((asset: any) => {
      expect(asset).toHaveProperty('userId', userId);
      expect(asset).toHaveProperty('id');
      expect(asset).toHaveProperty('type');
      expect(asset).toHaveProperty('name');
      expect(asset).toHaveProperty('value');
      expect(asset).toHaveProperty('currency');
      expect(asset).toHaveProperty('createdAt');
      expect(asset).toHaveProperty('updatedAt');
    });
  });

  it('should return assets with decrypted sensitive data', async () => {
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const assets = response.body.assets;
    
    // Verify data is properly decrypted
    const cashAsset = assets.find((a: any) => a.type === 'CASH');
    expect(cashAsset).toBeDefined();
    expect(cashAsset.name).toBe('Checking Account');
    expect(typeof cashAsset.name).toBe('string');
    expect(cashAsset.name).not.toMatch(/^[a-f0-9]+$/); // Not encrypted hex
    
    if (cashAsset.description) {
      expect(typeof cashAsset.description).toBe('string');
      expect(cashAsset.description).not.toMatch(/^[a-f0-9]+$/);
    }
  });

  it('should return assets with proper type-specific fields', async () => {
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const assets = response.body.assets;
    
    // Gold asset should have weight and unit
    const goldAsset = assets.find((a: any) => a.type === 'GOLD');
    expect(goldAsset).toBeDefined();
    expect(goldAsset).toHaveProperty('weight', 100.0);
    expect(goldAsset).toHaveProperty('unit', 'GRAM');
    
    // Crypto asset should have cryptoType and quantity
    const cryptoAsset = assets.find((a: any) => a.type === 'CRYPTOCURRENCY');
    expect(cryptoAsset).toBeDefined();
    expect(cryptoAsset).toHaveProperty('cryptoType', 'ETH');
    expect(cryptoAsset).toHaveProperty('quantity', 2.0);
  });

  it('should return empty array for user with no assets', async () => {
    // Create new user with no assets
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'noassets@example.com',
        password: 'SecurePassword123!',
        username: 'noassetsuser'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noassets@example.com',
        password: 'SecurePassword123!'
      });

    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('assets');
    expect(response.body.assets).toBeInstanceOf(Array);
    expect(response.body.assets).toHaveLength(0);
  });

  it('should return 401 for missing authentication', async () => {
    const response = await request(app)
      .get('/api/assets')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'NO_TOKEN');
  });

  it('should return 401 for invalid access token', async () => {
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_TOKEN');
  });

  it('should support filtering by asset type', async () => {
    const response = await request(app)
      .get('/api/assets?type=CASH')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.assets).toBeInstanceOf(Array);
    expect(response.body.assets).toHaveLength(1);
    expect(response.body.assets[0]).toHaveProperty('type', 'CASH');
  });

  it('should support filtering by currency', async () => {
    const response = await request(app)
      .get('/api/assets?currency=USD')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.assets).toBeInstanceOf(Array);
    response.body.assets.forEach((asset: any) => {
      expect(asset).toHaveProperty('currency', 'USD');
    });
  });

  it('should support pagination', async () => {
    const response = await request(app)
      .get('/api/assets?page=1&limit=2')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('assets');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page', 1);
    expect(response.body.pagination).toHaveProperty('limit', 2);
    expect(response.body.pagination).toHaveProperty('total', 3);
    expect(response.body.pagination).toHaveProperty('pages', 2);
    expect(response.body.assets).toHaveLength(2);
  });

  it('should support sorting by value', async () => {
    const response = await request(app)
      .get('/api/assets?sortBy=value&sortOrder=desc')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    const assets = response.body.assets;
    expect(assets[0].value).toBeGreaterThanOrEqual(assets[1].value);
    expect(assets[1].value).toBeGreaterThanOrEqual(assets[2].value);
  });

  it('should support sorting by creation date', async () => {
    const response = await request(app)
      .get('/api/assets?sortBy=createdAt&sortOrder=asc')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    const assets = response.body.assets;
    expect(new Date(assets[0].createdAt).getTime()).toBeLessThanOrEqual(
      new Date(assets[1].createdAt).getTime()
    );
  });

  it('should include total portfolio value', async () => {
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('summary');
    expect(response.body.summary).toHaveProperty('totalValue', 10000.00); // 2000 + 5000 + 3000
    expect(response.body.summary).toHaveProperty('zakatableValue');
    expect(response.body.summary).toHaveProperty('assetCount', 3);
    expect(response.body.summary).toHaveProperty('assetTypes');
  });

  it('should not expose assets from other users', async () => {
    // Create another user with assets
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'other@example.com',
        password: 'SecurePassword123!',
        username: 'otheruser'
      });

    const otherLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'other@example.com',
        password: 'SecurePassword123!'
      });

    await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${otherLoginResponse.body.accessToken}`)
      .send({
        type: 'CASH',
        name: 'Other User Asset',
        value: 1000.00,
        currency: 'USD'
      });

    // Original user should only see their own assets
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.assets).toHaveLength(3);
    response.body.assets.forEach((asset: any) => {
      expect(asset.userId).toBe(userId);
      expect(asset.name).not.toBe('Other User Asset');
    });
  });
});