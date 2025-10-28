import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Methodology Configuration Contract Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Register a test user with unique email
    const uniqueId = Date.now();
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `methodology${uniqueId}@example.com`,
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        username: `methodologyuser${uniqueId}`
      })
      .expect(201);

    testUser = registerResponse.body.user;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: `methodology${uniqueId}@example.com`,
        password: 'SecurePassword123!'
      })
      .expect(200);

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUser?.id) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  describe('GET /api/methodologies', () => {
    test('returns all available methodologies', async () => {
      const response = await request(app)
        .get('/api/methodologies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('fixed');
      expect(response.body).toHaveProperty('custom');

      // Check fixed methodologies
      expect(Array.isArray(response.body.fixed)).toBe(true);
      expect(response.body.fixed.length).toBeGreaterThan(0);

      // Each fixed methodology should have required fields
      response.body.fixed.forEach((methodology: any) => {
        expect(methodology).toHaveProperty('id');
        expect(methodology).toHaveProperty('name');
        expect(methodology).toHaveProperty('nisabBasis');
        expect(methodology).toHaveProperty('rate');
        expect(methodology).toHaveProperty('assetRules');
      });

      // Custom should be empty array initially
      expect(Array.isArray(response.body.custom)).toBe(true);
      expect(response.body.custom).toEqual([]);
    });

    test('requires authentication', async () => {
      await request(app)
        .get('/api/methodologies')
        .expect(401);
    });
  });

  describe('GET /api/methodologies/:id', () => {
    test('returns specific methodology configuration', async () => {
      const response = await request(app)
        .get('/api/methodologies/STANDARD')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('methodology');
      expect(response.body.methodology.id).toBe('STANDARD');
      expect(response.body.methodology).toHaveProperty('name');
      expect(response.body.methodology).toHaveProperty('nisabBasis');
    });

    test('returns 404 for unknown methodology', async () => {
      await request(app)
        .get('/api/methodologies/UNKNOWN')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/methodologies/:id', () => {
    test('updates methodology configuration', async () => {
      const updateData = {
        nisabBasis: 'SILVER',
        rate: 2.5
      };

      const response = await request(app)
        .put('/api/methodologies/STANDARD')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('methodology');
      expect(response.body.methodology.nisabBasis).toBe('SILVER');
    });

    test('validates nisab thresholds are positive', async () => {
      const invalidData = {
        customNisabValue: -100
      };

      await request(app)
        .put('/api/methodologies/STANDARD')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    test('validates methodology ID exists', async () => {
      await request(app)
        .put('/api/methodologies/INVALID_ID')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rate: 2.5 })
        .expect(404);
    });
  });

  describe('POST /api/methodologies/custom', () => {
    test('creates custom methodology', async () => {
      const customMethodology = {
        name: 'Test Custom Method',
        nisabBasis: 'SILVER',
        rate: 2.5,
        assetRules: {
          CASH: { included: true },
          GOLD: { included: true },
          CRYPTO: { included: false }
        }
      };

      const response = await request(app)
        .post('/api/methodologies/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customMethodology)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('methodology');
      expect(response.body.methodology.name).toBe('Test Custom Method');
      expect(response.body.methodology).toHaveProperty('id');
    });

    test('validates required fields', async () => {
      const invalidData = {
        name: 'Incomplete Method'
        // Missing nisabBasis, rate, assetRules
      };

      await request(app)
        .post('/api/methodologies/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('DELETE /api/methodologies/custom/:id', () => {
    test('deletes custom methodology', async () => {
      // First create a custom methodology
      const customMethodology = {
        name: 'Method to Delete',
        nisabBasis: 'GOLD',
        rate: 2.5,
        assetRules: {
          CASH: { included: true }
        }
      };

      const createResponse = await request(app)
        .post('/api/methodologies/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customMethodology)
        .expect(201);

      const methodologyId = createResponse.body.methodology.id;

      // Now delete it
      await request(app)
        .delete(`/api/methodologies/custom/${methodologyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's gone
      await request(app)
        .get(`/api/methodologies/${methodologyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('cannot delete fixed methodologies', async () => {
      await request(app)
        .delete('/api/methodologies/custom/STANDARD')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});