import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AssetAmountSnapshotService } from '../../../src/services/AssetAmountSnapshotService';

vi.mock('../../../src/utils/prisma', () => {
  const mockPrisma = {
    assetAmountEvent: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    assetAmountSnapshot: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe('AssetAmountSnapshotService', () => {
  let service: AssetAmountSnapshotService;
  let mockPrisma: any;

  beforeEach(async () => {
    const { prisma } = await import('../../../src/utils/prisma');
    mockPrisma = prisma;
    
    service = new AssetAmountSnapshotService();
    vi.clearAllMocks();
  });

  describe('regenerateForDateRange', () => {
    const assetId = 'asset1';

    it('should regenerate snapshots for date range', async () => {
      const events = [
        { id: 'e1', amount: 1000, effectiveDate: new Date('2024-01-15'), recordedAt: new Date('2024-01-15') },
        { id: 'e2', amount: 1500, effectiveDate: new Date('2024-02-15'), recordedAt: new Date('2024-02-15') },
        { id: 'e3', amount: 2000, effectiveDate: new Date('2024-03-15'), recordedAt: new Date('2024-03-15') },
      ];
      
      mockPrisma.assetAmountEvent.findMany.mockResolvedValue(events);
      mockPrisma.assetAmountSnapshot.upsert.mockResolvedValue({});

      await service.regenerateForDateRange(assetId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      // Should create 3 snapshots (one per unique date)
      expect(mockPrisma.assetAmountSnapshot.upsert).toHaveBeenCalledTimes(3);
    });

    it('should not create snapshots if no events exist', async () => {
      mockPrisma.assetAmountEvent.findMany.mockResolvedValue([]);

      await service.regenerateForDateRange(assetId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(mockPrisma.assetAmountSnapshot.upsert).not.toHaveBeenCalled();
    });

    it('should use latest event for same day', async () => {
      // Two events on same day - should use the later one
      const events = [
        { id: 'e1', amount: 1000, effectiveDate: new Date('2024-01-15T10:00:00'), recordedAt: new Date('2024-01-15T10:00:00') },
        { id: 'e2', amount: 1500, effectiveDate: new Date('2024-01-15T15:00:00'), recordedAt: new Date('2024-01-15T15:00:00') },
      ];
      
      mockPrisma.assetAmountEvent.findMany.mockResolvedValue(events);
      mockPrisma.assetAmountSnapshot.upsert.mockResolvedValue({});

      await service.regenerateForDateRange(assetId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      // Should only create 1 snapshot with the latest amount
      expect(mockPrisma.assetAmountSnapshot.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrisma.assetAmountSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ amount: 1500 }),
        })
      );
    });
  });

  describe('getSnapshotAtDate', () => {
    const assetId = 'asset1';

    it('should return snapshot at or before target date', async () => {
      const mockSnapshot = {
        id: 'snap1',
        assetId,
        date: new Date('2024-06-15'),
        amount: 1500,
        eventCount: 2,
      };
      
      mockPrisma.assetAmountSnapshot.findFirst.mockResolvedValue(mockSnapshot);

      const result = await service.getSnapshotAtDate(assetId, new Date('2024-06-20'));

      expect(result).toEqual(mockSnapshot);
    });

    it('should fallback to events if no snapshot exists', async () => {
      mockPrisma.assetAmountSnapshot.findFirst.mockResolvedValue(null);
      mockPrisma.assetAmountEvent.findFirst.mockResolvedValue({
        amount: 1000,
        effectiveDate: new Date('2024-01-15'),
      });

      const result = await service.getSnapshotAtDate(assetId, new Date('2024-01-20'));

      expect(result).toEqual({
        assetId,
        date: new Date('2024-01-15'),
        amount: 1000,
        eventCount: 1,
        isVirtual: true,
      });
    });

    it('should return null if no data exists', async () => {
      mockPrisma.assetAmountSnapshot.findFirst.mockResolvedValue(null);
      mockPrisma.assetAmountEvent.findFirst.mockResolvedValue(null);

      const result = await service.getSnapshotAtDate(assetId, new Date());

      expect(result).toBeNull();
    });
  });

  describe('getSnapshotsInRange', () => {
    const assetId = 'asset1';

    it('should return snapshots within date range', async () => {
      const mockSnapshots = [
        { id: 'snap1', date: new Date('2024-01-15'), amount: 1000 },
        { id: 'snap2', date: new Date('2024-02-15'), amount: 1500 },
      ];
      
      mockPrisma.assetAmountSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await service.getSnapshotsInRange(assetId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(result).toHaveLength(2);
      expect(mockPrisma.assetAmountSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assetId,
            date: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          }),
        })
      );
    });
  });

  describe('getCurrentSnapshot', () => {
    const assetId = 'asset1';

    it('should return the most recent snapshot', async () => {
      const mockSnapshot = {
        id: 'snap1',
        date: new Date('2024-06-15'),
        amount: 1500,
      };
      
      mockPrisma.assetAmountSnapshot.findFirst.mockResolvedValue(mockSnapshot);

      const result = await service.getCurrentSnapshot(assetId);

      expect(result).toEqual(mockSnapshot);
      expect(mockPrisma.assetAmountSnapshot.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'desc' },
        })
      );
    });
  });

  describe('deleteSnapshotsInRange', () => {
    const assetId = 'asset1';

    it('should delete snapshots in range and return count', async () => {
      mockPrisma.assetAmountSnapshot.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.deleteSnapshotsInRange(assetId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      });

      expect(result).toBe(5);
      expect(mockPrisma.assetAmountSnapshot.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assetId,
            date: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-06-30'),
            },
          }),
        })
      );
    });
  });

  describe('getEventCountBetween', () => {
    const assetId = 'asset1';

    it('should return count of events in range', async () => {
      mockPrisma.assetAmountEvent.count.mockResolvedValue(10);

      const result = await service.getEventCountBetween(
        assetId,
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(result).toBe(10);
    });
  });
});
