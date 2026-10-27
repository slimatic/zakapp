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
 * One Hawl-length rule, selected by name.
 *
 * The default is the lunar year the app has always computed (354 days), so no
 * stored completion date moves. The alternative is a solar year, which is what
 * the server's reminder path used to add — the two differ by 11 days for the
 * same start date, which is why the record is also stored with its Hijri
 * equivalent rather than committing the choice in code.
 */
import { describe, it, expect } from 'vitest';
import {
  HAWL_DAYS,
  DEFAULT_HAWL_RULE,
  hawlCompletionDate,
  hawlDates,
} from '../hawl';
import { gregorianToHijri, hijriDateToString } from '../../../utils/calendarConverter';

// Local-time start so the assertions are timezone independent.
const START = new Date(2026, 0, 15, 10, 30, 0);

describe('hawlCompletionDate', () => {
  it('adds one lunar year by default', () => {
    expect(DEFAULT_HAWL_RULE).toBe('lunar');
    expect(HAWL_DAYS).toBe(354);

    const completion = hawlCompletionDate(START);

    expect(completion.getFullYear()).toBe(2027);
    expect(completion.getMonth()).toBe(0);
    expect(completion.getDate()).toBe(4);
  });

  it('lands on the same calendar day the millisecond arithmetic it replaced did', () => {
    const legacy = new Date(START.getTime() + 354 * 24 * 60 * 60 * 1000);
    const completion = hawlCompletionDate(START);

    expect(completion.getFullYear()).toBe(legacy.getFullYear());
    expect(completion.getMonth()).toBe(legacy.getMonth());
    expect(completion.getDate()).toBe(legacy.getDate());
  });

  it('keeps the wall-clock time of the start date', () => {
    const completion = hawlCompletionDate(START);
    expect(completion.getHours()).toBe(START.getHours());
    expect(completion.getMinutes()).toBe(START.getMinutes());
  });

  it('does not mutate the date it is given', () => {
    const before = START.getTime();
    hawlCompletionDate(START);
    expect(START.getTime()).toBe(before);
  });

  it('adds a solar year under the solar rule, 11 days later than the lunar one', () => {
    const lunar = hawlCompletionDate(START);
    const solar = hawlCompletionDate(START, 'solar');

    expect(solar.getFullYear()).toBe(2027);
    expect(solar.getMonth()).toBe(0);
    expect(solar.getDate()).toBe(15);

    const deltaDays = (solar.getTime() - lunar.getTime()) / 86_400_000;
    expect(deltaDays).toBe(11);
  });

  it('falls back to the lunar default for an unknown rule', () => {
    const fallback = hawlCompletionDate(START, 'hijri-anniversary' as never);
    expect(fallback.toISOString()).toBe(hawlCompletionDate(START).toISOString());
  });
});

describe('hawlDates', () => {
  it('stores the start and the completion, in both calendars', () => {
    const dates = hawlDates(START);

    expect(dates.hawlStartDate).toBe(START.toISOString());
    expect(dates.hawlCompletionDate).toBe(hawlCompletionDate(START).toISOString());

    // The Hijri strings are the Hijri rendering of the stored Gregorian dates —
    // the record carries both, so the stored pair can never disagree.
    expect(dates.hawlStartDateHijri).toBe(hijriDateToString(gregorianToHijri(START)));
    expect(dates.hawlCompletionDateHijri).toBe(
      hijriDateToString(gregorianToHijri(new Date(dates.hawlCompletionDate)))
    );
    expect(dates.hawlStartDateHijri).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dates.hawlCompletionDateHijri).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dates.hijriYear).toBe(gregorianToHijri(START).hy);
  });
});
