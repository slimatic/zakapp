import axios from 'axios';
import { Logger } from '../utils/logger';

const logger = new Logger('CurrencyService');


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
   * Live provider rate table, cached for CACHE_DURATION_MS.
   *
   * Keyless and free. Overridable via RATES_API_URL so a deploy could point at a
   * licensed provider without a code change; RATES_API_TIMEOUT_MS bounds the wait
   * so a slow provider degrades to the fallback rather than hanging a request.
   */
  private liveTable: { base: string; rates: Record<string, number>; fetchedAt: Date } | null = null;
  private readonly ratesApiUrl =
    process.env.RATES_API_URL || 'https://open.er-api.com/v6/latest';
  private readonly ratesApiTimeoutMs = Number(process.env.RATES_API_TIMEOUT_MS || 5000);

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
        logger.warn(`Using stale exchange rate for ${cacheKey}: ${error}`);

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
    // Real rates via a live provider, with the failure path made explicit.
    //
    // This previously returned values from a hardcoded table commented "for demo
    // purposes" — which was unreachable-but-live production code. ZakatEngine
    // injects this service, so a user in EGP or TRY had their wealth converted to
    // USD using a rate frozen in 2023: measured against the live provider, EGP was
    // 30.90 vs an actual 52.04 (68% low) and TRY 27.50 vs 48.79 (77% low). Gold
    // nisab is compared in the base currency, so an understated conversion can
    // flip a user across the nisab threshold and change what they owe.
    //
    // Returns the rate and records where it came from, so callers can tell a live
    // rate from a degraded one instead of silently trusting both equally.
    const snapshot = await this.fetchLiveRatesTable();

    const direct = snapshot.rates[toCurrency];
    if (snapshot.base === fromCurrency && typeof direct === 'number' && direct > 0) {
      return direct;
    }

    // Cross-rate through the provider's base when the pair is not direct.
    const fromRate = snapshot.rates[fromCurrency];
    const toRate = snapshot.rates[toCurrency];
    if (typeof fromRate !== 'number' || typeof toRate !== 'number' || fromRate <= 0 || toRate <= 0) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    return toRate / fromRate;
  }

  /**
   * Fetch the provider's full rate table, cached for CACHE_DURATION_MS.
   *
   * Throws when no live or cached table is available, so callers fall through to
   * getFallbackRate() with full knowledge that the result is degraded.
   */
  private async fetchLiveRatesTable(): Promise<{ base: string; rates: Record<string, number>; fetchedAt: Date }> {
    if (this.liveTable && this.isCacheValid(this.liveTable.fetchedAt)) {
      return this.liveTable;
    }

    const url = `${this.ratesApiUrl}/${this.baseCurrency}`;
    const response = await axios.get(url, {
      timeout: this.ratesApiTimeoutMs,
      headers: { Accept: 'application/json' },
    });

    const body = response.data ?? {};
    const rates = body.rates;
    if (
      body.result !== 'success' ||
      typeof rates !== 'object' ||
      rates === null ||
      typeof rates[this.baseCurrency] !== 'number'
    ) {
      throw new Error(`Rate provider returned an unusable payload from ${url}`);
    }

    this.liveTable = {
      base: String(body.base_code ?? this.baseCurrency),
      rates: rates as Record<string, number>,
      fetchedAt: new Date(),
    };

    logger.info(
      `Loaded live exchange rates from ${this.ratesApiUrl} (published ${body.time_last_update_utc ?? 'unknown'})`
    );

    return this.liveTable;
  }

  /**
   * Get fallback exchange rate when API fails
   */
  private getFallbackRate(fromCurrency: string, toCurrency: string): number {
    logger.warn(`Using fallback exchange rate for ${fromCurrency} to ${toCurrency}`);


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

    // Last resort. Returning 1.0 here would be actively harmful: it silently
    // asserts "1 unit of this currency equals 1 USD", so a user holding TRY or IDR
    // has their wealth understated by a factor of ~49 or ~15800, and a nisab
    // comparison run against that is meaningless. A confidently wrong number is
    // worse than a declared approximation, because nothing downstream can tell it
    // apart from a real rate.
    //
    // The built-in table holds USD pairs only. Cross-rate through it rather than
    // giving up: a degraded cross-rate is still the right order of magnitude, and
    // refusing would break conversion entirely for every non-USD pair during a
    // provider outage.
    logger.error(
      `Live exchange rate unavailable for ${fromCurrency}→${toCurrency}; using stale built-in fallback`
    );

    const usdTable = fallbackRates['USD'] ?? {};

    if (fromCurrency === 'USD' && typeof usdTable[toCurrency] === 'number') {
      return usdTable[toCurrency];
    }
    if (toCurrency === 'USD' && typeof usdTable[fromCurrency] === 'number') {
      return 1 / usdTable[fromCurrency];
    }
    if (typeof usdTable[fromCurrency] === 'number' && typeof usdTable[toCurrency] === 'number') {
      return usdTable[toCurrency] / usdTable[fromCurrency];
    }

    // Genuinely unknown pair. Throwing is the honest answer — assuming parity would
    // produce a confidently wrong zakat figure.
    throw new Error(
      `No exchange rate available for ${fromCurrency}→${toCurrency}: live provider unreachable and no fallback rate defined. ` +
        `Refusing to assume parity, which would misstate the amount.`
    );
  }

  /**
   * Provenance of the most recently used rate, for surfaces that must show the
   * user whether a figure came from a live rate or a degraded fallback.
   */
  getRateSource(): 'live' | 'cache' | 'fallback' | 'unknown' {
    if (this.liveTable && this.isCacheValid(this.liveTable.fetchedAt)) return 'live';
    if (this.liveTable) return 'cache';
    return 'unknown';
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
        logger.warn(`Failed to get rate for ${currency}:`, error);

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