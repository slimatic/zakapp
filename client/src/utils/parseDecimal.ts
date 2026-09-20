/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { Decimal } from 'decimal.js';

/**
 * Safely parse a string/number input into a Decimal for financial calculations.
 * Falls back to 0 on invalid input to prevent NaN propagation.
 *
 * @param value - Raw input (string from form field, number, undefined, null)
 * @returns Decimal instance (never null/undefined)
 */
export function parseDecimal(value: string | number | undefined | null): Decimal {
  if (value === undefined || value === null || value === '') {
    return new Decimal(0);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return new Decimal(0);
    return new Decimal(value);
  }
  const trimmed = String(value).trim();
  if (trimmed === '') return new Decimal(0);
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return new Decimal(0);
  return new Decimal(trimmed);
}

/**
 * Convenience: parse and return as number.
 * Use this for form state that stores numbers (not Decimals).
 */
export function parseDecimalNumber(value: string | number | undefined | null): number {
  return parseDecimal(value).toNumber();
}

/**
 * Parse an amount that may have been written by ANY past version of this app.
 *
 * Older exports wrote formatted strings (`$1,234,567.89`, `IDR 15.750.000`,
 * `Rp 1.500.000`) rather than raw numbers. `parseFloat` on those returns NaN,
 * and callers coercing with `|| 0` silently turned a user's re-imported records
 * into zeroes. This accepts both shapes.
 *
 * The grouping rule is the subtle one: `1.500.000` is 1.5 million (dots group)
 * while `1234.56` has a real decimal. Rule used: when a separator appears more
 * than once it is grouping; when it appears once, it is a decimal only if the
 * trailing group is not exactly 3 digits (`1.500` -> 1500, `1234.56` -> 1234.56).
 *
 * @returns a finite number, or NaN when truly unparseable so callers can decide.
 */
export function parseAmountFromImport(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (value === null || value === undefined) return NaN;

  let s = String(value).replace(/"/g, '').trim();
  if (s === '') return NaN;

  // Drop a leading ISO code (USD, IDR, SAR…) then any remaining symbols.
  s = s.replace(/^[A-Za-z]{2,3}\s*/, '').replace(/[^\d.,\-+]/g, '');
  if (s === '' || s === '-' || s === '+') return NaN;

  const negative = s.startsWith('-');
  s = s.replace(/^[-+]/, '');

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  let normalised: string;

  if (hasComma && hasDot) {
    normalised =
      s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.') // 1.500.000,25
        : s.replace(/,/g, '');                   // 1,500,000.25
  } else if (hasDot) {
    const parts = s.split('.');
    normalised =
      parts.length > 2
        ? parts.join('')                         // 1.500.000 -> 1500000
        : parts.length === 2 && parts[1].length !== 3
          ? s                                    // 1234.56 -> 1234.56
          : parts.join('');                      // 1.500 -> 1500
  } else if (hasComma) {
    const parts = s.split(',');
    normalised =
      parts.length > 2
        ? parts.join('')
        : parts.length === 2 && parts[1].length !== 3
          ? s.replace(',', '.')                  // 1234,56 -> 1234.56
          : parts.join('');                      // 1,500 -> 1500
  } else {
    normalised = s;
  }

  const n = Number(normalised);
  if (!Number.isFinite(n)) return NaN;
  return negative ? -n : n;
}

