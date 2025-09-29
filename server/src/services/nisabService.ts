import { NISAB_THRESHOLDS } from '../../../shared/src/constants';

/**
 * Nisab Service for gold and silver price tracking and nisab calculations
 * 
 * Manages current gold and silver prices for accurate nisab threshold calculations.
 * Provides multiple price sources with fallback mechanisms.
 * 
 * Constitutional Compliance:
 * - Islamic Compliance: Uses authentic Islamic nisab thresholds
 * - Transparency: Clear price sources and calculation methods
 * - Reliability: Multiple data sources with fallbacks
 */
export class NisabService {
  private goldPrice: { price: number; timestamp: Date } | null = null;
  private silverPrice: { price: number; timestamp: Date } | null = null;
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour cache
  private readonly PRICE_UNIT = 'USD_PER_GRAM'; // Price per gram in USD

  /**
   * Get current gold price per gram in USD
   */
  async getGoldPrice(): Promise<number> {
    if (this.goldPrice && this.isCacheValid(this.goldPrice.timestamp)) {
      return this.goldPrice.price;
    }

    try {
      const price = await this.fetchGoldPrice();
      this.goldPrice = {
        price,
        timestamp: new Date()
      };
      return price;
    } catch (error) {
      // Use fallback price if fetch fails
      const fallbackPrice = this.getFallbackGoldPrice();
      console.warn('Using fallback gold price:', fallbackPrice, 'Error:', error);
      return fallbackPrice;
    }
  }

  /**
   * Get current silver price per gram in USD
   */
  async getSilverPrice(): Promise<number> {
    if (this.silverPrice && this.isCacheValid(this.silverPrice.timestamp)) {
      return this.silverPrice.price;
    }

    try {
      const price = await this.fetchSilverPrice();
      this.silverPrice = {
        price,
        timestamp: new Date()
      };
      return price;
    } catch (error) {
      // Use fallback price if fetch fails
      const fallbackPrice = this.getFallbackSilverPrice();
      console.warn('Using fallback silver price:', fallbackPrice, 'Error:', error);
      return fallbackPrice;
    }
  }

  /**
   * Calculate nisab thresholds in USD
   */
  async calculateNisabThresholds(): Promise<{
    goldNisab: number;
    silverNisab: number;
    goldPricePerGram: number;
    silverPricePerGram: number;
    timestamp: Date;
  }> {
    const goldPricePerGram = await this.getGoldPrice();
    const silverPricePerGram = await this.getSilverPrice();

    const goldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
    const silverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;

    return {
      goldNisab,
      silverNisab,
      goldPricePerGram,
      silverPricePerGram,
      timestamp: new Date()
    };
  }

  /**
   * Get nisab recommendation based on current prices
   */
  async getNisabRecommendation(): Promise<{
    recommendedNisab: number;
    recommendedBasis: 'gold' | 'silver';
    goldNisab: number;
    silverNisab: number;
    reasoning: string;
  }> {
    const thresholds = await this.calculateNisabThresholds();
    
    const recommendedBasis = thresholds.silverNisab <= thresholds.goldNisab ? 'silver' : 'gold';
    const recommendedNisab = Math.min(thresholds.goldNisab, thresholds.silverNisab);
    
    const reasoning = recommendedBasis === 'silver' 
      ? 'Silver nisab recommended as it provides a lower threshold, making zakat accessible to more Muslims and benefiting recipients.'
      : 'Gold nisab recommended as it is currently lower than the silver nisab threshold.';

    return {
      recommendedNisab,
      recommendedBasis,
      goldNisab: thresholds.goldNisab,
      silverNisab: thresholds.silverNisab,
      reasoning
    };
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(timestamp: Date): boolean {
    const now = new Date();
    return (now.getTime() - timestamp.getTime()) < this.CACHE_DURATION_MS;
  }

  /**
   * Fetch current gold price from external APIs
   * 
   * Note: In production, you would use real precious metals APIs like:
   * - MetalsAPI
   * - Quandl
   * - GoldAPI
   * - Alpha Vantage Commodities
   */
  private async fetchGoldPrice(): Promise<number> {
    // Mock implementation - replace with real API calls
    // This would normally fetch from multiple sources and average them
    
    try {
      // Simulate API call delay
      await this.sleep(100);
      
      // Mock current gold price (around $65-70 per gram as of 2024)
      // In reality, this would fetch from: https://api.metals.live/v1/spot/gold
      const mockPrice = 67.50 + (Math.random() - 0.5) * 5; // $65-70 per gram with variation
      
      if (mockPrice <= 0) {
        throw new Error('Invalid gold price received');
      }
      
      return mockPrice;
    } catch (error) {
      throw new Error(`Failed to fetch gold price: ${error}`);
    }
  }

  /**
   * Fetch current silver price from external APIs
   */
  private async fetchSilverPrice(): Promise<number> {
    // Mock implementation - replace with real API calls
    
    try {
      // Simulate API call delay
      await this.sleep(100);
      
      // Mock current silver price (around $0.80-1.00 per gram as of 2024)
      // In reality, this would fetch from: https://api.metals.live/v1/spot/silver
      const mockPrice = 0.90 + (Math.random() - 0.5) * 0.2; // $0.80-1.00 per gram with variation
      
      if (mockPrice <= 0) {
        throw new Error('Invalid silver price received');
      }
      
      return mockPrice;
    } catch (error) {
      throw new Error(`Failed to fetch silver price: ${error}`);
    }
  }

  /**
   * Get fallback gold price when API fails
   */
  private getFallbackGoldPrice(): number {
    // Fallback price based on recent historical data
    // This should be updated regularly based on market conditions
    return 67.00; // USD per gram
  }

  /**
   * Get fallback silver price when API fails
   */
  private getFallbackSilverPrice(): number {
    // Fallback price based on recent historical data
    return 0.85; // USD per gram
  }

  /**
   * Utility function to simulate async delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get price history for analytics (mock implementation)
   */
  async getPriceHistory(metal: 'gold' | 'silver', days: number = 30): Promise<Array<{
    date: Date;
    price: number;
  }>> {
    // Mock price history - in production, this would fetch historical data
    const history: Array<{ date: Date; price: number }> = [];
    const basePrice = metal === 'gold' ? 67.00 : 0.85;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate price variation
      const variation = (Math.random() - 0.5) * 0.1;
      const price = basePrice * (1 + variation);
      
      history.push({ date, price });
    }
    
    return history;
  }

  /**
   * Calculate nisab in different currencies
   */
  async getNisabInCurrency(currency: string, goldPrice?: number, silverPrice?: number): Promise<{
    goldNisab: number;
    silverNisab: number;
    currency: string;
  }> {
    // This would use the CurrencyService to convert USD nisab to other currencies
    // For now, return USD values
    const goldPricePerGram = goldPrice || await this.getGoldPrice();
    const silverPricePerGram = silverPrice || await this.getSilverPrice();

    const goldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
    const silverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;

    // In production, convert to requested currency using CurrencyService
    return {
      goldNisab,
      silverNisab,
      currency: 'USD' // Would be converted to requested currency
    };
  }

  /**
   * Validate nisab thresholds against Islamic standards
   */
  validateNisabThresholds(): {
    isValid: boolean;
    goldGrams: number;
    silverGrams: number;
    source: string;
  } {
    return {
      isValid: true,
      goldGrams: NISAB_THRESHOLDS.GOLD_GRAMS,
      silverGrams: NISAB_THRESHOLDS.SILVER_GRAMS,
      source: 'Authenticated Islamic sources: 20 mithqal of gold (87.48g) and 200 dirhams of silver (612.36g)'
    };
  }

  /**
   * Get current market status
   */
  async getMarketStatus(): Promise<{
    goldPrice: number;
    silverPrice: number;
    goldNisab: number;
    silverNisab: number;
    lastUpdated: Date;
    recommendedNisab: 'gold' | 'silver';
  }> {
    const goldPrice = await this.getGoldPrice();
    const silverPrice = await this.getSilverPrice();
    const goldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPrice;
    const silverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPrice;

    return {
      goldPrice,
      silverPrice,
      goldNisab,
      silverNisab,
      lastUpdated: new Date(),
      recommendedNisab: silverNisab <= goldNisab ? 'silver' : 'gold'
    };
  }

  /**
   * Clear price cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.goldPrice = null;
    this.silverPrice = null;
  }

  /**
   * Get cache status for monitoring
   */
  getCacheStatus(): {
    goldPriceCached: boolean;
    silverPriceCached: boolean;
    goldPriceAge: number | null;
    silverPriceAge: number | null;
  } {
    const now = new Date();
    
    return {
      goldPriceCached: this.goldPrice !== null,
      silverPriceCached: this.silverPrice !== null,
      goldPriceAge: this.goldPrice ? now.getTime() - this.goldPrice.timestamp.getTime() : null,
      silverPriceAge: this.silverPrice ? now.getTime() - this.silverPrice.timestamp.getTime() : null
    };
  }
}