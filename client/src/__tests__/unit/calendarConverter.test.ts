/**
 * Unit Tests for calendarConverter utility
 * Tests Hijri-Gregorian conversion functions for frontend
 */

import {
  gregorianToHijri,
  hijriToGregorian,
  formatHijriDate,
  formatGregorianDate,
  formatDualCalendar,
  addHijriMonths,
  isNearHijriAnniversary,
  getHijriYearStart,
  getHijriYearEnd,
  HIJRI_MONTHS
} from '../../utils/calendarConverter';

describe('calendarConverter utility', () => {
  describe('gregorianToHijri', () => {
    it('should convert a Gregorian date to Hijri', () => {
      const result = gregorianToHijri(new Date(2024, 0, 1)); // January 1, 2024

      expect(result).toHaveProperty('hy');
      expect(result).toHaveProperty('hm');
      expect(result).toHaveProperty('hd');
      expect(result.hy).toBe(1445);
      expect(result.hm).toBe(6); // Jumada al-thani
      expect(result.hd).toBe(19);
    });

    it('should handle ISO date strings', () => {
      const result = gregorianToHijri('2024-03-11'); // Ramadan 1, 1445

      expect(result.hy).toBe(1445);
      expect(result.hm).toBe(9); // Ramadan
    });

    it('should throw error for invalid dates', () => {
      expect(() => gregorianToHijri('invalid-date')).toThrow('Invalid Gregorian date provided');
      expect(() => gregorianToHijri(new Date('invalid'))).toThrow('Invalid Gregorian date provided');
    });

    it('should handle Date objects', () => {
      const date = new Date(2024, 5, 15);
      const result = gregorianToHijri(date);

      expect(result.hy).toBeGreaterThan(1400);
      expect(result.hm).toBeGreaterThanOrEqual(1);
      expect(result.hm).toBeLessThanOrEqual(12);
    });
  });

  describe('hijriToGregorian', () => {
    it('should convert a Hijri date to Gregorian', () => {
      const result = hijriToGregorian(1445, 9, 1); // Ramadan 1, 1445

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getDate()).toBe(11);
    });

    it('should throw error for invalid Hijri year', () => {
      expect(() => hijriToGregorian(0, 1, 1)).toThrow('Invalid Hijri date values');
      expect(() => hijriToGregorian(-5, 1, 1)).toThrow('Invalid Hijri date values');
    });

    it('should throw error for invalid Hijri month', () => {
      expect(() => hijriToGregorian(1445, 0, 1)).toThrow('Invalid Hijri date values');
      expect(() => hijriToGregorian(1445, 13, 1)).toThrow('Invalid Hijri date values');
    });

    it('should throw error for invalid Hijri day', () => {
      expect(() => hijriToGregorian(1445, 1, 0)).toThrow('Invalid Hijri date values');
      expect(() => hijriToGregorian(1445, 1, 31)).toThrow('Invalid Hijri date values');
    });

    it('should handle edge case: day 30', () => {
      const result = hijriToGregorian(1445, 1, 30);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBeGreaterThanOrEqual(2023);
    });

    it('should handle all 12 Hijri months', () => {
      for (let month = 1; month <= 12; month++) {
        const result = hijriToGregorian(1445, month, 1);
        expect(result).toBeInstanceOf(Date);
      }
    });
  });

  describe('formatHijriDate', () => {
    it('should format with month name by default', () => {
      const hijriDate = { hy: 1445, hm: 9, hd: 15 };
      const result = formatHijriDate(hijriDate);

      expect(result).toBe('15 Ramadan 1445 AH');
    });

    it('should format without month name when requested', () => {
      const hijriDate = { hy: 1445, hm: 9, hd: 15 };
      const result = formatHijriDate(hijriDate, false);

      expect(result).toBe('15/9/1445 AH');
    });

    it('should handle all month names correctly', () => {
      for (let month = 1; month <= 12; month++) {
        const hijriDate = { hy: 1445, hm: month, hd: 1 };
        const result = formatHijriDate(hijriDate);

        expect(result).toContain(HIJRI_MONTHS[month - 1]);
        expect(result).toContain('AH');
      }
    });

    it('should handle single-digit days', () => {
      const hijriDate = { hy: 1445, hm: 1, hd: 5 };
      const result = formatHijriDate(hijriDate);

      expect(result).toBe('5 Muharram 1445 AH');
    });

    it('should handle two-digit days', () => {
      const hijriDate = { hy: 1445, hm: 12, hd: 29 };
      const result = formatHijriDate(hijriDate);

      expect(result).toBe('29 Dhu al-Hijjah 1445 AH');
    });
  });

  describe('formatGregorianDate', () => {
    it('should format with default pattern', () => {
      const date = new Date(2024, 9, 4); // October 4, 2024
      const result = formatGregorianDate(date);

      expect(result).toContain('October');
      expect(result).toContain('4');
      expect(result).toContain('2024');
    });

    it('should accept custom format string', () => {
      const date = new Date(2024, 9, 4);
      const result = formatGregorianDate(date, 'yyyy-MM-dd');

      expect(result).toBe('2024-10-04');
    });

    it('should handle ISO string input', () => {
      const result = formatGregorianDate('2024-10-04');

      expect(result).toContain('2024');
    });

    it('should handle various formats', () => {
      const date = new Date(2024, 9, 4);

      expect(formatGregorianDate(date, 'dd/MM/yyyy')).toBe('04/10/2024');
      expect(formatGregorianDate(date, 'MMM d, yyyy')).toContain('Oct');
      expect(formatGregorianDate(date, 'EEEE, MMMM do, yyyy')).toContain('Friday');
    });
  });

  describe('formatDualCalendar', () => {
    it('should format with both calendars', () => {
      const date = new Date(2024, 2, 11); // March 11, 2024 (Ramadan 1, 1445)
      const result = formatDualCalendar(date);

      expect(result).toContain('March');
      expect(result).toContain('2024');
      expect(result).toContain('Ramadan');
      expect(result).toContain('1445');
      expect(result).toContain('AH');
    });

    it('should use custom Gregorian format', () => {
      const date = new Date(2024, 0, 1);
      const result = formatDualCalendar(date, 'yyyy-MM-dd');

      expect(result).toContain('2024-01-01');
      expect(result).toContain('AH');
    });

    it('should separate calendars with proper formatting', () => {
      const date = new Date(2024, 0, 1);
      const result = formatDualCalendar(date);

      // Should have a separator between Gregorian and Hijri
      expect(result).toMatch(/\(\d+ .+ \d+ AH\)/);
    });
  });

  describe('addHijriMonths', () => {
    it('should add months to Hijri date', () => {
      const startDate = { hy: 1445, hm: 1, hd: 1 }; // Muharram 1, 1445
      const result = addHijriMonths(startDate, 3);

      expect(result.hm).toBe(4); // Should be in 4th month
      expect(result.hy).toBe(1445);
    });

    it('should handle year rollover', () => {
      const startDate = { hy: 1445, hm: 11, hd: 1 }; // Month 11
      const result = addHijriMonths(startDate, 3);

      expect(result.hy).toBe(1446); // Next year
      expect(result.hm).toBe(2); // 11 + 3 = 14, wraps to month 2
    });

    it('should handle negative months (subtraction)', () => {
      const startDate = { hy: 1445, hm: 5, hd: 1 };
      const result = addHijriMonths(startDate, -2);

      expect(result.hm).toBe(3);
      expect(result.hy).toBe(1445);
    });

    it('should handle subtracting across year boundary', () => {
      const startDate = { hy: 1445, hm: 2, hd: 1 };
      const result = addHijriMonths(startDate, -3);

      expect(result.hy).toBe(1444);
      expect(result.hm).toBe(11);
    });

    it('should handle adding zero months', () => {
      const startDate = { hy: 1445, hm: 6, hd: 15 };
      const result = addHijriMonths(startDate, 0);

      expect(result.hy).toBe(1445);
      expect(result.hm).toBe(6);
      expect(result.hd).toBe(15);
    });

    it('should handle large month additions', () => {
      const startDate = { hy: 1445, hm: 1, hd: 1 };
      const result = addHijriMonths(startDate, 25); // More than 2 years

      expect(result.hy).toBeGreaterThan(1445);
    });
  });

  describe('isNearHijriAnniversary', () => {
    it('should detect dates within 30 days before anniversary', () => {
      const targetDate = { hy: 1445, hm: 9, hd: 15 };
      const checkDate = { hy: 1446, hm: 8, hd: 20 }; // ~25 days before

      const result = isNearHijriAnniversary(targetDate, checkDate, 30);

      expect(result).toBe(true);
    });

    it('should not detect dates more than window away', () => {
      const targetDate = { hy: 1445, hm: 9, hd: 15 };
      const checkDate = { hy: 1446, hm: 7, hd: 1 }; // More than 30 days before

      const result = isNearHijriAnniversary(targetDate, checkDate, 30);

      expect(result).toBe(false);
    });

    it('should handle same day as anniversary', () => {
      const targetDate = { hy: 1445, hm: 9, hd: 15 };
      const checkDate = { hy: 1446, hm: 9, hd: 15 }; // Exactly one year later

      const result = isNearHijriAnniversary(targetDate, checkDate, 30);

      expect(result).toBe(true);
    });

    it('should use default 30-day window', () => {
      const targetDate = { hy: 1445, hm: 9, hd: 15 };
      const checkDate = { hy: 1446, hm: 8, hd: 20 };

      // Should work without explicitly passing window
      const result = isNearHijriAnniversary(targetDate, checkDate);

      expect(result).toBe(true);
    });

    it('should support custom window sizes', () => {
      const targetDate = { hy: 1445, hm: 9, hd: 15 };
      const checkDate = { hy: 1446, hm: 8, hd: 25 }; // 20 days before

      expect(isNearHijriAnniversary(targetDate, checkDate, 25)).toBe(true);
      expect(isNearHijriAnniversary(targetDate, checkDate, 15)).toBe(false);
    });
  });

  describe('getHijriYearStart', () => {
    it('should return Muharram 1 for given year', () => {
      const result = getHijriYearStart(1446);

      expect(result).toBeInstanceOf(Date);

      // Convert back to verify
      const hijri = gregorianToHijri(result);
      expect(hijri.hy).toBe(1446);
      expect(hijri.hm).toBe(1);
      expect(hijri.hd).toBe(1);
    });

    it('should handle different Hijri years', () => {
      const years = [1444, 1445, 1446, 1447];

      years.forEach(year => {
        const result = getHijriYearStart(year);
        const hijri = gregorianToHijri(result);

        expect(hijri.hy).toBe(year);
        expect(hijri.hm).toBe(1);
      });
    });
  });

  describe('getHijriYearEnd', () => {
    it('should return Dhu al-Hijjah 29 for given year', () => {
      const result = getHijriYearEnd(1445);

      expect(result).toBeInstanceOf(Date);

      // Convert back to verify
      const hijri = gregorianToHijri(result);
      expect(hijri.hy).toBe(1445);
      expect(hijri.hm).toBe(12);
      expect(hijri.hd).toBe(29);
    });

    it('should handle different Hijri years', () => {
      const years = [1444, 1445, 1446, 1447];

      years.forEach(year => {
        const result = getHijriYearEnd(year);
        const hijri = gregorianToHijri(result);

        expect(hijri.hy).toBe(year);
        expect(hijri.hm).toBe(12);
      });
    });

    it('should be after year start', () => {
      const yearStart = getHijriYearStart(1445);
      const yearEnd = getHijriYearEnd(1445);

      expect(yearEnd.getTime()).toBeGreaterThan(yearStart.getTime());
    });
  });

  describe('HIJRI_MONTHS constant', () => {
    it('should have exactly 12 months', () => {
      expect(HIJRI_MONTHS).toHaveLength(12);
    });

    it('should include all expected month names', () => {
      const expected = [
        'Muharram',
        'Safar',
        "Rabi' al-awwal",
        "Rabi' al-thani",
        'Jumada al-awwal',
        'Jumada al-thani',
        'Rajab',
        "Sha'ban",
        'Ramadan',
        'Shawwal',
        "Dhu al-Qi'dah",
        'Dhu al-Hijjah'
      ];

      expected.forEach((month, index) => {
        expect(HIJRI_MONTHS[index]).toBe(month);
      });
    });

    it('should have Ramadan as 9th month', () => {
      expect(HIJRI_MONTHS[8]).toBe('Ramadan'); // 0-indexed
    });

    it('should have Muharram as first month', () => {
      expect(HIJRI_MONTHS[0]).toBe('Muharram');
    });

    it('should have Dhu al-Hijjah as last month', () => {
      expect(HIJRI_MONTHS[11]).toBe('Dhu al-Hijjah');
    });
  });

  describe('integration scenarios', () => {
    it('should support round-trip conversion', () => {
      const originalDate = new Date(2024, 5, 15);
      const hijri = gregorianToHijri(originalDate);
      const backToGregorian = hijriToGregorian(hijri.hy, hijri.hm, hijri.hd);

      expect(backToGregorian.getFullYear()).toBe(originalDate.getFullYear());
      expect(backToGregorian.getMonth()).toBe(originalDate.getMonth());
      expect(backToGregorian.getDate()).toBe(originalDate.getDate());
    });

    it('should calculate Zakat anniversary date', () => {
      // Last Zakat was on Ramadan 15, 1445
      const lastZakat = { hy: 1445, hm: 9, hd: 15 };

      // Next Zakat should be Ramadan 15, 1446
      const nextZakatDate = hijriToGregorian(lastZakat.hy + 1, lastZakat.hm, lastZakat.hd);

      const hijri = gregorianToHijri(nextZakatDate);
      expect(hijri.hy).toBe(1446);
      expect(hijri.hm).toBe(9);
      expect(hijri.hd).toBe(15);
    });

    it('should format complete date display', () => {
      const date = new Date(2024, 2, 11);
      const dual = formatDualCalendar(date);

      // Should be readable and contain both calendars
      expect(dual).toMatch(/\w+ \d+, \d{4} \(\d+ \w+ \d+ AH\)/);
    });
  });
});
