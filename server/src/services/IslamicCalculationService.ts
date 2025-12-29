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
const ZAKAT_METHODS = {
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
    name: 'Shafi\'i School',
    description: 'Dual minimum approach with balanced methodology',
    nisabBasis: 'dual_minimum',
    businessAssetTreatment: 'categorized',
    debtDeduction: 'comprehensive',
    scholarlyBasis: ['Al-Majmu\' by Al-Nawawi', 'Shafi\'i classical texts'] as readonly string[],
    regions: ['Southeast Asia', 'East Africa', 'Middle East'] as readonly string[],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'] as ('lunar' | 'solar')[],
    customRules: false,
    suitableFor: ['Diverse communities', 'Balanced approaches'] as readonly string[],
    pros: ['Flexible methodology', 'Comprehensive coverage'] as readonly string[],
    cons: ['May require more detailed asset categorization'] as readonly string[],
    explanation: 'The Shafi\'i school employs a balanced approach considering both gold and silver nisab.'
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