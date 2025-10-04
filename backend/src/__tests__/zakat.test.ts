import request from 'supertest';
import app from '../index';

describe('Zakat API Endpoints', () => {
  let authToken: string;
  let userId: string;
  // Use timestamp to ensure unique user for each test run
  const timestamp = Date.now();
  const testUser = {
    username: `zakatuser${timestamp}`,
    email: `zakatuser${timestamp}@test.com`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
  };

  beforeAll(async () => {
    // Register user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(registerResponse.status).toBe(201);

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password,
      });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.data.accessToken;
    userId = loginResponse.body.data.user.userId;

    // Create some test assets
    const testAssets = [
      {
        name: 'Test Savings Account',
        category: 'cash',
        subCategory: 'savings',
        value: 15000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Test savings for zakat calculation'
      },
      {
        name: 'Gold Investment',
        category: 'gold',
        subCategory: 'jewelry',
        value: 8000,
        currency: 'USD',
        zakatEligible: true,
        description: 'Gold investment for zakat calculation'
      },
      {
        name: 'Primary Home',
        category: 'property',
        subCategory: 'residential',
        value: 300000,
        currency: 'USD',
        zakatEligible: false,
        description: 'Primary residence - not zakatable'
      }
    ];

    for (const asset of testAssets) {
      const assetResponse = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(asset);
      
      if (assetResponse.status !== 201) {
        console.error('Failed to create asset:', asset.name, 'Status:', assetResponse.status);
        console.error('Error:', JSON.stringify(assetResponse.body, null, 2));
      }
    }
  });

  describe('GET /api/v1/zakat/nisab', () => {
    it('should get current nisab thresholds', async () => {
      const response = await request(app)
        .get('/api/v1/zakat/nisab')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nisab).toBeDefined();
      expect(response.body.data.nisab.goldNisab).toBeGreaterThan(0);
      expect(response.body.data.nisab.silverNisab).toBeGreaterThan(0);
      expect(response.body.data.nisab.effectiveNisab).toBeGreaterThan(0);
      expect(response.body.data.goldPricePerGram).toBeDefined();
      expect(response.body.data.silverPricePerGram).toBeDefined();
      expect(response.body.data.method).toBe('standard');
      expect(response.body.data.lastUpdated).toBeDefined();
    });

    it('should get nisab with Hanafi method', async () => {
      const response = await request(app)
        .get('/api/v1/zakat/nisab?method=hanafi')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.method).toBe('hanafi');
      expect(response.body.data.nisab.effectiveNisab).toBe(response.body.data.nisab.silverNisab);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/zakat/nisab')
        .expect(401);
    });
  });

  describe('POST /api/v1/zakat/validate', () => {
    let testAssetIds: string[];

    beforeEach(async () => {
      // Get user's assets to get their IDs
      const assetsResponse = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`);

      const assets = assetsResponse.body.data?.assets || [];
      testAssetIds = assets
        .filter((asset: any) => asset.zakatEligible)
        .map((asset: any) => asset.assetId);
      
      if (testAssetIds.length === 0) {
        console.warn('No zakat-eligible assets found for validate tests');
      }
    });

    it('should validate assets for zakat eligibility', async () => {
      const response = await request(app)
        .post('/api/v1/zakat/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetIds: testAssetIds,
          method: 'standard'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nisab).toBeDefined();
      expect(response.body.data.meetsNisab).toBe(true); // Should meet nisab with our test assets
      expect(response.body.data.totalZakatableValue).toBeGreaterThan(0);
      expect(response.body.data.assets).toHaveLength(testAssetIds.length);
      expect(response.body.data.method).toBe('standard');
    });

    it('should require asset IDs', async () => {
      const response = await request(app)
        .post('/api/v1/zakat/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'standard'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Asset IDs array is required');
    });

    it('should handle empty asset IDs array', async () => {
      const response = await request(app)
        .post('/api/v1/zakat/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetIds: [],
          method: 'standard'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Asset IDs array is required');
    });

    it('should handle invalid asset IDs', async () => {
      const response = await request(app)
        .post('/api/v1/zakat/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetIds: ['invalid-id-1', 'invalid-id-2'],
          method: 'standard'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No valid assets found');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/zakat/validate')
        .send({
          assetIds: testAssetIds,
          method: 'standard'
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/zakat/calculate', () => {
    let testAssetIds: string[];

    beforeEach(async () => {
      // Get user's assets to get their IDs
      const assetsResponse = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`);

      testAssetIds = assetsResponse.body.data.assets
        .filter((asset: any) => asset.zakatEligible)
        .map((asset: any) => asset.assetId);
    });

    it('should calculate zakat successfully', async () => {
      const calculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: testAssetIds
      };

      const response = await request(app)
        .post('/api/v1/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(calculationRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.calculationId).toBeDefined();
      expect(response.body.data.calculationDate).toBe(calculationRequest.calculationDate);
      expect(response.body.data.calendarType).toBe(calculationRequest.calendarType);
      expect(response.body.data.method).toBe(calculationRequest.method);
      expect(response.body.data.nisab).toBeDefined();
      expect(response.body.data.assets).toHaveLength(testAssetIds.length);
      expect(response.body.data.totals).toBeDefined();
      expect(response.body.data.meetsNisab).toBe(true);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.createdAt).toBeDefined();

      // Verify totals are calculated correctly
      expect(response.body.data.totals.totalAssets).toBeGreaterThan(0);
      expect(response.body.data.totals.totalZakatableAssets).toBeGreaterThan(0);
      expect(response.body.data.totals.totalZakatDue).toBeGreaterThan(0);
    });

    it('should calculate zakat with Hanafi method', async () => {
      const calculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'hanafi',
        includeAssets: testAssetIds
      };

      const response = await request(app)
        .post('/api/v1/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(calculationRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.method).toBe('hanafi');
      // Hanafi method should use silver nisab (typically lower threshold)
      expect(response.body.data.nisab.effectiveNisab).toBe(response.body.data.nisab.silverNisab);
    });

    it('should handle solar calendar type', async () => {
      const calculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'solar',
        method: 'standard',
        includeAssets: testAssetIds
      };

      const response = await request(app)
        .post('/api/v1/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(calculationRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.calendarType).toBe('solar');
    });

    it('should validate calculation request parameters', async () => {
      const invalidRequest = {
        // Missing calculationDate
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: testAssetIds
      };

      const response = await request(app)
        .post('/api/v1/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Calculation date is required');
    });

    it('should validate calendar type', async () => {
      const invalidRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'invalid',
        method: 'standard',
        includeAssets: testAssetIds
      };

      const response = await request(app)
        .post('/api/v1/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Valid calendar type is required');
    });

    it('should validate calculation method', async () => {
      const invalidRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'invalid',
        includeAssets: testAssetIds
      };

      const response = await request(app)
        .post('/api/v1/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Valid calculation method is required');
    });

    it('should require at least one asset', async () => {
      const invalidRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: []
      };

      const response = await request(app)
        .post('/api/v1/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('At least one asset must be included');
    });

    it('should require authentication', async () => {
      const calculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: 'standard',
        includeAssets: testAssetIds
      };

      await request(app)
        .post('/api/v1/zakat/calculate')
        .send(calculationRequest)
        .expect(401);
    });
  });
});