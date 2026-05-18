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
