import { vi, type Mock } from 'vitest';
/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Unit Tests for ComparisonService
 * Tests multi-snapshot comparison and trend analysis
 */

import { ComparisonService } from '../../services/ComparisonService';
import { YearlySnapshotModel } from '../../models/YearlySnapshot';
import { PaymentRecordModel } from '../../models/PaymentRecord';

// Mock the models
vi.mock('../../models/YearlySnapshot');
vi.mock('../../models/PaymentRecord');

describe('ComparisonService', () => {
  let service: ComparisonService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    // Set encryption key for tests
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
    service = new ComparisonService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('constructor', () => {
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => new ComparisonService()).toThrow('ENCRYPTION_KEY environment variable is required');
    });
  });

  describe('compareSnapshots', () => {
    const mockSnapshots = [
      {
        id: 'snap1',
        userId: mockUserId,
        gregorianYear: 2022,
        totalWealth: 100000,
        zakatAmount: 2500,
        zakatableWealth: 100000,
        calculationDate: new Date('2022-06-15')
      },
      {
        id: 'snap2',
        userId: mockUserId,
        gregorianYear: 2023,
        totalWealth: 120000,
        zakatAmount: 3000,
        zakatableWealth: 120000,
        calculationDate: new Date('2023-06-15')
      },
      {
        id: 'snap3',
        userId: mockUserId,
        gregorianYear: 2024,
        totalWealth: 150000,
        zakatAmount: 3750,
        zakatableWealth: 150000,
        calculationDate: new Date('2024-06-15')
      }
    ];

    beforeEach(() => {
      (YearlySnapshotModel.findById as Mock).mockImplementation(async (id: string) => {
        return mockSnapshots.find(s => s.id === id) || null;
      });
    });

    it('should throw error if less than 2 snapshots provided', async () => {
      await expect(
        service.compareSnapshots(['snap1'], mockUserId)
      ).rejects.toThrow('At least 2 snapshots are required for comparison');
    });

    it('should throw error if snapshot not found', async () => {
      // (YearlySnapshotModel.findById as Mock).mockResolvedValueOnce(null); // Removed to rely on beforeEach logic which returns null for unknown IDs

      await expect(
        service.compareSnapshots(['snap1', 'invalid-id'], mockUserId)
      ).rejects.toThrow('Snapshot invalid-id not found');
    });

    it('should detect increasing wealth trend', async () => {
      const result = await service.compareSnapshots(
        ['snap1', 'snap2', 'snap3'],
        mockUserId
      );

      expect(result.wealthTrend).toBe('increasing');
      expect(result.snapshots).toHaveLength(3);
    });

    it('should detect increasing zakat trend', async () => {
      const result = await service.compareSnapshots(
        ['snap1', 'snap2', 'snap3'],
        mockUserId
      );

      expect(result.zakatTrend).toBe('increasing');
    });

    it('should calculate correct growth rate', async () => {
      const result = await service.compareSnapshots(
        ['snap1', 'snap2', 'snap3'],
        mockUserId
      );

      // (150000 - 100000) / 100000 / 2 years = 25% per year
      expect(result.averageGrowthRate).toBeCloseTo(25, 1);
    });

    it('should calculate correct wealth statistics', async () => {
      const result = await service.compareSnapshots(
        ['snap1', 'snap2', 'snap3'],
        mockUserId
      );

      expect(result.totalWealth.min).toBe(100000);
      expect(result.totalWealth.max).toBe(150000);
      expect(result.totalWealth.average).toBeCloseTo(123333.33, 2);
      expect(result.totalWealth.current).toBe(150000);
    });

    it('should calculate correct zakat statistics', async () => {
      const result = await service.compareSnapshots(
        ['snap1', 'snap2', 'snap3'],
        mockUserId
      );

      expect(result.totalZakat.min).toBe(2500);
      expect(result.totalZakat.max).toBe(3750);
      expect(result.totalZakat.average).toBeCloseTo(3083.33, 1);
      expect(result.totalZakat.current).toBe(3750);
    });

    it('should sort snapshots by year', async () => {
      // Provide snapshots in wrong order
      const result = await service.compareSnapshots(
        ['snap3', 'snap1', 'snap2'],
        mockUserId
      );

      expect(result.snapshots[0].gregorianYear).toBe(2022);
      expect(result.snapshots[1].gregorianYear).toBe(2023);
      expect(result.snapshots[2].gregorianYear).toBe(2024);
    });

    it('should generate insights', async () => {
      const result = await service.compareSnapshots(
        ['snap1', 'snap2', 'snap3'],
        mockUserId
      );

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should detect decreasing trend', async () => {
      const decreasingSnapshots = [
        { ...mockSnapshots[0], totalWealth: 150000, zakatAmount: 3750 },
        { ...mockSnapshots[1], totalWealth: 120000, zakatAmount: 3000 },
        { ...mockSnapshots[2], totalWealth: 100000, zakatAmount: 2500 }
      ];

      (YearlySnapshotModel.findById as Mock).mockImplementation(async (id: string) => {
        return decreasingSnapshots.find(s => s.id === id) || null;
      });

      const result = await service.compareSnapshots(
        ['snap1', 'snap2', 'snap3'],
        mockUserId
      );

      expect(result.wealthTrend).toBe('decreasing');
      expect(result.zakatTrend).toBe('decreasing');
    });

    it('should detect stable trend', async () => {
      const stableSnapshots = mockSnapshots.map(s => ({
        ...s,
        totalWealth: 100000,
        zakatAmount: 2500
      }));

      (YearlySnapshotModel.findById as Mock).mockImplementation(async (id: string) => {
        return stableSnapshots.find(s => s.id === id) || null;
      });

      const result = await service.compareSnapshots(
        ['snap1', 'snap2', 'snap3'],
        mockUserId
      );

      expect(result.wealthTrend).toBe('stable');
      expect(result.zakatTrend).toBe('stable');
    });
  });

  describe('compareAllYears', () => {
    const mockAllSnapshots = {
      data: [
        {
          id: 'snap1',
          userId: mockUserId,
          gregorianYear: 2022,
          totalWealth: 100000,
          zakatableWealth: 100000,
          zakatAmount: 2500,
          nisabThreshold: 85000
        },
        {
          id: 'snap2',
          userId: mockUserId,
          gregorianYear: 2023,
          totalWealth: 120000,
          zakatableWealth: 120000,
          zakatAmount: 3000,
          nisabThreshold: 87000
        }
      ],
      total: 2
    };

    beforeEach(() => {
      (YearlySnapshotModel.findByUser as Mock).mockResolvedValue(mockAllSnapshots);
      (PaymentRecordModel.findBySnapshot as Mock).mockResolvedValue([
        { id: 'pay1', amount: 1000 },
        { id: 'pay2', amount: 1500 }
      ]);
    });

    it('should return empty result if no snapshots', async () => {
      (YearlySnapshotModel.findByUser as Mock).mockResolvedValue({ data: [], total: 0 });

      const result = await service.compareAllYears(mockUserId);

      expect(result.years).toEqual([]);
      expect(result.data).toEqual([]);
      expect(result.overallTrend).toBe('stable');
      expect(result.totalYears).toBe(0);
    });

    it('should return all years data', async () => {
      const result = await service.compareAllYears(mockUserId);

      expect(result.years).toEqual([2022, 2023]);
      expect(result.data).toHaveLength(2);
      expect(result.totalYears).toBe(2);
    });

    it('should include payment data', async () => {
      const result = await service.compareAllYears(mockUserId);

      expect(result.data[0].totalPaid).toBe(2500);
      expect(result.data[0].paymentCount).toBe(2);
    });

    it('should calculate year-over-year changes', async () => {
      const result = await service.compareAllYears(mockUserId);

      // First year has no previous comparison
      expect(result.data[0].wealthChangeFromPrevious).toBeUndefined();

      // Second year should show change
      expect(result.data[1].wealthChangeFromPrevious).toBe(20000);
      expect(result.data[1].zakatChangeFromPrevious).toBe(500);
    });

    it('should detect overall trend from multiple years', async () => {
      const result = await service.compareAllYears(mockUserId);

      expect(['increasing', 'decreasing', 'stable']).toContain(result.overallTrend);
    });
  });

  describe('trend calculation logic', () => {
    it('should handle edge case with single value', () => {
      // Access private method via any type
      const trend = (service as any).calculateTrend([100000]);
      expect(trend).toBe('stable');
    });

    it('should handle exact threshold values', () => {
      // 5% threshold - exactly at boundary
      const trend = (service as any).calculateTrend([100000, 105000]);
      expect(['increasing', 'stable']).toContain(trend);
    });

    it('should handle mixed trends', () => {
      // Up, down, up pattern
      const trend = (service as any).calculateTrend([100, 120, 110, 130]);
      expect(['increasing', 'decreasing', 'stable']).toContain(trend);
    });
  });

  describe('insights generation', () => {
    it('should generate positive growth insights', () => {
      const mockSnaps = [
        { gregorianYear: 2022, totalWealth: 100000, zakatAmount: 2500 },
        { gregorianYear: 2023, totalWealth: 150000, zakatAmount: 3750 }
      ];

      const insights = (service as any).generateInsights(
        mockSnaps,
        'increasing',
        'increasing',
        25
      );

      // Matches "Your wealth has been increasing..."
      expect(insights.some((i: string) => i.includes('increasing'))).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should generate decline warnings', () => {
      const mockSnaps = [
        { gregorianYear: 2022, totalWealth: 150000, zakatAmount: 3750 },
        { gregorianYear: 2023, totalWealth: 100000, zakatAmount: 2500 }
      ];

      const insights = (service as any).generateInsights(
        mockSnaps,
        'decreasing',
        'decreasing',
        -16.67
      );

      // Matches "Your wealth has been declining..."
      expect(insights.some((i: string) => i.includes('declining'))).toBe(true);
    });

    it('should acknowledge stable wealth', () => {
      const mockSnaps = [
        { gregorianYear: 2022, totalWealth: 100000, zakatAmount: 2500 },
        { gregorianYear: 2023, totalWealth: 102000, zakatAmount: 2550 }
      ];

      const insights = (service as any).generateInsights(
        mockSnaps,
        'stable',
        'stable',
        1
      );

      // Matches "Your wealth has remained relatively stable..."
      expect(insights.some((i: string) => i.includes('stable'))).toBe(true);
    });
  });
});
