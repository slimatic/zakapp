/**
 * End-to-end integration tests for Zakat methodology calculations
 * 
 * Tests all four methodologies:
 * - Standard (AAOIFI)
 * - Hanafi
 * - Shafi'i 
 * - Custom
 * 
 * Validates calculation accuracy, methodology switching, and nisab thresholds
 */

import request from 'supertest';
import app from '../../src/app';
import { generateTestUser, cleanupTestData } from '../helpers/testHelpers';

interface CalculationRequest {
  methodology: string;
  calendarType: string;
  includeAssets: string[];
  customRules?: {
    zakatRate: number;
    nisabBasis: string;
  };
}

describe('Zakat Methodology Calculations - End-to-End', () => {
  let testUser: any;
  let authToken: string;
  let testAssets: any[];

  beforeAll(async () => {
    // Create test user and authenticate
    testUser = await generateTestUser('methodology-test-user');
    
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'TestPassword123!'
      });
    
    authToken = loginResponse.body.token;

    // Create test assets for calculations
    testAssets = [
      {
        name: 'Savings Account',
        type: 'cash',
        value: 50000,
        currency: 'USD',
        description: 'Primary savings'
      },
      {
        name: 'Gold Jewelry',
        type: 'gold',
        value: 25000,
        currency: 'USD',
        weight: 200, // grams
        description: 'Gold jewelry collection'
      },
      {
        name: 'Business Inventory',
        type: 'business',
        value: 30000,
        currency: 'USD',
        description: 'Trading inventory'
      },
      {
        name: 'Investment Account',
        type: 'investment',
        value: 40000,
        currency: 'USD',
        description: 'Stock portfolio'
      }
    ];

    // Create assets via API
    for (const asset of testAssets) {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(asset);
    }
  });

  afterAll(async () => {
    await cleanupTestData(testUser.id);
  });

  describe('Standard (AAOIFI) Methodology', () => {
    it('should calculate zakat correctly for standard methodology', async () => {
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'standard',
          calendarType: 'lunar',
          includeAssets: ['cash', 'gold', 'business', 'investment']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const calculation = response.body.calculation;
      
      // Standard methodology calculations
      expect(calculation.methodology).toBe('standard');
      expect(calculation.totalWealth).toBe(145000); // 50k + 25k + 30k + 40k
      expect(calculation.nisabThreshold).toBeCloseTo(4340, 0); // Current nisab threshold
      expect(calculation.zakatDue).toBeCloseTo(3625, 0); // 2.5% of 145,000
      expect(calculation.zakatRate).toBe(2.5);
      expect(calculation.aboveNisab).toBe(true);
      
      // Asset breakdown validation
      expect(calculation.assetBreakdown).toHaveProperty('cash');
      expect(calculation.assetBreakdown).toHaveProperty('gold');
      expect(calculation.assetBreakdown).toHaveProperty('business');
      expect(calculation.assetBreakdown).toHaveProperty('investment');
      
      expect(calculation.assetBreakdown.cash.zakatDue).toBeCloseTo(1250, 0); // 2.5% of 50k
      expect(calculation.assetBreakdown.gold.zakatDue).toBeCloseTo(625, 0); // 2.5% of 25k
    });

    it('should handle below nisab threshold for standard methodology', async () => {
      // Create user with low-value assets
      const lowValueUser = await generateTestUser('low-value-user');
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: lowValueUser.email,
          password: 'TestPassword123!'
        });
      
      const token = loginResponse.body.token;

      // Create low-value asset (below nisab)
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Small Savings',
          type: 'cash',
          value: 2000,
          currency: 'USD'
        });

      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          methodology: 'standard',
          calendarType: 'lunar',
          includeAssets: ['cash']
        });

      expect(response.status).toBe(200);
      expect(response.body.calculation.aboveNisab).toBe(false);
      expect(response.body.calculation.zakatDue).toBe(0);
      
      await cleanupTestData(lowValueUser.id);
    });
  });

  describe('Hanafi Methodology', () => {
    it('should calculate zakat correctly for Hanafi methodology', async () => {
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'hanafi',
          calendarType: 'lunar',
          includeAssets: ['cash', 'gold', 'business', 'investment']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const calculation = response.body.calculation;
      
      // Hanafi methodology uses silver nisab (lower threshold)
      expect(calculation.methodology).toBe('hanafi');
      expect(calculation.totalWealth).toBe(145000);
      expect(calculation.nisabThreshold).toBeLessThan(4340); // Silver nisab is lower
      expect(calculation.zakatDue).toBeCloseTo(3625, 0); // Same rate, above nisab
      expect(calculation.zakatRate).toBe(2.5);
      expect(calculation.aboveNisab).toBe(true);
      
      // Hanafi-specific asset treatment
      expect(calculation.assetBreakdown).toHaveProperty('cash');
      expect(calculation.assetBreakdown).toHaveProperty('gold');
    });

    it('should use silver nisab threshold in Hanafi methodology', async () => {
      const response = await request(app)
        .get('/api/zakat/nisab/hanafi')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.nisabThreshold).toBeLessThan(4340); // Silver < Gold
      expect(response.body.basis).toBe('silver');
      expect(response.body.methodology).toBe('hanafi');
    });
  });

  describe('Shafi\'i Methodology', () => {
    it('should calculate zakat correctly for Shafi\'i methodology', async () => {
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'shafi',
          calendarType: 'lunar',
          includeAssets: ['cash', 'gold', 'business', 'investment']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const calculation = response.body.calculation;
      
      // Shafi'i methodology uses gold nisab
      expect(calculation.methodology).toBe('shafi');
      expect(calculation.totalWealth).toBe(145000);
      expect(calculation.nisabThreshold).toBeCloseTo(4340, 0); // Gold nisab
      expect(calculation.zakatDue).toBeCloseTo(3625, 0);
      expect(calculation.zakatRate).toBe(2.5);
      expect(calculation.aboveNisab).toBe(true);
    });

    it('should handle specific Shafi\'i asset rules', async () => {
      // Test with mixed assets including some that Shafi'i treats differently
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'shafi',
          calendarType: 'lunar',
          includeAssets: ['gold', 'silver'],
          customRules: {
            goldWeight: 200, // grams
            silverWeight: 0
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.calculation.methodology).toBe('shafi');
      
      // Shafi'i gold calculation should use weight-based nisab
      const goldBreakdown = response.body.calculation.assetBreakdown.gold;
      expect(goldBreakdown).toBeTruthy();
      expect(goldBreakdown.zakatable).toBe(true);
    });
  });

  describe('Custom Methodology', () => {
    it('should calculate zakat with custom rules', async () => {
      const customRules = {
        nisabBasis: 'gold',
        zakatRate: 2.0, // Custom rate
        excludeAssets: ['business'], // Custom exclusion
        minHoldingPeriod: 365, // Custom holding period
        adjustmentFactor: 0.95 // Custom adjustment
      };

      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'custom',
          calendarType: 'lunar',
          includeAssets: ['cash', 'gold', 'investment'], // Excluding business
          customRules
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const calculation = response.body.calculation;
      
      expect(calculation.methodology).toBe('custom');
      expect(calculation.zakatRate).toBe(2.0); // Custom rate
      expect(calculation.totalWealth).toBe(115000); // Excluding business (30k)
      expect(calculation.zakatDue).toBeCloseTo(2185, 0); // 2% of 115k * 0.95 adjustment
      
      // Business should be excluded
      expect(calculation.assetBreakdown).not.toHaveProperty('business');
      expect(calculation.assetBreakdown).toHaveProperty('cash');
      expect(calculation.assetBreakdown).toHaveProperty('gold');
      expect(calculation.assetBreakdown).toHaveProperty('investment');
    });

    it('should validate custom rules', async () => {
      const invalidRules = {
        zakatRate: 5.0, // Invalid rate (too high)
        nisabBasis: 'invalid' // Invalid basis
      };

      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'custom',
          calendarType: 'lunar',
          includeAssets: ['cash'],
          customRules: invalidRules
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });
  });

  describe('Methodology Switching', () => {
    it('should allow switching between methodologies', async () => {
      const methodologies = ['standard', 'hanafi', 'shafi', 'custom'];
      const results: Record<string, any> = {};

      for (const methodology of methodologies) {
        const requestData: CalculationRequest = {
          methodology,
          calendarType: 'lunar',
          includeAssets: ['cash', 'gold', 'business', 'investment']
        };

        if (methodology === 'custom') {
          requestData.customRules = {
            zakatRate: 2.3,
            nisabBasis: 'gold'
          };
        }

        const response = await request(app)
          .post('/api/zakat/calculate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(requestData);

        expect(response.status).toBe(200);
        results[methodology] = response.body.calculation;
      }

      // Verify each methodology produces different results
      expect(results.standard.methodology).toBe('standard');
      expect(results.hanafi.methodology).toBe('hanafi');
      expect(results.shafi.methodology).toBe('shafi');
      expect(results.custom.methodology).toBe('custom');

      // Hanafi should have lower nisab threshold
      expect(results.hanafi.nisabThreshold).toBeLessThan(results.standard.nisabThreshold);
      
      // Custom should have different rate
      expect(results.custom.zakatRate).toBe(2.3);
      expect(results.standard.zakatRate).toBe(2.5);
    });

    it('should persist methodology preference', async () => {
      // Set methodology preference
      await request(app)
        .patch('/api/user/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferredMethodology: 'hanafi',
          preferredCalendar: 'lunar'
        });

      // Verify preference is used in calculations
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          includeAssets: ['cash', 'gold']
        }); // No methodology specified - should use preference

      expect(response.status).toBe(200);
      expect(response.body.calculation.methodology).toBe('hanafi');
    });
  });

  describe('Nisab Threshold Validation', () => {
    it('should get current nisab thresholds for all methodologies', async () => {
      const methodologies = ['standard', 'hanafi', 'shafi'];
      
      for (const methodology of methodologies) {
        const response = await request(app)
          .get(`/api/zakat/nisab/${methodology}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.nisabThreshold).toBeGreaterThan(0);
        expect(response.body.methodology).toBe(methodology);
        expect(response.body.basis).toMatch(/gold|silver/);
        expect(response.body.lastUpdated).toBeTruthy();
      }
    });

    it('should handle edge cases near nisab threshold', async () => {
      // Get current nisab threshold
      const nisabResponse = await request(app)
        .get('/api/zakat/nisab/standard')
        .set('Authorization', `Bearer ${authToken}`);
      
      const nisabThreshold = nisabResponse.body.nisabThreshold;

      // Create user with assets just above nisab
      const edgeUser = await generateTestUser('edge-case-user');
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: edgeUser.email,
          password: 'TestPassword123!'
        });
      
      const token = loginResponse.body.token;

      // Create asset just above nisab
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Edge Case Asset',
          type: 'cash',
          value: nisabThreshold + 100, // Slightly above nisab
          currency: 'USD'
        });

      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          methodology: 'standard',
          calendarType: 'lunar',
          includeAssets: ['cash']
        });

      expect(response.status).toBe(200);
      expect(response.body.calculation.aboveNisab).toBe(true);
      expect(response.body.calculation.zakatDue).toBeGreaterThan(0);
      
      await cleanupTestData(edgeUser.id);
    });
  });

  describe('Calendar System Integration', () => {
    it('should calculate with lunar calendar adjustment', async () => {
      const lunarResponse = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'standard',
          calendarType: 'lunar',
          includeAssets: ['cash']
        });

      expect(lunarResponse.status).toBe(200);
      expect(lunarResponse.body.calculation.calendarType).toBe('lunar');
      expect(lunarResponse.body.calculation.adjustmentFactor).toBeCloseTo(0.9704, 3);
    });

    it('should calculate with solar calendar', async () => {
      const solarResponse = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'standard',
          calendarType: 'solar',
          includeAssets: ['cash']
        });

      expect(solarResponse.status).toBe(200);
      expect(solarResponse.body.calculation.calendarType).toBe('solar');
      expect(solarResponse.body.calculation.adjustmentFactor).toBe(1.0);
    });

    it('should show different results for lunar vs solar calendar', async () => {
      const baseRequest = {
        methodology: 'standard',
        includeAssets: ['cash', 'gold']
      };

      const [lunarResponse, solarResponse] = await Promise.all([
        request(app)
          .post('/api/zakat/calculate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...baseRequest, calendarType: 'lunar' }),
        request(app)
          .post('/api/zakat/calculate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...baseRequest, calendarType: 'solar' })
      ]);

      expect(lunarResponse.status).toBe(200);
      expect(solarResponse.status).toBe(200);

      // Lunar calculation should be slightly lower due to adjustment factor
      expect(lunarResponse.body.calculation.zakatDue)
        .toBeLessThan(solarResponse.body.calculation.zakatDue);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid methodology', async () => {
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'invalid',
          calendarType: 'lunar',
          includeAssets: ['cash']
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('methodology');
    });

    it('should handle missing assets', async () => {
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'standard',
          calendarType: 'lunar',
          includeAssets: ['nonexistent']
        });

      expect(response.status).toBe(200);
      expect(response.body.calculation.totalWealth).toBe(0);
      expect(response.body.calculation.zakatDue).toBe(0);
      expect(response.body.calculation.aboveNisab).toBe(false);
    });

    it('should handle empty asset list', async () => {
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'standard',
          calendarType: 'lunar',
          includeAssets: []
        });

      expect(response.status).toBe(200);
      expect(response.body.calculation.totalWealth).toBe(0);
      expect(response.body.calculation.zakatDue).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/zakat/calculate')
        .send({
          methodology: 'standard',
          calendarType: 'lunar',
          includeAssets: ['cash']
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Validation', () => {
    it('should complete calculation within performance targets', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodology: 'standard',
          calendarType: 'lunar',
          includeAssets: ['cash', 'gold', 'business', 'investment']
        });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(200); // <200ms target per methodology
    });

    it('should handle multiple concurrent calculations', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/zakat/calculate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            methodology: 'standard',
            calendarType: 'lunar',
            includeAssets: ['cash', 'gold']
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});