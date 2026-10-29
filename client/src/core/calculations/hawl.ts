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
 * The Hawl — one lunar year from the day wealth first reached nisab.
 *
 * This is the only place that decides how long a Hawl is. It previously lived
 * in four: a millisecond constant in the record actions, a `+ 354` in the
 * onboarding wizard, a tracked-days literal in the tracker, and a Dashboard
 * constant — while the server's reminder path added a Gregorian year instead,
 * 11 days later for the same start date, so one record could be "complete" on
 * one screen and still accruing on another.
 *
 * The lunar rule is the default because it is what every stored record was
 * created with, so no existing completion date moves. Both arithmetics are
 * offered; which one a Hawl follows is a question of fiqh and is left to the
 * user's school rather than settled here. Records store the completion date in
 * both calendars, so the choice is not baked into stored data.
 *
 * Not this rule: the 355-day liability window in `liabilityRules.ts` asks
 * which debts fall due inside the coming year, and must not be routed here.
 */
import { gregorianToHijri, hijriDateToString } from '../../utils/calendarConverter';

/**
 * Length of the lunar year in days.
 *
 * Must equal `HAWL_CONSTANTS.DAYS_LUNAR` in `@zakapp/shared`; the source guard
 * in `__tests__/hawlSingleSource.test.ts` fails if the two diverge.
 */
export const HAWL_DAYS = 354;

export type HawlRule = 'lunar' | 'solar';

/** The lunar year — the rule every stored record was created with. */
export const DEFAULT_HAWL_RULE: HawlRule = 'lunar';

/**
 * The date one Hawl completes.
 *
 * An unrecognised rule falls back to the default rather than producing an
 * invalid date or silently applying the other convention.
 */
export function hawlCompletionDate(start: Date, rule: HawlRule = DEFAULT_HAWL_RULE): Date {
  const completion = new Date(start);

  if (rule === 'solar') {
    completion.setFullYear(completion.getFullYear() + 1);
    return completion;
  }

  completion.setDate(completion.getDate() + HAWL_DAYS);
  return completion;
}

/** The hawl dates a record stores: one rule, both calendars. */
export type HawlDates = {
  hawlStartDate: string;
  hawlCompletionDate: string;
  hawlStartDateHijri: string;
  hawlCompletionDateHijri: string;
  hijriYear: number;
};

export function hawlDates(start: Date, rule: HawlRule = DEFAULT_HAWL_RULE): HawlDates {
  const completion = hawlCompletionDate(start, rule);
  const startHijri = gregorianToHijri(start);

  return {
    hawlStartDate: start.toISOString(),
    hawlCompletionDate: completion.toISOString(),
    hawlStartDateHijri: hijriDateToString(startHijri),
    hawlCompletionDateHijri: hijriDateToString(gregorianToHijri(completion)),
    hijriYear: startHijri.hy,
  };
}
