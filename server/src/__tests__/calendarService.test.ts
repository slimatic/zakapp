/**
 * Unit tests for CalendarService
 * 
 * Tests comprehensive calendar conversion functionality including:
 * - Gregorian to Hijri conversion accuracy
 * - Hijri to Gregorian conversion accuracy
 * - Edge cases (month boundaries, year boundaries)
 * - Next Zakat date calculation
 * - Date formatting
 * - Leap year calculations
 * - Adjustment factor calculations
 */

import { CalendarService } from '../services/calendarService';

describe('CalendarService', () => {
  let calendarService: CalendarService;

  beforeEach(() => {
    calendarService = new CalendarService();
  });

  describe('gregorianToHijri conversion', () => {
    it('should convert known Gregorian dates to Hijri dates accurately', async () => {
      // Test case 1: Islamic New Year 1446 (July 7, 2024)
      const date1 = new Date('2024-07-07');
      const calendarInfo1 = await calendarService.getCalendarInfo(date1);
      
      expect(calendarInfo1.hijriDate.year).toBe(1446);
      expect(calendarInfo1.hijriDate.month).toBeGreaterThanOrEqual(1);
      expect(calendarInfo1.hijriDate.month).toBeLessThanOrEqual(12);
      expect(calendarInfo1.hijriDate.day).toBeGreaterThanOrEqual(1);
      expect(calendarInfo1.hijriDate.day).toBeLessThanOrEqual(30);
      expect(calendarInfo1.hijriDate.monthName).toBeTruthy();
    });

    it('should convert January 1, 2024 to a valid Hijri date', async () => {
      const date = new Date('2024-01-01');
      const calendarInfo = await calendarService.getCalendarInfo(date);
      
      // Should be around Jumada al-Thani 1445
      expect(calendarInfo.hijriDate.year).toBe(1445);
      expect(calendarInfo.hijriDate.month).toBeGreaterThanOrEqual(1);
      expect(calendarInfo.hijriDate.month).toBeLessThanOrEqual(12);
      expect(calendarInfo.gregorianDate).toEqual(date);
    });

    it('should convert October 9, 2025 (current date) to valid Hijri', async () => {
      const date = new Date('2025-10-09');
      const calendarInfo = await calendarService.getCalendarInfo(date);
      
      // Should be around Rabi' al-Thani 1447
      expect(calendarInfo.hijriDate.year).toBe(1447);
      expect(calendarInfo.hijriDate.month).toBeGreaterThanOrEqual(1);
      expect(calendarInfo.hijriDate.month).toBeLessThanOrEqual(12);
    });

    it('should handle year boundary conversions correctly', async () => {
      // Test dates near Islamic year boundaries
      const dates = [
        new Date('2024-07-06'), // Day before 1446
        new Date('2024-07-07'), // Start of 1446
        new Date('2024-07-08'), // Day after
      ];

      for (const date of dates) {
        const calendarInfo = await calendarService.getCalendarInfo(date);
        expect(calendarInfo.hijriDate.year).toBeGreaterThanOrEqual(1445);
        expect(calendarInfo.hijriDate.year).toBeLessThanOrEqual(1446);
        expect(calendarInfo.hijriDate.month).toBeGreaterThanOrEqual(1);
        expect(calendarInfo.hijriDate.month).toBeLessThanOrEqual(12);
      }
    });

    it('should handle month boundary conversions correctly', async () => {
      // Test first and last days of months
      const testDates = [
        new Date('2024-01-01'), // Start of Gregorian year
        new Date('2024-01-31'), // End of January
        new Date('2024-02-01'), // Start of February
        new Date('2024-12-31'), // End of year
      ];

      for (const date of testDates) {
        const calendarInfo = await calendarService.getCalendarInfo(date);
        expect(calendarInfo.hijriDate.year).toBeGreaterThanOrEqual(1445);
        expect(calendarInfo.hijriDate.month).toBeGreaterThanOrEqual(1);
        expect(calendarInfo.hijriDate.month).toBeLessThanOrEqual(12);
        expect(calendarInfo.hijriDate.day).toBeGreaterThanOrEqual(1);
        expect(calendarInfo.hijriDate.day).toBeLessThanOrEqual(30);
      }
    });

    it('should return valid month names', async () => {
      const validMonthNames = [
        'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
        'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
        'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
      ];

      const date = new Date('2024-01-01');
      const calendarInfo = await calendarService.getCalendarInfo(date);
      
      expect(validMonthNames).toContain(calendarInfo.hijriDate.monthName);
    });
  });

  describe('getCurrentIslamicDate', () => {
    it('should return current Hijri date', async () => {
      const hijriDate = await calendarService.getCurrentIslamicDate();
      
      // Should be in year range 1446-1447 for 2024-2025
      expect(hijriDate.year).toBeGreaterThanOrEqual(1446);
      expect(hijriDate.year).toBeLessThanOrEqual(1447);
      expect(hijriDate.month).toBeGreaterThanOrEqual(1);
      expect(hijriDate.month).toBeLessThanOrEqual(12);
      expect(hijriDate.day).toBeGreaterThanOrEqual(1);
      expect(hijriDate.day).toBeLessThanOrEqual(30);
      expect(hijriDate.monthName).toBeTruthy();
    });
  });

  describe('formatHijriDate', () => {
    it('should format Hijri date correctly', () => {
      const hijriDate = {
        year: 1446,
        month: 1,
        day: 1,
        monthName: 'Muharram'
      };

      const formatted = calendarService.formatHijriDate(hijriDate);
      expect(formatted).toBe('1 Muharram 1446 AH');
    });

    it('should format all month names correctly', () => {
      const monthNames = [
        'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
        'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
        'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
      ];

      monthNames.forEach((monthName, index) => {
        const hijriDate = {
          year: 1446,
          month: index + 1,
          day: 15,
          monthName
        };

        const formatted = calendarService.formatHijriDate(hijriDate);
        expect(formatted).toBe(`15 ${monthName} 1446 AH`);
        expect(formatted).toContain('AH');
      });
    });

    it('should handle different day values', () => {
      const testCases = [
        { day: 1, expected: '1 Muharram 1446 AH' },
        { day: 15, expected: '15 Muharram 1446 AH' },
        { day: 29, expected: '29 Muharram 1446 AH' },
        { day: 30, expected: '30 Muharram 1446 AH' },
      ];

      testCases.forEach(({ day, expected }) => {
        const hijriDate = {
          year: 1446,
          month: 1,
          day,
          monthName: 'Muharram'
        };
        expect(calendarService.formatHijriDate(hijriDate)).toBe(expected);
      });
    });
  });

  describe('isHijriLeapYear', () => {
    it('should correctly identify leap years in 30-year cycle', () => {
      // Leap years in a 30-year cycle: 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29
      const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
      const nonLeapYears = [1, 3, 4, 6, 8, 9, 11, 12, 14, 15, 17, 19, 20, 22, 23, 25, 27, 28, 30];

      // Test within first 30-year cycle
      leapYears.forEach(year => {
        expect(calendarService.isHijriLeapYear(year)).toBe(true);
      });

      nonLeapYears.forEach(year => {
        expect(calendarService.isHijriLeapYear(year)).toBe(false);
      });
    });

    it('should work for years beyond first cycle', () => {
      // Test year 1446 (1446 % 30 = 6, which is not a leap year)
      expect(calendarService.isHijriLeapYear(1446)).toBe(false);
      
      // Test year 1447 (1447 % 30 = 7, which is a leap year)
      expect(calendarService.isHijriLeapYear(1447)).toBe(true);
      
      // Test year 1448 (1448 % 30 = 8, which is not a leap year)
      expect(calendarService.isHijriLeapYear(1448)).toBe(false);
    });

    it('should handle year 0 and negative years', () => {
      expect(calendarService.isHijriLeapYear(0)).toBe(false);
      expect(calendarService.isHijriLeapYear(-1)).toBe(false);
    });
  });

  describe('getDaysInHijriMonth', () => {
    it('should return 30 days for odd months', () => {
      const oddMonths = [1, 3, 5, 7, 9, 11];
      oddMonths.forEach(month => {
        expect(calendarService.getDaysInHijriMonth(month, 1446)).toBe(30);
      });
    });

    it('should return 29 days for even months (except month 12 in leap years)', () => {
      const evenMonths = [2, 4, 6, 8, 10];
      evenMonths.forEach(month => {
        expect(calendarService.getDaysInHijriMonth(month, 1446)).toBe(29);
        expect(calendarService.getDaysInHijriMonth(month, 1447)).toBe(29);
      });
    });

    it('should return 30 days for month 12 in leap years', () => {
      // 1447 is a leap year (1447 % 30 = 7)
      expect(calendarService.getDaysInHijriMonth(12, 1447)).toBe(30);
    });

    it('should return 29 days for month 12 in non-leap years', () => {
      // 1446 is not a leap year (1446 % 30 = 6)
      expect(calendarService.getDaysInHijriMonth(12, 1446)).toBe(29);
    });

    it('should handle all 12 months correctly', () => {
      const year = 1447; // Leap year (1447 % 30 = 7)
      const expectedDays = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 30];
      
      for (let month = 1; month <= 12; month++) {
        expect(calendarService.getDaysInHijriMonth(month, year)).toBe(expectedDays[month - 1]);
      }
    });
  });

  describe('getLunarYearAdjustment', () => {
    it('should return correct lunar year adjustment factor', () => {
      const adjustment = calendarService.getLunarYearAdjustment();
      
      // Lunar year (354.367 days) / Solar year (365.25 days) ≈ 0.9704
      expect(adjustment).toBeCloseTo(0.9704, 3);
      expect(adjustment).toBe(354.367 / 365.25);
    });

    it('should be less than 1 (lunar year is shorter)', () => {
      const adjustment = calendarService.getLunarYearAdjustment();
      expect(adjustment).toBeLessThan(1);
      expect(adjustment).toBeGreaterThan(0.9);
    });
  });

  describe('getCalendarInfo', () => {
    it('should return complete calendar calculation information', async () => {
      const date = new Date('2024-01-01');
      const calendarInfo = await calendarService.getCalendarInfo(date);

      expect(calendarInfo).toHaveProperty('gregorianDate');
      expect(calendarInfo).toHaveProperty('hijriDate');
      expect(calendarInfo).toHaveProperty('calculationPeriod');
      expect(calendarInfo).toHaveProperty('adjustmentFactor');

      expect(calendarInfo.gregorianDate).toEqual(date);
      expect(calendarInfo.calculationPeriod).toBe('lunar');
      expect(calendarInfo.adjustmentFactor).toBeCloseTo(0.9704, 3);
    });

    it('should include valid Hijri date components', async () => {
      const date = new Date('2025-10-09');
      const calendarInfo = await calendarService.getCalendarInfo(date);

      const { hijriDate } = calendarInfo;
      expect(hijriDate.year).toBeGreaterThan(0);
      expect(hijriDate.month).toBeGreaterThanOrEqual(1);
      expect(hijriDate.month).toBeLessThanOrEqual(12);
      expect(hijriDate.day).toBeGreaterThanOrEqual(1);
      expect(hijriDate.day).toBeLessThanOrEqual(30);
      expect(hijriDate.monthName).toBeTruthy();
      expect(typeof hijriDate.monthName).toBe('string');
    });

    it('should return lunar adjustment factor by default', async () => {
      const date = new Date('2024-01-01');
      const calendarInfo = await calendarService.getCalendarInfo(date);

      expect(calendarInfo.adjustmentFactor).toBe(354.367 / 365.25);
      expect(calendarInfo.calculationPeriod).toBe('lunar');
    });
  });

  describe('calculateZakatYearPeriod', () => {
    it('should calculate lunar year period correctly', () => {
      const startDate = new Date('2024-01-01');
      const result = calendarService.calculateZakatYearPeriod(startDate, 'lunar');

      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('periodDays');
      expect(result).toHaveProperty('adjustmentFactor');

      expect(result.periodDays).toBeCloseTo(354.367, 1);
      expect(result.adjustmentFactor).toBeCloseTo(0.9704, 3);

      // End date should be approximately 354 days after start date
      const daysDiff = Math.floor((result.endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeCloseTo(354, 1);
    });

    it('should calculate solar year period correctly', () => {
      const startDate = new Date('2024-01-01');
      const result = calendarService.calculateZakatYearPeriod(startDate, 'solar');

      expect(result.periodDays).toBeCloseTo(365.25, 1);
      expect(result.adjustmentFactor).toBe(1.0);

      // End date should be approximately 365 days after start date
      const daysDiff = Math.floor((result.endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeCloseTo(365, 1);
    });

    it('should handle leap years correctly for solar calendar', () => {
      // 2024 is a leap year
      const startDate = new Date('2024-01-01');
      const result = calendarService.calculateZakatYearPeriod(startDate, 'solar');

      const expectedEndDate = new Date('2024-12-31');
      const actualDiff = Math.floor((result.endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Should be 365 days (2024 is a leap year, but period is still ~365 days)
      expect(actualDiff).toBeGreaterThanOrEqual(365);
      expect(actualDiff).toBeLessThanOrEqual(366);
    });

    it('should calculate different end dates for lunar vs solar', () => {
      const startDate = new Date('2024-01-01');
      const lunarResult = calendarService.calculateZakatYearPeriod(startDate, 'lunar');
      const solarResult = calendarService.calculateZakatYearPeriod(startDate, 'solar');

      // Lunar year should end ~10-11 days earlier than solar year
      const diffInDays = Math.floor((solarResult.endDate.getTime() - lunarResult.endDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffInDays).toBeGreaterThanOrEqual(10);
      expect(diffInDays).toBeLessThanOrEqual(11);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very old dates', async () => {
      const oldDate = new Date('1900-01-01');
      const calendarInfo = await calendarService.getCalendarInfo(oldDate);

      expect(calendarInfo.hijriDate.year).toBeGreaterThan(1300);
      expect(calendarInfo.hijriDate.year).toBeLessThan(1400);
    });

    it('should handle future dates', async () => {
      const futureDate = new Date('2100-12-31');
      const calendarInfo = await calendarService.getCalendarInfo(futureDate);

      expect(calendarInfo.hijriDate.year).toBeGreaterThan(1500);
      expect(calendarInfo.hijriDate.year).toBeLessThan(1600);
    });

    it('should handle Islamic epoch date', async () => {
      // July 16, 622 CE - Islamic calendar epoch
      const epochDate = new Date('622-07-16');
      const calendarInfo = await calendarService.getCalendarInfo(epochDate);

      // Should be year 1 or close to it
      expect(calendarInfo.hijriDate.year).toBeGreaterThanOrEqual(1);
      expect(calendarInfo.hijriDate.year).toBeLessThanOrEqual(10);
    });

    it('should handle midnight dates', async () => {
      const midnightDate = new Date('2024-01-01T00:00:00.000Z');
      const calendarInfo = await calendarService.getCalendarInfo(midnightDate);

      expect(calendarInfo.hijriDate).toBeTruthy();
      expect(calendarInfo.gregorianDate).toEqual(midnightDate);
    });

    it('should handle end of day dates', async () => {
      const endOfDayDate = new Date('2024-12-31T23:59:59.999Z');
      const calendarInfo = await calendarService.getCalendarInfo(endOfDayDate);

      expect(calendarInfo.hijriDate).toBeTruthy();
      expect(calendarInfo.hijriDate.year).toBeGreaterThan(0);
    });
  });

  describe('Zakat calculation integration', () => {
    it('should provide correct adjustment factor for zakat calculations', async () => {
      const date = new Date('2024-01-01');
      const calendarInfo = await calendarService.getCalendarInfo(date);

      // Adjustment factor should be used to calculate zakat for lunar year
      const lunarAdjustment = calendarInfo.adjustmentFactor;
      expect(lunarAdjustment).toBeCloseTo(0.9704, 3);

      // Example: 100,000 wealth with lunar adjustment
      const wealth = 100000;
      const adjustedWealth = wealth * lunarAdjustment;
      expect(adjustedWealth).toBeCloseTo(97020, 0);
    });

    it('should calculate next zakat date correctly', () => {
      const startDate = new Date('2024-01-01');
      const lunar = calendarService.calculateZakatYearPeriod(startDate, 'lunar');
      const solar = calendarService.calculateZakatYearPeriod(startDate, 'solar');

      // Next zakat date for lunar should be ~354 days later
      const lunarDays = Math.floor((lunar.endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(lunarDays).toBeCloseTo(354, 1);

      // Next zakat date for solar should be ~365 days later
      const solarDays = Math.floor((solar.endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(solarDays).toBeCloseTo(365, 1);
    });
  });

  describe('Performance and consistency', () => {
    it('should return consistent results for same date', async () => {
      const date = new Date('2024-06-15');
      
      const result1 = await calendarService.getCalendarInfo(date);
      const result2 = await calendarService.getCalendarInfo(date);

      expect(result1.hijriDate).toEqual(result2.hijriDate);
      expect(result1.adjustmentFactor).toBe(result2.adjustmentFactor);
    });

    it('should handle rapid sequential calls', async () => {
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-06-15'),
        new Date('2024-12-31'),
      ];

      const promises = dates.map(date => calendarService.getCalendarInfo(date));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.gregorianDate).toEqual(dates[index]);
        expect(result.hijriDate).toBeTruthy();
      });
    });

    it('should complete conversion in reasonable time', async () => {
      const startTime = Date.now();
      const date = new Date('2024-01-01');
      
      await calendarService.getCalendarInfo(date);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in less than 50ms as per performance targets
      expect(duration).toBeLessThan(50);
    });
  });
});
