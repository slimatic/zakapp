import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/assets', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    // Register and login to get tokens
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'assets@example.com',
        password: 'SecurePassword123!',
        username: 'assetsuser'
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'assets@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;
  });

  it('should create cash asset with valid data', async () => {
    const assetData = {
      type: 'CASH',
      name: 'Savings Account',
      value: 5000.00,
      currency: 'USD',
      description: 'Primary savings account'
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetData)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Asset created successfully');
    expect(response.body.asset).toHaveProperty('id');
    expect(response.body.asset).toHaveProperty('type', 'CASH');
    expect(response.body.asset).toHaveProperty('name', assetData.name);
    expect(response.body.asset).toHaveProperty('value', assetData.value);
    expect(response.body.asset).toHaveProperty('currency', assetData.currency);
    expect(response.body.asset).toHaveProperty('userId', userId);
    expect(response.body.asset).toHaveProperty('createdAt');
    expect(response.body.asset).toHaveProperty('updatedAt');
    expect(response.body.asset).toHaveProperty('isZakatable', true); // Cash is always zakatable
  });

  it('should create gold asset with valid data', async () => {
    const assetData = {
      type: 'GOLD',
      name: 'Gold Jewelry',
      value: 3000.00,
      currency: 'USD',
      weight: 50.0,
      unit: 'GRAM',
      description: 'Wedding gold jewelry'
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetData)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.asset).toHaveProperty('type', 'GOLD');
    expect(response.body.asset).toHaveProperty('weight', assetData.weight);
    expect(response.body.asset).toHaveProperty('unit', assetData.unit);
    expect(response.body.asset).toHaveProperty('isZakatable', true);
  });

  it('should create cryptocurrency asset with valid data', async () => {
    const assetData = {
      type: 'CRYPTOCURRENCY',
      name: 'Bitcoin Holdings',
      value: 10000.00,
      currency: 'USD',
      cryptoType: 'BTC',
      quantity: 0.25,
      description: 'Bitcoin investment'
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetData)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.asset).toHaveProperty('type', 'CRYPTOCURRENCY');
    expect(response.body.asset).toHaveProperty('cryptoType', 'BTC');
    expect(response.body.asset).toHaveProperty('quantity', assetData.quantity);
    expect(response.body.asset).toHaveProperty('isZakatable', true);
  });

  it('should create business asset with valid data', async () => {
    const assetData = {
      type: 'BUSINESS',
      name: 'Retail Store Inventory',
      value: 25000.00,
      currency: 'USD',
      businessType: 'RETAIL',
      description: 'Store inventory for Zakat calculation'
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetData)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.asset).toHaveProperty('type', 'BUSINESS');
    expect(response.body.asset).toHaveProperty('businessType', 'RETAIL');
    expect(response.body.asset).toHaveProperty('isZakatable', true);
  });

  it('should encrypt sensitive asset data', async () => {
    const assetData = {
      type: 'CASH',
      name: 'Private Account',
      value: 15000.00,
      currency: 'USD',
      description: 'Confidential savings'
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetData)
      .expect(201);

    expect(response.body.asset).toHaveProperty('id');
    expect(response.body.asset).toHaveProperty('name', assetData.name);
    expect(response.body.asset).toHaveProperty('value', assetData.value);
    
    // Verify no raw encrypted data is exposed
    expect(response.body.asset).not.toHaveProperty('encryptedName');
    expect(response.body.asset).not.toHaveProperty('encryptedDescription');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Incomplete Asset' })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body).toHaveProperty('details');
    expect(response.body.details).toBeInstanceOf(Array);
  });

  it('should return 400 for invalid asset type', async () => {
    const assetData = {
      type: 'INVALID_TYPE',
      name: 'Invalid Asset',
      value: 1000.00,
      currency: 'USD'
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetData)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should return 400 for negative asset value', async () => {
    const assetData = {
      type: 'CASH',
      name: 'Negative Asset',
      value: -1000.00,
      currency: 'USD'
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetData)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should return 400 for invalid currency', async () => {
    const assetData = {
      type: 'CASH',
      name: 'Invalid Currency Asset',
      value: 1000.00,
      currency: 'INVALID'
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetData)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should return 401 for missing authentication', async () => {
    const assetData = {
      type: 'CASH',
      name: 'Unauthenticated Asset',
      value: 1000.00,
      currency: 'USD'
    };

    const response = await request(app)
      .post('/api/assets')
      .send(assetData)
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'NO_TOKEN');
  });

  it('should validate gold asset specific fields', async () => {
    const invalidGoldAsset = {
      type: 'GOLD',
      name: 'Gold without weight',
      value: 1000.00,
      currency: 'USD'
      // Missing weight and unit
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(invalidGoldAsset)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should validate cryptocurrency asset specific fields', async () => {
    const invalidCryptoAsset = {
      type: 'CRYPTOCURRENCY',
      name: 'Crypto without type',
      value: 1000.00,
      currency: 'USD'
      // Missing cryptoType and quantity
    };

    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(invalidCryptoAsset)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });
});