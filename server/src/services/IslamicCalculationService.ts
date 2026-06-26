/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

import { 
  Asset, 
  ZakatCalculationRequest, 
  ZakatCalculationResult,
  AssetCalculation,
  NisabInfo,
  MethodologyInfo
} from '@zakapp/shared';

// Additional types needed for internal calculations
interface ZakatAsset extends Asset {
  zakatableAmount: number;
  zakatDue: number;
}

interface CalculationBreakdown {
  method: string;
  totalAssets: number;
  totalZakatableAmount: number;
  totalZakat: number;
  nisabThreshold: number;
  aboveNisab: boolean;
  assetCalculations: AssetCalculation[];
  calculationDate: string;
  nisabCalculation?: {
    goldNisab: number;
    silverNisab: number;
    effectiveNisab: number;
    basis: string;
  };
}

interface ZakatCalculation {
  calculationId: string;
  date: string;
  method: string;
  totalAmount: number;
  nisab: NisabInfo;
  assets: ZakatAsset[];
  breakdown: CalculationBreakdown;
}

/**
 * Zakat calculation methodologies with scholarly sources
 */
export const ZAKAT_METHODS = {
  standard: {
    id: 'standard',
    name: 'Standard Method (AAOIFI)',
    description: 'Internationally recognized dual nisab method',
    nisabBasis: 'dual_minimum',
    businessAssetTreatment: 'comprehensive',
    debtDeduction: 'comprehensive',
    scholarlyBasis: ['AAOIFI FAS 9', 'Contemporary consensus'] as readonly string[],
    regions: ['Global', 'Modern contexts'] as readonly string[],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'] as ('lunar' | 'solar')[],
    customRules: false,
    suitableFor: ['Modern Muslims', 'International communities'] as readonly string[],
    pros: ['Globally accepted', 'Balanced approach'] as readonly string[],
    cons: ['May be complex for traditional contexts'] as readonly string[],
    explanation: 'The Standard method represents a modern consensus approach developed for contemporary global Muslim communities.'
  },
  hanafi: {
    id: 'hanafi',
    name: 'Hanafi School',
    description: 'Traditional silver-based nisab calculation',
    nisabBasis: 'silver',
    businessAssetTreatment: 'market_value',
    debtDeduction: 'conservative',
    scholarlyBasis: ['Al-Hidayah by Al-Marghinani', 'Classical Hanafi texts'] as readonly string[],
    regions: ['Middle East', 'South Asia', 'Turkey'] as readonly string[],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'] as ('lunar' | 'solar')[],
    customRules: false,
    suitableFor: ['Traditional communities', 'Silver-based economies'] as readonly string[],
    pros: ['Lower nisab threshold', 'Established tradition'] as readonly string[],
    cons: ['May be higher burden in gold economies'] as readonly string[],
    explanation: 'The Hanafi school uses silver-based nisab, which often results in a lower threshold.'
  },
  shafii: {
    id: 'shafii',
    name: "Shafi'i School",
    description: 'Dual minimum approach with balanced methodology',
    nisabBasis: 'dual_minimum',
    businessAssetTreatment: 'categorized',
    debtDeduction: 'comprehensive',
    scholarlyBasis: ["Al-Majmu' by Al-Nawawi", "Shafi'i classical texts"] as readonly string[],
    regions: ['Southeast Asia', 'East Africa', 'Middle East'] as readonly string[],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'] as ('lunar' | 'solar')[],
    customRules: false,
    suitableFor: ['Diverse communities', 'Balanced approaches'] as readonly string[],
    pros: ['Flexible methodology', 'Comprehensive coverage'] as readonly string[],
    cons: ['May require more detailed asset categorization'] as readonly string[],
    explanation: "The Shafi'i school employs a balanced approach considering both gold and silver nisab."
  },
  maliki: {
    id: 'maliki',
    name: 'Maliki School',
    description: 'Regional economic factors in nisab calculations',
    nisabBasis: 'dual_minimum',
    businessAssetTreatment: 'comprehensive',
    debtDeduction: 'immediate',
    scholarlyBasis: ['Al-Mudawwana by Sahnun', 'Maliki principles'] as readonly string[],
    regions: ['North Africa', 'West Africa', 'Spain'] as readonly string[],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'] as ('lunar' | 'solar')[],
    customRules: true,
    suitableFor: ['Regional variations', 'Economic diversity'] as readonly string[],
    pros: ['Considers local economic conditions', 'Potentially lower nisab'] as readonly string[],
    cons: ['Less global uniformity', 'Possible higher burden in affluent regions'] as readonly string[],
    explanation: 'The Maliki school adapts the nisab based on regional economic conditions, using a dual minimum approach.'
  }
} as const satisfies Record<string, MethodologyInfo>;

// Nisab constants (authentic hadith measurements)
const GOLD_NISAB_GRAMS = 85;     // 85 grams of gold (Mithqal standard)
const SILVER_NISAB_GRAMS = 595;  // 595 grams of silver (200 dirhams)
const LUNAR_YEAR_DAYS = 354;     // Approximate lunar year in days
const ZAKAT_RATE = 0.025;       // 2.5% (1/40)

// Non-zakatable asset categories for personal use
const NON_ZAKATABLE_CATEGORIES = new Set(['PROPERTY', 'PERSONAL_USE']);

// Cache for nisab calculations
const nisabCache = new Map<string, number>();

/**
 * IslamicCalculationService — Core zakat calculation engine
 * Implements calculation methods across Islamic school methodologies
 * with scholarly backing and precision arithmetic.
 */
export class IslamicCalculationService {
  private nisabCache = new Map<string, number>();

  /**
   * Calculate zakat amount for a given asset value and category.
   * Personal-use property is exempt; all other categories use 2.5%.
   */
  calculateZakatAmount(amount: number, category: string): number {
    if (NON_ZAKATABLE_CATEGORIES.has(category)) return 0;
    return Math.max(0, amount) * ZAKAT_RATE;
  }

  /**
   * Calculate zakat across multiple asset categories with methodology support.
   */
  calculateZakat(
    assets: Record<string, number>,
    methodology: string
  ): {
    methodology: string;
    nisabThreshold: number;
    totalZakatable: number;
    zakatDue: number;
    details: Record<string, unknown>;
  } {
    // Sum all valid (positive) assets
    const totalZakatable = Object.entries(assets)
      .filter(([key, val]) => val > 0 && !NON_ZAKATABLE_CATEGORIES.has(key.toUpperCase()))
      .reduce((sum, [, val]) => sum + val, 0);

    // Calculate nisab based on methodology
    const nisabThreshold = this.getMethodologyNisab(methodology);

    const zakatDue = totalZakatable >= nisabThreshold ? totalZakatable * ZAKAT_RATE : 0;

    return {
      methodology,
      nisabThreshold,
      totalZakatable,
      zakatDue,
      details: {
        aboveNisab: totalZakatable >= nisabThreshold,
        rate: ZAKAT_RATE,
        methodologyConfig: ZAKAT_METHODS[methodology as keyof typeof ZAKAT_METHODS],
      }
    };
  }

  /**
   * Check if a lunar year (354 days) has passed between two dates.
   */
  hasLunarYearPassed(acquisitionDate: Date, calculationDate: Date): boolean {
    const diffMs = calculationDate.getTime() - acquisitionDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= LUNAR_YEAR_DAYS;
  }

  /**
   * Convert a Gregorian year length to the lunar year equivalent.
   */
  calculateLunarYearAdjustment(gregorianYear: number): number {
    return LUNAR_YEAR_DAYS;
  }

  /**
   * Calculate zakat for a complex portfolio with nested asset structures.
   */
  calculateComplexPortfolio(
    complexAssets: Record<string, Record<string, number>>,
    methodology: string
  ): {
    breakdown: Record<string, number>;
    totalZakatable: number;
    zakatDue: number;
  } {
    const breakdown: Record<string, number> = {};
    let totalZakatable = 0;

    for (const [category, items] of Object.entries(complexAssets)) {
      let categoryTotal = 0;
      for (const [, value] of Object.entries(items)) {
        categoryTotal += Math.max(0, value);
      }
      breakdown[category] = categoryTotal;
      totalZakatable += categoryTotal;
    }

    return {
      breakdown,
      totalZakatable,
      zakatDue: totalZakatable * ZAKAT_RATE,
    };
  }

  /**
   * Calculate zakatable portion of business assets.
   * Only inventory and receivables are zakatable; equipment, buildings, vehicles are not.
   */
  calculateBusinessZakat(businessAssets: Record<string, number>): number {
    const NON_BUSINESS_ZAKATABLE = new Set(['equipment', 'buildings', 'vehicles', 'property']);
    return Object.entries(businessAssets)
      .filter(([key, val]) => val > 0 && !NON_BUSINESS_ZAKATABLE.has(key.toLowerCase()))
      .reduce((sum, [, val]) => sum + val, 0);
  }

  /**
   * Calculate zakat with debt deductions.
   * Standard approach: deduct short-term debts only.
   */
  calculateZakatWithDebts(
    assets: Record<string, number>,
    debts: Record<string, number>,
    methodology: string
  ): {
    deductibleDebts: number;
    netZakatable: number;
    zakatDue: number;
  } {
    const totalAssets = Object.values(assets).reduce((sum, val) => sum + Math.max(0, val), 0);
    
    // Long-term secured debts (mortgage) are typically not deductible
    const NON_DEDUCTIBLE_DEBTS = new Set(['mortgage']);
    const deductibleDebts = Object.entries(debts)
      .filter(([key, val]) => val > 0 && !NON_DEDUCTIBLE_DEBTS.has(key.toLowerCase()))
      .reduce((sum, [, val]) => sum + val, 0);

    const netZakatable = Math.max(0, totalAssets - deductibleDebts);
    const zakatDue = netZakatable * ZAKAT_RATE;

    return { deductibleDebts, netZakatable, zakatDue };
  }

  /**
   * Calculate nisab threshold for a given metal type and current price.
   */
  calculateNisabThreshold(metal: 'gold' | 'silver', pricePerGram: number): number {
    const cacheKey = `${metal}:${pricePerGram}`;
    const cached = this.nisabCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const grams = metal === 'gold' ? GOLD_NISAB_GRAMS : SILVER_NISAB_GRAMS;
    const nisab = grams * pricePerGram;
    this.nisabCache.set(cacheKey, nisab);
    return nisab;
  }

  /**
   * Get the effective cash nisab threshold (lower of gold and silver).
   */
  getCashNisabThreshold(goldPricePerGram: number, silverPricePerGram: number): number {
    const goldNisab = this.calculateNisabThreshold('gold', goldPricePerGram);
    const silverNisab = this.calculateNisabThreshold('silver', silverPricePerGram);
    return Math.min(goldNisab, silverNisab);
  }

  /**
   * Get nisab threshold based on methodology's preferred basis.
   */
  private getMethodologyNisab(methodology: string): number {
    // Default nisab values (approximate USD) when no price data available
    const methodConfig = ZAKAT_METHODS[methodology as keyof typeof ZAKAT_METHODS];
    if (methodConfig?.nisabBasis === 'silver') {
      return 476; // ~595g * $0.8/g (approximate silver nisab)
    }
    return 5100; // ~85g * $60/g (approximate gold nisab, dual_minimum uses gold floor)
  }
}
