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
 * Simplified Islamic Calculation Service for API endpoints
 * Provides basic Zakat calculation functionality without complex dependencies
 */
export class SimpleIslamicCalculationService {
  
  /**
   * Calculate Zakat for given assets using specified methodology
   */
  static async calculateZakat(
    assets: Array<{ id: string; type: string; value: number; currency: string; description?: string }>,
    methodology: string,
    nisabThreshold: number
  ): Promise<{
    totalValue: number;
    totalZakat: number;
    assetCalculations: Array<{
      assetId: string;
      assetValue: number;
      zakatableValue: number;
      zakatAmount: number;
    }>;
  }> {
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    
    // Only calculate Zakat if total value meets nisab threshold
    if (totalValue < nisabThreshold) {
      return {
        totalValue,
        totalZakat: 0,
        assetCalculations: assets.map(asset => ({
          assetId: asset.id,
          assetValue: asset.value,
          zakatableValue: 0,
          zakatAmount: 0
        }))
      };
    }
    
    // Calculate Zakat at 2.5% for zakatable assets
    const zakatRate = 0.025;
    const assetCalculations = assets.map(asset => {
      const isZakatable = this.isAssetZakatable(asset.type);
      const zakatableValue = isZakatable ? asset.value : 0;
      const zakatAmount = zakatableValue * zakatRate;
      
      return {
        assetId: asset.id,
        assetValue: asset.value,
        zakatableValue,
        zakatAmount
      };
    });
    
    const totalZakat = assetCalculations.reduce((sum, calc) => sum + calc.zakatAmount, 0);
    
    return {
      totalValue,
      totalZakat,
      assetCalculations
    };
  }
  
  /**
   * Get available calculation methodologies
   */
  static getAvailableMethodologies(): Array<{
    id: string;
    name: string;
    description: string;
    nisabBasis: string;
  }> {
    return [
      {
        id: 'standard',
        name: 'Standard Method (AAOIFI)',
        description: 'Internationally recognized dual nisab method',
        nisabBasis: 'dual_minimum'
      },
      {
        id: 'hanafi',
        name: 'Hanafi School',
        description: 'Traditional silver-based nisab calculation',
        nisabBasis: 'silver'
      },
      {
        id: 'shafii',
        name: 'Shafi\'i School',
        description: 'Dual minimum approach with balanced methodology',
        nisabBasis: 'dual_minimum'
      },
      {
        id: 'maliki',
        name: 'Maliki School',
        description: 'Regional adaptation with economic considerations',
        nisabBasis: 'contextual'
      },
      {
        id: 'hanbali',
        name: 'Hanbali School',
        description: 'Gold-based nisab with conservative approach',
        nisabBasis: 'gold'
      }
    ];
  }
  
  /**
   * Get methodology recommendation based on user context
   */
  static getMethodologyRecommendation(userContext?: {
    region?: string;
    schoolOfThought?: string;
    economicSituation?: string;
  }): string {
    if (!userContext) return 'standard';
    
    // Simple recommendation logic
    if (userContext.schoolOfThought) {
      return userContext.schoolOfThought.toLowerCase();
    }
    
    if (userContext.region) {
      const region = userContext.region.toLowerCase();
      if (region.includes('south asia') || region.includes('turkey')) {
        return 'hanafi';
      }
      if (region.includes('gulf') || region.includes('saudi')) {
        return 'hanbali';
      }
    }
    
    return 'standard';
  }
  
  /**
   * Check if asset type is zakatable
   */
  private static isAssetZakatable(assetType: string): boolean {
    const zakatableTypes = ['cash', 'gold', 'silver', 'crypto', 'business', 'investment'];
    return zakatableTypes.includes(assetType.toLowerCase());
  }
}