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

import { NisabInfo } from '@zakapp/shared';
import { NISAB_THRESHOLDS } from '@zakapp/shared';
import axios from 'axios';
import { metalPriceScraper } from './MetalPriceScraperService';

/**
 * Nisab Threshold Service
 * Manages nisab calculations and threshold data for Zakat calculations
 * 
 * Follows ZakApp constitutional principles:
 * - Islamic Compliance: Accurate nisab calculations per Islamic jurisprudence
 * - Transparency: Clear explanations of nisab calculations and sources
 * - User-Centric Design: Easy-to-understand threshold information
 */
export class NisabService {
  // Cache for metal prices - keyed by currency for currency-specific prices
  private priceCache: Map<string, {
    gold?: { price: number; timestamp: number };
    silver?: { price: number; timestamp: number };
  }> = new Map();

  // Cache validity period (24 hours)
  private readonly CACHE_VALIDITY_MS = 24 * 60 * 60 * 1000;

  /**
   * Calculate nisab thresholds based on current metal prices
   * 
   * @param methodology - Islamic methodology for nisab calculation
   * @param currency - Target currency for nisab amounts
   * @returns Complete nisab information with thresholds
   * @throws {Error} When price data is unavailable or calculation fails
   */
  async calculateNisab(
    methodology: string,
    currency: string = 'USD'
  ): Promise<NisabInfo> {
    try {
      // Get current metal prices
      const goldPrice = await this.getCurrentGoldPrice(currency);
      const silverPrice = await this.getCurrentSilverPrice(currency);

      // Calculate gold and silver based nisab amounts
      const goldNisab = this.calculateGoldNisab(goldPrice);
      const silverNisab = this.calculateSilverNisab(silverPrice);

      // Determine effective nisab based on methodology
      const { effectiveNisab, nisabBasis } = this.determineEffectiveNisab(
        methodology,
        goldNisab,
        silverNisab
      );

      return {
        goldNisab,
        silverNisab,
        effectiveNisab,
        nisabBasis,
        calculationMethod: methodology
      };
    } catch (error) {
      throw new Error(`Nisab calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current gold price per gram in specified currency
   * Scrapes directly from country-specific pages - no currency conversion needed
   * 
   * @param currency - Target currency code
   * @returns Gold price per gram in target currency
   */
  private async getCurrentGoldPrice(currency: string): Promise<number> {
    // Get or create currency-specific cache
    if (!this.priceCache.has(currency)) {
      this.priceCache.set(currency, {});
    }
    const currencyCache = this.priceCache.get(currency)!;

    // Check cache first
    const cached = currencyCache.gold;
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`Using cached gold price for ${currency}: ${cached.price}`);
      return cached.price;
    }

    // 1. Try Scraper (Primary) - scrapes directly in target currency
    try {
      console.log(`Attempting to scrape gold price in ${currency}...`);
      const price = await metalPriceScraper.scrapeGoldPrice(currency);

      // Update cache
      currencyCache.gold = {
        price: price,
        timestamp: Date.now()
      };

      console.log(`Scraped gold price for ${currency}: ${price}`);
      return price;
    } catch (error) {
      console.warn('Scraper failed for Gold:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 2. Try GoldAPI (Fallback) - returns price directly in currency
    try {
      const price = await this.fetchLivePrice('XAU', currency);

      // Update cache
      currencyCache.gold = {
        price: price,
        timestamp: Date.now()
      };

      return price;
    } catch (error) {
      console.error('GoldAPI Error (Gold):', error instanceof Error ? error.message : 'Unknown error');

      // 3. Last Resort Fallbacks

      // a. Check Cache (even if stale)
      if (cached) {
        console.warn('Using stale cached gold price');
        return cached.price;
      }

      // b. Fall back to USD value with rough conversion
      const fallbackUSD = process.env.MANUAL_GOLD_PRICE_USD
        ? parseFloat(process.env.MANUAL_GOLD_PRICE_USD)
        : 147; // ~current gold price USD/g

      console.warn(`Using fallback gold price: ${fallbackUSD} USD/g (no conversion)`);
      return fallbackUSD;
    }
  }

  /**
   * Get current silver price per gram in specified currency
   * Scrapes directly from country-specific pages - no currency conversion needed
   * 
   * @param currency - Target currency code
   * @returns Silver price per gram in target currency
   */
  private async getCurrentSilverPrice(currency: string): Promise<number> {
    // Get or create currency-specific cache
    if (!this.priceCache.has(currency)) {
      this.priceCache.set(currency, {});
    }
    const currencyCache = this.priceCache.get(currency)!;

    // Check cache first
    const cached = currencyCache.silver;
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`Using cached silver price for ${currency}: ${cached.price}`);
      return cached.price;
    }

    // 1. Try Scraper (Primary) - scrapes directly in target currency
    try {
      console.log(`Attempting to scrape silver price in ${currency}...`);
      const price = await metalPriceScraper.scrapeSilverPrice(currency);

      // Update cache
      currencyCache.silver = {
        price: price,
        timestamp: Date.now()
      };

      console.log(`Scraped silver price for ${currency}: ${price}`);
      return price;
    } catch (error) {
      console.warn('Scraper failed for Silver:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 2. Try GoldAPI (Fallback) - returns price directly in currency
    try {
      const price = await this.fetchLivePrice('XAG', currency);

      // Update cache
      currencyCache.silver = {
        price: price,
        timestamp: Date.now()
      };

      return price;
    } catch (error) {
      console.error('GoldAPI Error (Silver):', error instanceof Error ? error.message : 'Unknown error');

      // 3. Last Resort Fallbacks

      // a. Check Cache (even if stale)
      if (cached) {
        console.warn('Using stale cached silver price');
        return cached.price;
      }

      // b. Fall back to USD value with rough conversion
      const fallbackUSD = process.env.MANUAL_SILVER_PRICE_USD
        ? parseFloat(process.env.MANUAL_SILVER_PRICE_USD)
        : 0.95; // ~current silver price USD/g

      console.warn(`Using fallback silver price: ${fallbackUSD} USD/g (no conversion)`);
      return fallbackUSD;
    }
  }

  /**
   * Fetch live price from GoldAPI
   * @param symbol - 'XAU' (Gold) or 'XAG' (Silver)
   * @param currency - Target currency
   */
  private async fetchLivePrice(symbol: 'XAU' | 'XAG', currency: string): Promise<number> {
    const apiKey = process.env.GOLD_API_KEY;
    if (!apiKey) {
      throw new Error('GOLD_API_KEY is not configured');
    }

    // GoldAPI expects symbol and currency in URL, e.g., /api/XAU/USD
    // Note: GoldAPI returns price per OUNCE usually, but we need GRAMS.
    // However, some endpoints return price per gram directly if configured or we need to convert.
    // GoldAPI default is 1 oz. 1 Troy Ounce = 31.1034768 grams.

    // Using standard endpoint: https://www.goldapi.io/api/{symbol}/{currency}
    const response = await axios.get(`https://www.goldapi.io/api/${symbol}/${currency}`, {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5s timeout
    });

    if (response.status !== 200 || !response.data) {
      throw new Error(`Invalid response from GoldAPI: ${response.status}`);
    }

    // Response format: { price: number, price_gram_24k: number, ... }
    // We prefer `price_gram_24k` for pure gold/silver calculations if available,
    // otherwise fallback to `price` (ounce) / 31.1035

    // For calculating Nisab (pure gold/silver), we should use 24k price.
    const pricePerGram = response.data.price_gram_24k;

    if (typeof pricePerGram === 'number') {
      return pricePerGram;
    }

    // Fallback calculation if configured differently
    const pricePerOunce = response.data.price;
    if (typeof pricePerOunce === 'number') {
      const GRAMS_PER_OUNCE = 31.1034768;
      return pricePerOunce / GRAMS_PER_OUNCE;
    }

    throw new Error('Price data missing in GoldAPI response');
  }

  /**
   * Calculate gold-based nisab threshold
   * 
   * @param goldPricePerGram - Current gold price per gram
   * @returns Gold nisab amount
   */
  private calculateGoldNisab(goldPricePerGram: number): number {
    return NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
  }

  /**
   * Calculate silver-based nisab threshold
   * 
   * @param silverPricePerGram - Current silver price per gram
   * @returns Silver nisab amount
   */
  private calculateSilverNisab(silverPricePerGram: number): number {
    return NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;
  }

  /**
   * Determine effective nisab based on Islamic methodology
   * 
   * @param methodology - Islamic calculation methodology
   * @param goldNisab - Gold-based nisab amount
   * @param silverNisab - Silver-based nisab amount
   * @returns Effective nisab and basis information
   */
  private determineEffectiveNisab(
    methodology: string,
    goldNisab: number,
    silverNisab: number
  ): { effectiveNisab: number; nisabBasis: string } {
    switch (methodology.toLowerCase()) {
      case 'hanafi':
        // Hanafi school traditionally uses silver-based nisab
        return {
          effectiveNisab: silverNisab,
          nisabBasis: 'silver'
        };

      case 'hanbali':
        // Hanbali school typically uses gold-based nisab
        return {
          effectiveNisab: goldNisab,
          nisabBasis: 'gold'
        };

      case 'shafii':
      case 'maliki':
      case 'standard':
      default:
        // Use dual minimum approach (lower of gold or silver)
        // This ensures more people are eligible for Zakat payment
        const effectiveNisab = Math.min(goldNisab, silverNisab);
        const nisabBasis = goldNisab < silverNisab ? 'gold' : 'silver';

        return {
          effectiveNisab,
          nisabBasis: `dual_minimum_${nisabBasis}`
        };
    }
  }

  /**
   * Get nisab information for educational purposes
   * 
   * @param methodology - Islamic calculation methodology
   * @returns Educational information about nisab calculation
   */
  getNisabEducation(methodology: string): {
    explanation: string;
    sources: string[];
    calculation: string;
  } {
    const baseExplanation = 'Nisab is the minimum amount of wealth one must have before being obligated to pay Zakat.';

    switch (methodology.toLowerCase()) {
      case 'hanafi':
        return {
          explanation: `${baseExplanation} The Hanafi school uses the silver-based nisab, which is approximately ${NISAB_THRESHOLDS.SILVER_GRAMS} grams of silver.`,
          sources: [
            'Al-Hidayah by Al-Marghinani',
            'Classical Hanafi jurisprudence texts',
            'Imam Abu Hanifa\'s rulings on Zakat'
          ],
          calculation: `${NISAB_THRESHOLDS.SILVER_GRAMS} grams of silver × current silver price per gram`
        };

      case 'hanbali':
        return {
          explanation: `${baseExplanation} The Hanbali school uses the gold-based nisab, which is approximately ${NISAB_THRESHOLDS.GOLD_GRAMS} grams of gold.`,
          sources: [
            'Al-Mughni by Ibn Qudamah',
            'Hanbali classical texts',
            'Ibn Taymiyyah\'s works on Zakat'
          ],
          calculation: `${NISAB_THRESHOLDS.GOLD_GRAMS} grams of gold × current gold price per gram`
        };

      case 'shafii':
        return {
          explanation: `${baseExplanation} The Shafi'i school uses a balanced approach, typically choosing the lower threshold between gold and silver to ensure broader Zakat eligibility.`,
          sources: [
            'Al-Majmu\' by Al-Nawawi',
            'Shafi\'i jurisprudence texts',
            'Imam al-Shafi\'i\'s methodology'
          ],
          calculation: 'Min(gold nisab, silver nisab) using current market prices'
        };

      case 'maliki':
        return {
          explanation: `${baseExplanation} The Maliki school considers regional economic conditions and typically uses the dual minimum approach with local adaptations.`,
          sources: [
            'Al-Mudawwana by Sahnun',
            'Bidayat al-Mujtahid by Ibn Rushd',
            'Maliki jurisprudence principles'
          ],
          calculation: 'Dual minimum approach adapted for regional economic conditions'
        };

      case 'standard':
      default:
        return {
          explanation: `${baseExplanation} The Standard method uses a dual minimum approach, selecting the lower threshold between gold (${NISAB_THRESHOLDS.GOLD_GRAMS}g) and silver (${NISAB_THRESHOLDS.SILVER_GRAMS}g) based nisab.`,
          sources: [
            'AAOIFI Shariah Standards',
            'Contemporary Islamic finance institutions',
            'Modern scholarly consensus'
          ],
          calculation: 'Min(87.48g gold × gold price, 612.36g silver × silver price)'
        };
    }
  }

  /**
   * Validate if an amount meets nisab requirement
   * 
   * @param amount - Wealth amount to check
   * @param nisabInfo - Nisab threshold information
   * @returns Whether the amount meets nisab requirement
   */
  meetsNisab(amount: number, nisabInfo: NisabInfo): boolean {
    return amount >= nisabInfo.effectiveNisab;
  }

  /**
   * Calculate how much additional wealth is needed to reach nisab
   * 
   * @param currentAmount - Current wealth amount
   * @param nisabInfo - Nisab threshold information
   * @returns Amount needed to reach nisab (0 if already meets nisab)
   */
  amountToReachNisab(currentAmount: number, nisabInfo: NisabInfo): number {
    if (this.meetsNisab(currentAmount, nisabInfo)) {
      return 0;
    }
    return nisabInfo.effectiveNisab - currentAmount;
  }

  /**
   * Get historical nisab trends for analysis
   * 
   * @param methodology - Islamic calculation methodology
   * @param currency - Target currency
   * @param days - Number of days of historical data
   * @returns Array of historical nisab values
   */
  async getHistoricalNisab(
    methodology: string,
    currency: string = 'USD',
    days: number = 30
  ): Promise<Array<{ date: string; nisab: number; basis: string }>> {
    // TODO: Implement historical price data integration
    // For now, return placeholder data
    const historicalData: Array<{ date: string; nisab: number; basis: string }> = [];
    const currentDate = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);

      // Simulate historical data with slight variations
      const baseGold = 65 + (Math.random() - 0.5) * 5;
      const baseSilver = 0.85 + (Math.random() - 0.5) * 0.1;

      const goldNisab = this.calculateGoldNisab(baseGold);
      const silverNisab = this.calculateSilverNisab(baseSilver);
      const { effectiveNisab, nisabBasis } = this.determineEffectiveNisab(
        methodology,
        goldNisab,
        silverNisab
      );

      historicalData.push({
        date: date.toISOString().split('T')[0],
        nisab: effectiveNisab,
        basis: nisabBasis
      });
    }

    return historicalData;
  }

  /**
   * Check if cached price data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_VALIDITY_MS;
  }

  /**
   * Clear price cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.priceCache.clear();
  }

  /**
   * Get cache status for monitoring
   * Returns status for all cached currencies
   */
  getCacheStatus(): Record<string, {
    gold: { cached: boolean; age?: number };
    silver: { cached: boolean; age?: number };
  }> {
    const now = Date.now();
    const status: Record<string, { gold: { cached: boolean; age?: number }; silver: { cached: boolean; age?: number } }> = {};

    this.priceCache.forEach((cache, currency) => {
      status[currency] = {
        gold: {
          cached: !!cache.gold,
          age: cache.gold ? now - cache.gold.timestamp : undefined
        },
        silver: {
          cached: !!cache.silver,
          age: cache.silver ? now - cache.silver.timestamp : undefined
        }
      };
    });

    return status;
  }
}

// Export singleton instance
export const nisabService = new NisabService();