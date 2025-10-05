/**
 * Formatters Utility
 * Provides formatting functions for currency, numbers, dates, and percentages
 * Supports multiple currencies and locales
 */

/**
 * Supported currency codes
 */
export type CurrencyCode =  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'SAR'
  | 'AED'
  | 'PKR'
  | 'INR'
  | 'MYR'
  | 'IDR'
  | 'TRY'
  | 'EGP';

/**
 * Currency symbols and configurations
 */
const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string; decimals: number }> = {
  USD: { symbol: '$', locale: 'en-US', decimals: 2 },
  EUR: { symbol: '€', locale: 'en-EU', decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2 },
  SAR: { symbol: 'SAR', locale: 'ar-SA', decimals: 2 },
  AED: { symbol: 'AED', locale: 'ar-AE', decimals: 2 },
  PKR: { symbol: 'Rs', locale: 'ur-PK', decimals: 2 },
  INR: { symbol: '₹', locale: 'en-IN', decimals: 2 },
  MYR: { symbol: 'RM', locale: 'ms-MY', decimals: 2 },
  IDR: { symbol: 'Rp', locale: 'id-ID', decimals: 0 },
  TRY: { symbol: '₺', locale: 'tr-TR', decimals: 2 },
  EGP: { symbol: 'E£', locale: 'ar-EG', decimals: 2 }
};

/**
 * Formats a numeric amount as currency
 * @param amount - The numeric amount to format
 * @param currency - Currency code (default: 'USD')
 * @param showSymbol - Whether to show currency symbol (default: true)
 * @param compact - Use compact notation for large numbers (default: false)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  showSymbol: boolean = true,
  compact: boolean = false
): string {
  const config = CURRENCY_CONFIG[currency];
  
  if (!config) {
    throw new Error(`Unsupported currency code: ${currency}`);
  }

  const options: Intl.NumberFormatOptions = {
    style: showSymbol ? 'currency' : 'decimal',
    currency: showSymbol ? currency : undefined,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short'
  };

  try {
    return new Intl.NumberFormat(config.locale, options).format(amount);
  } catch {
    // Fallback for unsupported locales
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    });
    return showSymbol ? `${config.symbol}${formatted}` : formatted;
  }
}

/**
 * Formats a percentage value
 * @param value - Numeric value (0-100 or 0-1 based on isDecimal)
 * @param decimals - Number of decimal places (default: 1)
 * @param isDecimal - Whether input is 0-1 range (default: false, assumes 0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  isDecimal: boolean = false
): string {
  const percentValue = isDecimal ? value * 100 : value;
  return `${percentValue.toFixed(decimals)}%`;
}

/**
 * Formats a large number with thousands separators
 * @param value - Numeric value
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - Locale code (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = 'en-US'
): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formats a number in compact notation (1K, 1M, 1B)
 * @param value - Numeric value
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - Locale code (default: 'en-US')
 * @returns Compact formatted string
 */
export function formatCompactNumber(
  value: number,
  decimals: number = 1,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formats currency with appropriate compact notation for large amounts
 * @param amount - Numeric amount
 * @param currency - Currency code
 * @param threshold - Threshold above which to use compact notation (default: 1,000,000)
 * @returns Formatted currency string
 */
export function formatSmartCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  threshold: number = 1000000
): string {
  const useCompact = Math.abs(amount) >= threshold;
  return formatCurrency(amount, currency, true, useCompact);
}

/**
 * Formats a relative change (increase/decrease)
 * @param oldValue - Previous value
 * @param newValue - Current value
 * @param showSign - Whether to show + sign for increases (default: true)
 * @returns Formatted change with sign and percentage
 */
export function formatChange(
  oldValue: number,
  newValue: number,
  showSign: boolean = true
): string {
  if (oldValue === 0) {
    return 'N/A';
  }

  const change = ((newValue - oldValue) / oldValue) * 100;
  const sign = change > 0 ? '+' : '';
  const formattedChange = change.toFixed(1);

  return showSign ? `${sign}${formattedChange}%` : `${formattedChange}%`;
}

/**
 * Formats a number as ordinal (1st, 2nd, 3rd, etc.)
 * @param number - The number to format
 * @returns Ordinal string
 */
export function formatOrdinal(number: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = number % 100;
  const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
  return `${number}${suffix}`;
}

/**
 * Formats a duration in milliseconds to human-readable string
 * @param milliseconds - Duration in milliseconds
 * @param precision - Level of detail ('short' | 'long')
 * @returns Formatted duration string
 */
export function formatDuration(
  milliseconds: number,
  precision: 'short' | 'long' = 'short'
): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (precision === 'short') {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
  if (seconds % 60 > 0 && parts.length < 2) parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);

  return parts.join(', ') || '0 seconds';
}

/**
 * Formats file size in bytes to human-readable format
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param position - Where to truncate ('end' | 'middle')
 * @returns Truncated text
 */
export function truncateText(
  text: string,
  maxLength: number,
  position: 'end' | 'middle' = 'end'
): string {
  if (text.length <= maxLength) return text;

  if (position === 'end') {
    return `${text.substring(0, maxLength - 3)}...`;
  }

  const halfLength = Math.floor((maxLength - 3) / 2);
  return `${text.substring(0, halfLength)}...${text.substring(text.length - halfLength)}`;
}

/**
 * Formats a range of values
 * @param min - Minimum value
 * @param max - Maximum value
 * @param formatter - Optional custom formatter function
 * @returns Formatted range string
 */
export function formatRange(
  min: number,
  max: number,
  formatter?: (value: number) => string
): string {
  const format = formatter || ((v: number) => v.toLocaleString());
  return `${format(min)} - ${format(max)}`;
}

/**
 * Formats currency range
 * @param min - Minimum amount
 * @param max - Maximum amount
 * @param currency - Currency code
 * @returns Formatted currency range
 */
export function formatCurrencyRange(
  min: number,
  max: number,
  currency: CurrencyCode = 'USD'
): string {
  return formatRange(min, max, (v) => formatCurrency(v, currency));
}

/**
 * Converts currency amount between two currencies
 * Note: This is a placeholder - real implementation would fetch exchange rates
 * @param amount - Amount in source currency
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param exchangeRate - Exchange rate (from -> to)
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return amount;
  return amount * exchangeRate;
}

/**
 * Formats a number with sign (+ or -)
 * @param value - Numeric value
 * @param decimals - Number of decimal places
 * @returns Formatted number with sign
 */
export function formatSignedNumber(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

/**
 * Gets currency symbol for a currency code
 * @param currency - Currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_CONFIG[currency]?.symbol || currency;
}

/**
 * Gets list of all supported currencies
 * @returns Array of currency codes
 */
export function getSupportedCurrencies(): CurrencyCode[] {
  return Object.keys(CURRENCY_CONFIG) as CurrencyCode[];
}

/**
 * Validates if a currency code is supported
 * @param currency - Currency code to validate
 * @returns true if supported
 */
export function isSupportedCurrency(currency: string): currency is CurrencyCode {
  return currency in CURRENCY_CONFIG;
}
