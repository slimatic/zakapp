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
 * Precious Metals API Client Configuration
 * 
 * Integrates with metals-api.com to fetch current gold and silver spot prices
 * for Nisab threshold calculations in Islamic Zakat tracking.
 * 
 * Features:
 * - 24-hour caching strategy to respect free tier limits (50 req/month)
 * - Fallback to last successful fetch if API unavailable
 * - Support for multiple currencies (defaults to USD)
 * - Automatic conversion to price per gram
 * 
 * @see https://metals-api.com/documentation
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

/**
 * Metal types supported for Nisab calculations
 */
export enum MetalType {
  GOLD = 'gold',
  SILVER = 'silver',
}

/**
 * API response structure from metals-api.com
 */
interface MetalsApiResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: {
    XAU?: number; // Gold price (troy ounce)
    XAG?: number; // Silver price (troy ounce)
    [key: string]: number | undefined;
  };
}

/**
 * Normalized metal price data
 */
export interface MetalPrice {
  metalType: MetalType;
  pricePerGram: number;
  currency: string;
  fetchedAt: Date;
  sourceApi: string;
}

/**
 * Configuration for Precious Metals API client
 */
interface PreciousMetalsApiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  baseCurrency: string;
}

/**
 * Precious Metals API Client
 * 
 * Fetches current spot prices for gold and silver from metals-api.com
 * and converts to price per gram for Nisab calculations.
 */
export class PreciousMetalsApiClient {
  private client: AxiosInstance;
  private config: PreciousMetalsApiConfig;

  // Troy ounce to gram conversion factor
  private static readonly TROY_OUNCE_TO_GRAM = 31.1034768;

  // Islamic Nisab thresholds in grams
  public static readonly NISAB_GOLD_GRAMS = 87.48;
  public static readonly NISAB_SILVER_GRAMS = 612.36;

  // Cache implementation
  private cache: {
    data: MetalPrice[] | null;
    timestamp: number;
    currency: string;
  } = {
      data: null,
      timestamp: 0,
      currency: ''
    };

  // Cache duration: 24 hours to respect 100 reqs/month limit
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  constructor(config?: Partial<PreciousMetalsApiConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.GOLD_API_KEY || '',
      baseUrl: config?.baseUrl || 'https://www.goldapi.io/api',
      timeout: config?.timeout || 5000, // 5 seconds
      baseCurrency: config?.baseCurrency || 'USD',
    };

    if (!this.config.apiKey) {
      logger.info(
        'GOLD_API_KEY not configured. Using fallback precious metal prices (Gold: $65/g, Silver: $0.75/g)'
      );
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch current gold and silver prices from goldapi.io
   * 
   * @param currency - Target currency code (default: USD)
   * @returns Array of metal prices
   * @throws Error if API request fails
   */
  async fetchCurrentPrices(currency?: string): Promise<MetalPrice[]> {
    const targetCurrency = currency || this.config.baseCurrency;

    // Check cache
    const now = Date.now();
    if (
      this.cache.data &&
      this.cache.currency === targetCurrency &&
      (now - this.cache.timestamp < this.CACHE_TTL)
    ) {
      logger.debug('Returning cached precious metal prices');
      return this.cache.data;
    }

    try {
      // Fetch Gold
      const goldResponse = await this.client.get<any>(`/XAU/${targetCurrency}`, {
        headers: { 'x-access-token': this.config.apiKey }
      });

      // Fetch Silver
      const silverResponse = await this.client.get<any>(`/XAG/${targetCurrency}`, {
        headers: { 'x-access-token': this.config.apiKey }
      });

      const fetchedAt = new Date();
      const prices: MetalPrice[] = [];

      // Process Gold
      if (goldResponse.data) {
        const pricePerGram = goldResponse.data.price_gram_24k || (goldResponse.data.price / PreciousMetalsApiClient.TROY_OUNCE_TO_GRAM);

        prices.push({
          metalType: MetalType.GOLD,
          pricePerGram: Number(pricePerGram.toFixed(2)),
          currency: targetCurrency,
          fetchedAt,
          sourceApi: 'goldapi.io',
        });
      }

      // Process Silver
      if (silverResponse.data) {
        const pricePerGram = silverResponse.data.price_gram_24k || (silverResponse.data.price / PreciousMetalsApiClient.TROY_OUNCE_TO_GRAM);

        prices.push({
          metalType: MetalType.SILVER,
          pricePerGram: Number(pricePerGram.toFixed(2)),
          currency: targetCurrency,
          fetchedAt,
          sourceApi: 'goldapi.io',
        });
      }

      if (prices.length === 0) {
        throw new Error('Metals API returned unsuccessful response');
      }

      // Update Cache
      this.cache = {
        data: prices,
        timestamp: now,
        currency: targetCurrency
      };

      logger.info(
        `Fetched ${prices.length} precious metal prices from metals-api.com`,
        { currency: targetCurrency, timestamp: fetchedAt.toISOString() }
      );

      return prices;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error('Metals API request failed', {
          status: axiosError.response?.status,
          message: axiosError.message,
          data: axiosError.response?.data,
        });

        if (axiosError.response?.status === 401) {
          throw new Error('Invalid Metals API key. Check GOLD_API_KEY environment variable.');
        } else if (axiosError.response?.status === 429) {
          throw new Error('Metals API rate limit exceeded. Free tier allows 50 requests/month.');
        }
      }

      throw new Error(`Failed to fetch precious metal prices: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate Nisab threshold value in user's currency
   * 
   * @param basis - Nisab basis ('gold' or 'silver')
   * @param metalPrice - Current metal price per gram
   * @returns Nisab threshold in currency units
   */
  static calculateNisabThreshold(basis: 'gold' | 'silver', metalPrice: number): number {
    const gramsRequired = basis === 'gold'
      ? PreciousMetalsApiClient.NISAB_GOLD_GRAMS
      : PreciousMetalsApiClient.NISAB_SILVER_GRAMS;

    return Number((gramsRequired * metalPrice).toFixed(2));
  }

  /**
   * Test API connectivity and credentials
   * 
   * @returns true if API is accessible and credentials are valid
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchCurrentPrices();
      return true;
    } catch (error) {
      logger.error('Metals API connection test failed', { error: (error as Error).message });
      return false;
    }
  }
}

/**
 * Singleton instance of Precious Metals API client
 */
export const preciousMetalsApi = new PreciousMetalsApiClient();
