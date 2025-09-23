import request from 'supertest';
import app from '../index.js';
import { Asset } from '@zakapp/shared';

describe('Asset Bulk Operations', () => {
  let authToken: string;
  const testUser = {
    username: 'assetuser',
    email: 'assetuser@example.com',
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123',
  };

  beforeAll(async () => {
    // Register and login user for testing
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password,
      });

    authToken = loginResponse.body.data.token;
  });

  describe('POST /api/v1/assets/bulk/validate', () => {
    it('should validate valid asset data', async () => {
      const validAssets = [
        {
          name: 'Test Savings',
          category: 'cash',
          subCategory: 'savings',
          value: 5000,
          currency: 'USD',
          zakatEligible: true,
        },
        {
          name: 'Gold Ring',
          category: 'gold',
          subCategory: 'jewelry',
          value: 2000,
          currency: 'USD',
          zakatEligible: true,
          weight: 15,
          purity: 22,
        },
      ];

      const response = await request(app)
        .post('/api/v1/assets/bulk/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assets: validAssets })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.valid).toBe(2);
      expect(response.body.data.summary.invalid).toBe(0);
      expect(response.body.data.summary.total).toBe(2);
    });

    it('should detect invalid asset data', async () => {
      const invalidAssets = [
        {
          // Missing required fields
          name: '',
          category: 'cash',
          value: -100, // Invalid negative value
        },
        {
          name: 'Valid Asset',
          category: 'gold',
          subCategory: 'jewelry',
          value: 1000,
          currency: 'USD',
          zakatEligible: true,
        },
      ];

      const response = await request(app)
        .post('/api/v1/assets/bulk/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assets: invalidAssets })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.valid).toBe(1);
      expect(response.body.data.summary.invalid).toBe(1);
      expect(response.body.data.summary.total).toBe(2);
    });

    it('should require authentication', async () => {
      const assets = [{ name: 'Test' }];

      await request(app)
        .post('/api/v1/assets/bulk/validate')
        .send({ assets })
        .expect(401);
    });
  });

  describe('POST /api/v1/assets/bulk/import', () => {
    it('should import valid assets', async () => {
      const validAssets = [
        {
          name: 'Imported Savings',
          category: 'cash',
          subCategory: 'savings',
          value: 3000,
          currency: 'USD',
          zakatEligible: true,
          description: 'Imported via bulk operation',
        },
        {
          name: 'Imported Gold',
          category: 'gold',
          subCategory: 'coins',
          value: 1500,
          currency: 'USD',
          zakatEligible: true,
          weight: 10,
          purity: 24,
        },
      ];

      const response = await request(app)
        .post('/api/v1/assets/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          assets: validAssets,
          mergeStrategy: 'merge'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.successful).toBe(2);
      expect(response.body.data.summary.failed).toBe(0);
      expect(response.body.data.summary.total).toBe(2);

      // Verify assets were created
      const assetsResponse = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const createdAssets = assetsResponse.body.data.assets.filter(
        (asset: Asset) => asset.name === 'Imported Savings' || asset.name === 'Imported Gold'
      );
      expect(createdAssets).toHaveLength(2);
    });

    it('should handle partial failures gracefully', async () => {
      const mixedAssets = [
        {
          name: 'Valid Asset',
          category: 'cash',
          subCategory: 'checking',
          value: 1000,
          currency: 'USD',
          zakatEligible: true,
        },
        {
          // Invalid asset - missing required fields
          name: '',
          value: -500,
        },
      ];

      const response = await request(app)
        .post('/api/v1/assets/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assets: mixedAssets })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.successful).toBe(1);
      expect(response.body.data.summary.failed).toBe(1);
      expect(response.body.data.summary.total).toBe(2);
    });

    it('should require authentication', async () => {
      const assets = [{ name: 'Test', category: 'cash', value: 100 }];

      await request(app)
        .post('/api/v1/assets/bulk/import')
        .send({ assets })
        .expect(401);
    });
  });

  describe('GET /api/v1/assets/bulk/export', () => {
    beforeAll(async () => {
      // Create test assets for export
      const testAsset = {
        name: 'Export Test Asset',
        category: 'stocks',
        subCategory: 'individual_stocks',
        value: 5000,
        currency: 'USD',
        zakatEligible: true,
        ticker: 'AAPL',
        shares: 10,
      };

      await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testAsset);
    });

    it('should export user assets', async () => {
      const response = await request(app)
        .get('/api/v1/assets/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assets).toBeDefined();
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.totalAssets).toBeGreaterThan(0);
      expect(response.body.data.exportDate).toBeDefined();
      expect(response.body.data.userId).toBeDefined();
    });

    it('should include metadata about exported assets', async () => {
      const response = await request(app)
        .get('/api/v1/assets/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const metadata = response.body.data.metadata;
      expect(metadata.totalAssets).toBeGreaterThan(0);
      expect(metadata.totalValue).toBeGreaterThan(0);
      expect(Array.isArray(metadata.categories)).toBe(true);
      expect(metadata.categories.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/assets/bulk/export')
        .expect(401);
    });
  });

  describe('Integration: Export and Import Workflow', () => {
    it('should export and re-import assets successfully', async () => {
      // First export existing assets
      const exportResponse = await request(app)
        .get('/api/v1/assets/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const exportedAssets = exportResponse.body.data.assets;
      expect(exportedAssets.length).toBeGreaterThan(0);

      // Create a new user for import test
      const newUser = {
        username: 'importuser',
        email: 'importuser@example.com',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      const newUserLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: newUser.username,
          password: newUser.password,
        });

      const newUserToken = newUserLogin.body.data.token;

      // Import the exported assets for the new user
      const importResponse = await request(app)
        .post('/api/v1/assets/bulk/import')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          assets: exportedAssets.slice(0, 2), // Import first 2 assets
          mergeStrategy: 'merge'
        })
        .expect(200);

      expect(importResponse.body.success).toBe(true);
      expect(importResponse.body.data.summary.successful).toBe(2);

      // Verify imported assets
      const importedAssetsResponse = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(importedAssetsResponse.body.data.assets).toHaveLength(2);
    });
  });
});