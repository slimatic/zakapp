/**
 * Calendar Service - Hijri/Gregorian Calendar Conversion
 */

import * as hijriConverter from 'hijri-converter';

export interface DateComponents {
  year: number;
  month: number;
  day: number;
  formatted?: string;
  monthName?: string;
}

export interface ConversionResult {
  convertedDate: DateComponents;
  originalDate: DateComponents;
  fromCalendar: 'GREGORIAN' | 'HIJRI';
  toCalendar: 'GREGORIAN' | 'HIJRI';
}

export interface ZakatYear {
  startDate: Date;
  endDate: Date;
  calendarType: 'GREGORIAN' | 'HIJRI';
  daysInYear: number;
  periodDays: number;
  adjustmentFactor: number;
  hijriStart?: DateComponents;
  hijriEnd?: DateComponents;
}

export class CalendarService {
  convertDate(
    date: Date,
    fromCalendar: 'GREGORIAN' | 'HIJRI',
    toCalendar: 'GREGORIAN' | 'HIJRI'
  ): ConversionResult {
    if (fromCalendar === toCalendar) {
      throw new Error('Source and target calendars must be different');
    }

    let convertedDate: DateComponents;
    let originalDate: DateComponents;

    if (fromCalendar === 'GREGORIAN' && toCalendar === 'HIJRI') {
      const hijri = hijriConverter.toHijri(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      
      convertedDate = {
        year: hijri.hy,
        month: hijri.hm,
        day: hijri.hd,
        formatted: `${hijri.hy}-${String(hijri.hm).padStart(2, '0')}-${String(hijri.hd).padStart(2, '0')}`
      };

      originalDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        formatted: date.toISOString().split('T')[0]
      };
    } else {
      const gregorian = hijriConverter.toGregorian(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );

      const gregDate = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
      
      convertedDate = {
        year: gregorian.gy,
        month: gregorian.gm,
        day: gregorian.gd,
        formatted: gregDate.toISOString().split('T')[0]
      };

      originalDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        formatted: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      };
    }

    return {
      convertedDate,
      originalDate,
      fromCalendar,
      toCalendar
    };
  }

  calculateZakatYear(referenceDate: Date, calendarType: 'GREGORIAN' | 'HIJRI'): ZakatYear {
    let startDate: Date;
    let endDate: Date;
    let daysInYear: number;
    let hijriStart: DateComponents | undefined;
    let hijriEnd: DateComponents | undefined;

    if (calendarType === 'HIJRI') {
      daysInYear = 354;
      startDate = new Date(referenceDate);
      endDate = new Date(referenceDate);
      endDate.setDate(endDate.getDate() + daysInYear);

      const hijriStartConv = hijriConverter.toHijri(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate()
      );
      
      const hijriEndConv = hijriConverter.toHijri(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate()
      );

      hijriStart = {
        year: hijriStartConv.hy,
        month: hijriStartConv.hm,
        day: hijriStartConv.hd,
        formatted: `${hijriStartConv.hy}-${String(hijriStartConv.hm).padStart(2, '0')}-${String(hijriStartConv.hd).padStart(2, '0')}`
      };

      hijriEnd = {
        year: hijriEndConv.hy,
        month: hijriEndConv.hm,
        day: hijriEndConv.hd,
        formatted: `${hijriEndConv.hy}-${String(hijriEndConv.hm).padStart(2, '0')}-${String(hijriEndConv.hd).padStart(2, '0')}`
      };
    } else {
      daysInYear = 365;
      startDate = new Date(referenceDate);
      endDate = new Date(referenceDate);
      endDate.setDate(endDate.getDate() + daysInYear);
    }

    return {
      startDate,
      endDate,
      calendarType,
      daysInYear,
      periodDays: calendarType === 'HIJRI' ? 354.367 : 365.25,
      adjustmentFactor: calendarType === 'HIJRI' ? 0.9704 : 1.0,
      hijriStart,
      hijriEnd
    };
  }

  validateDateString(dateStr: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return false;
    }

    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  parseDate(dateStr: string): Date {
    if (!this.validateDateString(dateStr)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date value');
    }

    return date;
  }

  /**
   * Get calendar information for a date
   * Used by zakatEngine for lunar calendar calculations
   */
  getCalendarInfo(date: Date): { hijriDate: { year: number; month: number; day: number; monthName: string }; gregorianDate: Date; calculationPeriod: 'lunar' | 'solar'; adjustmentFactor: number } {
    const hijri = hijriConverter.toHijri(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );

    // Arabic month names
    const monthNames = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Shaban',
      'Ramadan', 'Shawwal', 'Dhul-Qadah', 'Dhul-Hijjah'
    ];

    // Lunar year is 354 days, solar is 365 days
    // Adjustment factor: 354/365 = 0.97
    const adjustmentFactor = 354 / 365;

    return {
      hijriDate: {
        year: hijri.hy,
        month: hijri.hm,
        day: hijri.hd,
        monthName: monthNames[hijri.hm - 1]
      },
      gregorianDate: date,
      calculationPeriod: 'lunar',
      adjustmentFactor
    };
  }

  /**
   * Get current Islamic date
   */
  getCurrentIslamicDate(): DateComponents {
    return this.convertDate(new Date(), 'GREGORIAN', 'HIJRI').convertedDate;
  }

  /**
   * Format Hijri date as string
   */
  formatHijriDate(date: DateComponents): string {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }

  /**
   * Check if a Hijri year is a leap year
   */
  isHijriLeapYear(year: number): boolean {
    // Hijri calendar leap year calculation
    // A year is leap if (11 * year + 14) mod 30 < 11
    return (11 * year + 14) % 30 < 11;
  }

  /**
   * Get number of days in a Hijri month
   */
  getDaysInHijriMonth(month: number, year: number): number {
    if (month === 12) {
      // Dhul-Hijjah: 30 days normally, 29 in leap years
      return this.isHijriLeapYear(year) ? 29 : 30;
    } else if (month % 2 === 1) {
      // Odd months: 30 days
      return 30;
    } else {
      // Even months: 29 days
      return 29;
    }
  }

  /**
   * Get lunar year adjustment factor
   */
  getLunarYearAdjustment(): number {
    return 354 / 365; // Lunar year is 354 days, solar is 365
  }

  /**
   * Calculate Zakat year period (alias for calculateZakatYear)
   */
  calculateZakatYearPeriod(referenceDate: Date, calendarType: 'GREGORIAN' | 'HIJRI' | 'lunar' | 'solar'): ZakatYear {
    // Map 'lunar'/'solar' to 'HIJRI'/'GREGORIAN' for backward compatibility
    const mappedType = calendarType === 'lunar' ? 'HIJRI' : calendarType === 'solar' ? 'GREGORIAN' : calendarType;
    return this.calculateZakatYear(referenceDate, mappedType as 'GREGORIAN' | 'HIJRI');
  }
}

export const calendarService = new CalendarService();
