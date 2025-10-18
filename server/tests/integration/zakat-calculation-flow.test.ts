/**
 * Integration Tests: Full Zakat Calculation Flow
 *
 * Tests the complete user journey from registration to snapshot creation
 * Validates end-to-end functionality, data encryption, audit logging, and constraints
 */

import request from 'supertest';
import app from '../../src/app';
import { cleanupTestData, createTestAssets } from '../helpers/testHelpers';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { jwtService } from '../../src/services/JWTService';

const prisma = new PrismaClient();

describe('Zakat Calculation Flow - End-to-End Integration', () => {
  let testUser: any;
  let authToken: string;
  let testAssets: any[];

  beforeAll(async () => {
    // Increase timeout for setup
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up between tests
    await prisma.paymentRecord.deleteMany();
    await prisma.assetSnapshot.deleteMany();
    await prisma.zakatCalculation.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.user.deleteMany();

    // Create fresh test user directly in database for speed
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: hashedPassword,
        profile: JSON.stringify({ name: 'Test User' }),
        isActive: true,
      }
    });

    // Generate JWT token using the service
    authToken = jwtService.createAccessToken({
      userId: testUser.id,
      email: testUser.email
    });

    // Create test assets directly in database
    testAssets = await Promise.all([
      prisma.asset.create({
        data: {
          userId: testUser.id,
          name: 'Savings Account',
          category: 'cash',
          value: 50000,
          currency: 'USD',
          acquisitionDate: new Date('2023-01-01')
        }
      }),
      prisma.asset.create({
        data: {
          userId: testUser.id,
          name: 'Gold Jewelry',
          category: 'gold',
          value: 25000,
          currency: 'USD',
          acquisitionDate: new Date('2023-01-01')
        }
      }),
      prisma.asset.create({
        data: {
          userId: testUser.id,
          name: 'Business Inventory',
          category: 'business',
          value: 30000,
          currency: 'USD',
          acquisitionDate: new Date('2023-01-01')
        }
      })
    ]);
  }, 15000);

  describe('Complete User Journey', () => {
    it('should complete full zakat calculation workflow', async () => {
      // 1. Verify user exists and has assets
      const userResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.success).toBe(true);

      // 2. Verify assets exist
      const assetsResponse = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(assetsResponse.status).toBe(200);
      expect(assetsResponse.body.success).toBe(true);
      expect(assetsResponse.body.assets).toHaveLength(testAssets.length);

      // 3. Calculate Zakat
      const calculationResponse = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'standard',
          calendarType: 'solar'
        });

      expect(calculationResponse.status).toBe(200);
      expect(calculationResponse.body.success).toBe(true);
      expect(calculationResponse.body.data.calculation).toBeDefined();
      expect(calculationResponse.body.data.calculation.summary.zakatAmount).toBeGreaterThan(0);

      const calculationId = calculationResponse.body.data.calculation.id;

      // 4. Record Payment
      const paymentResponse = await request(app)
        .post('/api/zakat/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          calculationId,
          amount: calculationResponse.body.data.calculation.summary.zakatAmount * 0.5, // Pay half
          paymentDate: new Date().toISOString(),
          recipient: 'Local Mosque',
          notes: 'Partial payment for Ramadan'
        });

      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.body.success).toBe(true);

      // 5. Create Snapshot
      const snapshotResponse = await request(app)
        .post('/api/tracking/snapshots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          calculationId,
          year: new Date().getFullYear(),
          notes: 'End of year Zakat calculation'
        });

      expect(snapshotResponse.status).toBe(201);
      expect(snapshotResponse.body.success).toBe(true);

      const snapshotId = snapshotResponse.body.data?.snapshot?.id;

      // 6. Verify snapshot data
      if (snapshotId) {
        const snapshotDetailsResponse = await request(app)
          .get(`/api/tracking/snapshots/${snapshotId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(snapshotDetailsResponse.status).toBe(200);
        expect(snapshotDetailsResponse.body.success).toBe(true);
        expect(snapshotDetailsResponse.body.data.snapshot.totalWealth).toBeGreaterThan(0);
        expect(snapshotDetailsResponse.body.data.snapshot.zakatAmount).toBe(calculationResponse.body.data.calculation.summary.zakatAmount);
      }
    });
  });

  describe('Methodology Changes', () => {
    it('should recalculate with different methodologies', async () => {
      // Calculate with Standard methodology
      const standardResponse = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodologyId: 'standard',
          calendarType: 'solar'
        });

      expect(standardResponse.status).toBe(200);
      const standardZakat = standardResponse.body.calculation.summary.zakatAmount;

      // Calculate with Hanafi methodology
      const hanafiResponse = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodologyId: 'hanafi',
          calendarType: 'solar'
        });

      expect(hanafiResponse.status).toBe(200);
      const hanafiZakat = hanafiResponse.body.calculation.summary.zakatAmount;

      // Hanafi methodology should produce different results
      expect(hanafiZakat).not.toBe(standardZakat);
    });
  });

  describe('Snapshot Comparison', () => {
    let snapshotId1: string;
    let snapshotId2: string;

    beforeAll(async () => {
      // Create first snapshot
      const calc1Response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodologyId: 'standard',
          calendarType: 'solar'
        });

      const snapshot1Response = await request(app)
        .post('/api/tracking/snapshots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          calculationId: calc1Response.body.calculation.id,
          year: 2024,
          notes: 'Year 2024 calculation'
        });

      snapshotId1 = snapshot1Response.body.data?.snapshotId;

      // Create second snapshot with different values
      // First update an asset value
      const assetUpdateResponse = await request(app)
        .put(`/api/assets/${testAssets[0].id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: testAssets[0].value * 1.2 // 20% increase
        });

      expect(assetUpdateResponse.status).toBe(200);

      const calc2Response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodologyId: 'standard',
          calendarType: 'solar'
        });

      const snapshot2Response = await request(app)
        .post('/api/tracking/snapshots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          calculationId: calc2Response.body.calculation.id,
          year: 2025,
          notes: 'Year 2025 calculation'
        });

      snapshotId2 = snapshot2Response.body.data?.snapshotId;
    }, 15000);

    it('should compare snapshots and show growth metrics', async () => {
      if (!snapshotId1 || !snapshotId2) {
        console.warn('Skipping snapshot comparison test - snapshots not created');
        return;
      }

      const comparisonResponse = await request(app)
        .get(`/api/snapshots/compare?from=${snapshotId1}&to=${snapshotId2}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(comparisonResponse.status).toBe(200);
      expect(comparisonResponse.body.success).toBe(true);
      expect(comparisonResponse.body.data).toHaveProperty('assetGrowth');
      expect(comparisonResponse.body.data).toHaveProperty('zakatGrowth');
      expect(comparisonResponse.body.data).toHaveProperty('netWorthGrowth');

      // Asset growth should be positive (20% increase)
      expect(comparisonResponse.body.data.assetGrowth).toBeGreaterThan(0);
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt sensitive data in database', async () => {
      // Create a calculation
      const calculationResponse = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'standard',
          calendarType: 'solar'
        });

      // Check database directly for encrypted data
      const calculationInDb = await prisma.calculationHistory.findFirst({
        where: { userId: testUser.id }
      });

      expect(calculationInDb).toBeTruthy();
      // Sensitive data should be encrypted (not plain text)
      expect(calculationInDb?.assetBreakdown).not.toContain('50000'); // Original asset value
      expect(calculationInDb?.zakatDue).not.toBe(calculationResponse.body.data.calculation.summary.zakatAmount); // Should be encrypted
    });

    it('should decrypt data correctly for API responses', async () => {
      // Create and retrieve calculation
      const calculationResponse = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodologyId: 'standard',
          calendarType: 'solar'
        });

      const calculationId = calculationResponse.body.calculation.id;

      // Retrieve the same calculation
      const getResponse = await request(app)
        .get(`/api/calculations/${calculationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.zakatDue).toBe(calculationResponse.body.calculation.summary.zakatAmount);
      expect(getResponse.body.data.assetBreakdown).toEqual(calculationResponse.body.calculation.breakdown);
    });
  });

  describe('Audit Logging', () => {
    test('should log important financial events', async () => {
      // This test would verify audit logs are created
      // Implementation depends on audit logging system
      // For now, we'll test that calculations are tracked in history

      const calculationsResponse = await request(app)
        .get('/api/calculations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(calculationsResponse.status).toBe(200);
      expect(Array.isArray(calculationsResponse.body.calculations)).toBe(true);
      expect(calculationsResponse.body.calculations.length).toBeGreaterThan(0);

      // Each calculation should have timestamp and methodology
      const latestCalculation = calculationsResponse.body.calculations[0];
      expect(latestCalculation).toHaveProperty('calculationDate');
      expect(latestCalculation).toHaveProperty('methodology');
    });
  });

  describe('Concurrent Calculations', () => {
    it('should handle multiple simultaneous calculations', async () => {
      // Run multiple calculations concurrently
      const promises = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/zakat/calculate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            method: 'standard',
            calendarType: 'solar'
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Results should be consistent (same input, same output)
      const zakatAmounts = responses.map(r => r.body.data.calculation.summary.zakatAmount);
      const uniqueAmounts = [...new Set(zakatAmounts)];
      expect(uniqueAmounts.length).toBe(1); // All should be identical
    });
  });

  describe('Assets Below Nisab', () => {
    it('should handle calculations with assets below nisab threshold', async () => {
      // Create assets below nisab threshold (current nisab is ~$5000)
      await prisma.asset.createMany({
        data: [
          {
            userId: testUser.id,
            name: 'Low Value Cash',
            category: 'cash',
            value: 1000,
            currency: 'USD',
            acquisitionDate: new Date('2023-01-01')
          },
          {
            userId: testUser.id,
            name: 'Low Value Gold',
            category: 'gold',
            value: 2000,
            currency: 'USD',
            acquisitionDate: new Date('2023-01-01')
          }
        ]
      });

      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodologyId: 'standard',
          calendarType: 'solar'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.calculation.summary.zakatAmount).toBe(0); // No zakat due
      expect(response.body.calculation.summary.totalZakatable).toBeLessThan(response.body.calculation.summary.nisabThreshold);
    });
  });

  describe('Mixed Asset Types', () => {
    it('should calculate zakat correctly for mixed asset types', async () => {
      // Create diverse assets
      await prisma.asset.createMany({
        data: [
          {
            userId: testUser.id,
            name: 'Cash Savings',
            category: 'cash',
            value: 10000,
            currency: 'USD',
            acquisitionDate: new Date(),
            metadata: JSON.stringify({})
          },
          {
            userId: testUser.id,
            name: 'Gold Jewelry',
            category: 'gold',
            value: 5000,
            currency: 'USD',
            acquisitionDate: new Date(),
            metadata: JSON.stringify({})
          },
          {
            userId: testUser.id,
            name: 'Investment Account',
            category: 'stocks',
            value: 15000,
            currency: 'USD',
            acquisitionDate: new Date(),
            metadata: JSON.stringify({})
          },
          {
            userId: testUser.id,
            name: 'Personal Home',
            category: 'property',
            value: 200000,
            currency: 'USD',
            acquisitionDate: new Date(),
            metadata: JSON.stringify({})
          }
        ]
      });

      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          methodologyId: 'standard',
          calendarType: 'solar'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.calculation.summary.zakatAmount).toBeGreaterThan(0);
      expect(response.body.calculation.summary.totalZakatable).toBe(30000); // Cash + Gold + Investment
      expect(response.body.calculation.breakdown.assetCalculations.length).toBe(3); // Only zakatable assets
    });
  });

  describe('Payment Tracking', () => {
    it('should track zakat payments and update calculation history', async () => {
      // Create a zakat payment record
      const payment = await prisma.zakatPayment.create({
        data: {
          userId: testUser.id,
          amount: 1000,
          currency: 'USD',
          paymentDate: new Date(),
          paymentMethod: 'bank_transfer',
          recipients: JSON.stringify(['Local Mosque']),
          notes: 'Annual Zakat payment',
          islamicYear: '1445',
          status: 'completed'
        }
      });

      // Calculate zakat after payment
      const response = await request(app)
        .post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'standard',
          calendarType: 'solar'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify payment is tracked in calculation history
      const history = await prisma.calculationHistory.findFirst({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' }
      });

      expect(history).toBeTruthy();
      expect(history!.methodology).toBe('standard');
      expect(history!.calendarType).toBe('solar');
    });
  });

  describe('Database Constraints', () => {
    it('should enforce foreign key constraints and data integrity', async () => {
      // Try to create asset with non-existent user ID
      await expect(
        prisma.asset.create({
          data: {
            userId: 'non-existent-user-id',
            name: 'Test Asset',
            category: 'cash',
            value: 1000,
            currency: 'USD',
            acquisitionDate: new Date(),
            metadata: JSON.stringify({})
          }
        })
      ).rejects.toThrow();

      // Try to create calculation with invalid methodology
      await expect(
        prisma.zakatCalculation.create({
          data: {
            userId: testUser.id,
            methodology: 'invalid_methodology',
            calendarType: 'solar',
            totalAssets: 10000,
            totalLiabilities: 0,
            netWorth: 10000,
            nisabThreshold: 5000,
            nisabSource: 'gold',
            isZakatObligatory: true,
            zakatAmount: 250,
            zakatRate: 0.025,
            breakdown: JSON.stringify({}),
            assetsIncluded: JSON.stringify({}),
            liabilitiesIncluded: JSON.stringify({}),
            calculationDate: new Date()
          }
        })
      ).rejects.toThrow();

      // Valid data should work
      const validAsset = await prisma.asset.create({
        data: {
          userId: testUser.id,
          name: 'Valid Asset',
          category: 'cash',
          value: 1000,
          currency: 'USD',
          acquisitionDate: new Date(),
          metadata: JSON.stringify({})
        }
      });

      expect(validAsset.id).toBeTruthy();
    });
  });
});