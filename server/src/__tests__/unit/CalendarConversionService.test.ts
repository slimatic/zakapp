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
 * Unit Tests for CalendarConversionService
 * Tests Hijri-Gregorian date conversions and formatting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarConversionService } from '../../services/CalendarConversionService';

describe('CalendarConversionService', () => {
  let service: CalendarConversionService;

  beforeEach(() => {
    service = new CalendarConversionService();
  });

  describe('gregorianToHijri', () => {
    it('should convert a known Gregorian date to Hijri correctly', () => {
      // January 1, 2024 = Jumada al-thani 19, 1445
      const gregorianDate = new Date(2024, 0, 1);
      const result = service.gregorianToHijri(gregorianDate);

      expect(result.year).toBe(1445);
      expect(result.month).toBe(6); // Jumada al-thani
      expect(result.day).toBe(19);
      expect(result.monthName).toBe('Jumada al-Thani');
    });

    it('should convert Ramadan dates correctly', () => {
      // March 11, 2024 = Ramadan 1, 1445
      const gregorianDate = new Date(2024, 2, 11);
      const result = service.gregorianToHijri(gregorianDate);

      expect(result.year).toBe(1445);
      expect(result.month).toBe(9); // Ramadan
      expect(result.monthName).toBe('Ramadan');
    });

    it('should handle edge case dates', () => {
      // Test a relatively old date (hijri-converter supports back to approx 1937)
      const oldDate = new Date(1940, 0, 1);
      const result = service.gregorianToHijri(oldDate);

      expect(result.year).toBeGreaterThan(0);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
      expect(result.day).toBeGreaterThanOrEqual(1);
      expect(result.day).toBeLessThanOrEqual(30);
    });

    it('should return correct month names for all months', () => {
      const monthNames = [
        'Muharram',
        'Safar',
        "Rabi' al-Awwal",
        "Rabi' al-Thani",
        'Jumada al-Awwal',
        'Jumada al-Thani',
        'Rajab',
        "Sha'ban",
        'Ramadan',
        'Shawwal',
        "Dhu al-Qi'dah",
        'Dhu al-Hijjah'
      ];

      // Test each month by converting dates throughout a Hijri year
      const testDate = new Date(2024, 0, 1);
      for (let i = 0; i < 12; i++) {
        const date = new Date(testDate.getTime() + i * 30 * 24 * 60 * 60 * 1000);
        const result = service.gregorianToHijri(date);
        expect(monthNames).toContain(result.monthName);
      }
    });
  });

  describe('hijriToGregorian', () => {
    it('should convert a known Hijri date to Gregorian correctly', () => {
      // Ramadan 1, 1445 = March 11, 2024
      const result = service.hijriToGregorian(1445, 9, 1);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getDate()).toBe(11);
    });

    it('should convert back and forth consistently', () => {
      const originalDate = new Date(2024, 5, 15); // June 15, 2024
      const hijri = service.gregorianToHijri(originalDate);
      const backToGregorian = service.hijriToGregorian(hijri.year, hijri.month, hijri.day);

      // Should match original date
      expect(backToGregorian.getFullYear()).toBe(originalDate.getFullYear());
      expect(backToGregorian.getMonth()).toBe(originalDate.getMonth());
      expect(backToGregorian.getDate()).toBe(originalDate.getDate());
    });

    it('should handle Muharram (first month)', () => {
      const result = service.hijriToGregorian(1446, 1, 1);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBeGreaterThanOrEqual(2024);
    });

    it('should handle Dhu al-Hijjah (last month)', () => {
      const result = service.hijriToGregorian(1445, 12, 29);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBeGreaterThanOrEqual(2024);
    });
  });

  describe('formatBothCalendars', () => {
    it('should format date with both calendars', () => {
      const date = new Date(2024, 0, 1);
      const result = service.formatBothCalendars(date);

      expect(result).toContain('01 Jan 2024');
      expect(result).toContain('AH');
      expect(result).toContain('1445');
    });

    it('should use custom format pattern', () => {
      const date = new Date(2024, 0, 1);
      const result = service.formatBothCalendars(date, 'yyyy-MM-dd');

      expect(result).toContain('2024-01-01');
      expect(result).toContain('AH');
    });

    it('should include Hijri month name', () => {
      const date = new Date(2024, 2, 11); // Ramadan 1, 1445
      const result = service.formatBothCalendars(date);

      expect(result).toContain('Ramadan');
    });
  });

  describe('getCurrentHijriDate', () => {
    it('should return current Hijri date', () => {
      const result = service.getCurrentHijriDate();

      expect(result.year).toBeGreaterThanOrEqual(1445);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
      expect(result.day).toBeGreaterThanOrEqual(1);
      expect(result.day).toBeLessThanOrEqual(30);
      expect(result.monthName).toBeDefined();
    });

    it('should return valid month name', () => {
      const result = service.getCurrentHijriDate();
      const validMonths = [
        'Muharram',
        'Safar',
        "Rabi' al-Awwal",
        "Rabi' al-Thani",
        'Jumada al-Awwal',
        'Jumada al-Thani',
        'Rajab',
        "Sha'ban",
        'Ramadan',
        'Shawwal',
        "Dhu al-Qi'dah",
        'Dhu al-Hijjah'
      ];

      expect(validMonths).toContain(result.monthName);
    });
  });

  describe('getCurrentHijriYear', () => {
    it('should return current Hijri year as a number', () => {
      const result = service.getCurrentHijriYear();

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(1445);
      expect(result).toBeLessThan(1500); // Reasonable upper bound for current era
    });

    it('should be consistent with getCurrentHijriDate', () => {
      const year = service.getCurrentHijriYear();
      const fullDate = service.getCurrentHijriDate();

      expect(year).toBe(fullDate.year);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle leap years correctly', () => {
      // February 29, 2024 (leap year)
      const leapDate = new Date(2024, 1, 29);
      const result = service.gregorianToHijri(leapDate);

      expect(result.year).toBeGreaterThan(0);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
    });

    it('should handle dates around year boundaries', () => {
      // December 31 and January 1
      const dec31 = service.gregorianToHijri(new Date(2023, 11, 31));
      const jan1 = service.gregorianToHijri(new Date(2024, 0, 1));

      expect(dec31).toBeDefined();
      expect(jan1).toBeDefined();
    });

    it('should handle century transitions', () => {
      const date1999 = service.gregorianToHijri(new Date(1999, 11, 31));
      const date2000 = service.gregorianToHijri(new Date(2000, 0, 1));

      expect(date1999).toBeDefined();
      expect(date2000).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should support Zakat anniversary calculations', () => {
      // Simulate tracking Zakat due dates
      const lastZakatDate = new Date(2024, 5, 15);
      const hijri = service.gregorianToHijri(lastZakatDate);

      // One year later in Hijri calendar
      const nextYearHijri = { ...hijri, year: hijri.year + 1 };
      const nextZakatDate = service.hijriToGregorian(
        nextYearHijri.year,
        nextYearHijri.month,
        nextYearHijri.day
      );

      // Should be approximately 354-355 days later (lunar year)
      const daysDiff = Math.floor(
        (nextZakatDate.getTime() - lastZakatDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBeGreaterThanOrEqual(353);
      expect(daysDiff).toBeLessThanOrEqual(356);
    });

    it('should handle Ramadan date tracking', () => {
      // Find current Ramadan
      const today = new Date();
      const hijri = service.gregorianToHijri(today);

      if (hijri.month === 9) {
        // We're in Ramadan
        expect(hijri.monthName).toBe('Ramadan');
      }

      // Calculate next Ramadan (month 9 of next year)
      const nextRamadan = service.hijriToGregorian(hijri.year + 1, 9, 1);
      expect(nextRamadan).toBeInstanceOf(Date);
      expect(nextRamadan.getTime()).toBeGreaterThan(today.getTime());
    });
  });
});
