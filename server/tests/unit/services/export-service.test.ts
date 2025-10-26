import { describe, it, expect } from '@jest/globals';
import { ExportService } from '../../../src/services/export-service';

describe('ExportService', () => {
  describe('generateCSV', () => {
    it('should generate CSV content for payment records', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate);

      expect(csvContent).toBeDefined();
      expect(typeof csvContent).toBe('string');
      expect(csvContent.length).toBeGreaterThan(0);

      // Check CSV headers
      const lines = csvContent.split('\n');
      expect(lines.length).toBeGreaterThan(0);
      const headers = lines[0].split(',');
      expect(headers).toContain('Payment Date');
      expect(headers).toContain('Amount');
      expect(headers).toContain('Recipient');
      expect(headers).toContain('Recipient Category');
      expect(headers).toContain('Payment Method');
      expect(headers).toContain('Notes');
    });

    it('should include payment records in CSV', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate);

      const lines = csvContent.split('\n');
      expect(lines.length).toBeGreaterThan(1); // At least header + 1 data row

      // Check that data rows contain expected values
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const columns = lines[i].split(',');
          expect(columns.length).toBeGreaterThan(5); // Should have multiple columns
        }
      }
    });

    it('should handle empty payment history', async () => {
      const userId = 'user-empty';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate);

      const lines = csvContent.split('\n');
      expect(lines.length).toBe(1); // Only header row
      expect(lines[0]).toContain('Payment Date');
    });

    it('should filter payments by date range', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate);

      // Should only include payments within June 2024
      const lines = csvContent.split('\n');
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const columns = lines[i].split(',');
          const paymentDateStr = columns[0]; // Assuming first column is payment date
          if (paymentDateStr) {
            const paymentDate = new Date(paymentDateStr);
            expect(paymentDate.getFullYear()).toBe(2024);
            expect(paymentDate.getMonth()).toBe(5); // June is month 5 (0-indexed)
          }
        }
      }
    });

    it('should include optional notes when requested', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate, true);

      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('Notes');
    });

    it('should exclude notes when not requested', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate, false);

      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      expect(headers).not.toContain('Notes');
    });

    it('should throw error for invalid user ID', async () => {
      const userId = '';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await expect(ExportService.generateCSV(userId, startDate, endDate))
        .rejects.toThrow('Invalid user ID');
    });

    it('should throw error for invalid date range', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01');

      await expect(ExportService.generateCSV(userId, startDate, endDate))
        .rejects.toThrow('Invalid date range');
    });

    it('should handle very large datasets efficiently', async () => {
      const userId = 'user-large-dataset';
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2024-12-31');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate);

      expect(csvContent).toBeDefined();
      expect(typeof csvContent).toBe('string');

      // Should handle large datasets without memory issues
      const lines = csvContent.split('\n');
      expect(lines.length).toBeGreaterThan(0);

      // Each line should be properly formatted
      lines.forEach((line, index) => {
        if (index === 0) {
          // Header row
          expect(line).toContain('Payment Date');
        } else if (line.trim()) {
          // Data rows should have consistent column count
          const columns = line.split(',');
          expect(columns.length).toBeGreaterThan(3);
        }
      });
    });

    it('should properly escape CSV special characters', async () => {
      const userId = 'user-special-chars';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate);

      expect(csvContent).toBeDefined();

      // Check that commas, quotes, and newlines in data are properly escaped
      const lines = csvContent.split('\n');
      lines.forEach((line, index) => {
        if (index > 0 && line.trim()) {
          // Data rows should not have unescaped special characters
          // This is a basic check - in a real implementation we'd verify proper CSV escaping
          expect(line).not.toMatch(/[^"]*,[^"]*,\s*[^"]*,/); // Basic check for unescaped commas
        }
      });
    });

    it('should handle multi-year date ranges', async () => {
      const userId = 'user-123';
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2024-12-31');

      const csvContent = await ExportService.generateCSV(userId, startDate, endDate);

      expect(csvContent).toBeDefined();

      // Should include data from multiple years
      const lines = csvContent.split('\n');
      const dataLines = lines.slice(1).filter(line => line.trim());

      // Should have data spanning multiple years
      const yearsFound = new Set<number>();
      dataLines.forEach(line => {
        const columns = line.split(',');
        if (columns[0]) {
          const date = new Date(columns[0]);
          if (!isNaN(date.getTime())) {
            yearsFound.add(date.getFullYear());
          }
        }
      });

      // Should span at least 2 years of data
      expect(yearsFound.size).toBeGreaterThanOrEqual(2);
    });
  });
});