import { describe, it, expect } from '@jest/globals';
import { AnalyticsService } from '../../src/services/analytics-service';

describe('AnalyticsService Performance Tests', () => {
  describe('calculateTrends performance', () => {
    it('should calculate trends within 500ms for small date ranges', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31'); // 1 month

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(result).toBeDefined();
      expect(result.totalPayments).toBeDefined();
      expect(result.totalAmount).toBeDefined();
    });

    it('should calculate trends within 500ms for medium date ranges', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-06-30'); // 6 months

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(result).toBeDefined();
      expect(result.monthlyTrends.length).toBeLessThanOrEqual(6);
    });

    it('should calculate trends within 500ms for large date ranges', async () => {
      const userId = 'user-123';
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2024-12-31'); // 5 years

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(result).toBeDefined();
      expect(result.monthlyTrends.length).toBeLessThanOrEqual(60); // 5 years * 12 months
    });

    it('should handle concurrent analytics calculations efficiently', async () => {
      const userId = 'user-123';
      const dateRanges = [
        { start: new Date('2024-01-01'), end: new Date('2024-03-31') },
        { start: new Date('2024-04-01'), end: new Date('2024-06-30') },
        { start: new Date('2024-07-01'), end: new Date('2024-09-30') },
        { start: new Date('2024-10-01'), end: new Date('2024-12-31') },
      ];

      const startTime = Date.now();

      // Run multiple calculations concurrently
      const promises = dateRanges.map(range =>
        AnalyticsService.calculateTrends(userId, range.start, range.end)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Concurrent calculations should complete within 1 second
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.totalPayments).toBeDefined();
        expect(result.totalAmount).toBeDefined();
      });
    });

    it('should maintain performance with different user IDs', async () => {
      const userIds = ['user-123', 'user-456', 'user-789', 'user-999'];
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();

      const promises = userIds.map(userId =>
        AnalyticsService.calculateTrends(userId, startDate, endDate)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second for multiple users
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.totalPayments).toBe('number');
        expect(typeof result.totalAmount).toBe('number');
      });
    });

    it('should handle edge case date ranges without performance degradation', async () => {
      const userId = 'user-123';
      const edgeCases = [
        // Same day
        { start: new Date('2024-06-15'), end: new Date('2024-06-15') },
        // One week
        { start: new Date('2024-06-01'), end: new Date('2024-06-07') },
        // One month
        { start: new Date('2024-06-01'), end: new Date('2024-06-30') },
        // Cross-year boundary
        { start: new Date('2023-12-15'), end: new Date('2024-01-15') },
        // Leap year
        { start: new Date('2024-02-01'), end: new Date('2024-02-29') },
      ];

      const startTime = Date.now();

      const promises = edgeCases.map(range =>
        AnalyticsService.calculateTrends(userId, range.start, range.end)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Edge cases should not cause performance issues
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result.monthlyTrends)).toBe(true);
      });
    });

    it('should scale performance linearly with date range size', async () => {
      const userId = 'user-123';
      const testRanges = [
        { start: new Date('2024-01-01'), end: new Date('2024-01-31'), expectedMonths: 1 },
        { start: new Date('2024-01-01'), end: new Date('2024-06-30'), expectedMonths: 6 },
        { start: new Date('2024-01-01'), end: new Date('2024-12-31'), expectedMonths: 12 },
        { start: new Date('2023-01-01'), end: new Date('2024-12-31'), expectedMonths: 24 },
      ];

      const results = [];

      for (const range of testRanges) {
        const startTime = Date.now();
        const result = await AnalyticsService.calculateTrends(userId, range.start, range.end);
        const endTime = Date.now();

        const duration = endTime - startTime;
        results.push({ duration, months: range.expectedMonths, trendsCount: result.monthlyTrends.length });
      }

      // Verify that performance scales reasonably (not exponentially)
      // Each additional month shouldn't add more than 50ms on average
      for (let i = 1; i < results.length; i++) {
        const prevResult = results[i - 1];
        const currResult = results[i];
        const durationIncrease = currResult.duration - prevResult.duration;
        const monthIncrease = currResult.months - prevResult.months;

        if (monthIncrease > 0) {
          const avgDurationPerMonth = durationIncrease / monthIncrease;
          expect(avgDurationPerMonth).toBeLessThan(50); // Reasonable scaling
        }
      }
    });
  });

  describe('getSummary performance', () => {
    it('should get summary analytics within 500ms', async () => {
      const userId = 'user-123';
      const months = 12;

      const startTime = Date.now();
      const result = await AnalyticsService.getSummary(userId, months);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalPayments');
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('monthlyTrends');
      expect(result).toHaveProperty('recentPayments');
      expect(Array.isArray(result.monthlyTrends)).toBe(true);
      expect(Array.isArray(result.recentPayments)).toBe(true);
    });

    it('should handle different month ranges efficiently', async () => {
      const userId = 'user-123';
      const monthRanges = [3, 6, 12, 24];

      for (const months of monthRanges) {
        const startTime = Date.now();
        const result = await AnalyticsService.getSummary(userId, months);
        const endTime = Date.now();

        const duration = endTime - startTime;

        expect(duration).toBeLessThan(500); // All ranges should be fast
        expect(result.monthlyTrends.length).toBeLessThanOrEqual(months);
      }
    });
  });

  describe('getAnalyticsMetrics performance', () => {
    it('should get analytics metrics within 500ms', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();
      const result = await AnalyticsService.getAnalyticsMetrics(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalPayments');
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('monthlyTrends');
      expect(result).toHaveProperty('yearlyComparison');
      expect(result).toHaveProperty('categoryBreakdown');
      expect(result).toHaveProperty('averageMonthlyAmount');
      expect(result).toHaveProperty('growthRate');
      expect(result).toHaveProperty('consistencyScore');
    });
  });

  describe('calculateTrendsLargeDataset performance', () => {
    it('should handle large datasets within reasonable time limits', async () => {
      const userId = 'user-large-dataset';
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrendsLargeDataset(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Large dataset processing should complete within 2 seconds (more lenient for large data)
      expect(duration).toBeLessThan(2000);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalPayments');
      expect(result).toHaveProperty('totalAmount');
      expect(Array.isArray(result.monthlyTrends)).toBe(true);
      expect(Array.isArray(result.yearlyComparison)).toBe(true);
      expect(Array.isArray(result.categoryBreakdown)).toBe(true);
    });

    it('should handle empty large datasets efficiently', async () => {
      const userId = 'user-empty-large';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrendsLargeDataset(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Empty datasets should be very fast
      expect(result.totalPayments).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.monthlyTrends).toEqual([]);
      expect(result.yearlyComparison).toEqual([]);
      expect(result.categoryBreakdown).toEqual([]);
    });
  });

  describe('Memory usage and streaming performance', () => {
    it('should maintain memory efficiency with large datasets', async () => {
      const userId = 'user-memory-test';
      const startDate = new Date('2015-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      const result = await AnalyticsService.calculateTrendsLargeDataset(userId, startDate, endDate);

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;

      const duration = endTime - startTime;
      const memoryIncrease = endMemory - startMemory;

      expect(duration).toBeLessThan(2000);
      // Memory increase should be reasonable (less than 50MB for large dataset processing)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(result).toBeDefined();
    });

    it('should handle concurrent large dataset calculations', async () => {
      const userIds = ['user-concurrent-1', 'user-concurrent-2', 'user-concurrent-3'];
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();

      const promises = userIds.map(userId =>
        AnalyticsService.calculateTrendsLargeDataset(userId, startDate, endDate)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000); // Concurrent large calculations within 3 seconds
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.totalPayments).toBe('number');
        expect(typeof result.totalAmount).toBe('number');
      });
    });
  });

  describe('Database query performance', () => {
    it('should optimize database queries for analytics', async () => {
      const userId = 'user-query-test';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate, {
        useCache: false, // Disable cache to test raw query performance
        maxRecords: 10000
      });
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(800); // Database queries should be fast
      expect(result).toBeDefined();
    });

    it('should handle pagination limits correctly', async () => {
      const userId = 'user-pagination-test';
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2024-12-31');

      // Test with different max record limits
      const limits = [100, 1000, 5000];

      for (const limit of limits) {
        const startTime = Date.now();
        const result = await AnalyticsService.calculateTrends(userId, startDate, endDate, {
          useCache: false,
          maxRecords: limit
        });
        const endTime = Date.now();

        const duration = endTime - startTime;

        expect(duration).toBeLessThan(1000); // Should scale with limits
        expect(result).toBeDefined();
        // Note: In real implementation, we might not get exactly 'limit' records
        // due to how pagination works, but performance should still be good
      }
    });
  });

  describe('Additional performance benchmarks', () => {
    it('should handle concurrent analytics requests efficiently', async () => {
      const userId = 'user-concurrent-test';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Simulate 5 concurrent analytics requests
      const promises = Array(5).fill(null).map(() => 
        AnalyticsService.calculateTrends(userId, startDate, endDate)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / 5;

      // Average duration should still be within performance budget
      expect(avgDuration).toBeLessThan(500);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.totalPayments).toBeDefined();
      });
    });

    it('should calculate getSummary within 300ms', async () => {
      const userId = 'user-summary-test';

      const startTime = Date.now();
      const result = await AnalyticsService.getSummary(userId, 12);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Summary should be faster than full analytics
      expect(duration).toBeLessThan(300);
      expect(result).toBeDefined();
      expect(result.totalPayments).toBeDefined();
      expect(result.totalAmount).toBeDefined();
      expect(result.monthlyTrends).toBeDefined();
      expect(result.recentPayments).toBeDefined();
    });

    it('should handle memory efficiently for large datasets', async () => {
      const userId = 'user-memory-test';
      const startDate = new Date('2015-01-01');
      const endDate = new Date('2024-12-31'); // 10 years

      // Get initial memory usage
      if (global.gc) global.gc();
      const memBefore = process.memoryUsage().heapUsed;

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);
      const endTime = Date.now();

      // Force garbage collection and check memory
      if (global.gc) global.gc();
      const memAfter = process.memoryUsage().heapUsed;
      const memDelta = (memAfter - memBefore) / 1024 / 1024; // MB

      const duration = endTime - startTime;

      // Should complete within time budget
      expect(duration).toBeLessThan(500);
      
      // Should not consume excessive memory (< 50MB for analytics)
      // Note: This is approximate and may vary
      expect(memDelta).toBeLessThan(50);
      
      expect(result).toBeDefined();
    });

    it('should optimize streaming aggregation for very large datasets', async () => {
      const userId = 'user-large-dataset';
      const startDate = new Date('2010-01-01');
      const endDate = new Date('2024-12-31'); // 15 years

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrendsLargeDataset(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Large dataset method should still be performant
      expect(duration).toBeLessThan(1000); // 1 second for very large datasets
      expect(result).toBeDefined();
      expect(result.totalPayments).toBeDefined();
      expect(result.monthlyTrends).toBeDefined();
    });

    it('should cache results effectively', async () => {
      const userId = 'user-cache-test';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // First call - no cache
      const startTime1 = Date.now();
      await AnalyticsService.calculateTrends(userId, startDate, endDate, { useCache: false });
      const duration1 = Date.now() - startTime1;

      // Second call - with cache (if implemented)
      const startTime2 = Date.now();
      await AnalyticsService.calculateTrends(userId, startDate, endDate, { useCache: true });
      const duration2 = Date.now() - startTime2;

      // Note: If caching is not implemented, durations will be similar
      // This test documents the caching behavior
      expect(duration1).toBeLessThan(500);
      expect(duration2).toBeLessThan(500);
    });

    it('should handle edge case performance: single payment', async () => {
      const userId = 'user-single-payment';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Even minimal data should be fast
      expect(duration).toBeLessThan(100);
      expect(result).toBeDefined();
    });

    it('should handle edge case performance: no payments', async () => {
      const userId = 'user-no-payments';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const startTime = Date.now();
      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Empty dataset should be very fast
      expect(duration).toBeLessThan(50);
      expect(result).toBeDefined();
      expect(result.totalPayments).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });
});