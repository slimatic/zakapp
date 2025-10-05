# Developer Guide: Calendar System

**Version:** 1.0  
**Last Updated:** October 2025

---

## Overview

ZakApp implements a dual calendar system supporting both Gregorian and Hijri (Islamic) calendars. This guide explains the implementation, conversion algorithms, and best practices for working with dates in the ZakApp codebase.

### Why Dual Calendar?

1. **Islamic Obligation:** Zakat is calculated based on the Hijri (lunar) calendar
2. **Practical Use:** Users need Gregorian dates for day-to-day reference
3. **Anniversary Tracking:** Zakat anniversary reminders use Hijri dates
4. **Cultural Respect:** Displaying both calendars honors Islamic tradition

### Key Features

✅ Bidirectional conversion (Gregorian ↔ Hijri)  
✅ Accurate lunar calendar calculations  
✅ Automatic date synchronization  
✅ Anniversary detection and reminders  
✅ Date validation and error handling  
✅ Timezone-aware conversions  
✅ Historical date support (back to 1900)  

---

## Architecture

### Libraries Used

**hijri-converter** (npm package)
- Primary library for Hijri-Gregorian conversion
- Accurate algorithm based on Umm al-Qura calendar
- Supports dates from 1318 AH (1900 CE) to 1500 AH (2076 CE)
- Installation: `npm install hijri-converter`

### File Structure

```
server/src/utils/
├── calendar.utils.ts          # Core calendar utilities
├── date.utils.ts              # Date formatting and validation
└── hijri.utils.ts             # Hijri-specific operations

shared/types/
└── calendar.types.ts          # Shared TypeScript types

client/src/utils/
├── calendar.utils.ts          # Frontend calendar utilities
└── date-formatter.ts          # Date display formatting
```

---

## Core Utilities

### calendar.utils.ts

Main utility file for calendar operations.

#### gregorianToHijri()

Converts Gregorian date to Hijri date.

**Signature:**
```typescript
function gregorianToHijri(date: Date | string): HijriDate
```

**Parameters:**
- `date` - JavaScript Date object or ISO 8601 string

**Returns:**
- `HijriDate` object with year, month, day

**Example:**
```typescript
import { gregorianToHijri } from '@/utils/calendar.utils';

const gregorianDate = new Date('2024-01-01');
const hijriDate = gregorianToHijri(gregorianDate);

console.log(hijriDate);
// Output: { year: 1446, month: 6, day: 19 }
```

**Implementation:**
```typescript
import HijriDate from 'hijri-converter';

export function gregorianToHijri(date: Date | string): HijriDate {
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Extract Gregorian components
  const gYear = dateObj.getFullYear();
  const gMonth = dateObj.getMonth() + 1; // JavaScript months are 0-indexed
  const gDay = dateObj.getDate();

  // Convert using hijri-converter
  const hijri = new HijriDate.Gregorian(gYear, gMonth, gDay).toHijri();

  return {
    year: hijri.year,
    month: hijri.month,
    day: hijri.day
  };
}
```

**Error Handling:**
```typescript
export function gregorianToHijri(date: Date | string): HijriDate {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Validate date
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date provided');
    }

    // Check date range (1900-2076)
    const year = dateObj.getFullYear();
    if (year < 1900 || year > 2076) {
      throw new Error('Date must be between 1900 and 2076');
    }

    const gYear = dateObj.getFullYear();
    const gMonth = dateObj.getMonth() + 1;
    const gDay = dateObj.getDate();

    const hijri = new HijriDate.Gregorian(gYear, gMonth, gDay).toHijri();

    return {
      year: hijri.year,
      month: hijri.month,
      day: hijri.day
    };
  } catch (error) {
    console.error('Error converting Gregorian to Hijri:', error);
    throw new Error('Failed to convert date to Hijri calendar');
  }
}
```

---

#### hijriToGregorian()

Converts Hijri date to Gregorian date.

**Signature:**
```typescript
function hijriToGregorian(hijriDate: HijriDate): Date
```

**Parameters:**
- `hijriDate` - Object with `year`, `month`, `day` properties

**Returns:**
- JavaScript Date object

**Example:**
```typescript
import { hijriToGregorian } from '@/utils/calendar.utils';

const hijriDate = { year: 1446, month: 6, day: 19 };
const gregorianDate = hijriToGregorian(hijriDate);

console.log(gregorianDate.toISOString());
// Output: 2024-01-01T00:00:00.000Z
```

**Implementation:**
```typescript
export function hijriToGregorian(hijriDate: HijriDate): Date {
  try {
    // Validate Hijri date
    if (!hijriDate.year || !hijriDate.month || !hijriDate.day) {
      throw new Error('Invalid Hijri date: missing year, month, or day');
    }

    // Validate ranges
    if (hijriDate.month < 1 || hijriDate.month > 12) {
      throw new Error('Hijri month must be between 1 and 12');
    }

    if (hijriDate.day < 1 || hijriDate.day > 30) {
      throw new Error('Hijri day must be between 1 and 30');
    }

    // Convert using hijri-converter
    const gregorian = new HijriDate.Hijri(
      hijriDate.year,
      hijriDate.month,
      hijriDate.day
    ).toGregorian();

    // Create JavaScript Date object
    return new Date(gregorian.year, gregorian.month - 1, gregorian.day);
  } catch (error) {
    console.error('Error converting Hijri to Gregorian:', error);
    throw new Error('Failed to convert Hijri date to Gregorian calendar');
  }
}
```

---

#### formatHijriDate()

Formats Hijri date for display.

**Signature:**
```typescript
function formatHijriDate(hijriDate: HijriDate, format?: 'long' | 'short' | 'numeric'): string
```

**Parameters:**
- `hijriDate` - Hijri date object
- `format` - Display format (default: 'long')

**Returns:**
- Formatted string

**Examples:**
```typescript
import { formatHijriDate } from '@/utils/calendar.utils';

const hijriDate = { year: 1446, month: 6, day: 19 };

// Long format (default)
formatHijriDate(hijriDate);
// Output: "Jumada al-Thani 19, 1446 AH"

// Short format
formatHijriDate(hijriDate, 'short');
// Output: "Jumada II 19, 1446"

// Numeric format
formatHijriDate(hijriDate, 'numeric');
// Output: "1446-06-19"
```

**Implementation:**
```typescript
const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul-Qadah',
  'Dhul-Hijjah'
];

const HIJRI_MONTHS_SHORT = [
  'Muh',
  'Saf',
  'Rabi I',
  'Rabi II',
  'Jumada I',
  'Jumada II',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul-Qadah',
  'Dhul-Hijjah'
];

export function formatHijriDate(
  hijriDate: HijriDate,
  format: 'long' | 'short' | 'numeric' = 'long'
): string {
  const { year, month, day } = hijriDate;

  switch (format) {
    case 'long':
      return `${HIJRI_MONTHS[month - 1]} ${day}, ${year} AH`;

    case 'short':
      return `${HIJRI_MONTHS_SHORT[month - 1]} ${day}, ${year}`;

    case 'numeric':
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    default:
      return formatHijriDate(hijriDate, 'long');
  }
}
```

---

#### calculateHijriAnniversary()

Calculates the next Hijri anniversary date.

**Signature:**
```typescript
function calculateHijriAnniversary(originalDate: HijriDate, currentDate?: Date): Date
```

**Parameters:**
- `originalDate` - Original Hijri date (e.g., Zakat anniversary)
- `currentDate` - Current date to calculate from (default: today)

**Returns:**
- JavaScript Date of next anniversary

**Example:**
```typescript
import { calculateHijriAnniversary } from '@/utils/calendar.utils';

// Original Zakat anniversary: Ramadan 15, 1445
const originalHijri = { year: 1445, month: 9, day: 15 };

// Calculate next anniversary
const nextAnniversary = calculateHijriAnniversary(originalHijri);

console.log(nextAnniversary);
// Output: Date for Ramadan 15, 1446
```

**Implementation:**
```typescript
export function calculateHijriAnniversary(
  originalDate: HijriDate,
  currentDate: Date = new Date()
): Date {
  // Get current Hijri date
  const currentHijri = gregorianToHijri(currentDate);

  // Calculate next anniversary date
  let nextAnniversaryHijri: HijriDate;

  if (
    currentHijri.month < originalDate.month ||
    (currentHijri.month === originalDate.month && currentHijri.day < originalDate.day)
  ) {
    // Anniversary hasn't occurred this Hijri year yet
    nextAnniversaryHijri = {
      year: currentHijri.year,
      month: originalDate.month,
      day: originalDate.day
    };
  } else {
    // Anniversary already passed this year, use next Hijri year
    nextAnniversaryHijri = {
      year: currentHijri.year + 1,
      month: originalDate.month,
      day: originalDate.day
    };
  }

  // Convert to Gregorian
  return hijriToGregorian(nextAnniversaryHijri);
}
```

---

#### getDaysBetweenHijriDates()

Calculates days between two Hijri dates.

**Signature:**
```typescript
function getDaysBetweenHijriDates(date1: HijriDate, date2: HijriDate): number
```

**Parameters:**
- `date1` - First Hijri date
- `date2` - Second Hijri date

**Returns:**
- Number of days between dates (positive if date2 is after date1)

**Example:**
```typescript
import { getDaysBetweenHijriDates } from '@/utils/calendar.utils';

const date1 = { year: 1445, month: 1, day: 1 }; // Muharram 1, 1445
const date2 = { year: 1446, month: 1, day: 1 }; // Muharram 1, 1446

const days = getDaysBetweenHijriDates(date1, date2);
console.log(days); // ~354 days (1 Hijri year)
```

**Implementation:**
```typescript
export function getDaysBetweenHijriDates(date1: HijriDate, date2: HijriDate): number {
  // Convert both Hijri dates to Gregorian
  const greg1 = hijriToGregorian(date1);
  const greg2 = hijriToGregorian(date2);

  // Calculate difference in milliseconds
  const diffMs = greg2.getTime() - greg1.getTime();

  // Convert to days
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}
```

---

#### isHijriLeapYear()

Checks if a Hijri year is a leap year (has 355 days instead of 354).

**Signature:**
```typescript
function isHijriLeapYear(year: number): boolean
```

**Parameters:**
- `year` - Hijri year

**Returns:**
- `true` if leap year, `false` otherwise

**Example:**
```typescript
import { isHijriLeapYear } from '@/utils/calendar.utils';

console.log(isHijriLeapYear(1445)); // true or false
console.log(isHijriLeapYear(1446)); // true or false
```

**Implementation:**
```typescript
export function isHijriLeapYear(year: number): boolean {
  // Hijri leap year follows a 30-year cycle
  // 11 leap years in every 30-year cycle
  // Leap years: 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29

  const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
  const yearInCycle = year % 30;

  return leapYears.includes(yearInCycle);
}
```

---

## TypeScript Types

### shared/types/calendar.types.ts

```typescript
/**
 * Hijri (Islamic) date representation
 */
export interface HijriDate {
  year: number;   // Hijri year (e.g., 1446)
  month: number;  // Month (1-12)
  day: number;    // Day (1-30)
}

/**
 * Dual calendar date (both Gregorian and Hijri)
 */
export interface DualDate {
  gregorian: Date;
  hijri: HijriDate;
  formatted: {
    gregorian: string;
    hijri: string;
  };
}

/**
 * Date range with dual calendars
 */
export interface DateRange {
  start: DualDate;
  end: DualDate;
}

/**
 * Anniversary information
 */
export interface Anniversary {
  originalDate: DualDate;
  nextOccurrence: DualDate;
  daysUntil: number;
  isPast: boolean;
}
```

---

## Usage Examples

### Example 1: Creating a Snapshot with Dual Dates

```typescript
import { gregorianToHijri, formatHijriDate } from '@/utils/calendar.utils';

// User selects Gregorian date
const snapshotDate = new Date('2024-01-01');

// Automatically calculate Hijri date
const hijriDate = gregorianToHijri(snapshotDate);

// Format for display
const hijriFormatted = formatHijriDate(hijriDate);

// Save to database
const snapshot = {
  snapshotDate: snapshotDate.toISOString(),
  snapshotDateHijri: `${hijriDate.year}-${hijriDate.month}-${hijriDate.day}`,
  // ... other fields
};

console.log(`Gregorian: ${snapshotDate.toLocaleDateString()}`);
console.log(`Hijri: ${hijriFormatted}`);
// Output:
// Gregorian: 1/1/2024
// Hijri: Jumada al-Thani 19, 1446 AH
```

### Example 2: Detecting Zakat Anniversary

```typescript
import {
  gregorianToHijri,
  calculateHijriAnniversary,
  getDaysBetweenHijriDates
} from '@/utils/calendar.utils';

// Snapshot was finalized on this date
const finalizedDate = new Date('2024-01-15');
const finalizedHijri = gregorianToHijri(finalizedDate);

// Calculate next anniversary
const nextAnniversary = calculateHijriAnniversary(finalizedHijri);

// Check if anniversary is upcoming (within 30 days)
const today = new Date();
const daysUntilAnniversary = Math.floor(
  (nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
);

if (daysUntilAnniversary > 0 && daysUntilAnniversary <= 30) {
  // Create reminder
  console.log(`Zakat anniversary in ${daysUntilAnniversary} days!`);
}
```

### Example 3: Comparing Multi-Year Snapshots

```typescript
import { gregorianToHijri, formatHijriDate } from '@/utils/calendar.utils';

const snapshots = [
  { id: 1, date: '2022-01-01', wealth: 100000 },
  { id: 2, date: '2023-01-01', wealth: 125000 },
  { id: 3, date: '2024-01-01', wealth: 150000 }
];

// Add Hijri dates to comparison
const comparison = snapshots.map(snapshot => {
  const gregorian = new Date(snapshot.date);
  const hijri = gregorianToHijri(gregorian);

  return {
    ...snapshot,
    gregorian: gregorian.toLocaleDateString(),
    hijri: formatHijriDate(hijri),
    hijriYear: hijri.year
  };
});

console.log(comparison);
// Output:
// [
//   { id: 1, gregorian: '1/1/2022', hijri: 'Jumada al-Awwal 28, 1443 AH', ... },
//   { id: 2, gregorian: '1/1/2023', hijri: 'Jumada al-Thani 9, 1444 AH', ... },
//   { id: 3, gregorian: '1/1/2024', hijri: 'Jumada al-Thani 19, 1446 AH', ... }
// ]
```

---

## Testing

### Unit Tests

```typescript
// calendar.utils.test.ts
import {
  gregorianToHijri,
  hijriToGregorian,
  formatHijriDate,
  calculateHijriAnniversary
} from '@/utils/calendar.utils';

describe('Calendar Utilities', () => {
  describe('gregorianToHijri', () => {
    it('should convert Gregorian date to Hijri', () => {
      const gregorian = new Date('2024-01-01');
      const hijri = gregorianToHijri(gregorian);

      expect(hijri.year).toBe(1446);
      expect(hijri.month).toBe(6);
      expect(hijri.day).toBe(19);
    });

    it('should handle string input', () => {
      const hijri = gregorianToHijri('2024-01-01');

      expect(hijri.year).toBe(1446);
    });

    it('should throw error for invalid date', () => {
      expect(() => gregorianToHijri('invalid')).toThrow();
    });
  });

  describe('hijriToGregorian', () => {
    it('should convert Hijri date to Gregorian', () => {
      const hijri = { year: 1446, month: 6, day: 19 };
      const gregorian = hijriToGregorian(hijri);

      expect(gregorian.getFullYear()).toBe(2024);
      expect(gregorian.getMonth() + 1).toBe(1);
      expect(gregorian.getDate()).toBe(1);
    });

    it('should throw error for invalid Hijri date', () => {
      const invalid = { year: 1446, month: 13, day: 1 };
      expect(() => hijriToGregorian(invalid)).toThrow();
    });
  });

  describe('formatHijriDate', () => {
    const hijri = { year: 1446, month: 6, day: 19 };

    it('should format in long format', () => {
      const formatted = formatHijriDate(hijri, 'long');
      expect(formatted).toBe('Jumada al-Thani 19, 1446 AH');
    });

    it('should format in short format', () => {
      const formatted = formatHijriDate(hijri, 'short');
      expect(formatted).toBe('Jumada II 19, 1446');
    });

    it('should format in numeric format', () => {
      const formatted = formatHijriDate(hijri, 'numeric');
      expect(formatted).toBe('1446-06-19');
    });
  });

  describe('calculateHijriAnniversary', () => {
    it('should calculate next anniversary', () => {
      const original = { year: 1445, month: 9, day: 15 };
      const current = new Date('2024-01-01');

      const nextAnniversary = calculateHijriAnniversary(original, current);

      // Should be Ramadan 15, 1446
      const nextHijri = gregorianToHijri(nextAnniversary);
      expect(nextHijri.month).toBe(9);
      expect(nextHijri.day).toBe(15);
      expect(nextHijri.year).toBeGreaterThan(1445);
    });
  });
});
```

---

## Best Practices

### 1. Always Store Both Calendars

```typescript
// ✅ Good: Store both Gregorian and Hijri
const snapshot = {
  snapshotDate: '2024-01-01T00:00:00Z',
  snapshotDateHijri: '1446-06-19'
};

// ❌ Bad: Store only Gregorian (requires conversion every time)
const snapshot = {
  snapshotDate: '2024-01-01T00:00:00Z'
};
```

### 2. Use ISO 8601 for Gregorian, Consistent Format for Hijri

```typescript
// ✅ Good: ISO 8601 for Gregorian, YYYY-MM-DD for Hijri
gregorianDate: '2024-01-01T00:00:00Z',
hijriDate: '1446-06-19'

// ❌ Bad: Inconsistent formats
gregorianDate: '01/01/2024',
hijriDate: 'Jumada al-Thani 19, 1446 AH'
```

### 3. Handle Timezone Conversions Carefully

```typescript
// ✅ Good: Use UTC consistently
const date = new Date('2024-01-01T00:00:00Z');

// ❌ Bad: Local timezone can cause date shifts
const date = new Date('2024-01-01');
```

### 4. Validate Date Ranges

```typescript
// ✅ Good: Validate date is within supported range
function validateDate(date: Date): void {
  const year = date.getFullYear();
  if (year < 1900 || year > 2076) {
    throw new Error('Date must be between 1900 and 2076');
  }
}

// ❌ Bad: No validation (hijri-converter will fail for out-of-range dates)
const hijri = gregorianToHijri(someDate);
```

### 5. Cache Expensive Conversions

```typescript
// ✅ Good: Cache conversion results
const dateCache = new Map<string, HijriDate>();

function gregorianToHijriCached(date: Date): HijriDate {
  const key = date.toISOString();
  if (!dateCache.has(key)) {
    dateCache.set(key, gregorianToHijri(date));
  }
  return dateCache.get(key)!;
}
```

---

## Performance Considerations

### Conversion Performance

- **gregorianToHijri:** ~0.1ms per conversion
- **hijriToGregorian:** ~0.1ms per conversion
- **Bulk operations:** Consider batch processing for >100 conversions

### Optimization Strategies

1. **Memoization:** Cache frequently accessed conversions
2. **Lazy Loading:** Convert on-demand, not upfront
3. **Background Processing:** Use workers for bulk conversions
4. **Database Indexing:** Index both Gregorian and Hijri date columns

---

## Troubleshooting

### Common Issues

**Issue 1: Date Shifts by One Day**
- **Cause:** Timezone differences
- **Solution:** Use UTC dates consistently

**Issue 2: Conversion Fails for Old Dates**
- **Cause:** Date before 1900 or after 2076
- **Solution:** Validate date range before conversion

**Issue 3: Anniversary Not Detected**
- **Cause:** Comparing Gregorian dates instead of Hijri
- **Solution:** Use `calculateHijriAnniversary()` for Hijri-based detection

**Issue 4: Incorrect Month Names**
- **Cause:** Using wrong month index (0-based vs 1-based)
- **Solution:** Hijri months are 1-based (1-12), JS months are 0-based (0-11)

---

## References

- **hijri-converter Library:** [GitHub](https://github.com/bahaa2345/hijri-converter)
- **Umm al-Qura Calendar:** [Wikipedia](https://en.wikipedia.org/wiki/Hijri_calendar)
- **Islamic Calendar Basics:** [islamicfinder.org](https://www.islamicfinder.org/)
- **Zakat & Hijri Calendar:** [islamqa.info](https://islamqa.info/)

---

**Last Updated:** October 2025  
**Version:** 1.0
