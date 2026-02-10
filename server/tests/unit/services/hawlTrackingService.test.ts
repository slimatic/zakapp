import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HawlTrackingService } from '../../../src/services/hawlTrackingService';
import { PrismaClient } from '@prisma/client';
import moment from 'moment-hijri';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      yearlySnapshot: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
    })),
  };
});
vi.mock('../../../src/services/wealthAggregationService');
vi.mock('../../../src/services/nisabCalculationService');
vi.mock('../../../src/services/EncryptionService');

describe('HawlTrackingService', () => {
  let service: HawlTrackingService;
  let mockPrisma: any;
  let mockWealthAgg: any;
  let mockNisabCalc: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (callback) => {
        // When transaction is called with a callback, execute it with mockPrisma as tx
        if (typeof callback === 'function') {
          return await callback(mockPrisma);
        }
        return callback;
      }),
      yearlySnapshot: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    mockWealthAgg = {
      calculateTotalZakatableWealth: vi.fn().mockResolvedValue({ totalZakatableWealth: 10000 }),
      getZakatableAssets: vi.fn().mockResolvedValue([]),
    };

    mockNisabCalc = {
      calculateNisabThreshold: vi.fn().mockResolvedValue({ selectedNisab: 5000 }),
      calculateZakat: vi.fn().mockReturnValue(250),
    };

    service = new HawlTrackingService(
      mockPrisma as any,
      mockWealthAgg as any,
      mockNisabCalc as any
    );

    vi.clearAllMocks();
  });

  describe('calculateHawlCompletionDate', () => {
    it('should add 354 days to start date for lunar year', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const completionDate = service.calculateHawlCompletionDate(startDate);
      const daysDiff = Math.floor(
        (completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(354);
    });
  });

  describe('toHijriDate', () => {
    it('should convert Gregorian date to Hijri format', () => {
      const gregorianDate = new Date('2024-03-15T00:00:00Z');
      const hijriString = service.toHijriDate(gregorianDate);
      expect(hijriString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('detectNisabAchievement', () => {
    it('should process users and create DRAFT records if Nisab reached', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'user1' }]);
      mockPrisma.yearlySnapshot.findFirst.mockResolvedValue(null);
      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 6000 });
      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });

      const count = await service.detectNisabAchievement('GOLD');

      expect(count).toBe(1);
      expect(mockPrisma.yearlySnapshot.create).toHaveBeenCalled();
    });
  });

  describe('isHawlComplete', () => {
    it('should return true if 354 days have passed', () => {
      const longAgo = new Date(Date.now() - 360 * 24 * 60 * 60 * 1000);
      expect(service.isHawlComplete(longAgo)).toBe(true);
    });

    it('should return false if 354 days have not passed', () => {
      const recently = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      expect(service.isHawlComplete(recently)).toBe(false);
    });
  });

  describe('handleWealthChange', () => {
    it('should start Hawl if wealth >= Nisab and no active Hawl', async () => {
      mockPrisma.yearlySnapshot.findFirst.mockResolvedValue(null);
      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 6000 });
      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });

      await service.handleWealthChange('user1');

      expect(mockPrisma.yearlySnapshot.create).toHaveBeenCalled();
    });

    it('should interrupt Hawl if wealth < Nisab and active Hawl exists', async () => {
      mockPrisma.yearlySnapshot.findFirst.mockResolvedValue({
        id: 'record1',
        nisabThresholdAtStart: '5000',
        nisabBasis: 'GOLD'
      });
      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 4000 });
      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });

      await service.handleWealthChange('user1');

      expect(mockPrisma.yearlySnapshot.delete).toHaveBeenCalledWith({
        where: { id: 'record1' }
      });
    });

    it('should do nothing if wealth < Nisab and no active Hawl', async () => {
      mockPrisma.yearlySnapshot.findFirst.mockResolvedValue(null);
      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 4000 });
      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });

      await service.handleWealthChange('user1');

      expect(mockPrisma.yearlySnapshot.create).not.toHaveBeenCalled();
    });

    it('should do nothing if wealth >= Nisab and active Hawl exists', async () => {
       mockPrisma.yearlySnapshot.findFirst.mockResolvedValue({
        id: 'record1',
        nisabThresholdAtStart: '5000',
        nisabBasis: 'GOLD'
      });
      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 6000 });
      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });

      await service.handleWealthChange('user1');

      expect(mockPrisma.yearlySnapshot.delete).not.toHaveBeenCalled();
      expect(mockPrisma.yearlySnapshot.create).not.toHaveBeenCalled();
    });
  });
});
