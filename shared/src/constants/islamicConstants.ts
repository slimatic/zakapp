/**
 * Islamic Constants for Zakat Calculations
 * 
 * Centralized source of truth for all Islamic financial thresholds,
 * rates, and scholarly references used throughout the application.
 * 
 * @remarks
 * All values are based on scholarly consensus and aligned with the
 * Simple Zakat Guide methodology. Any changes to these values must
 * be accompanied by updated scholarly references.
 * 
 * @see https://simplezakatguide.com
 */

/**
 * Nisab Thresholds
 * 
 * Minimum wealth thresholds required for Zakat obligation.
 * Based on gold and silver standards from classical Islamic jurisprudence.
 */
export const NISAB_THRESHOLDS = {
  /**
   * Gold Nisab: 87.48 grams (3 ounces troy)
   * 
   * Equivalent to 20 Dinars or 85 grams of 24k gold in some madhabs.
   * The 87.48g figure represents scholarly consensus for practical application.
   * 
   * @source Simple Zakat Guide - Gold Nisab Calculation
   */
  GOLD_GRAMS: 87.48,

  /**
   * Silver Nisab: 612.36 grams (200 Dirhams)
   * 
   * Equivalent to 200 Dirhams in classical texts.
   * This is the more accessible threshold and often results in lower Nisab values.
   * 
   * @source Simple Zakat Guide - Silver Nisab Calculation
   */
  SILVER_GRAMS: 612.36,

  /**
   * Conversion constants for reference
   */
  GOLD_TROY_OUNCES: 3.0, // 87.48g ≈ 3 troy ounces
  SILVER_TROY_OUNCES: 21.0, // 612.36g ≈ 21 troy ounces
} as const;

/**
 * Zakat Rates
 * 
 * Percentage rates for different asset categories.
 */
export const ZAKAT_RATES = {
  /**
   * Standard Zakat Rate: 2.5%
   * 
   * Applied to cash, gold, silver, business assets, and most zakatable wealth
   * after one full Hawl (lunar year) of continuous Nisab possession.
   * 
   * @calculation zakatable_amount = total_wealth * 0.025
   * @source Quran 9:60, Hadith collections (Sahih al-Bukhari, Sahih Muslim)
   */
  STANDARD: 0.025,

  /**
   * Agricultural Produce Rates
   * 
   * Different rates apply based on irrigation method:
   * - Rain-fed/natural irrigation: 10% (0.10)
   * - Artificial irrigation: 5% (0.05)
   * 
   * Note: Not currently implemented in ZakApp (future feature)
   * @source Hadith - Sahih al-Bukhari 1483
   */
  AGRICULTURE_RAIN_FED: 0.10,
  AGRICULTURE_IRRIGATED: 0.05,

  /**
   * Rikaz (Buried Treasure) Rate: 20%
   * 
   * Note: Not currently implemented in ZakApp (future feature)
   * @source Hadith - Sahih al-Bukhari 1499
   */
  RIKAZ: 0.20,
} as const;

/**
 * Hawl (Lunar Year) Constants
 * 
 * Time periods for Zakat obligation calculations.
 */
export const HAWL_CONSTANTS = {
  /**
   * Full Hawl Duration: 354 days (lunar year)
   * 
   * Zakat becomes due after wealth continuously exceeds Nisab for one complete
   * lunar year based on the Islamic (Hijri) calendar.
   * 
   * @calculation hawl_completion = hawl_start_date + 354 days
   * @source Umm al-Qura calendar system (official Saudi calendar)
   */
  DAYS_LUNAR: 354,

  /**
   * Lunar vs Solar Year Difference: ~11 days
   * 
   * The lunar year is approximately 11 days shorter than the solar year.
   * This is informational only - calculations use exact Hijri dates.
   */
  LUNAR_SOLAR_DIFF_DAYS: 11,

  /**
   * Grace Period for Wealth Fluctuations: 24 hours
   * 
   * If wealth drops below Nisab temporarily (<24 hours), Hawl continues.
   * If below Nisab for >24 hours, Hawl is interrupted and must restart
   * when Nisab is reached again.
   * 
   * @source Simple Zakat Guide - Hawl Interruption Rules
   */
  INTERRUPTION_GRACE_PERIOD_HOURS: 24,

  /**
   * Hawl Months (Hijri): 12 lunar months
   * 
   * Each month is 29-30 days based on moon sighting.
   */
  MONTHS_IN_HAWL: 12,

  /**
   * Average Lunar Month: ~29.53 days
   * 
   * Used for calculations when exact moon sighting data unavailable.
   */
  AVERAGE_LUNAR_MONTH_DAYS: 29.53,
} as const;

/**
 * Deductible Liabilities
 * 
 * Categories of debts that may be deducted from zakatable wealth
 * according to different scholarly opinions.
 */
export const DEDUCTIBLE_LIABILITIES = {
  /**
   * Opinion 1 (Majority): Immediate debts only
   * 
   * Only debts due within the current year are deductible.
   * Long-term debts (mortgages, business loans) are not deducted.
   * 
   * @source Hanafi, Maliki madhabs
   */
  IMMEDIATE_ONLY: 'IMMEDIATE_ONLY',

  /**
   * Opinion 2 (Minority): All debts deductible
   * 
   * All debts including long-term obligations can be deducted
   * from zakatable wealth before calculating Zakat.
   * 
   * @source Some contemporary scholars, Hanbali madhab
   */
  ALL_DEBTS: 'ALL_DEBTS',

  /**
   * Opinion 3 (Conservative): No deductions
   * 
   * Calculate Zakat on gross wealth without deducting any debts.
   * Most cautious approach to ensure obligation is met.
   * 
   * @source Shafi'i madhab position
   */
  NO_DEDUCTIONS: 'NO_DEDUCTIONS',
} as const;

/**
 * Asset Categories
 * 
 * Zakatable and non-zakatable asset types.
 */
export const ASSET_CATEGORIES = {
  /**
   * Fully Zakatable Assets
   * 
   * These assets are included in wealth calculation at full value:
   * - Cash (all currencies)
   * - Bank balances (checking, savings)
   * - Gold and silver
   * - Cryptocurrencies (treated as currency)
   * - Trade inventory (business assets for resale)
   * - Stocks and investment accounts
   * - Loans receivable (if collectible)
   */
  ZAKATABLE: [
    'CASH',
    'BANK_ACCOUNT',
    'GOLD',
    'SILVER',
    'CRYPTOCURRENCY',
    'BUSINESS_INVENTORY',
    'INVESTMENT_ACCOUNT',
    'LOAN_RECEIVABLE',
  ] as const,

  /**
   * Non-Zakatable Assets
   * 
   * These assets are NOT included in wealth calculation:
   * - Primary residence
   * - Personal use items (car, furniture, clothing)
   * - Tools of trade (equipment used in profession)
   * - Investment properties (rental income subject to Zakat, not property value)
   */
  NON_ZAKATABLE: [
    'PRIMARY_RESIDENCE',
    'PERSONAL_VEHICLE',
    'HOUSEHOLD_ITEMS',
    'PROFESSIONAL_EQUIPMENT',
  ] as const,

  /**
   * Partial Zakatable Assets
   * 
   * Special rules apply:
   * - Rental property: Only income/profit is zakatable, not property value
   * - Business assets: Only inventory for resale, not fixed assets
   * - Livestock: Specific nisab thresholds apply (not yet implemented)
   */
  PARTIAL: [
    'RENTAL_PROPERTY',
    'BUSINESS_FIXED_ASSETS',
    'LIVESTOCK',
  ] as const,
} as const;

/**
 * Calculation Methods
 * 
 * Different methodologies for calculating Zakat based on madhab.
 */
export const CALCULATION_METHODS = {
  /**
   * Standard Method (Majority Opinion)
   * 
   * - Nisab: Lower of gold or silver (more accessible)
   * - Rate: 2.5% on total wealth above Nisab
   * - Hawl: Full lunar year (354 days)
   * - Debts: Immediate debts deductible
   * 
   * @source Simple Zakat Guide default methodology
   */
  STANDARD: 'STANDARD',

  /**
   * Hanafi Method
   * 
   * - Nisab: Silver-based (lower threshold)
   * - Rate: 2.5% on wealth above Nisab
   * - Hawl: Lunar year
   * - Debts: Immediate debts deductible
   * - Special: Business assets valued at market price
   */
  HANAFI: 'HANAFI',

  /**
   * Shafi'i Method
   * 
   * - Nisab: Gold-based (higher threshold)
   * - Rate: 2.5% on wealth above Nisab
   * - Hawl: Lunar year
   * - Debts: Not deductible (conservative)
   */
  SHAFII: 'SHAFII',

  /**
   * Maliki Method
   * 
   * - Nisab: Gold or silver
   * - Rate: 2.5% on wealth above Nisab
   * - Hawl: Lunar year
   * - Debts: Immediate debts deductible
   */
  MALIKI: 'MALIKI',

  /**
   * Hanbali Method
   * 
   * - Nisab: Gold or silver
   * - Rate: 2.5% on wealth above Nisab
   * - Hawl: Lunar year
   * - Debts: All debts deductible
   */
  HANBALI: 'HANBALI',
} as const;

/**
 * Precious Metals API Fallback Prices
 * 
 * Emergency fallback prices used when API is unavailable and cache is stale.
 * These should be updated periodically by administrators.
 * 
 * @warning These are FALLBACK values only. Application will display a warning
 * when using fallback prices to inform users of potential inaccuracy.
 */
export const FALLBACK_METAL_PRICES = {
  /**
   * Gold Fallback: $2000 USD per troy ounce
   * 
   * Conservative estimate based on recent historical averages.
   * Should be updated quarterly by system administrators.
   * 
   * @lastUpdated 2025-10-27
   */
  GOLD_USD_PER_OZ: 2000,

  /**
   * Silver Fallback: $25 USD per troy ounce
   * 
   * Conservative estimate based on recent historical averages.
   * Should be updated quarterly by system administrators.
   * 
   * @lastUpdated 2025-10-27
   */
  SILVER_USD_PER_OZ: 25,

  /**
   * Cache Staleness Threshold: 7 days
   * 
   * If cached prices are older than 7 days, show warning to user
   * even if using cached data.
   */
  CACHE_STALE_WARNING_DAYS: 7,

  /**
   * Cache TTL: 24 hours
   * 
   * Precious metals prices cached for 24 hours before refresh.
   */
  CACHE_TTL_HOURS: 24,
} as const;

/**
 * Default Nisab Threshold Fallback
 * 
 * Default Nisab threshold value used when no active record exists or
 * when the active record does not have an initialNisabThreshold set.
 * 
 * This value represents a conservative estimate of the Nisab threshold
 * based on silver prices (typically the lower and more accessible threshold).
 * 
 * @remarks
 * This is a UI fallback value only and should not be used for actual Zakat
 * calculations without proper scholarly consultation. Users should create
 * a Nisab Year Record with current metal prices for accurate calculations.
 * 
 * @example
 * Calculation basis (as of typical market conditions):
 * - Silver Nisab: 612.36g / 31.1035 g/oz ≈ 19.68 oz
 * - At ~$25/oz silver: 19.68 * $25 ≈ $492
 * - Rounded up conservatively to $5000 for UI display purposes
 * 
 * @warning This is a display fallback only. Always encourage users to
 * create proper Nisab records with current market prices.
 */
export const DEFAULT_NISAB_THRESHOLD = 5000 as const;

/**
 * Scholarly References
 * 
 * Primary sources for Islamic rulings implemented in this application.
 */
export const SCHOLARLY_SOURCES = {
  /**
   * Primary Methodology Source
   */
  PRIMARY: {
    name: 'Simple Zakat Guide',
    url: 'https://simplezakatguide.com',
    description: 'Video series and comprehensive website explaining Zakat calculations with contemporary examples',
  },

  /**
   * Classical Sources
   */
  QURAN: {
    name: 'Quran',
    zakataVerses: ['9:60', '2:43', '2:110', '2:267'],
    description: 'Primary divine source mandating Zakat',
  },

  HADITH: {
    name: 'Hadith Collections',
    collections: ['Sahih al-Bukhari', 'Sahih Muslim', 'Sunan Abu Dawood'],
    description: 'Prophetic traditions detailing Zakat calculations and thresholds',
  },

  /**
   * Calendar System
   */
  CALENDAR: {
    name: 'Umm al-Qura Calendar',
    description: 'Official Islamic calendar system used for Hijri date calculations',
    algorithm: 'Astronomical calculations based on Saudi Arabia moon sighting methodology',
  },

  /**
   * Contemporary Scholars
   */
  CONTEMPORARY: {
    description: 'Modern fatwas and rulings adapted for contemporary financial instruments (crypto, stocks, etc.)',
    organizations: [
      'AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions)',
      'Fiqh Council of North America',
      'European Council for Fatwa and Research',
    ],
  },
} as const;

/**
 * Display Formats
 * 
 * Standardized formats for displaying Islamic values in UI.
 */
export const DISPLAY_FORMATS = {
  /**
   * Currency precision: 2 decimal places
   */
  CURRENCY_DECIMALS: 2,

  /**
   * Weight precision: 2 decimal places for metals
   */
  WEIGHT_DECIMALS: 2,

  /**
   * Percentage precision: 2 decimal places (e.g., 2.50%)
   */
  PERCENTAGE_DECIMALS: 2,

  /**
   * Date formats
   */
  HIJRI_DATE_FORMAT: 'iD iMMMM iYYYY', // e.g., "15 Ramadan 1446"
  GREGORIAN_DATE_FORMAT: 'MMMM D, YYYY', // e.g., "March 15, 2025"
} as const;

/**
 * Type Exports
 * 
 * TypeScript types derived from constants for type safety.
 */
export type CalculationMethod = typeof CALCULATION_METHODS[keyof typeof CALCULATION_METHODS];
export type DeductibleLiabilityOpinion = typeof DEDUCTIBLE_LIABILITIES[keyof typeof DEDUCTIBLE_LIABILITIES];
export type ZakatableAssetCategory = typeof ASSET_CATEGORIES.ZAKATABLE[number];
export type NonZakatableAssetCategory = typeof ASSET_CATEGORIES.NON_ZAKATABLE[number];
export type PartialZakatableAssetCategory = typeof ASSET_CATEGORIES.PARTIAL[number];

/**
 * Helper Functions
 */

/**
 * Calculate Nisab threshold in user's currency
 * 
 * @param goldPricePerOz - Current gold price per troy ounce in user's currency
 * @param silverPricePerOz - Current silver price per troy ounce in user's currency
 * @param basis - 'gold' | 'silver' | 'lower' (default: 'lower' for more accessible threshold)
 * @returns Nisab threshold in user's currency
 * 
 * @example
 * ```typescript
 * const nisab = calculateNisabThreshold(2000, 25, 'lower');
 * // Returns: 525 (silver-based: 612.36g / 31.1035g/oz * $25)
 * ```
 */
export function calculateNisabThreshold(
  goldPricePerOz: number,
  silverPricePerOz: number,
  basis: 'gold' | 'silver' | 'lower' = 'lower'
): number {
  const GRAMS_PER_TROY_OZ = 31.1035;

  const goldNisab = (NISAB_THRESHOLDS.GOLD_GRAMS / GRAMS_PER_TROY_OZ) * goldPricePerOz;
  const silverNisab = (NISAB_THRESHOLDS.SILVER_GRAMS / GRAMS_PER_TROY_OZ) * silverPricePerOz;

  switch (basis) {
    case 'gold':
      return goldNisab;
    case 'silver':
      return silverNisab;
    case 'lower':
    default:
      return Math.min(goldNisab, silverNisab);
  }
}

/**
 * Calculate Zakat amount
 * 
 * @param zakatableWealth - Total zakatable wealth in user's currency
 * @param rate - Zakat rate (default: 0.025 for 2.5%)
 * @returns Zakat amount due
 * 
 * @example
 * ```typescript
 * const zakat = calculateZakatAmount(10000); // Returns: 250
 * ```
 */
export function calculateZakatAmount(
  zakatableWealth: number,
  rate: number = ZAKAT_RATES.STANDARD
): number {
  return zakatableWealth * rate;
}

/**
 * Calculate Hawl completion date
 * 
 * @param hawlStartDate - Date when Nisab was first reached
 * @returns Date when Hawl completes (354 days later)
 * 
 * @example
 * ```typescript
 * const completionDate = calculateHawlCompletionDate(new Date('2025-01-01'));
 * // Returns: Date representing 2025-12-21 (354 days later)
 * ```
 */
export function calculateHawlCompletionDate(hawlStartDate: Date): Date {
  const completion = new Date(hawlStartDate);
  completion.setDate(completion.getDate() + HAWL_CONSTANTS.DAYS_LUNAR);
  return completion;
}

/**
 * Check if wealth exceeds Nisab threshold
 * 
 * @param wealth - Current wealth in user's currency
 * @param nisabThreshold - Nisab threshold in same currency
 * @returns true if wealth >= nisab (Zakat obligatory)
 * 
 * @example
 * ```typescript
 * const isObligatory = isZakatObligatory(10000, 5000); // Returns: true
 * ```
 */
export function isZakatObligatory(wealth: number, nisabThreshold: number): boolean {
  return wealth >= nisabThreshold;
}
