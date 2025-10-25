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
  });
});