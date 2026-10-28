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
 * Financial Precision Utilities
 * 
 * Uses decimal.js for arbitrary precision arithmetic.
 * This is CRITICAL for Zakat calculations where floating-point
 * errors violate Islamic finance principles.
 * 
 * Parsing and formatting primitives only. A zakat figure is computed by the
 * canonical engine in `core/calculations/zakat.ts`, which compares wealth
 * against nisab and applies the selected methodology's rules; a rate helper
 * that skips that comparison would report an obligation on wealth below
 * nisab, so none lives here.
 * 
 * @faqih-mandate: Use for ALL financial calculations
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
    precision: 20,        // High precision for intermediate calculations
    rounding: Decimal.ROUND_HALF_UP,  // Standard banker's rounding
    toExpNeg: -9,         // Don't use exponential notation for small numbers
    toExpPos: 20,         // Don't use exponential notation for large numbers
});

/**
 * Safely parse a value to Decimal, handling edge cases.
 * Returns Decimal(0) for invalid inputs rather than throwing.
 * 
 * @example
 * toDecimal('1000.50') // Decimal(1000.50)
 * toDecimal(undefined) // Decimal(0)
 * toDecimal('') // Decimal(0)
 */
export function toDecimal(value: string | number | null | undefined): Decimal {
    if (value === null || value === undefined || value === '') {
        return new Decimal(0);
    }

    try {
        const num = typeof value === 'string' ? value.trim() : value;
        const decimal = new Decimal(num);
        return decimal.isNaN() ? new Decimal(0) : decimal;
    } catch {
        return new Decimal(0);
    }
}

/**
 * Convert Decimal to number for display/storage.
 * Use sparingly - prefer keeping values as Decimal during calculations.
 */
export function toNumber(value: Decimal | string | number | null | undefined): number {
    if (value instanceof Decimal) {
        return value.toNumber();
    }
    return toDecimal(value).toNumber();
}

// Re-export Decimal for direct use when needed
export { Decimal };
