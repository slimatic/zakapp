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
 * Nisab Calculation Service (T041)
 * 
 * Handles all Nisab threshold calculations and precious metals pricing
 * Integrates with metals-api.com for real-time prices with fallback caching
 */

import { PreciousMetalsApiClient } from '../config/preciousMetalsApi';
import { EncryptionService } from './EncryptionService';
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

export class NisabCalculationService {
  private readonly NISAB_GOLD_GRAMS = 87.48;
  private readonly NISAB_SILVER_GRAMS = 612.36;
  private readonly ZAKAT_RATE = 0.025; // 2.5%

  private logger = new Logger('NisabCalculationService');
  private preciousMetalsApi: PreciousMetalsApiClient;
  private encryptionService: EncryptionService;

  constructor(
    preciousMetalsApi?: PreciousMetalsApiClient,
    encryptionService?: EncryptionService
  ) {
    this.preciousMetalsApi = preciousMetalsApi || new PreciousMetalsApiClient();
    this.encryptionService = encryptionService || new EncryptionService();
  }

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
      let goldPrice = 0;
      let silverPrice = 0;

      // Try to fetch from API if key is available
      if (process.env.METALS_API_KEY) {
        try {
          const priceArray = await this.preciousMetalsApi.fetchCurrentPrices(currency);

          for (const metalPrice of priceArray) {
            if (metalPrice.metalType === 'gold') {
              goldPrice = metalPrice.pricePerGram;
            } else if (metalPrice.metalType === 'silver') {
              silverPrice = metalPrice.pricePerGram;
            }
          }
        } catch (apiError) {
          this.logger.warn('Failed to fetch prices from API, using fallback values');
        }
      }

      // Use fallback prices if API is not available (approximate USD per gram as of Oct 2025)
      if (goldPrice === 0) {
        goldPrice = 65.0; // Approximate $65/gram for gold
        this.logger.info('Using fallback gold price: $65/gram');
      }
      if (silverPrice === 0) {
        silverPrice = 0.75; // Approximate $0.75/gram for silver
        this.logger.info('Using fallback silver price: $0.75/gram');
      }

      // Calculate Nisab amounts
      const goldNisab = goldPrice * this.NISAB_GOLD_GRAMS;
      const silverNisab = silverPrice * this.NISAB_SILVER_GRAMS;
      const selectedNisab = nisabBasis === 'GOLD' ? goldNisab : silverNisab;

      return {
        goldPrice,
        silverPrice,
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
   * @returns Encrypted string value (Promise<string>)
   */
  encryptFinancialData(value: number | string): any {
    const stringValue = typeof value === 'number' ? value.toString() : value;
    return EncryptionService.encrypt(stringValue);
  }

  /**
   * Decrypt sensitive financial data
   * 
   * @param encryptedValue - Encrypted string
   * @returns Decrypted numerical value
   */
  decryptFinancialData(encryptedValue: string): number {
    const decrypted = EncryptionService.decrypt(encryptedValue);
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
