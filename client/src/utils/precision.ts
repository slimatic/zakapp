/**
 * Financial Precision Utilities
 * 
 * Uses decimal.js for arbitrary precision arithmetic.
 * This is CRITICAL for Zakat calculations where floating-point
 * errors violate Islamic finance principles.
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

/**
 * Calculate Zakat at 2.5% (1/40) with precision.
 * 
 * @faqih-rule: Zakat is exactly 2.5% of zakatable wealth
 */
export function calculateZakat(zakatableWealth: string | number | Decimal): Decimal {
    const wealth = zakatableWealth instanceof Decimal
        ? zakatableWealth
        : toDecimal(zakatableWealth);

    // 2.5% = 0.025 = 1/40
    return wealth.times(new Decimal('0.025'));
}

/**
 * Calculate zakatable wealth (assets minus liabilities).
 * Returns 0 if result would be negative.
 */
export function calculateZakatableWealth(
    totalAssets: string | number | Decimal,
    totalLiabilities: string | number | Decimal
): Decimal {
    const assets = totalAssets instanceof Decimal ? totalAssets : toDecimal(totalAssets);
    const liabilities = totalLiabilities instanceof Decimal ? totalLiabilities : toDecimal(totalLiabilities);

    const result = assets.minus(liabilities);
    return result.isNegative() ? new Decimal(0) : result;
}

/**
 * Check if wealth meets Nisab threshold.
 */
export function meetsNisab(
    zakatableWealth: string | number | Decimal,
    nisabThreshold: string | number | Decimal
): boolean {
    const wealth = zakatableWealth instanceof Decimal ? zakatableWealth : toDecimal(zakatableWealth);
    const nisab = nisabThreshold instanceof Decimal ? nisabThreshold : toDecimal(nisabThreshold);

    return wealth.gte(nisab);
}

/**
 * Format a Decimal value for display with specified precision.
 */
export function formatDecimal(
    value: Decimal | string | number,
    decimalPlaces: number = 2
): string {
    const decimal = value instanceof Decimal ? value : toDecimal(value);
    return decimal.toFixed(decimalPlaces);
}

// Re-export Decimal for direct use when needed
export { Decimal };
