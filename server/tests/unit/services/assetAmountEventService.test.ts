import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AssetAmountEventService } from '../../../src/services/AssetAmountEventService';

// Mock dependencies
vi.mock('../../../src/utils/prisma', () => {
  const mockPrisma = {
    asset: {
      findFirst: vi.fn(),
    },
    assetAmountEvent: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
    auditTrailEntry: {
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

vi.mock('../../../src/services/AssetAmountSnapshotService', () => {
  return {
    AssetAmountSnapshotService: vi.fn().mockImplementation(() => ({
      regenerateForDateRange: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('AssetAmountEventService', () => {
  let service: AssetAmountEventService;
  let mockPrisma: any;

  beforeEach(async () => {
    // Import after mocks are set up
    const { prisma } = await import('../../../src/utils/prisma');
    mockPrisma = prisma;
    
    service = new AssetAmountEventService();
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    const userId = 'user1';
    const assetId = 'asset1';
    
    it('should create a CREATED event successfully', async () => {
      // Setup mocks
      mockPrisma.asset.findFirst.mockResolvedValue({
        id: assetId,
        userId,
        name: 'Test Asset',
        category: 'cash',
        currency: 'USD',
      });
      
      mockPrisma.assetAmountEvent.create.mockResolvedValue({
        id: 'event1',
        assetId,
        eventType: 'CREATED',
        amount: 1000,
        effectiveDate: new Date('2024-01-15'),
        userId,
      });
      
      mockPrisma.auditTrailEntry.create.mockResolvedValue({ id: 'audit1' });

      const result = await service.createEvent(userId, {
        assetId,
        eventType: 'CREATED',
        amount: 1000,
        effectiveDate: new Date('2024-01-15'),
        description: 'Initial value',
      });

      expect(result).toBeDefined();
      expect(result.assetId).toBe(assetId);
      expect(mockPrisma.assetAmountEvent.create).toHaveBeenCalled();
    });

    it('should throw error if asset not found', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue(null);

      await expect(
        service.createEvent(userId, {
          assetId: 'nonexistent',
          eventType: 'CREATED',
          amount: 1000,
          effectiveDate: new Date(),
        })
      ).rejects.toThrow('Asset not found');
    });

    it('should throw error if CORRECTION without originalEventId', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue({
        id: assetId,
        userId,
      });

      await expect(
        service.createEvent(userId, {
          assetId,
          eventType: 'CORRECTION',
          amount: 500,
          effectiveDate: new Date(),
        })
      ).rejects.toThrow('CORRECTION events require originalEventId');
    });
  });

  describe('getAssetHistory', () => {
    const userId = 'user1';
    const assetId = 'asset1';

    it('should retrieve asset history successfully', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue({
        id: assetId,
        userId,
      });

      const mockHistory = [
        { id: 'event1', eventType: 'CREATED', amount: 1000, effectiveDate: new Date('2024-01-01') },
        { id: 'event2', eventType: 'UPDATED', amount: 1500, effectiveDate: new Date('2024-06-01') },
      ];
      
      mockPrisma.assetAmountEvent.findMany.mockResolvedValue(mockHistory);

      const result = await service.getAssetHistory(assetId, userId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.assetAmountEvent.findMany).toHaveBeenCalled();
    });

    it('should apply date filters correctly', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue({ id: assetId, userId });
      mockPrisma.assetAmountEvent.findMany.mockResolvedValue([]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.getAssetHistory(assetId, userId, { startDate, endDate });

      // Verify findMany was called
      expect(mockPrisma.assetAmountEvent.findMany).toHaveBeenCalled();
    });
  });

  describe('getAssetAmountAtDate', () => {
    const userId = 'user1';
    const assetId = 'asset1';

    it('should return amount at specific date', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue({ id: assetId, userId });
      mockPrisma.assetAmountEvent.findFirst.mockResolvedValue({
        amount: 1000,
        effectiveDate: new Date('2024-06-15'),
      });

      const result = await service.getAssetAmountAtDate(assetId, userId, new Date('2024-06-20'));

      expect(result).toBe(1000);
    });

    it('should return null if no event found', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue({ id: assetId, userId });
      mockPrisma.assetAmountEvent.findFirst.mockResolvedValue(null);

      const result = await service.getAssetAmountAtDate(assetId, userId, new Date());

      expect(result).toBeNull();
    });
  });

  describe('backportHistoricalData', () => {
    const userId = 'user1';
    const assetId = 'asset1';

    it('should backport multiple historical entries', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue({ id: assetId, userId, currency: 'USD' });
      
      // Mock createEvent to return events
      mockPrisma.assetAmountEvent.create.mockResolvedValue({ id: 'event1' });
      mockPrisma.auditTrailEntry.create.mockResolvedValue({ id: 'audit1' });

      const entries = [
        { amount: 5000, effectiveDate: new Date('2020-01-01'), description: 'Initial 2020' },
        { amount: 7500, effectiveDate: new Date('2021-01-01'), description: '2021 update' },
        { amount: 10000, effectiveDate: new Date('2022-01-01'), description: '2022 update' },
      ];

      const result = await service.backportHistoricalData(userId, assetId, entries);

      expect(result).toHaveLength(3);
      expect(mockPrisma.assetAmountEvent.create).toHaveBeenCalledTimes(3);
    });
  });
});
