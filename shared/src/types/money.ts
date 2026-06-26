/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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
 * Financial amount type alias.
 * Represents monetary / asset values as decimal strings
 * to eliminate IEEE-754 floating-point precision errors.
 *
 * Use `fromMoney()` to convert to Decimal for safe math,
 * and `toMoney()` to serialize back.
 *
 * Examples:
 *   "1234.56"
 *   "0.025"
 *   "999999.9999"
 */
export type Money = string;

/**
 * Zakat-rate type alias.
 * Represents a percentage / rate, also as string Decimal.
 * Examples:
 *   "2.5"
 *   "0.025"
 *   "0.3"
 */
export type ZakatRate = string;

/**
 * Shorthand helpers for internal Decimal calculation.
 */
import Decimal from "decimal.js";

/** Convert a Money string to a Decimal instance for safe calculations. */
export function toDecimal(money: Money): Decimal {
  return new Decimal(money);
}

/** Convert a Decimal / number / string to a Money string with 4-decimal precision. */
export function toMoney(value: Decimal | number | string): Money {
  if (Decimal.isDecimal(value)) {
    return (value as Decimal).toFixed(4).replace(/\.?0+$/, "");
  }
  return new Decimal(value).toFixed(4).replace(/\.?0+$/, "");
}

/** Create a Money string from a validated input, preserving sign. */
export function safeMoney(value: unknown): Money {
  if (typeof value === "string") {
    // Already a string; sanitize it
    const trimmed = value.trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      throw new Error(`Invalid Money string: "${value}"`);
    }
    return new Decimal(trimmed).toFixed(4).replace(/\.?0+$/, "");
  }
  if (typeof value === "number") {
    return new Decimal(value).toFixed(4).replace(/\.?0+$/, "");
  }
  if (Decimal.isDecimal(value)) {
    return (value as Decimal).toFixed(4).replace(/\.?0+$/, "");
  }
  throw new Error(`Cannot convert to Money: ${typeof value}`);
}

/** Parse a Money string as a number (for display only — never for math). */
export function moneyToNumber(money: Money): number {
  return new Decimal(money).toNumber();
}

/** JSON reviver for Money fields in shared zod schemas. */
export function reviver(key: string, value: unknown): unknown {
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
    const numericFields = new Set([
      // Add field names here if you want auto-revival to Decimal, else rely on schema parsing
    ]);
    if (numericFields.has(key)) {
      return value; // Keep as string (Money)
    }
  }
  return value;
}
