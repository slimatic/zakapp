import { describe, it, expect } from '@jest/globals';
import { AnalyticsService } from '../../../src/services/analytics-service';

describe('AnalyticsService', () => {
  describe('calculateTrends', () => {
    it('should calculate payment trends for a given date range', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.totalPayments).toBeDefined();
      expect(result.totalAmount).toBeDefined();
      expect(typeof result.totalPayments).toBe('number');
      expect(typeof result.totalAmount).toBe('number');
      expect(result.monthlyTrends).toBeDefined();
      expect(Array.isArray(result.monthlyTrends)).toBe(true);
    });

    it('should return zero values when no payments exist', async () => {
      const userId = 'user-empty';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result.totalPayments).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.monthlyTrends).toEqual([]);
    });

    it('should calculate monthly trends correctly', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result.monthlyTrends.length).toBeLessThanOrEqual(3); // Jan, Feb, Mar

      result.monthlyTrends.forEach(trend => {
        expect(trend).toHaveProperty('month');
        expect(trend).toHaveProperty('year');
        expect(trend).toHaveProperty('paymentCount');
        expect(trend).toHaveProperty('totalAmount');
        expect(typeof trend.paymentCount).toBe('number');
        expect(typeof trend.totalAmount).toBe('number');
      });
    });

    it('should handle different date ranges', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
    });

    it('should throw error for invalid date range', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01'); // End before start

      await expect(AnalyticsService.calculateTrends(userId, startDate, endDate))
        .rejects.toThrow('Invalid date range');
    });

    it('should throw error for invalid user ID', async () => {
      const userId = '';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await expect(AnalyticsService.calculateTrends(userId, startDate, endDate))
        .rejects.toThrow('Invalid user ID');
    });

    it('should handle very large date ranges (multiple years)', async () => {
      const userId = 'user-123';
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2024-12-31');

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result).toBeDefined();
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      // Should handle 5 years of data
      expect(result.monthlyTrends.length).toBeLessThanOrEqual(60); // 5 years * 12 months
    });

    it('should handle single day date ranges', async () => {
      const userId = 'user-123';
      const singleDay = new Date('2024-06-15');
      const startDate = new Date(singleDay);
      const endDate = new Date(singleDay);

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result).toBeDefined();
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      // Should still return valid structure even with single day
      expect(typeof result.totalPayments).toBe('number');
      expect(typeof result.totalAmount).toBe('number');
      expect(Array.isArray(result.monthlyTrends)).toBe(true);
    });

    it('should handle leap year date calculations', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-02-28'); // Leap year
      const endDate = new Date('2024-03-01');

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result).toBeDefined();
      // Should handle leap year dates without issues
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
    });

    it('should handle date ranges spanning multiple decades', async () => {
      const userId = 'user-123';
      const startDate = new Date('2010-01-01');
      const endDate = new Date('2024-12-31');

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result).toBeDefined();
      expect(result.monthlyTrends.length).toBeLessThanOrEqual(180); // 15 years * 12 months
    });

    it('should handle empty results for future date ranges', async () => {
      const userId = 'user-123';
      const futureStart = new Date();
      futureStart.setFullYear(futureStart.getFullYear() + 1);
      const futureEnd = new Date();
      futureEnd.setFullYear(futureEnd.getFullYear() + 2);

      const result = await AnalyticsService.calculateTrends(userId, futureStart, futureEnd);

      expect(result).toBeDefined();
      expect(result.totalPayments).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.monthlyTrends).toEqual([]);
    });

    it('should handle very old historical date ranges', async () => {
      const userId = 'user-123';
      const startDate = new Date('1990-01-01');
      const endDate = new Date('1995-12-31');

      const result = await AnalyticsService.calculateTrends(userId, startDate, endDate);

      expect(result).toBeDefined();
      // Should handle historical dates gracefully
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
    });

    it('should handle null or undefined user IDs', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await expect(AnalyticsService.calculateTrends(null as unknown as string, startDate, endDate))
        .rejects.toThrow('Invalid user ID');

      await expect(AnalyticsService.calculateTrends(undefined as unknown as string, startDate, endDate))
        .rejects.toThrow('Invalid user ID');
    });

    it('should handle malformed date objects', async () => {
      const userId = 'user-123';
      const invalidDate = new Date('invalid-date-string');
      const validDate = new Date('2024-01-01');

      await expect(AnalyticsService.calculateTrends(userId, invalidDate, validDate))
        .rejects.toThrow();

      await expect(AnalyticsService.calculateTrends(userId, validDate, invalidDate))
        .rejects.toThrow();
    });
  });
});