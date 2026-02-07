import { describe, it, expect, beforeEach, afterEach, afterAll, vi, type Mock } from 'vitest';
/**
 * Integration Test: Asset Refresh Workflow
 * Purpose: Test asset refresh functionality for DRAFT Nisab Year Records
 * Requirements: FR-032a
 * Expected: FAIL (endpoint doesn't exist yet) - TDD approach
 */

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { EncryptionService } from '../../src/services/EncryptionService';
import { authHelpers } from '../helpers/authHelpers';
import { assetHelpers } from '../helpers/assetHelpers';

describe('Asset Refresh Workflow Integration Test', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create test user and get auth token
    const authResult = await authHelpers.createAuthenticatedUser();
    authToken = authResult.token;
    userId = authResult.userId;
  });

  afterEach(async () => {
    if (userId) {
      await prisma.user.delete({
        where: { id: userId },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/nisab-year-records/:id/assets/refresh', () => {
    it('should return current assets for DRAFT record', async () => {
      // Step 1: Create initial assets
      const initialAssets = [
        {
          name: 'Initial Cash',
          category: 'cash',
          value: 5000,
          isZakatable: true,
        },
        {
          name: 'Initial Bitcoin',
          category: 'crypto',
          value: 3000,
          isZakatable: true,
        },
      ];

      const createdAssets = await Promise.all(
        initialAssets.map((asset) =>
          assetHelpers.createAsset(userId, asset, authToken)
        )
      );

      // Step 2: Create DRAFT Nisab Year Record with asset snapshot
      const initialSnapshot = {
        assets: createdAssets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          category: asset.category,
          value: asset.value,
          isZakatable: asset.isZakatable,
          addedAt: asset.createdAt,
        })),
        capturedAt: new Date().toISOString(),
        totalWealth: 8000,
        zakatableWealth: 8000,
      };

      const record = await prisma.yearlySnapshot.create({
        data: {
          userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: JSON.stringify(EncryptionService.encrypt('8000')),
          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
          zakatableWealth: JSON.stringify(EncryptionService.encrypt('8000')),
          zakatAmount: JSON.stringify(EncryptionService.encrypt('200')),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify(initialSnapshot))),
          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
          isPrimary: false,
          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabType: 'gold',
        },
      });

      // Step 3: Add new asset to user
      const newAsset = await assetHelpers.createAsset(
        userId,
        {
          name: 'New Gold Investment',
          category: 'gold',
          value: 2500,
          isZakatable: true,
        },
        authToken
      );

      // Step 4: Call refresh endpoint
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 5: Verify response includes NEW asset
      expect(response.body.success).toBe(true);
      expect(response.body.data.assets).toHaveLength(3);
      
      const assetNames = response.body.data.assets.map((a: any) => a.name);
      expect(assetNames).toContain('Initial Cash');
      expect(assetNames).toContain('Initial Bitcoin');
      expect(assetNames).toContain('New Gold Investment');

      // Verify asset structure
      const goldAsset = response.body.data.assets.find(
        (a: any) => a.name === 'New Gold Investment'
      );
      expect(goldAsset).toMatchObject({
        id: newAsset.id,
        name: 'New Gold Investment',
        category: 'gold',
        value: 2500,
        isZakatable: true,
      });
      expect(goldAsset.addedAt).toBeDefined();

      // Verify totals returned include zakatableValue and zakatableWealth matches sum of zakatableValue
      // All created assets are fully zakatable (modifier 1.0) so zakatableWealth should equal total wealth
      expect(response.body.data).toHaveProperty('totalWealth');
      expect(response.body.data).toHaveProperty('zakatableWealth');
      expect(response.body.data.totalWealth).toBe(5000 + 3000 + 2500);
      expect(response.body.data.zakatableWealth).toBe(5000 + 3000 + 2500);

      // Step 6: Verify record is NOT updated (refresh doesn't persist)
      const unchangedRecord = await prisma.yearlySnapshot.findUnique({
        where: { id: record.id },
      });
      
      const storedSnapshot = JSON.parse(
        EncryptionService.decrypt(unchangedRecord!.assetBreakdown)
      );
      expect(storedSnapshot.assets).toHaveLength(2); // Still original 2 assets
    });

    it('should return 400 for FINALIZED record', async () => {
      // Create FINALIZED record
      const record = await prisma.yearlySnapshot.create({
        data: {
          userId,
          hawlStartDate: new Date('2024-01-01'),
          hawlStartDateHijri: '1445-06-01',
          hawlCompletionDate: new Date('2024-12-20'),
          hawlCompletionDateHijri: '1446-06-01',
          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabBasis: 'gold',
          calculationDate: new Date('2024-12-20'),
          gregorianYear: 2024,
          gregorianMonth: 12,
          gregorianDay: 20,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: JSON.stringify(EncryptionService.encrypt('10000')),
          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
          zakatableWealth: JSON.stringify(EncryptionService.encrypt('10000')),
          zakatAmount: JSON.stringify(EncryptionService.encrypt('250')),
          methodologyUsed: 'standard',
          status: 'FINALIZED',
          finalizedAt: new Date('2024-12-20'),
          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
          isPrimary: false,
          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabType: 'gold',
        },
      });

      // Try to refresh FINALIZED record
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('INVALID_STATUS');
      expect(response.body.message).toMatch(/Can only refresh assets for DRAFT records/i);
    });

    it('should return 400 for UNLOCKED record', async () => {
      // Create UNLOCKED record
      const record = await prisma.yearlySnapshot.create({
        data: {
          userId,
          hawlStartDate: new Date('2024-01-01'),
          hawlStartDateHijri: '1445-06-01',
          hawlCompletionDate: new Date('2024-12-20'),
          hawlCompletionDateHijri: '1446-06-01',
          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabBasis: 'gold',
          calculationDate: new Date('2024-12-20'),
          gregorianYear: 2024,
          gregorianMonth: 12,
          gregorianDay: 20,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: JSON.stringify(EncryptionService.encrypt('10000')),
          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
          zakatableWealth: JSON.stringify(EncryptionService.encrypt('10000')),
          zakatAmount: JSON.stringify(EncryptionService.encrypt('250')),
          methodologyUsed: 'standard',
          status: 'UNLOCKED',
          finalizedAt: new Date('2024-12-20'),
          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
          isPrimary: false,
          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabType: 'gold',
        },
      });

      // Try to refresh UNLOCKED record
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_STATUS');
    });

    it('should return 404 for non-existent record', async () => {
      const fakeId = 'clxxxxxxxxxxxxxxxxxxxxxxxx';

      await request(app)
        .get(`/api/nisab-year-records/${fakeId}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 when accessing another user\'s record', async () => {
      // Create another user
      const otherUser = await authHelpers.createAuthenticatedUser();

      // Create record for other user
      const record = await prisma.yearlySnapshot.create({
        data: {
          userId: otherUser.userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: JSON.stringify(EncryptionService.encrypt('10000')),
          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
          zakatableWealth: JSON.stringify(EncryptionService.encrypt('10000')),
          zakatAmount: JSON.stringify(EncryptionService.encrypt('250')),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
          isPrimary: false,
          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabType: 'gold',
        },
      });

      // Try to access with original user's token
      await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should handle assets deleted after record creation', async () => {
      // Create assets
      const assets = await Promise.all([
        assetHelpers.createAsset(
          userId,
          { name: 'Asset 1', category: 'cash', value: 5000, isZakatable: true },
          authToken
        ),
        assetHelpers.createAsset(
          userId,
          { name: 'Asset 2', category: 'crypto', value: 3000, isZakatable: true },
          authToken
        ),
      ]);

      // Create DRAFT record
      const record = await prisma.yearlySnapshot.create({
        data: {
          userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: JSON.stringify(EncryptionService.encrypt('8000')),
          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
          zakatableWealth: JSON.stringify(EncryptionService.encrypt('8000')),
          zakatAmount: JSON.stringify(EncryptionService.encrypt('200')),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
          isPrimary: false,
          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabType: 'gold',
        },
      });

      // Delete one asset
      await prisma.asset.delete({ where: { id: assets[1].id } });

      // Refresh should return only remaining asset
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.assets).toHaveLength(1);
      expect(response.body.data.assets[0].name).toBe('Asset 1');
    });

    it('should only return zakatable assets', async () => {
      // Create mix of zakatable and non-zakatable assets
      await assetHelpers.createAsset(
        userId,
        { name: 'Cash', category: 'cash', value: 5000, isZakatable: true },
        authToken
      );
      // Add a passive asset to ensure zakatableValue is lower
      await assetHelpers.createAsset(
        userId,
        { name: 'Passive Fund', category: 'stocks', value: 6000, isZakatable: true, isPassiveInvestment: true },
        authToken
      );
      await assetHelpers.createAsset(
        userId,
        { name: 'House', category: 'property', value: 250000, isZakatable: false },
        authToken
      );
      await assetHelpers.createAsset(
        userId,
        { name: 'Gold', category: 'gold', value: 3000, isZakatable: true },
        authToken
      );

      // Create DRAFT record
      const record = await prisma.yearlySnapshot.create({
        data: {
          userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: JSON.stringify(EncryptionService.encrypt('8000')),
          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
          zakatableWealth: JSON.stringify(EncryptionService.encrypt('8000')),
          zakatAmount: JSON.stringify(EncryptionService.encrypt('200')),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
          isPrimary: false,
          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabType: 'gold',
        },
      });

      // Refresh should return only zakatable assets
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      // Should include three zakatable assets (Cash, Passive Fund, Gold)
      expect(response.body.data.assets).toHaveLength(3);
      const assetNames = response.body.data.assets.map((a: any) => a.name);
      expect(assetNames).toContain('Cash');
      expect(assetNames).toContain('Gold');
      expect(assetNames).toContain('Passive Fund');
      expect(assetNames).not.toContain('House');

      // Verify Passive Fund has a reduced zakatableValue (0.3 * 6000 = 1800)
      const passive = response.body.data.assets.find((a: any) => a.name === 'Passive Fund');
      expect(passive).toBeDefined();
      expect(passive.zakatableValue).toBe(6000 * 0.3);

      // Verify the returned zakatableWealth equals the sum of per-asset zakatableValue
      const expectedZakatable = response.body.data.assets.reduce((s: number, a: any) => s + (a.zakatableValue ?? a.value), 0);
      expect(response.body.data.zakatableWealth).toBe(expectedZakatable);
    });

    it('should allow updating record with refreshed assets and persist zakatable wealth correctly', async () => {
      // Create assets including a passive one
      const a1 = await assetHelpers.createAsset(userId, { name: 'Cash', category: 'cash', value: 600, isZakatable: true }, authToken);
      const a2 = await assetHelpers.createAsset(userId, { name: 'Passive Stock', category: 'stocks', value: 6000, isZakatable: true, isPassiveInvestment: true }, authToken);

      // Create DRAFT record
      const record = await prisma.yearlySnapshot.create({
        data: {
          userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: JSON.stringify(EncryptionService.encrypt('0')),
          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
          zakatableWealth: JSON.stringify(EncryptionService.encrypt('0')),
          zakatAmount: JSON.stringify(EncryptionService.encrypt('0')),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
          isPrimary: false,
          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
          nisabType: 'gold',
        }
      });

      // Refresh to get current assets
      const refreshRes = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const available = refreshRes.body.data.assets;
      // Select all assets returned
      const selected = available.map((a: any) => a);

      const totalWealth = selected.reduce((s: number, a: any) => s + a.value, 0);
      const zakatableWealth = selected.reduce((s: number, a: any) => s + (a.zakatableValue ?? a.value), 0);
      const zakatAmount = zakatableWealth * 0.025;

      // Update the record with assetBreakdown including zakatableValue
      await request(app)
        .put(`/api/nisab-year-records/${record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetBreakdown: {
            assets: selected.map((a: any) => ({ id: a.id, name: a.name, category: a.category, value: a.value, isZakatable: a.isZakatable, zakatableValue: a.zakatableValue, calculationModifier: a.calculationModifier, addedAt: a.addedAt })),
            capturedAt: new Date().toISOString(),
            totalWealth,
            zakatableWealth,
          },
          totalWealth: totalWealth.toString(),
          zakatableWealth: zakatableWealth.toString(),
          zakatAmount: zakatAmount.toString(),
        })
        .expect(200);

      // Read the stored record and verify encrypted assetBreakdown was saved and contains correct zakatableWealth
      const stored = await prisma.yearlySnapshot.findUnique({ where: { id: record.id } });
      const decrypted = JSON.parse(EncryptionService.decrypt(stored!.assetBreakdown));
      expect(Number(decrypted.zakatableWealth)).toBe(zakatableWealth);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/nisab-year-records/some-id/assets/refresh')
        .expect(401);
    });
  });
});
