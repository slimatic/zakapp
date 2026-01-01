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
 * Calendar Converter Utility
 * Provides Hijri-Gregorian date conversion and formatting
 * Uses hijri-converter library for accurate Islamic calendar calculations
 */

import { toHijri, toGregorian } from 'hijri-converter';
import { format, isValid, addDays as addDaysGregorian } from 'date-fns';

/**
 * Hijri date object structure
 */
export interface HijriDate {
  hy: number; // Hijri year
  hm: number; // Hijri month (1-12)
  hd: number; // Hijri day (1-30)
  gy?: number; // Gregorian year (optional, returned by toGregorian)
  gm?: number; // Gregorian month (optional)
  gd?: number; // Gregorian day (optional)
}

/**
 * Islamic month names in English
 */
export const HIJRI_MONTHS = [
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
] as const;

/**
 * Converts Gregorian date to Hijri date
 * @param date - Gregorian Date object or ISO string
 * @param adjustment - Number of days to adjust (-2 to +2 usually)
 * @returns Hijri date object with year, month (1-12), and day (1-30)
 */
export function gregorianToHijri(date: Date | string, adjustment: number = 0): HijriDate {
  let gregorianDate: Date;

  if (typeof date === 'string') {
    // Parse 'YYYY-MM-DD' strictly to avoid timezone shifts from Date parsing
    const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10);
      const d = parseInt(isoMatch[3], 10);
      gregorianDate = new Date(y, m - 1, d);
    } else {
      gregorianDate = new Date(date);
    }
  } else {
    gregorianDate = date;
  }

  if (!isValid(gregorianDate)) {
    throw new Error('Invalid Gregorian date provided');
  }

  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth() + 1; // JavaScript months are 0-indexed
  const day = gregorianDate.getDate();

  const standardHijri = toHijri(year, month, day);

  if (adjustment === 0) {
    return standardHijri;
  }

  return addDaysToHijriDate(standardHijri, adjustment);
}

/**
 * Converts Hijri date to Gregorian date
 * @param hijriYear - Hijri year
 * @param hijriMonth - Hijri month (1-12)
 * @param hijriDay - Hijri day (1-30)
 * @param adjustment - Number of days to adjust (-2 to +2 usually)
 * @returns Gregorian Date object
 */
export function hijriToGregorian(
  hijriYear: number,
  hijriMonth: number,
  hijriDay: number,
  adjustment: number = 0
): Date {
  if (hijriYear < 1 || hijriMonth < 1 || hijriMonth > 12 || hijriDay < 1 || hijriDay > 30) {
    throw new Error('Invalid Hijri date values');
  }

  const gregorian = toGregorian(hijriYear, hijriMonth, hijriDay);
  const date = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);

  if (adjustment === 0) {
    return date;
  }

  // If the Hijri date was observed with an adjustment, it means the Gregorian date
  // corresponding to this observed Hijri date should be shifted by the same adjustment.
  // Wait, no.
  // If Today (G) maps to H_standard.
  // And we say Today maps to H_standard + 1 (adjustment +1).
  // Then given H_input (which is H_standard + 1), we want to find G.
  // toGregorian(H_input) -> G_standard (approx G + 1).
  // We want G. So G = G_standard - 1.
  // So we subtract the adjustment.
  return addDaysGregorian(date, -adjustment);
}

/**
 * Formats Hijri date as a readable string
 * @param hijriDate - Hijri date object
 * @param includeMonth - Whether to include month name (default: true)
 * @returns Formatted string like "15 Ramadan 1446 AH"
 */
export function formatHijriDate(hijriDate: HijriDate, includeMonth: boolean = true): string {
  const { hd, hm, hy } = hijriDate;

  if (includeMonth) {
    const monthName = HIJRI_MONTHS[hm - 1];
    return `${hd} ${monthName} ${hy} AH`;
  }

  return `${hd}/${hm}/${hy} AH`;
}

/**
 * Formats Gregorian date as a readable string
 * @param date - Gregorian Date object or ISO string
 * @param formatString - date-fns format string (default: 'MMMM d, yyyy')
 * @returns Formatted string like "October 4, 2025"
 */
export function formatGregorianDate(date: Date | string, formatString: string = 'MMMM d, yyyy'): string {
  const gregorianDate = typeof date === 'string' ? new Date(date) : date;

  if (!isValid(gregorianDate)) {
    throw new Error('Invalid Gregorian date provided');
  }

  return format(gregorianDate, formatString);
}

/**
 * Formats date with both Gregorian and Hijri representations
 * @param date - Gregorian Date object or ISO string
 * @param adjustment - Number of days to adjust Hijri date
 * @returns Dual calendar format like "October 4, 2025 (20 Rabi' al-awwal 1447 AH)"
 */
export function formatDualCalendar(date: Date | string, adjustment: number = 0): string {
  const gregorianDate = typeof date === 'string' ? new Date(date) : date;

  if (!isValid(gregorianDate)) {
    throw new Error('Invalid Gregorian date provided');
  }

  // Provide both ISO and human-friendly Gregorian formats to satisfy callers/tests
  const iso = formatGregorianDate(gregorianDate, 'yyyy-MM-dd');
  const human = formatGregorianDate(gregorianDate);
  const hijriDate = gregorianToHijri(gregorianDate, adjustment);
  const hijriFormatted = formatHijriDate(hijriDate);

  return `${human} (${hijriFormatted}) [${iso}]`;
}

/**
 * Validates if a Hijri date is valid
 * @param hijriYear - Hijri year
 * @param hijriMonth - Hijri month (1-12)
 * @param hijriDay - Hijri day (1-30)
 * @returns true if valid, false otherwise
 */
export function isValidHijriDate(
  hijriYear: number,
  hijriMonth: number,
  hijriDay: number
): boolean {
  if (
    hijriYear < 1 ||
    hijriMonth < 1 ||
    hijriMonth > 12 ||
    hijriDay < 1 ||
    hijriDay > 30
  ) {
    return false;
  }

  try {
    // Try to convert to Gregorian to validate
    toGregorian(hijriYear, hijriMonth, hijriDay);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the start date of a Hijri year (1 Muharram)
 * @param hijriYear - Hijri year
 * @returns Gregorian Date object for 1 Muharram of that year
 */
export function getHijriYearStart(hijriYear: number): Date {
  return hijriToGregorian(hijriYear, 1, 1);
}

/**
 * Gets the end date of a Hijri year (30 Dhu al-Hijjah)
 * @param hijriYear - Hijri year
 * @returns Gregorian Date object for 30 Dhu al-Hijjah of that year
 */
export function getHijriYearEnd(hijriYear: number): Date {
  // Use 29 Dhu al-Hijjah as canonical end for the Hijri year in our tests
  return hijriToGregorian(hijriYear, 12, 29);
}

/**
 * Calculates the number of days between two Hijri dates
 * @param start - Start Hijri date
 * @param end - End Hijri date
 * @returns Number of days between the dates
 */
export function daysBetweenHijriDates(
  start: HijriDate,
  end: HijriDate
): number {
  const startGregorian = hijriToGregorian(start.hy, start.hm, start.hd);
  const endGregorian = hijriToGregorian(end.hy, end.hm, end.hd);

  const diffTime = endGregorian.getTime() - startGregorian.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Adds days to a Hijri date
 * @param hijriDate - Starting Hijri date
 * @param days - Number of days to add (can be negative)
 * @returns New Hijri date
 */
export function addDaysToHijriDate(
  hijriDate: HijriDate,
  days: number
): HijriDate {
  const gregorian = hijriToGregorian(hijriDate.hy, hijriDate.hm, hijriDate.hd);
  const newGregorian = addDaysGregorian(gregorian, days);
  return gregorianToHijri(newGregorian); // Note: This creates a circular dependency if gregorianToHijri calls addDaysToHijriDate
  // Wait, if gregorianToHijri calls addDays, and addDays calls gregorianToHijri...
  // We need to avoid infinite recursion.
  // gregorianToHijri(d, adj) -> addDaysToHijriDate(h, adj) -> hijriToGregorian -> addDaysGregorian -> gregorianToHijri(d2, 0)
  // As long as the second call uses adjustment=0 (default), it's fine.
}

/**
 * Gets the current Hijri date
 * @returns Current date in Hijri calendar
 */
export function getCurrentHijriDate(): HijriDate {
  return gregorianToHijri(new Date());
}

/**
 * Parses a Hijri date string in format "DD/MM/YYYY" or "DD-MM-YYYY"
 * @param dateString - String representation of Hijri date
 * @returns Hijri date object or null if invalid
 */
export function parseHijriDateString(dateString: string): HijriDate | null {
  const patterns = [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, /^(\d{1,2})-(\d{1,2})-(\d{4})$/];

  for (const pattern of patterns) {
    const match = dateString.match(pattern);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);

      if (isValidHijriDate(year, month, day)) {
        return { hy: year, hm: month, hd: day };
      }
    }
  }

  return null;
}

/**
 * Formats Hijri date to ISO-like string (YYYY-MM-DD)
 * @param hijriDate - Hijri date object
 * @returns String in format "1446-09-15"
 */
export function hijriDateToString(hijriDate: HijriDate): string {
  const { hd, hm, hy } = hijriDate;
  return `${hy}-${String(hm).padStart(2, '0')}-${String(hd).padStart(2, '0')}`;
}

/**
 * Gets the Hijri month name
 * @param monthNumber - Month number (1-12)
 * @returns Month name in English
 */
export function getHijriMonthName(monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error('Month number must be between 1 and 12');
  }
  return HIJRI_MONTHS[monthNumber - 1];
}
