import { HijriDate, CalendarCalculation } from '@zakapp/shared';

/**
 * Calendar Service for Hijri (Lunar) and Gregorian (Solar) date conversions
 * 
 * Provides calendar calculations for zakat calculations that need to consider
 * the difference between lunar (354 days) and solar (365 days) years.
 * 
 * Constitutional Compliance:
 * - Islamic Compliance: Accurate Hijri calendar calculations
 * - Transparency: Clear date conversion explanations
 * - User-Centric: Support for both calendar systems
 */
export class CalendarService {
  
  /**
   * Get calendar information for zakat calculation
   * 
   * @param gregorianDate - The Gregorian date for calculation
   * @returns Calendar calculation information with both systems
   */
  async getCalendarInfo(gregorianDate: Date): Promise<CalendarCalculation> {
    const hijriDate = this.gregorianToHijri(gregorianDate);
    const adjustmentFactor = this.calculateAdjustmentFactor('lunar');

    return {
      gregorianDate,
      hijriDate,
      calculationPeriod: 'lunar',
      adjustmentFactor
    };
  }

  /**
   * Convert Gregorian date to Hijri date
   * 
   * Note: This is a simplified implementation. In production, you would use
   * a proper Islamic calendar library like moment-hijri or hijri-date
   */
  private gregorianToHijri(gregorianDate: Date): HijriDate {
    // Simplified conversion - in reality, use proper Islamic calendar library
    const gregorianYear = gregorianDate.getFullYear();
    const gregorianMonth = gregorianDate.getMonth() + 1;
    const gregorianDay = gregorianDate.getDate();

    // Approximate conversion (Islamic calendar started July 16, 622 CE)
    const islamicEpoch = new Date(622, 6, 16); // July 16, 622
    const daysSinceEpoch = Math.floor((gregorianDate.getTime() - islamicEpoch.getTime()) / (1000 * 60 * 60 * 24));
    
    // Islamic year is approximately 354.367 days
    const islamicYearLength = 354.367;
    const hijriYear = Math.floor(daysSinceEpoch / islamicYearLength) + 1;
    
    // Simplified month and day calculation
    const remainingDays = daysSinceEpoch % islamicYearLength;
    const hijriMonth = Math.floor(remainingDays / 29.5) + 1;
    const hijriDay = Math.floor(remainingDays % 29.5) + 1;

    const monthNames = [
      'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];

    return {
      year: hijriYear,
      month: Math.min(hijriMonth, 12),
      day: Math.min(hijriDay, 30),
      monthName: monthNames[(hijriMonth - 1) % 12] || 'Muharram'
    };
  }

  /**
   * Calculate adjustment factor for calendar system
   * 
   * @param calendarType - The calendar system being used
   * @returns Adjustment factor to apply to calculations
   */
  private calculateAdjustmentFactor(calendarType: 'lunar' | 'solar'): number {
    if (calendarType === 'lunar') {
      // Islamic lunar year is ~354.367 days vs solar year ~365.25 days
      // Adjustment factor: 354.367 / 365.25 ≈ 0.9704
      return 354.367 / 365.25;
    }
    return 1.0; // No adjustment for solar calendar
  }

  /**
   * Check if a Hijri year is a leap year
   * 
   * @param hijriYear - The Hijri year to check
   * @returns True if the year is a leap year
   */
  isHijriLeapYear(hijriYear: number): boolean {
    // 11 years in every 30-year cycle are leap years
    const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    return leapYears.includes(hijriYear % 30);
  }

  /**
   * Get days in a Hijri month
   * 
   * @param month - Hijri month (1-12)
   * @param year - Hijri year
   * @returns Number of days in the month
   */
  getDaysInHijriMonth(month: number, year: number): number {
    // Odd months (1,3,5,7,9,11) have 30 days, even months have 29 days
    // Exception: 12th month has 30 days in leap years
    if (month % 2 === 1) {
      return 30; // Odd months
    } else if (month === 12 && this.isHijriLeapYear(year)) {
      return 30; // Dhu al-Hijjah in leap year
    } else {
      return 29; // Even months (except Dhu al-Hijjah in leap year)
    }
  }

  /**
   * Calculate the lunar year adjustment for zakat calculations
   * 
   * This is used when calculating zakat based on lunar calendar principles
   * but using Gregorian calendar asset values.
   */
  getLunarYearAdjustment(): number {
    return 354.367 / 365.25;
  }

  /**
   * Get formatted Hijri date string
   */
  formatHijriDate(hijriDate: HijriDate): string {
    return `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year} AH`;
  }

  /**
   * Get the current Islamic calendar information
   */
  async getCurrentIslamicDate(): Promise<HijriDate> {
    return this.gregorianToHijri(new Date());
  }

  /**
   * Calculate zakat year period based on calendar system
   * 
   * @param startDate - Start date for zakat calculation period
   * @param calendarType - Calendar system to use
   * @returns End date and period information
   */
  calculateZakatYearPeriod(startDate: Date, calendarType: 'lunar' | 'solar'): {
    startDate: Date;
    endDate: Date;
    periodDays: number;
    adjustmentFactor: number;
  } {
    const periodDays = calendarType === 'lunar' ? 354.367 : 365.25;
    const endDate = new Date(startDate.getTime() + (periodDays * 24 * 60 * 60 * 1000));
    
    return {
      startDate,
      endDate,
      periodDays,
      adjustmentFactor: this.calculateAdjustmentFactor(calendarType)
    };
  }
}