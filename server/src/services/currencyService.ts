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
 * Currency Service for exchange rate management and currency conversions
 * 
 * Handles currency conversion for multi-currency zakat calculations.
 * Supports both real-time and cached exchange rates with fallback mechanisms.
 * 
 * Constitutional Compliance:
 * - Privacy & Security: No external data sharing of user transactions
 * - Transparency: Clear exchange rate sources and timestamps
 * - Reliability: Fallback mechanisms for rate retrieval
 */
export class CurrencyService {
  private exchangeRates: Map<string, { rate: number; timestamp: Date }> = new Map();
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour
  private readonly baseCurrency = 'USD';

  /**
   * Get exchange rate between two currencies
   * 
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @returns Exchange rate (1 unit of fromCurrency = X units of toCurrency)
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.exchangeRates.get(cacheKey);
    
    // Check if cached rate is still valid
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.rate;
    }

    try {
      // Try to get real-time rate
      const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
      
      // Cache the rate
      this.exchangeRates.set(cacheKey, {
        rate,
        timestamp: new Date()
      });
      
      return rate;
    } catch (error) {
      // Fall back to cached rate if available
      if (cached) {
        console.warn(`Using stale exchange rate for ${cacheKey}: ${error}`);
        return cached.rate;
      }
      
      // Fall back to default rates
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Check if cached rate is still valid
   */
  private isCacheValid(timestamp: Date): boolean {
    const now = new Date();
    return (now.getTime() - timestamp.getTime()) < this.CACHE_DURATION_MS;
  }

  /**
   * Fetch exchange rate from external API
   * 
   * Note: In production, you would use a real exchange rate API like:
   * - ExchangeRate-API
   * - Fixer.io
   * - CurrencyLayer
   * - Alpha Vantage
   */
  private async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Mock implementation - replace with real API call
    // This would normally make HTTP request to exchange rate API
    
    // For demo purposes, return mock rates
    const mockRates: { [key: string]: { [key: string]: number } } = {
      'USD': {
        'EUR': 0.85,
        'GBP': 0.73,
        'SAR': 3.75,
        'AED': 3.67,
        'EGP': 30.90,
        'TRY': 27.50,
        'INR': 83.20,
        'PKR': 278.50,
        'BDT': 109.50,
        'MYR': 4.65,
        'IDR': 15750.00
      },
      'EUR': {
        'USD': 1.18,
        'GBP': 0.86,
        'SAR': 4.42,
        'AED': 4.33
      },
      'GBP': {
        'USD': 1.37,
        'EUR': 1.16,
        'SAR': 5.14,
        'AED': 5.03
      }
    };

    if (mockRates[fromCurrency]?.[toCurrency]) {
      return mockRates[fromCurrency][toCurrency];
    }

    // If direct rate not available, calculate via USD
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromToUSD = mockRates[fromCurrency]?.['USD'] || (1 / (mockRates['USD']?.[fromCurrency] || 1));
      const USDToTo = mockRates['USD']?.[toCurrency] || (1 / (mockRates[toCurrency]?.['USD'] || 1));
      return fromToUSD * USDToTo;
    }

    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
  }

  /**
   * Get fallback exchange rate when API fails
   */
  private getFallbackRate(fromCurrency: string, toCurrency: string): number {
    console.warn(`Using fallback exchange rate for ${fromCurrency} to ${toCurrency}`);
    
    // Basic fallback rates (should be updated regularly)
    const fallbackRates: { [key: string]: { [key: string]: number } } = {
      'USD': {
        'EUR': 0.85,
        'GBP': 0.73,
        'SAR': 3.75,
        'AED': 3.67,
        'EGP': 30.00,
        'TRY': 27.00,
        'INR': 83.00,
        'PKR': 280.00,
        'BDT': 110.00,
        'MYR': 4.70,
        'IDR': 15800.00
      }
    };

    if (fallbackRates[fromCurrency]?.[toCurrency]) {
      return fallbackRates[fromCurrency][toCurrency];
    }

    if (fallbackRates['USD']?.[toCurrency] && fromCurrency === 'USD') {
      return fallbackRates['USD'][toCurrency];
    }

    if (fallbackRates['USD']?.[fromCurrency] && toCurrency === 'USD') {
      return 1 / fallbackRates['USD'][fromCurrency];
    }

    // Last resort - return 1:1 (this should be logged for monitoring)
    console.error(`No fallback rate available for ${fromCurrency} to ${toCurrency}, using 1:1`);
    return 1.0;
  }

  /**
   * Convert amount between currencies
   * 
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @returns Converted amount
   */
  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Convert multiple amounts to base currency
   * 
   * @param amounts - Array of {amount, currency} objects
   * @param baseCurrency - Target currency (default: USD)
   * @returns Array of converted amounts
   */
  async convertToBaseCurrency(
    amounts: Array<{ amount: number; currency: string }>,
    baseCurrency: string = 'USD'
  ): Promise<Array<{ originalAmount: number; originalCurrency: string; convertedAmount: number; rate: number }>> {
    const results = [];
    
    for (const item of amounts) {
      const rate = await this.getExchangeRate(item.currency, baseCurrency);
      const convertedAmount = item.amount * rate;
      
      results.push({
        originalAmount: item.amount,
        originalCurrency: item.currency,
        convertedAmount,
        rate
      });
    }
    
    return results;
  }

  /**
   * Get current exchange rates for all supported currencies to USD
   */
  async getAllRatesToUSD(): Promise<{ [currency: string]: { rate: number; timestamp: Date } }> {
    const supportedCurrencies = [
      'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'TRY', 'INR', 'PKR', 'BDT', 'MYR', 'IDR'
    ];

    const rates: { [currency: string]: { rate: number; timestamp: Date } } = {};

    for (const currency of supportedCurrencies) {
      try {
        const rate = await this.getExchangeRate(currency, 'USD');
        rates[currency] = {
          rate,
          timestamp: new Date()
        };
      } catch (error) {
        console.warn(`Failed to get rate for ${currency}:`, error);
      }
    }

    return rates;
  }

  /**
   * Clear cached exchange rates (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.exchangeRates.clear();
  }

  /**
   * Get cache status for monitoring
   */
  getCacheStatus(): {
    totalCached: number;
    validCache: number;
    staleCache: number;
  } {
    let validCache = 0;
    let staleCache = 0;

    for (const [, data] of this.exchangeRates) {
      if (this.isCacheValid(data.timestamp)) {
        validCache++;
      } else {
        staleCache++;
      }
    }

    return {
      totalCached: this.exchangeRates.size,
      validCache,
      staleCache
    };
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount: number, currency: string): string {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'SAR': 'ر.س',
      'AED': 'د.إ',
      'EGP': 'ج.م',
      'TRY': '₺',
      'INR': '₹',
      'PKR': '₨',
      'BDT': '৳',
      'MYR': 'RM',
      'IDR': 'Rp'
    };

    const symbol = symbols[currency] || currency;
    const formattedAmount = amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return `${symbol}${formattedAmount}`;
  }

  /**
   * Validate currency code
   */
  isValidCurrency(currency: string): boolean {
    const validCurrencies = [
      'USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'TRY',
      'INR', 'PKR', 'BDT', 'MYR', 'IDR'
    ];
    
    return validCurrencies.includes(currency.toUpperCase());
  }
}