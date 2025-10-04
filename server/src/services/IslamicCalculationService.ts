/**
 * Local type definitions to avoid cross-project imports
 */
interface Asset {
  id: string;
  type: string;
  value: number;
  currency: string;
  description?: string;
}

interface ZakatCalculationRequest {
  methodology: string;
  assets: Asset[];
  nisabThreshold: number;
  calculationDate?: string;
}

interface AssetCalculation {
  assetId: string;
  assetValue: number;
  zakatableValue: number;
  zakatAmount: number;
  reasoning: string;
}

interface ZakatCalculationResult {
  totalValue: number;
  totalZakat: number;
  assetCalculations: AssetCalculation[];
  methodology: string;
  calculationDate: string;
}

interface MethodologyInfo {
  id: string;
  name: string;
  description: string;
  nisabBasis: string;
  scholarlyBasis: string[];
  explanation: string;
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
    scholarlyBasis: ['AAOIFI FAS 9', 'Contemporary consensus'],
    explanation: 'The Standard method represents a modern consensus approach developed for contemporary global Muslim communities.'
  },
  hanafi: {
    id: 'hanafi',
    name: 'Hanafi School',
    description: 'Traditional silver-based nisab calculation',
    nisabBasis: 'silver',
    scholarlyBasis: ['Al-Hidayah by Al-Marghinani', 'Classical Hanafi texts'],
    explanation: 'The Hanafi school uses silver-based nisab, which often results in a lower threshold.'
  },
  shafii: {
    id: 'shafii',
    name: 'Shafi\'i School',
    description: 'Dual minimum approach with balanced methodology',
    nisabBasis: 'dual_minimum',
    scholarlyBasis: ['Al-Majmu\' by Al-Nawawi', 'Shafi\'i jurisprudence'],
    explanation: 'The Shafi\'i school balances different scholarly opinions with a practical approach.'
  },
  maliki: {
    id: 'maliki',
    name: 'Maliki School',
    description: 'Regional adaptation with economic considerations',
    nisabBasis: 'contextual',
    scholarlyBasis: ['Al-Mudawwana by Sahnun', 'Maliki principles'],
    explanation: 'The Maliki school considers regional economic factors in nisab calculations.'
  },
  hanbali: {
    id: 'hanbali',
    name: 'Hanbali School',
    description: 'Gold-based nisab with conservative approach',
    nisabBasis: 'gold',
    scholarlyBasis: ['Al-Mughni by Ibn Qudamah', 'Hanbali classical texts'],
    explanation: 'The Hanbali school traditionally uses gold-based nisab calculations.'
  }
} as const;

/**
 * Islamic Calculation Service with Multiple Methodologies
 * Implements comprehensive Zakat calculation following various Islamic schools of thought
 * 
 * Follows ZakApp constitutional principles:
 * - Islamic Compliance: Accurate calculations per scholarly methodologies
 * - Transparency: Educational content and source citations
 * - User-Centric Design: Multiple methodology options with clear explanations
 */
export class IslamicCalculationService {

  /**
   * Calculate Zakat according to the specified methodology
   * 
   * @param request - Zakat calculation request with method and asset selection
   * @param assets - Array of user assets to include in calculation
   * @returns Complete Zakat calculation result with breakdown
   * @throws {Error} When calculation fails or invalid parameters provided
   */
  async calculateZakat(
    request: ZakatCalculationRequest, 
    assets: Asset[]
  ): Promise<ZakatCalculationResult> {
    try {
      // Validate input parameters
      this.validateCalculationRequest(request, assets);

      // Get methodology information
      const methodology = this.getMethodologyInfo(request.method);
      
      // Filter assets based on request
      const includedAssets = assets.filter(asset => 
        request.includeAssets.includes(asset.assetId)
      );

      // Calculate nisab threshold
      const nisabInfo = this.calculateNisabThreshold(methodology, 'USD');

      // Convert assets to ZakatAsset format
      const zakatAssets = this.convertToZakatAssets(includedAssets, methodology, nisabInfo);

      // Perform asset-wise Zakat calculations
      const assetCalculations = this.calculateAssetWiseZakat(zakatAssets, methodology);

      // Calculate total Zakat amount
      const totalZakat = assetCalculations.reduce((sum, calc) => sum + calc.zakatDue, 0);

      // Generate detailed breakdown
      const breakdown = this.generateCalculationBreakdown(
        assetCalculations,
        methodology,
        nisabInfo,
        totalZakat
      );

      // Create ZakatCalculation result
      const calculation: ZakatCalculation = {
        calculationId: this.generateCalculationId(),
        date: request.calculationDate,
        method: methodology.id,
        totalAmount: totalZakat,
        nisab: nisabInfo,
        assets: zakatAssets,
        breakdown
      };

      // Create complete result
      const result: ZakatCalculationResult = {
        result: calculation,
        methodology,
        breakdown,
        assumptions: this.generateAssumptions(methodology),
        sources: [...methodology.scholarlyBasis], // Convert readonly array to mutable
        alternatives: [] // TODO: Implement alternative calculations
      };

      return result;
    } catch (error) {
      throw new Error(`Zakat calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available Islamic calculation methodologies
   * 
   * @returns Array of methodology information with details
   */
  getAvailableMethodologies(): MethodologyInfo[] {
    return Object.values(ZAKAT_METHODS).map(method => ({
      id: method.id,
      name: method.name,
      description: method.description,
      nisabBasis: method.nisabBasis,
      businessAssetTreatment: method.businessAssetTreatment,
      debtDeduction: method.debtDeduction,
      scholarlyBasis: [...method.scholarlyBasis], // Convert readonly to mutable
      regions: [...method.regions], // Convert readonly to mutable
      zakatRate: method.zakatRate,
      calendarSupport: [...method.calendarSupport], // Convert readonly to mutable
      customRules: method.customRules,
      suitableFor: [...method.suitableFor], // Convert readonly to mutable
      pros: [...method.pros], // Convert readonly to mutable
      cons: [...method.cons], // Convert readonly to mutable
      explanation: method.explanation
    }));
  }

  /**
   * Get methodology recommendation based on user profile
   * 
   * @param userRegion - User's geographic region
   * @param preferredSchool - User's preferred Islamic school (optional)
   * @param assetComplexity - Complexity of user's asset portfolio
   * @returns Recommended methodology with reasoning
   */
  getMethodologyRecommendation(
    userRegion?: string,
    preferredSchool?: string,
    assetComplexity: 'simple' | 'moderate' | 'complex' = 'simple'
  ): {
    recommendedMethod: string;
    reasoning: string;
    alternatives: string[];
  } {
    // Default to Standard method for international users
    let recommendedMethod = 'standard';
    let reasoning = 'Standard method recommended for international users and simplified calculations';
    const alternatives: string[] = [];

    // Regional recommendations
    const regionMethodMap: { [key: string]: string } = {
      'turkey': 'hanafi',
      'pakistan': 'hanafi',
      'india': 'hanafi',
      'bangladesh': 'hanafi',
      'indonesia': 'shafii',
      'malaysia': 'shafii',
      'morocco': 'maliki',
      'algeria': 'maliki',
      'egypt': 'hanafi',
      'saudi_arabia': 'hanbali',
      'qatar': 'hanbali',
      'uae': 'standard'
    };

    if (userRegion && regionMethodMap[userRegion.toLowerCase()]) {
      recommendedMethod = regionMethodMap[userRegion.toLowerCase()];
      reasoning = `${ZAKAT_METHODS[recommendedMethod.toUpperCase()].name} recommended based on regional prevalence in ${userRegion}`;
    }

    // Adjust for preferred school
    if (preferredSchool) {
      const schoolKey = preferredSchool.toUpperCase();
      if (ZAKAT_METHODS[schoolKey]) {
        recommendedMethod = preferredSchool.toLowerCase();
        reasoning = `${ZAKAT_METHODS[schoolKey].name} recommended based on your preferred Islamic school`;
      }
    }

    // Adjust for asset complexity
    if (assetComplexity === 'complex') {
      if (recommendedMethod === 'standard') {
        alternatives.push('hanafi'); // Better for complex business assets
        reasoning += '. Consider Hanafi method for complex business portfolios.';
      }
    }

    // Always include Standard as alternative for international users
    if (recommendedMethod !== 'standard') {
      alternatives.push('standard');
    }

    return {
      recommendedMethod,
      reasoning,
      alternatives
    };
  }

  /**
   * Convert assets to ZakatAsset format with Zakat-specific fields
   */
  private convertToZakatAssets(assets: Asset[], methodology: any, nisabInfo: NisabInfo): ZakatAsset[] {
    return assets.map(asset => {
      const zakatableAmount = asset.zakatEligible ? asset.value : 0;
      const zakatDue = zakatableAmount * (methodology.zakatRate / 100);

      return {
        assetId: asset.assetId,
        name: asset.name,
        category: asset.category,
        value: asset.value,
        zakatableAmount,
        zakatDue
      };
    });
  }

  /**
   * Validate calculation request parameters
   */
  private validateCalculationRequest(request: ZakatCalculationRequest, assets: Asset[]): void {
    if (!request.method) {
      throw new Error('Methodology is required for Zakat calculation');
    }

    if (!ZAKAT_METHODS[request.method.toUpperCase()]) {
      throw new Error(`Unsupported methodology: ${request.method}`);
    }

    if (!request.includeAssets || request.includeAssets.length === 0) {
      throw new Error('At least one asset must be selected for Zakat calculation');
    }

    if (!assets || assets.length === 0) {
      throw new Error('No assets provided for calculation');
    }

    // Validate that all included assets exist
    const assetIds = assets.map(a => a.assetId);
    for (const assetId of request.includeAssets) {
      if (!assetIds.includes(assetId)) {
        throw new Error(`Asset not found: ${assetId}`);
      }
    }
  }

  /**
   * Get methodology information by ID
   */
  private getMethodologyInfo(methodologyId: string): any {
    const methodology = ZAKAT_METHODS[methodologyId.toUpperCase()];
    if (!methodology) {
      throw new Error(`Methodology not found: ${methodologyId}`);
    }
    return methodology;
  }

  /**
   * Calculate nisab threshold based on methodology
   */
  private calculateNisabThreshold(methodology: any, currency: string): NisabInfo {
    // TODO: Integrate with real-time gold/silver prices
    // For now, use placeholder values
    const goldPricePerGram = 65; // USD per gram (placeholder)
    const silverPricePerGram = 0.85; // USD per gram (placeholder)

    const goldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
    const silverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;

    let effectiveNisab: number;
    let nisabBasis: string;

    switch (methodology.nisabBasis) {
      case 'gold':
        effectiveNisab = goldNisab;
        nisabBasis = 'gold';
        break;
      case 'silver':
        effectiveNisab = silverNisab;
        nisabBasis = 'silver';
        break;
      case 'dual_minimum':
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = goldNisab < silverNisab ? 'gold' : 'silver';
        break;
      default:
        effectiveNisab = goldNisab;
        nisabBasis = 'gold';
    }

    return {
      goldNisab,
      silverNisab,
      effectiveNisab,
      nisabBasis,
      calculationMethod: methodology.id
    };
  }

  /**
   * Calculate Zakat for individual assets
   */
  private calculateAssetWiseZakat(assets: ZakatAsset[], methodology: any): AssetCalculation[] {
    return assets.map(asset => ({
      assetId: asset.assetId,
      name: asset.name,
      category: asset.category,
      value: asset.value,
      zakatableAmount: asset.zakatableAmount,
      zakatDue: asset.zakatDue,
      methodSpecificRules: this.getMethodSpecificRules(asset, methodology)
    }));
  }

  /**
   * Get method-specific rules for an asset
   */
  private getMethodSpecificRules(asset: ZakatAsset, methodology: any): string[] {
    const rules: string[] = [];
    
    rules.push(`Calculated using ${methodology.name} at ${methodology.zakatRate}% rate`);
    
    if (asset.category === 'gold' || asset.category === 'silver') {
      rules.push('Precious metals are Zakat-eligible when held as wealth');
    } else if (asset.category === 'business') {
      rules.push(`Business assets treated per ${methodology.businessAssetTreatment} approach`);
    }

    return rules;
  }

  /**
   * Generate detailed calculation breakdown
   */
  private generateCalculationBreakdown(
    calculations: AssetCalculation[],
    methodology: any,
    nisabInfo: NisabInfo,
    totalZakat: number
  ): CalculationBreakdown {
    const totalAssets = calculations.reduce((sum, calc) => sum + calc.value, 0);
    const totalZakatableAmount = calculations.reduce((sum, calc) => sum + calc.zakatableAmount, 0);

    return {
      method: methodology.id,
      nisabCalculation: {
        goldNisab: nisabInfo.goldNisab,
        silverNisab: nisabInfo.silverNisab,
        effectiveNisab: nisabInfo.effectiveNisab,
        basis: nisabInfo.nisabBasis
      },
      assetCalculations: calculations,
      finalCalculation: {
        totalAssets,
        totalDeductions: 0, // TODO: Implement debt deductions
        zakatableAmount: totalZakatableAmount,
        zakatDue: totalZakat
      },
      sources: [...methodology.scholarlyBasis]
    };
  }

  /**
   * Generate assumptions made during calculation
   */
  private generateAssumptions(methodology: any): string[] {
    return [
      `Calculation performed using ${methodology.name} methodology`,
      'Current market prices used for precious metals (placeholder values)',
      'All assets assumed to be held for one full lunar year',
      'No debt deductions applied in this simplified calculation',
      'Exchange rates are current as of calculation date'
    ];
  }

  /**
   * Generate unique calculation ID
   */
  private generateCalculationId(): string {
    return `calc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const islamicCalculationService = new IslamicCalculationService();