/**
 * Nisab Calculation Service (T041)
 * 
 * Handles all Nisab threshold calculations and precious metals pricing
 * Integrates with metals-api.com for real-time prices with fallback caching
 */

import { injectable } from 'tsyringe';
import { PreciousMetalsApiClient } from '../config/preciousMetalsApi';
import { EncryptionService } from './encryption-service';
import { Logger } from '../utils/logger';

export interface NisabThresholdData {
  goldPrice: number; // USD per gram
  silverPrice: number; // USD per gram
  goldNisab: number; // 87.48g → USD
  silverNisab: number; // 612.36g → USD
  selectedNisab: number; // Based on nisabBasis
  basisUsed: 'GOLD' | 'SILVER';
  currency: string;
  fetchedAt: Date;
}

@injectable()
export class NisabCalculationService {
  private readonly NISAB_GOLD_GRAMS = 87.48;
  private readonly NISAB_SILVER_GRAMS = 612.36;
  private readonly ZAKAT_RATE = 0.025; // 2.5%

  private logger = new Logger('NisabCalculationService');

  constructor(
    private preciousMetalsApi: PreciousMetalsApiClient,
    private encryptionService: EncryptionService
  ) {}

  /**
   * Calculate Nisab thresholds based on current precious metals prices
   * Returns both gold and silver Nisab amounts for user reference
   * 
   * @param currency - Currency for calculation (e.g., 'USD', 'EUR')
   * @param nisabBasis - Whether to use gold or silver for Zakat calculation
   * @returns Nisab threshold data with prices and calculated values
   * @throws Error if price fetch fails and no cache available
   */
  async calculateNisabThreshold(
    currency: string = 'USD',
    nisabBasis: 'GOLD' | 'SILVER' = 'GOLD'
  ): Promise<NisabThresholdData> {
    try {
      // Fetch current prices from metals API
      const prices = await this.preciousMetalsApi.fetchCurrentPrices(currency);

      // Calculate Nisab amounts
      const goldNisab = prices.goldPrice * this.NISAB_GOLD_GRAMS;
      const silverNisab = prices.silverPrice * this.NISAB_SILVER_GRAMS;
      const selectedNisab = nisabBasis === 'GOLD' ? goldNisab : silverNisab;

      return {
        goldPrice: prices.goldPrice,
        silverPrice: prices.silverPrice,
        goldNisab: Math.round(goldNisab * 100) / 100,
        silverNisab: Math.round(silverNisab * 100) / 100,
        selectedNisab: Math.round(selectedNisab * 100) / 100,
        basisUsed: nisabBasis,
        currency,
        fetchedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to calculate Nisab threshold', error);
      throw new Error(`Nisab calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate Nisab from a specific metal price and weight
   * Used for historical records or manual calculations
   * 
   * @param metalType - 'gold' or 'silver'
   * @param pricePerGram - Price in specified currency
   * @returns Nisab threshold amount
   */
  calculateNisabFromPrice(metalType: 'gold' | 'silver', pricePerGram: number): number {
    const nisabGrams = metalType === 'gold' ? this.NISAB_GOLD_GRAMS : this.NISAB_SILVER_GRAMS;
    const nisab = pricePerGram * nisabGrams;
    return Math.round(nisab * 100) / 100;
  }

  /**
   * Calculate Zakat amount (2.5%) from zakatableWealth
   * 
   * @param zakatableWealth - Total wealth eligible for Zakat
   * @returns Zakat amount (2.5% of wealth)
   */
  calculateZakat(zakatableWealth: number): number {
    const zakat = zakatableWealth * this.ZAKAT_RATE;
    return Math.round(zakat * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Verify wealth is above Nisab threshold
   * 
   * @param wealth - User's total zakatable wealth
   * @param nisabThreshold - Current Nisab threshold
   * @returns true if wealth >= nisabThreshold
   */
  isAboveNisab(wealth: number, nisabThreshold: number): boolean {
    return wealth >= nisabThreshold;
  }

  /**
   * Calculate days remaining in Hawl period
   * 
   * @param hawlCompletionDate - Date when Hawl completes
   * @returns Days remaining (negative if Hawl has ended)
   */
  calculateDaysRemaining(hawlCompletionDate: Date): number {
    const now = new Date();
    const timeDiff = hawlCompletionDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Encrypt sensitive financial data
   * 
   * @param value - Numerical value to encrypt
   * @returns Encrypted string value
   */
  encryptFinancialData(value: number | string): string {
    const stringValue = typeof value === 'number' ? value.toString() : value;
    return this.encryptionService.encrypt(stringValue);
  }

  /**
   * Decrypt sensitive financial data
   * 
   * @param encryptedValue - Encrypted string
   * @returns Decrypted numerical value
   */
  decryptFinancialData(encryptedValue: string): number {
    const decrypted = this.encryptionService.decrypt(encryptedValue);
    return parseFloat(decrypted);
  }

  /**
   * Get Nisab calculation constants
   */
  getConstants() {
    return {
      nisabGoldGrams: this.NISAB_GOLD_GRAMS,
      nisabSilverGrams: this.NISAB_SILVER_GRAMS,
      zakatPercentage: this.ZAKAT_RATE * 100, // 2.5
    };
  }
}
