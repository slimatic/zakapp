/**
 * Performance Tests for API Endpoints
 * 
 * Constitutional Principles:
 * - Quality & Reliability: Ensure API performance meets user expectations
 * - User-Centric Design: Fast response times for optimal user experience
 * - Privacy & Security First: Performance testing without compromising security
 */

import request from 'supertest';
import app from '../../server/src/app';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

// Mock Prisma for performance testing
jest.mock('@prisma/client');
const MockPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('API Performance Tests', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let authToken: string;
  
  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long-abcdef1234567890';
    
    // Setup mocked Prisma
    mockPrisma = new MockPrismaClient() as jest.Mocked<PrismaClient>;
    
    // Get auth token for protected endpoints
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  describe('Authentication Endpoints Performance', () => {
    it('should handle login requests within 500ms', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500);
    });

    it('should handle registration within 1000ms', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'newpassword123',
          profile: {
            name: 'New User',
            location: 'Test City'
          }
        });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle token refresh within 200ms', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
    });

    it('should handle concurrent login requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'testpassword123'
          })
      );
      
      const startTime = performance.now();
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // All concurrent requests should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Asset Management Performance', () => {
    it('should retrieve asset list within 300ms', async () => {
      // Mock large asset dataset
      const mockAssets = Array.from({ length: 100 }, (_, i) => ({
        id: `asset-${i}`,
        name: `Asset ${i}`,
        value: Math.random() * 10000,
        category: 'cash'
      }));
      
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets);
      
      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300);
      expect(response.body.data.items).toHaveLength(100);
    });

    it('should create asset within 400ms', async () => {
      const newAsset = {
        name: 'New Asset',
        category: 'cash',
        value: 5000,
        currency: 'USD',
        acquisitionDate: new Date().toISOString()
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newAsset);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(400);
    });

    it('should update asset within 350ms', async () => {
      const updateData = {
        name: 'Updated Asset',
        value: 7500
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .put('/api/assets/asset-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(350);
    });

    it('should handle paginated asset requests efficiently', async () => {
      const mockAssets = Array.from({ length: 1000 }, (_, i) => ({
        id: `asset-${i}`,
        name: `Asset ${i}`,
        value: Math.random() * 10000
      }));
      
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(mockAssets.slice(0, 50));
      mockPrisma.asset.count = jest.fn().mockResolvedValue(1000);
      
      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/assets?page=1&limit=50')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(400);
      expect(response.body.data.pagination.total).toBe(1000);
    });
  });

  describe('Zakat Calculation Performance', () => {
    it('should calculate Zakat within 600ms', async () => {
      const calculationRequest = {
        assets: {
          cash: 50000,
          gold: 25000,
          silver: 5000,
          business: 75000
        },
        methodology: 'hanafi',
        calculationDate: new Date().toISOString()
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(calculationRequest);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(600);
      expect(response.body.data.zakatDue).toBeDefined();
    });

    it('should handle complex portfolio calculation within 800ms', async () => {
      const complexPortfolio = {
        assets: Array.from({ length: 50 }, (_, i) => ({
          id: `asset-${i}`,
          category: i % 5 === 0 ? 'gold' : 'cash',
          value: Math.random() * 10000,
          currency: i % 3 === 0 ? 'EUR' : 'USD'
        })),
        methodology: 'hanafi',
        includeCurrencyConversion: true
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/zakat/calculate-portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send(complexPortfolio);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(800);
    });

    it('should retrieve Zakat history within 250ms', async () => {
      const mockCalculations = Array.from({ length: 20 }, (_, i) => ({
        id: `calc-${i}`,
        calculationDate: new Date(Date.now() - i * 86400000).toISOString(),
        zakatDue: Math.random() * 1000,
        methodology: 'hanafi'
      }));
      
      mockPrisma.zakatCalculation.findMany = jest.fn().mockResolvedValue(mockCalculations);
      
      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/zakat/history')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(250);
      expect(response.body.data.items).toHaveLength(20);
    });
  });

  describe('Data Migration Performance', () => {
    it('should validate migration files within 1000ms', async () => {
      const migrationData = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: `user-${i}`,
          email: `user${i}@example.com`
        })),
        assets: Array.from({ length: 500 }, (_, i) => ({
          id: `asset-${i}`,
          userId: `user-${i % 100}`,
          value: Math.random() * 10000
        }))
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/migration/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(migrationData);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000);
    });

    it('should process small migration within 2000ms', async () => {
      const smallMigrationData = {
        users: Array.from({ length: 10 }, (_, i) => ({
          id: `user-${i}`,
          email: `user${i}@example.com`,
          profile: { name: `User ${i}` }
        }))
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/migration/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send(smallMigrationData);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('Load Testing and Stress Testing', () => {
    it('should handle high concurrent user load', async () => {
      const concurrentUsers = 50;
      const requestsPerUser = 5;
      
      const promises = Array.from({ length: concurrentUsers }, async () => {
        const userRequests = Array.from({ length: requestsPerUser }, () =>
          request(app)
            .get('/api/assets')
            .set('Authorization', `Bearer ${authToken}`)
        );
        return Promise.all(userRequests);
      });
      
      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Flatten results and check all responses
      const allResponses = results.flat();
      expect(allResponses).toHaveLength(concurrentUsers * requestsPerUser);
      
      allResponses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // All requests should complete within 10 seconds
      expect(totalTime).toBeLessThan(10000);
      
      // Average response time should be reasonable
      const averageResponseTime = totalTime / allResponses.length;
      expect(averageResponseTime).toBeLessThan(500);
    });

    it('should maintain performance under memory pressure', async () => {
      // Create large payloads to simulate memory pressure
      const largePayloads = Array.from({ length: 10 }, () => ({
        assets: Array.from({ length: 100 }, (_, i) => ({
          id: `asset-${i}`,
          name: `Asset ${i}`,
          value: Math.random() * 10000,
          metadata: 'x'.repeat(1000) // Large metadata
        }))
      }));
      
      const promises = largePayloads.map(payload =>
        request(app)
          .post('/api/assets/bulk-create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(payload)
      );
      
      const startTime = performance.now();
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(totalTime).toBeLessThan(15000); // Should handle within 15 seconds
    });

    it('should recover gracefully from rate limiting', async () => {
      // Send many requests to trigger rate limiting
      const rapidRequests = Array.from({ length: 150 }, () =>
        request(app)
          .get('/api/assets')
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      const responses = await Promise.allSettled(rapidRequests);
      
      let successCount = 0;
      let rateLimitedCount = 0;
      
      responses.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.status === 200) {
            successCount++;
          } else if (result.value.status === 429) {
            rateLimitedCount++;
          }
        }
      });
      
      expect(successCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(successCount + rateLimitedCount).toBe(150);
    });
  });

  describe('Database Performance', () => {
    it('should handle complex queries efficiently', async () => {
      // Mock complex query result
      const complexQueryResult = Array.from({ length: 200 }, (_, i) => ({
        id: `result-${i}`,
        calculation: {
          assets: Math.random() * 100000,
          zakat: Math.random() * 2500
        }
      }));
      
      mockPrisma.$queryRaw = jest.fn().mockResolvedValue(complexQueryResult);
      
      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/analytics/zakat-trends?period=1year')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1500);
    });

    it('should optimize pagination queries', async () => {
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        value: Math.random() * 1000
      }));
      
      mockPrisma.asset.findMany = jest.fn().mockResolvedValue(largeDataset);
      mockPrisma.asset.count = jest.fn().mockResolvedValue(10000);
      
      const pageTests = [1, 50, 100, 200].map(async (page) => {
        const startTime = performance.now();
        
        const response = await request(app)
          .get(`/api/assets?page=${page}&limit=50`)
          .set('Authorization', `Bearer ${authToken}`);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(400);
        
        return responseTime;
      });
      
      const responseTimes = await Promise.all(pageTests);
      
      // Response times should be consistent across different pages
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);
      expect(maxTime - minTime).toBeLessThan(200); // Variance should be small
    });
  });

  describe('Security Performance Impact', () => {
    it('should maintain performance with encryption overhead', async () => {
      const sensitiveData = {
        profile: {
          name: 'Test User',
          ssn: '123-45-6789',
          bankAccount: '1234567890',
          creditCards: Array.from({ length: 5 }, (_, i) => `4532-1234-5678-901${i}`)
        }
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sensitiveData);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(600); // Encryption should not add significant overhead
    });

    it('should handle security middleware efficiently', async () => {
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .get('/api/assets')
          .set('Authorization', `Bearer ${authToken}`)
          .set('User-Agent', 'Performance Test Client')
      );
      
      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.headers['x-response-time']).toBeDefined();
      });
      
      const averageTime = totalTime / responses.length;
      expect(averageTime).toBeLessThan(300);
    });
  });

  describe('Real-World Scenario Performance', () => {
    it('should handle complete user workflow efficiently', async () => {
      const startTime = performance.now();
      
      // 1. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });
      
      const token = loginResponse.body.data.token;
      
      // 2. Get assets
      await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${token}`);
      
      // 3. Create new asset
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Workflow Asset',
          category: 'cash',
          value: 10000,
          currency: 'USD'
        });
      
      // 4. Calculate Zakat
      await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          methodology: 'hanafi'
        });
      
      // 5. Get calculation history
      await request(app)
        .get('/api/zakat/history')
        .set('Authorization', `Bearer ${token}`);
      
      const endTime = performance.now();
      const totalWorkflowTime = endTime - startTime;
      
      // Complete workflow should finish within 3 seconds
      expect(totalWorkflowTime).toBeLessThan(3000);
    });

    it('should support Islamic methodology switching performance', async () => {
      const methodologies = ['hanafi', 'shafi', 'maliki', 'hanbali'];
      const assets = {
        cash: 50000,
        gold: 25000,
        business: 30000
      };
      
      const startTime = performance.now();
      
      const calculations = await Promise.all(
        methodologies.map(methodology =>
          request(app)
            .post('/api/zakat/calculate')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ assets, methodology })
        )
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      calculations.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.zakatDue).toBeDefined();
      });
      
      // All methodology calculations should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);
    });
  });
});