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
  let encryptionService: EncryptionService;

  beforeAll(async () => {
    encryptionService = EncryptionService.getInstance();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.nisabYearRecord.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and get auth token
    const authResult = await authHelpers.createAuthenticatedUser();
    authToken = authResult.token;
    userId = authResult.userId;
  });

  afterEach(async () => {
    await prisma.nisabYearRecord.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.user.deleteMany();
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

      const record = await prisma.nisabYearRecord.create({
        data: {
          userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: encryptionService.encrypt('5000'),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: encryptionService.encrypt('8000'),
          totalLiabilities: encryptionService.encrypt('0'),
          zakatableWealth: encryptionService.encrypt('8000'),
          zakatAmount: encryptionService.encrypt('200'),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: encryptionService.encrypt(JSON.stringify(initialSnapshot)),
          calculationDetails: encryptionService.encrypt(JSON.stringify({})),
          isPrimary: false,
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
      expect(response.body.assets).toHaveLength(3);
      
      const assetNames = response.body.assets.map((a: any) => a.name);
      expect(assetNames).toContain('Initial Cash');
      expect(assetNames).toContain('Initial Bitcoin');
      expect(assetNames).toContain('New Gold Investment');

      // Verify asset structure
      const goldAsset = response.body.assets.find(
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

      // Step 6: Verify record is NOT updated (refresh doesn't persist)
      const unchangedRecord = await prisma.nisabYearRecord.findUnique({
        where: { id: record.id },
      });
      
      const storedSnapshot = JSON.parse(
        encryptionService.decrypt(unchangedRecord!.assetBreakdown)
      );
      expect(storedSnapshot.assets).toHaveLength(2); // Still original 2 assets
    });

    it('should return 400 for FINALIZED record', async () => {
      // Create FINALIZED record
      const record = await prisma.nisabYearRecord.create({
        data: {
          userId,
          hawlStartDate: new Date('2024-01-01'),
          hawlStartDateHijri: '1445-06-01',
          hawlCompletionDate: new Date('2024-12-20'),
          hawlCompletionDateHijri: '1446-06-01',
          nisabThresholdAtStart: encryptionService.encrypt('5000'),
          nisabBasis: 'gold',
          calculationDate: new Date('2024-12-20'),
          gregorianYear: 2024,
          gregorianMonth: 12,
          gregorianDay: 20,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: encryptionService.encrypt('10000'),
          totalLiabilities: encryptionService.encrypt('0'),
          zakatableWealth: encryptionService.encrypt('10000'),
          zakatAmount: encryptionService.encrypt('250'),
          methodologyUsed: 'standard',
          status: 'FINALIZED',
          finalizedAt: new Date('2024-12-20'),
          assetBreakdown: encryptionService.encrypt(JSON.stringify({ assets: [] })),
          calculationDetails: encryptionService.encrypt(JSON.stringify({})),
          isPrimary: false,
        },
      });

      // Try to refresh FINALIZED record
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('CANNOT_REFRESH_FINALIZED');
      expect(response.body.message).toMatch(/cannot refresh.*finalized/i);
    });

    it('should return 400 for UNLOCKED record', async () => {
      // Create UNLOCKED record
      const record = await prisma.nisabYearRecord.create({
        data: {
          userId,
          hawlStartDate: new Date('2024-01-01'),
          hawlStartDateHijri: '1445-06-01',
          hawlCompletionDate: new Date('2024-12-20'),
          hawlCompletionDateHijri: '1446-06-01',
          nisabThresholdAtStart: encryptionService.encrypt('5000'),
          nisabBasis: 'gold',
          calculationDate: new Date('2024-12-20'),
          gregorianYear: 2024,
          gregorianMonth: 12,
          gregorianDay: 20,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: encryptionService.encrypt('10000'),
          totalLiabilities: encryptionService.encrypt('0'),
          zakatableWealth: encryptionService.encrypt('10000'),
          zakatAmount: encryptionService.encrypt('250'),
          methodologyUsed: 'standard',
          status: 'UNLOCKED',
          finalizedAt: new Date('2024-12-20'),
          assetBreakdown: encryptionService.encrypt(JSON.stringify({ assets: [] })),
          calculationDetails: encryptionService.encrypt(JSON.stringify({})),
          isPrimary: false,
        },
      });

      // Try to refresh UNLOCKED record
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('DRAFT');
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
      const record = await prisma.nisabYearRecord.create({
        data: {
          userId: otherUser.userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: encryptionService.encrypt('5000'),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: encryptionService.encrypt('10000'),
          totalLiabilities: encryptionService.encrypt('0'),
          zakatableWealth: encryptionService.encrypt('10000'),
          zakatAmount: encryptionService.encrypt('250'),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: encryptionService.encrypt(JSON.stringify({ assets: [] })),
          calculationDetails: encryptionService.encrypt(JSON.stringify({})),
          isPrimary: false,
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
      const record = await prisma.nisabYearRecord.create({
        data: {
          userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: encryptionService.encrypt('5000'),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: encryptionService.encrypt('8000'),
          totalLiabilities: encryptionService.encrypt('0'),
          zakatableWealth: encryptionService.encrypt('8000'),
          zakatAmount: encryptionService.encrypt('200'),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: encryptionService.encrypt(JSON.stringify({ assets: [] })),
          calculationDetails: encryptionService.encrypt(JSON.stringify({})),
          isPrimary: false,
        },
      });

      // Delete one asset
      await prisma.asset.delete({ where: { id: assets[1].id } });

      // Refresh should return only remaining asset
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.assets).toHaveLength(1);
      expect(response.body.assets[0].name).toBe('Asset 1');
    });

    it('should only return zakatable assets', async () => {
      // Create mix of zakatable and non-zakatable assets
      await assetHelpers.createAsset(
        userId,
        { name: 'Cash', category: 'cash', value: 5000, isZakatable: true },
        authToken
      );
      await assetHelpers.createAsset(
        userId,
        { name: 'House', category: 'real_estate', value: 250000, isZakatable: false },
        authToken
      );
      await assetHelpers.createAsset(
        userId,
        { name: 'Gold', category: 'gold', value: 3000, isZakatable: true },
        authToken
      );

      // Create DRAFT record
      const record = await prisma.nisabYearRecord.create({
        data: {
          userId,
          hawlStartDate: new Date('2025-01-01'),
          hawlStartDateHijri: '1446-06-01',
          hawlCompletionDate: new Date('2025-12-20'),
          hawlCompletionDateHijri: '1447-06-01',
          nisabThresholdAtStart: encryptionService.encrypt('5000'),
          nisabBasis: 'gold',
          calculationDate: new Date('2025-01-01'),
          gregorianYear: 2025,
          gregorianMonth: 1,
          gregorianDay: 1,
          hijriYear: 1446,
          hijriMonth: 6,
          hijriDay: 1,
          totalWealth: encryptionService.encrypt('8000'),
          totalLiabilities: encryptionService.encrypt('0'),
          zakatableWealth: encryptionService.encrypt('8000'),
          zakatAmount: encryptionService.encrypt('200'),
          methodologyUsed: 'standard',
          status: 'DRAFT',
          assetBreakdown: encryptionService.encrypt(JSON.stringify({ assets: [] })),
          calculationDetails: encryptionService.encrypt(JSON.stringify({})),
          isPrimary: false,
        },
      });

      // Refresh should return only zakatable assets
      const response = await request(app)
        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.assets).toHaveLength(2);
      const assetNames = response.body.assets.map((a: any) => a.name);
      expect(assetNames).toContain('Cash');
      expect(assetNames).toContain('Gold');
      expect(assetNames).not.toContain('House');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/nisab-year-records/some-id/assets/refresh')
        .expect(401);
    });
  });
});
