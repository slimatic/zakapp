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
 * Unit Tests for AnalyticsService Cache Logic
 * Tests cache TTL optimization and metric calculations
 */

import { AnalyticsService } from '../../services/AnalyticsService';
import { AnalyticsMetricModel } from '../../models/AnalyticsMetric';
import { YearlySnapshotModel } from '../../models/YearlySnapshot';
import { PaymentRecordModel } from '../../models/PaymentRecord';

// Mock the models
jest.mock('../../models/AnalyticsMetric');
jest.mock('../../models/YearlySnapshot');
jest.mock('../../models/PaymentRecord');

describe('AnalyticsService - Cache Logic', () => {
  let service: AnalyticsService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
    service = new AnalyticsService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('constructor', () => {
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => new AnalyticsService()).toThrow('ENCRYPTION_KEY environment variable is required');
    });

    it('should initialize with correct cache TTL values', () => {
      const ttls = (service as any).CACHE_TTL_MINUTES;

      expect(ttls.WEALTH_TREND).toBe(60);
      expect(ttls.ZAKAT_TREND).toBe(60);
      expect(ttls.ASSET_COMPOSITION).toBe(30);
      expect(ttls.PAYMENT_DISTRIBUTION).toBe(30);
      expect(ttls.GROWTH_RATE).toBe(60);
      expect(ttls.DEFAULT).toBe(15);
    });
  });

  describe('getCacheTTL', () => {
    it('should return 60 minutes for wealth_trend', () => {
      const ttl = (service as any).getCacheTTL('wealth_trend');
      expect(ttl).toBe(60);
    });

    it('should return 60 minutes for zakat_trend', () => {
      const ttl = (service as any).getCacheTTL('zakat_trend');
      expect(ttl).toBe(60);
    });

    it('should return 30 minutes for asset_composition', () => {
      const ttl = (service as any).getCacheTTL('asset_composition');
      expect(ttl).toBe(30);
    });

    it('should return 30 minutes for payment_distribution', () => {
      const ttl = (service as any).getCacheTTL('payment_distribution');
      expect(ttl).toBe(30);
    });

    it('should return 15 minutes for unknown metric types (default)', () => {
      const ttl = (service as any).getCacheTTL('unknown_metric_type');
      expect(ttl).toBe(15);
    });

    it('should handle uppercase metric names', () => {
      const ttl = (service as any).getCacheTTL('WEALTH_TREND');
      expect(ttl).toBe(60);
    });

    it('should handle mixed case metric names', () => {
      const ttl = (service as any).getCacheTTL('Wealth_Trend');
      expect(ttl).toBe(60);
    });
  });

  describe('getWealthTrend - Cache Behavior', () => {
    const mockSnapshots = {
      data: [
        {
          gregorianYear: 2023,
          calculationDate: new Date('2023-06-15'),
          totalWealth: 100000,
          zakatableWealth: 100000
        },
        {
          gregorianYear: 2024,
          calculationDate: new Date('2024-06-15'),
          totalWealth: 120000,
          zakatableWealth: 120000
        }
      ],
      total: 2
    };

    const startDate = new Date('2023-01-01');
    const endDate = new Date('2024-12-31');

    it('should check cache first', async () => {
      const cachedMetric = {
        id: 'cached-123',
        userId: mockUserId,
        metricType: 'wealth_trend',
        calculatedValue: JSON.stringify({ trend: [] }),
        startDate,
        endDate
      };

      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(cachedMetric);

      await service.getWealthTrend(mockUserId, startDate, endDate);

      expect(AnalyticsMetricModel.findCached).toHaveBeenCalledWith(
        mockUserId,
        'wealth_trend',
        startDate,
        endDate
      );
    });

    it('should return cached result if available', async () => {
      const cachedMetric = {
        id: 'cached-123',
        userId: mockUserId,
        metricType: 'wealth_trend',
        calculatedValue: JSON.stringify({ trend: [{ year: 2023, value: 100000 }] }),
        startDate,
        endDate
      };

      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(cachedMetric);

      const result = await service.getWealthTrend(mockUserId, startDate, endDate);

      expect(result).toBeDefined();
      expect(YearlySnapshotModel.findByUser).not.toHaveBeenCalled();
    });

    it('should calculate and cache if not in cache', async () => {
      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(null);
      (YearlySnapshotModel.findByUser as jest.Mock).mockResolvedValue(mockSnapshots);
      (AnalyticsMetricModel.createOrUpdate as jest.Mock).mockResolvedValue({
        id: 'new-metric',
        userId: mockUserId,
        metricType: 'wealth_trend',
        calculatedValue: JSON.stringify({ trend: [] })
      });

      await service.getWealthTrend(mockUserId, startDate, endDate);

      expect(AnalyticsMetricModel.findCached).toHaveBeenCalled();
      expect(YearlySnapshotModel.findByUser).toHaveBeenCalled();
      expect(AnalyticsMetricModel.createOrUpdate).toHaveBeenCalledWith(
        mockUserId,
        'wealth_trend',
        expect.objectContaining({
          cacheTTLMinutes: 60
        })
      );
    });

    it('should use correct TTL when caching wealth trend', async () => {
      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(null);
      (YearlySnapshotModel.findByUser as jest.Mock).mockResolvedValue(mockSnapshots);
      (AnalyticsMetricModel.createOrUpdate as jest.Mock).mockResolvedValue({});

      await service.getWealthTrend(mockUserId, startDate, endDate);

      expect(AnalyticsMetricModel.createOrUpdate).toHaveBeenCalledWith(
        mockUserId,
        'wealth_trend',
        expect.objectContaining({
          cacheTTLMinutes: 60 // Historical data, 60 minutes
        })
      );
    });

    it('should filter snapshots by date range', async () => {
      const allSnapshots = {
        data: [
          { gregorianYear: 2021, calculationDate: new Date('2021-06-15'), totalWealth: 80000, zakatableWealth: 80000 },
          { gregorianYear: 2023, calculationDate: new Date('2023-06-15'), totalWealth: 100000, zakatableWealth: 100000 },
          { gregorianYear: 2024, calculationDate: new Date('2024-06-15'), totalWealth: 120000, zakatableWealth: 120000 },
          { gregorianYear: 2025, calculationDate: new Date('2025-06-15'), totalWealth: 140000, zakatableWealth: 140000 }
        ],
        total: 4
      };

      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(null);
      (YearlySnapshotModel.findByUser as jest.Mock).mockResolvedValue(allSnapshots);
      (AnalyticsMetricModel.createOrUpdate as jest.Mock).mockImplementation(
        async (userId, type, data) => ({ calculatedValue: data.calculatedValue })
      );

      const result = await service.getWealthTrend(
        mockUserId,
        new Date('2023-01-01'),
        new Date('2024-12-31')
      );

      // Should only include 2023 and 2024
      expect(result.calculatedValue.trend).toHaveLength(2);
    });
  });

  describe('getZakatTrend - Cache Behavior', () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2024-12-31');

    it('should use 60-minute TTL for historical Zakat data', async () => {
      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(null);
      (YearlySnapshotModel.findByUser as jest.Mock).mockResolvedValue({ data: [], total: 0 });
      (AnalyticsMetricModel.createOrUpdate as jest.Mock).mockResolvedValue({});

      await service.getZakatTrend(mockUserId, startDate, endDate);

      expect(AnalyticsMetricModel.createOrUpdate).toHaveBeenCalledWith(
        mockUserId,
        'zakat_trend',
        expect.objectContaining({
          cacheTTLMinutes: 60
        })
      );
    });

    it('should check cache before calculating', async () => {
      const cached = {
        id: 'cached',
        calculatedValue: JSON.stringify({ trend: [] })
      };

      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(cached);

      await service.getZakatTrend(mockUserId, startDate, endDate);

      expect(YearlySnapshotModel.findByUser).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentDistribution - Cache Behavior', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    it('should use 30-minute TTL for payment distribution', async () => {
      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(null);
      (PaymentRecordModel.findByUser as jest.Mock).mockResolvedValue({ data: [], total: 0 });
      (AnalyticsMetricModel.createOrUpdate as jest.Mock).mockResolvedValue({});

      await service.getPaymentDistribution(mockUserId, startDate, endDate);

      expect(AnalyticsMetricModel.createOrUpdate).toHaveBeenCalledWith(
        mockUserId,
        'payment_distribution',
        expect.objectContaining({
          cacheTTLMinutes: 30 // Moderate frequency
        })
      );
    });

    it('should return cached distribution if available', async () => {
      const cached = {
        id: 'cached',
        calculatedValue: JSON.stringify({ distribution: [] })
      };

      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(cached);

      await service.getPaymentDistribution(mockUserId, startDate, endDate);

      expect(PaymentRecordModel.findByUser).not.toHaveBeenCalled();
    });
  });

  describe('cache TTL optimization strategy', () => {
    it('should prioritize historical metrics with longer TTL', () => {
      const historicalTTL = (service as any).getCacheTTL('wealth_trend');
      const moderateTTL = (service as any).getCacheTTL('payment_distribution');
      const defaultTTL = (service as any).getCacheTTL('unknown');

      expect(historicalTTL).toBeGreaterThan(moderateTTL);
      expect(moderateTTL).toBeGreaterThan(defaultTTL);
    });

    it('should use same TTL for all historical metrics', () => {
      const wealthTTL = (service as any).getCacheTTL('wealth_trend');
      const zakatTTL = (service as any).getCacheTTL('zakat_trend');
      const growthTTL = (service as any).getCacheTTL('growth_rate');

      expect(wealthTTL).toBe(60);
      expect(zakatTTL).toBe(60);
      expect(growthTTL).toBe(60);
    });

    it('should use same TTL for all moderate frequency metrics', () => {
      const assetTTL = (service as any).getCacheTTL('asset_composition');
      const paymentTTL = (service as any).getCacheTTL('payment_distribution');

      expect(assetTTL).toBe(30);
      expect(paymentTTL).toBe(30);
    });
  });

  describe('decryptMetricData', () => {
    it('should handle null metric', async () => {
      const result = await (service as any).decryptMetricData(null);
      expect(result).toBeNull();
    });

    it('should handle already decrypted JSON objects', async () => {
      const metric = {
        calculatedValue: { trend: [] },
        parameters: { startDate: '2024-01-01' }
      };

      const result = await (service as any).decryptMetricData(metric);

      expect(result.calculatedValue).toEqual({ trend: [] });
      expect(result.parameters).toEqual({ startDate: '2024-01-01' });
    });

    it('should preserve non-encrypted fields', async () => {
      const metric = {
        id: 'metric-123',
        userId: mockUserId,
        metricType: 'wealth_trend',
        calculatedValue: { trend: [] },
        createdAt: new Date()
      };

      const result = await (service as any).decryptMetricData(metric);

      expect(result.id).toBe('metric-123');
      expect(result.userId).toBe(mockUserId);
      expect(result.metricType).toBe('wealth_trend');
    });
  });

  describe('performance characteristics', () => {
    it('should minimize database calls with caching', async () => {
      const cached = { id: '1', calculatedValue: JSON.stringify({}) };
      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(cached);

      await service.getWealthTrend(mockUserId, new Date(), new Date());

      // Only cache lookup, no snapshot queries
      expect(AnalyticsMetricModel.findCached).toHaveBeenCalledTimes(1);
      expect(YearlySnapshotModel.findByUser).not.toHaveBeenCalled();
    });

    it('should batch snapshots queries efficiently', async () => {
      (AnalyticsMetricModel.findCached as jest.Mock).mockResolvedValue(null);
      (YearlySnapshotModel.findByUser as jest.Mock).mockResolvedValue({ data: [], total: 0 });
      (AnalyticsMetricModel.createOrUpdate as jest.Mock).mockResolvedValue({});

      await service.getWealthTrend(mockUserId, new Date(), new Date());

      // Single query for all snapshots
      expect(YearlySnapshotModel.findByUser).toHaveBeenCalledTimes(1);
      expect(YearlySnapshotModel.findByUser).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ limit: 1000 })
      );
    });
  });
});
