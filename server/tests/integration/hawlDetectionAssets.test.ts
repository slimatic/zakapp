/**
 * Integration Test: Automatic Asset Inclusion in Background Job
 * Purpose: Test that Hawl detection job automatically includes assets in DRAFT records
 * Requirements: FR-014, FR-011a
 * Expected: FAIL (asset snapshot logic doesn't exist yet) - TDD approach
 */

import { prisma } from '../../src/lib/prisma';
import { EncryptionService } from '../../src/services/EncryptionService';
import { HawlTrackingService } from '../../src/services/hawlTrackingService';
import { authHelpers } from '../helpers/authHelpers';
import { assetHelpers } from '../helpers/assetHelpers';

// Type for asset breakdown structure
interface AssetSnapshotItem {
  id: string;
  name: string;
  category: string;
  value: number;
  isZakatable: boolean;
  addedAt: string | Date;
}

interface AssetBreakdown {
  assets: AssetSnapshotItem[];
  capturedAt: string;
  totalWealth: number;
  zakatableWealth: number;
}

describe('Automatic Asset Inclusion in Hawl Detection', () => {
  let hawlTrackingService: HawlTrackingService;
  let userId: string;
  let authToken: string;

  beforeAll(async () => {
    hawlTrackingService = new HawlTrackingService();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.yearlySnapshot.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.preciousMetalPrice.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const authResult = await authHelpers.createAuthenticatedUser();
    userId = authResult.userId;
    authToken = authResult.token;

    // Set up Nisab threshold (using gold: 87.48g * $70/g = $6,123.60)
    await prisma.preciousMetalPrice.create({
      data: {
        metal: 'gold',
        pricePerGram: 70.0,
        currency: 'USD',
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
  });

  afterEach(async () => {
    await prisma.yearlySnapshot.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.preciousMetalPrice.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Asset Snapshot Creation', () => {
    it('should create DRAFT record with assetBreakdown populated when Nisab achieved', async () => {
      // Create assets that exceed Nisab threshold ($6,123.60)
      const assets = await Promise.all([
        assetHelpers.createAsset(
          userId,
          {
            name: 'Savings Account',
            category: 'cash',
            value: 5000,
            isZakatable: true,
          },
          authToken
        ),
        assetHelpers.createAsset(
          userId,
          {
            name: 'Bitcoin',
            category: 'crypto',
            value: 3000,
            isZakatable: true,
          },
          authToken
        ),
        assetHelpers.createAsset(
          userId,
          {
            name: 'Gold Jewelry',
            category: 'gold',
            value: 2500,
            isZakatable: true,
          },
          authToken
        ),
      ]);
      // Total: 10,500 > Nisab threshold of 6,123.60

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // Verify DRAFT record was created
      const records = await prisma.yearlySnapshot.findMany({
        where: { userId },
      });

      expect(records).toHaveLength(1);
      const record = records[0];

      expect(record.status).toBe('DRAFT');
      expect(record.assetBreakdown).toBeTruthy();

      // Decrypt and verify asset breakdown
      const assetBreakdown: AssetBreakdown = JSON.parse(
        EncryptionService.decrypt(record.assetBreakdown)
      );

      // Verify JSON structure
      expect(assetBreakdown).toHaveProperty('assets');
      expect(assetBreakdown).toHaveProperty('capturedAt');
      expect(assetBreakdown).toHaveProperty('totalWealth');
      expect(assetBreakdown).toHaveProperty('zakatableWealth');

      // Verify all zakatable assets included
      expect(assetBreakdown.assets).toHaveLength(3);

      const assetIds = assetBreakdown.assets.map((a: AssetSnapshotItem) => a.id);
      expect(assetIds).toContain(assets[0].id);
      expect(assetIds).toContain(assets[1].id);
      expect(assetIds).toContain(assets[2].id);

      // Verify each asset has required fields
      assetBreakdown.assets.forEach((asset: AssetSnapshotItem) => {
        expect(asset).toHaveProperty('id');
        expect(asset).toHaveProperty('name');
        expect(asset).toHaveProperty('category');
        expect(asset).toHaveProperty('value');
        expect(asset).toHaveProperty('isZakatable');
        expect(asset).toHaveProperty('addedAt');
      });

      // Verify totals
      expect(assetBreakdown.totalWealth).toBe(10500);
      expect(assetBreakdown.zakatableWealth).toBe(10500);

      // Verify capturedAt is recent
      const capturedAt = new Date(assetBreakdown.capturedAt);
      const now = new Date();
      const diff = now.getTime() - capturedAt.getTime();
      expect(diff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should include correct asset details in snapshot', async () => {
      // Create specific asset with known values
      const asset = await assetHelpers.createAsset(
        userId,
        {
          name: 'Test Gold Bar',
          category: 'gold',
          value: 7500.50,
          isZakatable: true,
        },
        authToken
      );

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // Get created record
      const record = await prisma.yearlySnapshot.findFirst({
        where: { userId },
      });

      expect(record).toBeTruthy();

      const assetBreakdown = JSON.parse(
        EncryptionService.decrypt(record!.assetBreakdown)
      );

      const snapshotAsset = assetBreakdown.assets[0];

      expect(snapshotAsset).toMatchObject({
        id: asset.id,
        name: 'Test Gold Bar',
        category: 'gold',
        value: 7500.50,
        isZakatable: true,
      });

      // Verify addedAt is a valid ISO date
      expect(new Date(snapshotAsset.addedAt).toISOString()).toBe(
        snapshotAsset.addedAt
      );
    });

    it('should only include zakatable assets in snapshot', async () => {
      // Create mix of zakatable and non-zakatable assets
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Cash',
          category: 'cash',
          value: 5000,
          isZakatable: true,
        },
        authToken
      );
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Primary Residence',
          category: 'real_estate',
          value: 250000,
          isZakatable: false,
        },
        authToken
      );
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Gold',
          category: 'gold',
          value: 3000,
          isZakatable: true,
        },
        authToken
      );

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // Get created record
      const record = await prisma.yearlySnapshot.findFirst({
        where: { userId },
      });

      const assetBreakdown = JSON.parse(
        EncryptionService.decrypt(record!.assetBreakdown)
      );

      // Should only have 2 zakatable assets, not the residence
      expect(assetBreakdown.assets).toHaveLength(2);

      const assetNames = assetBreakdown.assets.map((a: AssetSnapshotItem) => a.name);
      expect(assetNames).toContain('Cash');
      expect(assetNames).toContain('Gold');
      expect(assetNames).not.toContain('Primary Residence');

      // totalWealth should include all assets (including non-zakatable)
      expect(assetBreakdown.totalWealth).toBe(258000);

      // zakatableWealth should only include zakatable assets
      expect(assetBreakdown.zakatableWealth).toBe(8000);
    });

    it('should encrypt assetBreakdown field', async () => {
      // Create asset above Nisab
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Savings',
          category: 'cash',
          value: 10000,
          isZakatable: true,
        },
        authToken
      );

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // Get raw record from database
      const record = await prisma.yearlySnapshot.findFirst({
        where: { userId },
      });

      // Verify assetBreakdown is encrypted (not valid JSON without decryption)
      expect(() => JSON.parse(record!.assetBreakdown)).toThrow();

      // Verify it can be decrypted
      const decrypted = EncryptionService.decrypt(record!.assetBreakdown);
      const parsed = JSON.parse(decrypted);
      expect(parsed.assets).toHaveLength(1);
    });

    it('should handle user with no assets', async () => {
      // User has no assets, so Nisab not achieved
      await hawlTrackingService.detectNisabAchievement();

      // No record should be created
      const records = await prisma.yearlySnapshot.findMany({
        where: { userId },
      });

      expect(records).toHaveLength(0);
    });

    it('should handle user with assets below Nisab', async () => {
      // Create asset below Nisab threshold ($6,123.60)
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Small Savings',
          category: 'cash',
          value: 3000,
          isZakatable: true,
        },
        authToken
      );

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // No record should be created
      const records = await prisma.yearlySnapshot.findMany({
        where: { userId },
      });

      expect(records).toHaveLength(0);
    });

    it('should create snapshot at exact moment of detection', async () => {
      // Create initial asset above Nisab
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Initial Asset',
          category: 'cash',
          value: 10000,
          isZakatable: true,
        },
        authToken
      );

      const detectionTime = new Date();

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // Immediately modify asset value
      const asset = await prisma.asset.findFirst({ where: { userId } });
      await prisma.asset.update({
        where: { id: asset!.id },
        data: { value: 5000 }, // Reduced to below Nisab
      });

      // Get created record
      const record = await prisma.yearlySnapshot.findFirst({
        where: { userId },
      });

      const assetBreakdown = JSON.parse(
        EncryptionService.decrypt(record!.assetBreakdown)
      );

      // Snapshot should still show original value (10000), not modified value (5000)
      expect(assetBreakdown.assets[0].value).toBe(10000);
      expect(assetBreakdown.totalWealth).toBe(10000);

      // Verify capturedAt is around detection time
      const capturedAt = new Date(assetBreakdown.capturedAt);
      const diff = Math.abs(capturedAt.getTime() - detectionTime.getTime());
      expect(diff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should not create duplicate records if Nisab already achieved', async () => {
      // Create assets above Nisab
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Cash',
          category: 'cash',
          value: 10000,
          isZakatable: true,
        },
        authToken
      );

      // Run detection first time
      await hawlTrackingService.detectNisabAchievement();

      const firstRecords = await prisma.yearlySnapshot.findMany({
        where: { userId },
      });
      expect(firstRecords).toHaveLength(1);

      // Run detection second time
      await hawlTrackingService.detectNisabAchievement();

      const secondRecords = await prisma.yearlySnapshot.findMany({
        where: { userId },
      });

      // Should still only have 1 record
      expect(secondRecords).toHaveLength(1);
      expect(secondRecords[0].id).toBe(firstRecords[0].id);
    });

    it('should handle assets with zero value', async () => {
      // Create assets including one with zero value
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Active Account',
          category: 'cash',
          value: 7000,
          isZakatable: true,
        },
        authToken
      );
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Empty Account',
          category: 'cash',
          value: 0,
          isZakatable: true,
        },
        authToken
      );

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // Get created record
      const record = await prisma.yearlySnapshot.findFirst({
        where: { userId },
      });

      const assetBreakdown = JSON.parse(
        EncryptionService.decrypt(record!.assetBreakdown)
      );

      // Both assets should be included
      expect(assetBreakdown.assets).toHaveLength(2);

      const emptyAccount = assetBreakdown.assets.find(
        (a: AssetSnapshotItem) => a.name === 'Empty Account'
      );
      expect(emptyAccount?.value).toBe(0);

      // Totals should still be correct
      expect(assetBreakdown.totalWealth).toBe(7000);
      expect(assetBreakdown.zakatableWealth).toBe(7000);
    });

    it('should preserve asset order by addedAt date', async () => {
      // Create assets at different times
      await assetHelpers.createAsset(
        userId,
        {
          name: 'First Asset',
          category: 'cash',
          value: 3000,
          isZakatable: true,
        },
        authToken
      );

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      await assetHelpers.createAsset(
        userId,
        {
          name: 'Second Asset',
          category: 'gold',
          value: 4000,
          isZakatable: true,
        },
        authToken
      );

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // Get created record
      const record = await prisma.yearlySnapshot.findFirst({
        where: { userId },
      });

      const assetBreakdown = JSON.parse(
        EncryptionService.decrypt(record!.assetBreakdown)
      );

      // Assets should be in chronological order
      expect(assetBreakdown.assets[0].name).toBe('First Asset');
      expect(assetBreakdown.assets[1].name).toBe('Second Asset');

      // Verify timestamps
      const firstAddedAt = new Date(assetBreakdown.assets[0].addedAt);
      const secondAddedAt = new Date(assetBreakdown.assets[1].addedAt);
      expect(firstAddedAt.getTime()).toBeLessThan(secondAddedAt.getTime());
    });
  });

  describe('JSON Structure Validation', () => {
    it('should match exact assetBreakdown JSON structure', async () => {
      // Create test asset
      await assetHelpers.createAsset(
        userId,
        {
          name: 'Test Asset',
          category: 'cash',
          value: 10000,
          isZakatable: true,
        },
        authToken
      );

      // Run Hawl detection job
      await hawlTrackingService.detectNisabAchievement();

      // Get created record
      const record = await prisma.yearlySnapshot.findFirst({
        where: { userId },
      });

      const assetBreakdown = JSON.parse(
        EncryptionService.decrypt(record!.assetBreakdown)
      );

      // Verify exact structure matches specification
      expect(assetBreakdown).toEqual({
        assets: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            category: expect.any(String),
            value: expect.any(Number),
            isZakatable: expect.any(Boolean),
            addedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/), // ISO date
          }),
        ]),
        capturedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/), // ISO date
        totalWealth: expect.any(Number),
        zakatableWealth: expect.any(Number),
      });

      // Verify no extra fields
      const allowedKeys = ['assets', 'capturedAt', 'totalWealth', 'zakatableWealth'];
      const actualKeys = Object.keys(assetBreakdown);
      expect(actualKeys.sort()).toEqual(allowedKeys.sort());
    });
  });
});
