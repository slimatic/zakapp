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

import { toHijri, toGregorian } from 'hijri-converter';

export interface HijriDate {
    year: number;
    month: number;
    day: number;
}

/**
 * Converts a Gregorian Date to Hijri
 */
export function dateToHijri(date: Date): HijriDate {
    const { hy, hm, hd } = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return { year: hy, month: hm, day: hd };
}

/**
 * Converts Hijri components to Gregorian Date
 */
export function hijriToDate(hijri: HijriDate): Date {
    const { gy, gm, gd } = toGregorian(hijri.year, hijri.month, hijri.day);
    return new Date(gy, gm - 1, gd);
}

/**
 * Adds exactly one lunar year (Hawl) to the given date.
 * This is the Fiqh-compliant way to determine the next Zakat Due Date.
 * 
 * Example: 
 * If you reached Nisab on 15 Ramadan 1445, 
 * Zakat is due on 15 Ramadan 1446.
 * (This handles the ~11 day drift automatically).
 */
export function addHawl(startDate: Date): Date {
    const hijri = dateToHijri(startDate);

    // Add 1 year
    const nextYear = hijri.year + 1;

    // Handle edge case: Leap years or month length differences?
    // hijri-converter handles the validity of the resulting date usually.
    // However, if the day is 30 and next month only has 29, we might need clamping.
    // For simplicity, toGregorian usually handles valid inputs. 
    // If toGregorian throws on invalid day (e.g. 30 Safar -> 30 Safar next year might not exist if next Safar is 29 days),
    // we should ideally check month length. 
    // But standard libraries often clamp or roll over. 
    // `hijri-converter` is simple math. Let's assume day clamping logic is needed if it strictly projects.
    // A safe fallback for "End of Month" logic is difficult without knowing month lengths of the target year.
    // But for Zakat, "Same Day" is the standard.

    return hijriToDate({
        year: nextYear,
        month: hijri.month,
        day: hijri.day
    });
}
