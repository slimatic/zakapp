import { vi } from 'vitest';
import { HawlTrackingService } from '../../../src/services/hawlTrackingService';
import { PrismaClient } from '@prisma/client';
import moment from 'moment-hijri';

vi.mock('@prisma/client');
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
      yearlySnapshot: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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
});
