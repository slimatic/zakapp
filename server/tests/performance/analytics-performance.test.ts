import { describe, it, expect } from '@jest/globals';
import { AnalyticsService } from '../../../src/services/analytics-service';

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
});