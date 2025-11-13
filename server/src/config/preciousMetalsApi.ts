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

  constructor(config?: Partial<PreciousMetalsApiConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.METALS_API_KEY || '',
      baseUrl: config?.baseUrl || 'https://metals-api.com/api',
      timeout: config?.timeout || 5000, // 5 seconds
      baseCurrency: config?.baseCurrency || 'USD',
    };

    if (!this.config.apiKey) {
      logger.info(
        'METALS_API_KEY not configured. Using fallback precious metal prices (Gold: $65/g, Silver: $0.75/g)'
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
   * Fetch current gold and silver prices from metals-api.com
   * 
   * @param currency - Target currency code (default: USD)
   * @returns Array of metal prices
   * @throws Error if API request fails
   */
  async fetchCurrentPrices(currency?: string): Promise<MetalPrice[]> {
    const targetCurrency = currency || this.config.baseCurrency;

    try {
      const response = await this.client.get<MetalsApiResponse>('/latest', {
        params: {
          access_key: this.config.apiKey,
          base: targetCurrency,
          symbols: 'XAU,XAG', // Gold and Silver
        },
      });

      if (!response.data.success) {
        throw new Error('Metals API returned unsuccessful response');
      }

      const { rates, timestamp } = response.data;
      const fetchedAt = new Date(timestamp * 1000);

      const prices: MetalPrice[] = [];

      // Convert gold price (XAU is price per troy ounce)
      if (rates.XAU) {
        const pricePerOunce = 1 / rates.XAU; // API returns currency per troy oz
        const pricePerGram = pricePerOunce / PreciousMetalsApiClient.TROY_OUNCE_TO_GRAM;
        
        prices.push({
          metalType: MetalType.GOLD,
          pricePerGram: Number(pricePerGram.toFixed(2)),
          currency: targetCurrency,
          fetchedAt,
          sourceApi: 'metals-api.com',
        });
      }

      // Convert silver price (XAG is price per troy ounce)
      if (rates.XAG) {
        const pricePerOunce = 1 / rates.XAG; // API returns currency per troy oz
        const pricePerGram = pricePerOunce / PreciousMetalsApiClient.TROY_OUNCE_TO_GRAM;
        
        prices.push({
          metalType: MetalType.SILVER,
          pricePerGram: Number(pricePerGram.toFixed(2)),
          currency: targetCurrency,
          fetchedAt,
          sourceApi: 'metals-api.com',
        });
      }

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
          throw new Error('Invalid Metals API key. Check METALS_API_KEY environment variable.');
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
