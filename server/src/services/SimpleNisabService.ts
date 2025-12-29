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
 * Simplified Nisab Service for API endpoints
 * Provides basic nisab calculation without complex dependencies
 */
export class SimpleNisabService {
  
  /**
   * Calculate nisab threshold based on methodology
   */
  static async calculateNisabThreshold(
    methodology: string,
    source: 'gold' | 'silver' = 'gold'
  ): Promise<{
    effectiveNisab: number;
    goldNisab: number;
    silverNisab: number;
    nisabBasis: string;
    calculationMethod: string;
  }> {
    // Current approximate prices (in production, fetch from real API)
    const goldPricePerGram = 65; // USD
    const silverPricePerGram = 0.85; // USD
    
    // Nisab amounts in grams
    const goldGrams = 87.48; // ~3 oz
    const silverGrams = 612.36; // ~21 oz
    
    const goldNisab = goldGrams * goldPricePerGram;
    const silverNisab = silverGrams * silverPricePerGram;
    
    let effectiveNisab: number;
    let nisabBasis: string;
    
    switch (methodology.toLowerCase()) {
      case 'hanafi':
        effectiveNisab = silverNisab;
        nisabBasis = 'silver';
        break;
      case 'hanbali':
        effectiveNisab = goldNisab;
        nisabBasis = 'gold';
        break;
      case 'shafii':
      case 'maliki':
      case 'standard':
      default:
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = goldNisab < silverNisab ? 'gold' : 'silver';
        break;
    }
    
    return {
      effectiveNisab,
      goldNisab,
      silverNisab,
      nisabBasis,
      calculationMethod: methodology
    };
  }
  
  /**
   * Get educational content about nisab
   */
  static getEducationalContent(): {
    explanation: string;
    goldBased: string;
    silverBased: string;
    dualMinimum: string;
  } {
    return {
      explanation: 'Nisab is the minimum amount of wealth one must have before being obligated to pay Zakat.',
      goldBased: 'Gold-based nisab uses approximately 87.48 grams of gold as the threshold.',
      silverBased: 'Silver-based nisab uses approximately 612.36 grams of silver as the threshold.',
      dualMinimum: 'Dual minimum approach uses the lower of gold or silver-based calculations to ensure broader Zakat eligibility.'
    };
  }
}