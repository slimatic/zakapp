import * as HijriConverter from 'hijri-converter';
import { format, parse } from 'date-fns';

/**
 * CalendarService - Handles Hijri/Gregorian date conversions
 * Uses hijri-converter library for accurate Islamic calendar calculations
 */
export class CalendarConversionService {
  
  /**
   * Converts a Gregorian date to Hijri date
   * @param gregorianDate - Gregorian date to convert
   * @returns Hijri date components
   */
  gregorianToHijri(gregorianDate: Date): {
    year: number;
    month: number;
    day: number;
    monthName: string;
  } {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth() + 1; // months are 0-indexed in JS
    const day = gregorianDate.getDate();

    const hijriDate = HijriConverter.toHijri(year, month, day);

    const monthNames = [
      'Muharram',
      'Safar',
      'Rabi\' al-awwal',
      'Rabi\' al-thani',
      'Jumada al-awwal',
      'Jumada al-thani',
      'Rajab',
      'Sha\'ban',
      'Ramadan',
      'Shawwal',
      'Dhu al-Qi\'dah',
      'Dhu al-Hijjah'
    ];

    return {
      year: hijriDate.hy,
      month: hijriDate.hm,
      day: hijriDate.hd,
      monthName: monthNames[hijriDate.hm - 1] || 'Unknown'
    };
  }

  /**
   * Converts a Hijri date to Gregorian date
   * @param hijriYear - Hijri year
   * @param hijriMonth - Hijri month (1-12)
   * @param hijriDay - Hijri day (1-30)
   * @returns Gregorian date
   */
  hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
    const gregorianDate = HijriConverter.toGregorian(hijriYear, hijriMonth, hijriDay);
    
    return new Date(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd);
  }

  /**
   * Formats a Gregorian date showing both Gregorian and Hijri representations
   * @param gregorianDate - Date to format
   * @param formatPattern - Format pattern (default: 'dd MMM yyyy')
   * @returns Formatted string with both calendars
   */
  formatBothCalendars(gregorianDate: Date, formatPattern: string = 'dd MMM yyyy'): string {
    const gregorianFormatted = format(gregorianDate, formatPattern);
    const hijri = this.gregorianToHijri(gregorianDate);
    
    return `${gregorianFormatted} (${hijri.day} ${hijri.monthName} ${hijri.year} AH)`;
  }

  /**
   * Gets the current Hijri date
   * @returns Current Hijri date components
   */
  getCurrentHijriDate(): {
    year: number;
    month: number;
    day: number;
    monthName: string;
  } {
    return this.gregorianToHijri(new Date());
  }

  /**
   * Gets the current Hijri year
   * @returns Current Hijri year number
   */
  getCurrentHijriYear(): number {
    const hijri = this.gregorianToHijri(new Date());
    return hijri.year;
  }

  /**
   * Checks if a Hijri date is valid
   * @param year - Hijri year
   * @param month - Hijri month (1-12)
   * @param day - Hijri day (1-30)
   * @returns True if valid
   */
  isValidHijriDate(year: number, month: number, day: number): boolean {
    // Basic validation
    if (year < 1 || year > 9999) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 30) return false;

    // Try to convert - if it throws, it's invalid
    try {
      HijriConverter.toGregorian(year, month, day);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculates the number of days between two Hijri dates
   * @param startDate - Start Hijri date
   * @param endDate - End Hijri date
   * @returns Number of days
   */
  daysBetweenHijriDates(
    startDate: { year: number; month: number; day: number },
    endDate: { year: number; month: number; day: number }
  ): number {
    const startGregorian = this.hijriToGregorian(startDate.year, startDate.month, startDate.day);
    const endGregorian = this.hijriToGregorian(endDate.year, endDate.month, endDate.day);

    const diffTime = endGregorian.getTime() - startGregorian.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Adds days to a Hijri date
   * @param hijriDate - Starting Hijri date
   * @param days - Number of days to add
   * @returns New Hijri date
   */
  addDaysToHijriDate(
    hijriDate: { year: number; month: number; day: number },
    days: number
  ): { year: number; month: number; day: number; monthName: string } {
    const gregorian = this.hijriToGregorian(hijriDate.year, hijriDate.month, hijriDate.day);
    gregorian.setDate(gregorian.getDate() + days);
    
    return this.gregorianToHijri(gregorian);
  }

  /**
   * Gets the Hijri month name
   * @param monthNumber - Month number (1-12)
   * @returns Month name
   */
  getHijriMonthName(monthNumber: number): string {
    const monthNames = [
      'Muharram',
      'Safar',
      'Rabi\' al-awwal',
      'Rabi\' al-thani',
      'Jumada al-awwal',
      'Jumada al-thani',
      'Rajab',
      'Sha\'ban',
      'Ramadan',
      'Shawwal',
      'Dhu al-Qi\'dah',
      'Dhu al-Hijjah'
    ];

    if (monthNumber < 1 || monthNumber > 12) {
      throw new Error('Invalid month number. Must be between 1 and 12');
    }

    return monthNames[monthNumber - 1];
  }

  /**
   * Formats a Hijri date
   * @param hijriDate - Hijri date to format
   * @param includeMonthName - Include full month name (default: true)
   * @returns Formatted Hijri date string
   */
  formatHijriDate(
    hijriDate: { year: number; month: number; day: number },
    includeMonthName: boolean = true
  ): string {
    if (includeMonthName) {
      const monthName = this.getHijriMonthName(hijriDate.month);
      return `${hijriDate.day} ${monthName} ${hijriDate.year} AH`;
    }
    
    return `${hijriDate.day}/${hijriDate.month}/${hijriDate.year} AH`;
  }

  /**
   * Gets the date range for a Hijri year
   * @param hijriYear - Hijri year
   * @returns Start and end dates in both calendars
   */
  getHijriYearRange(hijriYear: number): {
    hijriStart: { year: number; month: number; day: number };
    hijriEnd: { year: number; month: number; day: number };
    gregorianStart: Date;
    gregorianEnd: Date;
  } {
    const hijriStart = { year: hijriYear, month: 1, day: 1 };
    const hijriEnd = { year: hijriYear, month: 12, day: 30 };

    return {
      hijriStart,
      hijriEnd,
      gregorianStart: this.hijriToGregorian(hijriYear, 1, 1),
      gregorianEnd: this.hijriToGregorian(hijriYear, 12, 30)
    };
  }
}
