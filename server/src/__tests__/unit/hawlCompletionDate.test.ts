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
 * The server computes the same Hawl length as the client, from the same rule.
 *
 * `ts-node` resolves `@zakapp/shared` to `src/shared_local.ts` at runtime, while
 * the test runner resolves it to the real package — so both have to produce the
 * same date, and both have to produce a LUNAR year rather than a Gregorian one.
 */
import { describe, it, expect } from 'vitest';
import { calculateHawlCompletionDate, HAWL_CONSTANTS } from '../../shared_local';
import { calculateHawlCompletionDate as canonical } from '@zakapp/shared';

const START = new Date(2026, 0, 15, 10, 30, 0);

describe('calculateHawlCompletionDate', () => {
  it('adds one lunar year, not a Gregorian one', () => {
    const completion = calculateHawlCompletionDate(START);

    expect(HAWL_CONSTANTS.DAYS_LUNAR).toBe(354);
    expect(completion.getFullYear()).toBe(2027);
    expect(completion.getMonth()).toBe(0);
    expect(completion.getDate()).toBe(4);
    expect(completion.getHours()).toBe(START.getHours());
  });

  it('agrees with the shared package the client also reads', () => {
    expect(calculateHawlCompletionDate(START).getTime()).toBe(canonical(START).getTime());
  });

  it('does not mutate the date it is given', () => {
    const before = START.getTime();
    calculateHawlCompletionDate(START);
    expect(START.getTime()).toBe(before);
  });
});
