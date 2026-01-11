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
  // Cache for metal prices to avoid frequent API calls
  private priceCache: {
    gold?: { price: number; timestamp: number };
    silver?: { price: number; timestamp: number };
  } = {};

  // Cache validity period (24 hours) - Optimizes for 100 reqs/month limit
  // 100 reqs / 2 metals = 50 updates/month = ~1.6 updates/day. 24h is safe.
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
   * 
   * @param currency - Target currency code
   * @returns Gold price per gram
   */
  private async getCurrentGoldPrice(currency: string): Promise<number> {
    // Check cache first
    const cached = this.priceCache.gold;
    if (cached && this.isCacheValid(cached.timestamp)) {
      return this.convertCurrency(cached.price, 'USD', currency);
    }

    // 1. Try Scraper (Primary)
    try {
      console.log('Attempting to scrape gold price...');
      const price = await metalPriceScraper.scrapeGoldPrice();

      // Update cache
      this.priceCache.gold = {
        price: price,
        timestamp: Date.now()
      };

      return this.convertCurrency(price, 'USD', currency);
    } catch (error) {
      console.warn('Scraper failed for Gold, trying API fallback:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 2. Try API (Fallback)
    try {
      const price = await this.fetchLivePrice('XAU', currency);

      // Update cache
      this.priceCache.gold = {
        price: price,
        timestamp: Date.now()
      };

      return price;
    } catch (error) {
      console.error('GoldAPI Error (Gold):', error instanceof Error ? error.message : 'Unknown error');

      // 3. Last Resort Fallbacks

      // a. Check Cache (even if stale)
      if (cached) {
        console.warn('Using cached gold price due to API error');
        return this.convertCurrency(cached.price, 'USD', currency);
      }

      // b. Manual Env Variable (Configured Fallback)
      if (process.env.MANUAL_GOLD_PRICE_USD) {
        console.warn('Using manual gold price from env as fallback:', process.env.MANUAL_GOLD_PRICE_USD);
        const price = parseFloat(process.env.MANUAL_GOLD_PRICE_USD);
        return this.convertCurrency(price, 'USD', currency);
      }

      // c. Static Constant (Hard Fallback)
      const FALLBACK_GOLD_PRICE = 65; // USD/g
      console.warn(`Using static fallback gold price: $${FALLBACK_GOLD_PRICE}/g`);
      return this.convertCurrency(FALLBACK_GOLD_PRICE, 'USD', currency);
    }
  }

  /**
   * Get current silver price per gram in specified currency
   * 
   * @param currency - Target currency code
   * @returns Silver price per gram
   */
  private async getCurrentSilverPrice(currency: string): Promise<number> {
    // Check cache first
    const cached = this.priceCache.silver;
    if (cached && this.isCacheValid(cached.timestamp)) {
      return this.convertCurrency(cached.price, 'USD', currency);
    }

    // 1. Try Scraper (Primary)
    try {
      console.log('Attempting to scrape silver price...');
      const price = await metalPriceScraper.scrapeSilverPrice();

      // Update cache
      this.priceCache.silver = {
        price: price,
        timestamp: Date.now()
      };

      return this.convertCurrency(price, 'USD', currency);
    } catch (error) {
      console.warn('Scraper failed for Silver, trying API fallback:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 2. Try API (Fallback)
    try {
      const price = await this.fetchLivePrice('XAG', currency);

      // Update cache
      this.priceCache.silver = {
        price: price,
        timestamp: Date.now()
      };

      return price;
    } catch (error) {
      console.error('GoldAPI Error (Silver):', error instanceof Error ? error.message : 'Unknown error');

      // 3. Last Resort Fallbacks

      // a. Check Cache (even if stale)
      if (cached) {
        console.warn('Using cached silver price due to API error');
        return this.convertCurrency(cached.price, 'USD', currency);
      }

      // b. Manual Env Variable (Configured Fallback)
      if (process.env.MANUAL_SILVER_PRICE_USD) {
        console.warn('Using manual silver price from env as fallback:', process.env.MANUAL_SILVER_PRICE_USD);
        const price = parseFloat(process.env.MANUAL_SILVER_PRICE_USD);
        return this.convertCurrency(price, 'USD', currency);
      }

      // c. Static Constant (Hard Fallback)
      const FALLBACK_SILVER_PRICE = 0.85; // USD/g
      console.warn(`Using static fallback silver price: $${FALLBACK_SILVER_PRICE}/g`);
      return this.convertCurrency(FALLBACK_SILVER_PRICE, 'USD', currency);
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
   * Convert currency (placeholder implementation)
   */
  private convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    // TODO: Integrate with real currency conversion API
    // For now, return the amount as-is assuming same currency
    return amount;
  }

  /**
   * Clear price cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.priceCache = {};
  }

  /**
   * Get cache status for monitoring
   */
  getCacheStatus(): {
    gold: { cached: boolean; age?: number };
    silver: { cached: boolean; age?: number };
  } {
    const now = Date.now();

    return {
      gold: {
        cached: !!this.priceCache.gold,
        age: this.priceCache.gold ? now - this.priceCache.gold.timestamp : undefined
      },
      silver: {
        cached: !!this.priceCache.silver,
        age: this.priceCache.silver ? now - this.priceCache.silver.timestamp : undefined
      }
    };
  }
}

// Export singleton instance
export const nisabService = new NisabService();