import { 
  ZAKAT_RATES, 
  NISAB_THRESHOLDS, 
  ZAKAT_METHODS, 
  CALENDAR_TYPES,
  ASSET_CATEGORIES,
  REGIONAL_METHODOLOGY_MAP,
  METHODOLOGY_EDUCATION
} from '@zakapp/shared';
import type { 
  ZakatCalculation, 
  ZakatCalculationRequest, 
  ZakatAsset, 
  NisabInfo, 
  ZakatTotals,
  Asset,
  CalculationBreakdown
} from '@zakapp/shared';
import { randomUUID } from 'crypto';

export interface ZakatCalculationService {
  calculateZakat(request: ZakatCalculationRequest, assets: Asset[]): Promise<ZakatCalculation>;
  calculateNisab(goldPricePerGram: number, silverPricePerGram: number, method: string): NisabInfo;
  isEligibleForZakat(assetValue: number, nisab: number): boolean;
  calculateAssetZakat(asset: Asset, method: string): ZakatAsset;
  getMethodologyRecommendations(region?: string): string[];
  getMethodologyEducation(methodId: string): any;
  getMethodologyComparison(goldPrice: number, silverPrice: number): any[];
}

export class ZakatService implements ZakatCalculationService {
  
  /**
   * Calculate Zakat for given assets and parameters
   */
  async calculateZakat(request: ZakatCalculationRequest, assets: Asset[]): Promise<ZakatCalculation> {
    try {
      // Separate assets and expenses
      const includedItems = assets.filter(asset => 
        request.includeAssets.includes(asset.assetId)
      );
      
      const zakatableAssets = includedItems.filter(asset => 
        asset.zakatEligible && asset.category !== 'expenses'
      );
      
      const expenses = includedItems.filter(asset => 
        asset.category === 'expenses'
      );

      // Calculate current gold and silver prices (for now using default values)
      // In a real implementation, these would come from an external API
      const goldPricePerGram = 65; // USD per gram - should be fetched from API
      const silverPricePerGram = 0.8; // USD per gram - should be fetched from API

      // Calculate nisab thresholds
      const nisab = this.calculateNisab(goldPricePerGram, silverPricePerGram, request.method);

      // Calculate zakat for each asset
      const zakatAssets = zakatableAssets.map(asset => 
        this.calculateAssetZakat(asset, request.method)
      );

      // Calculate total expenses for deduction
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0);

      // Calculate totals (with expense deductions)
      const totals = this.calculateTotals(zakatAssets, totalExpenses);

      // Check if total assets (after deductions) meet nisab threshold
      const meetsNisab = this.isEligibleForZakat(totals.totalZakatableAssets, nisab.effectiveNisab);

      // If nisab is not met, zero out all zakat due amounts
      if (!meetsNisab) {
        zakatAssets.forEach(asset => {
          asset.zakatDue = 0;
        });
        totals.totalZakatDue = 0;
      }

      // Generate calculation breakdown
      const breakdown = this.generateCalculationBreakdown(request.method, nisab, zakatAssets, totals, meetsNisab);

      return {
        calculationId: randomUUID(),
        calculationDate: request.calculationDate,
        calendarType: request.calendarType,
        method: request.method,
        nisab,
        assets: zakatAssets,
        totals,
        meetsNisab,
        status: 'pending',
        createdAt: new Date().toISOString(),
        breakdown
      };

    } catch (error) {
      throw new Error(`Zakat calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate nisab thresholds based on current gold and silver prices
   */
  calculateNisab(goldPricePerGram: number, silverPricePerGram: number, method: string): NisabInfo {
    const goldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
    const silverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;

    // Different methods use different nisab calculations
    let effectiveNisab: number;
    let nisabBasis: string;

    switch (method) {
      case ZAKAT_METHODS.HANAFI.id:
        // Hanafi method uses silver nisab (lower threshold)
        effectiveNisab = silverNisab;
        nisabBasis = 'silver';
        break;
      case ZAKAT_METHODS.SHAFII.id:
        // Shafi'i method uses dual minimum approach
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = 'dual_minimum';
        break;
      case ZAKAT_METHODS.STANDARD.id:
        // Standard method uses the lower of gold or silver nisab
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = goldNisab < silverNisab ? 'gold' : 'silver';
        break;
      case ZAKAT_METHODS.SHAFII.id:
        // Shafi'i method uses dual minimum approach
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = 'dual_minimum';
        break;
      default:
        // Default to standard method
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = 'standard';
        break;
    }

    return {
      goldNisab,
      silverNisab,
      effectiveNisab,
      nisabBasis,
      calculationMethod: method
    };
  }

  /**
   * Check if asset value meets nisab threshold
   */
  isEligibleForZakat(assetValue: number, nisab: number): boolean {
    return assetValue >= nisab;
  }

  /**
   * Calculate zakat for a single asset
   */
  calculateAssetZakat(asset: Asset, method: string): ZakatAsset {
    // Get the asset category configuration
    const categoryConfig = this.getAssetCategoryConfig(asset.category);
    
    // Calculate zakatable amount (usually same as value for most assets)
    const zakatableAmount = this.calculateZakatableAmount(asset);
    
    // Calculate zakat due based on the method and asset type
    const zakatRate = this.getZakatRate(asset.category, method);
    let zakatDue = (zakatableAmount * zakatRate) / 100;

    // Apply method-specific calculation adjustments
    zakatDue = this.calculateMethodSpecificZakat(asset, method, zakatDue);
    // Calculate zakat due using method-specific logic
    const zakatDue = this.calculateMethodSpecificZakat(asset, method);

    return {
      assetId: asset.assetId,
      name: asset.name,
      category: asset.category,
      value: asset.value,
      zakatableAmount,
      zakatDue
    };
  }

  /**
   * Apply method-specific zakat calculation adjustments
   */
  private calculateMethodSpecificZakat(asset: Asset, method: string, baseZakat: number): number {
    switch (method) {
      case ZAKAT_METHODS.HANAFI.id:
        return this.applyHanafiRules(asset, baseZakat);
      case ZAKAT_METHODS.SHAFII.id:
        return this.applyShafiiRules(asset, baseZakat);
      default:
        return baseZakat;
    }
  }

  /**
   * Apply Hanafi-specific calculation rules
   */
  private applyHanafiRules(asset: Asset, baseZakat: number): number {
    // Hanafi-specific rules:
    // 1. Include all business assets comprehensively
    // 2. More comprehensive debt deduction approach
    // 3. Trade goods at market value
    
    if (asset.category === 'business') {
      // Hanafi method includes all business assets including inventory, receivables, and cash
      // This is already calculated in the base zakat calculation
      return baseZakat;
    }
    
    return baseZakat;
  }

  /**
   * Apply Shafi'i-specific calculation rules
   */
  private applyShafiiRules(asset: Asset, baseZakat: number): number {
    // Shafi'i-specific rules:
    // 1. Detailed categorization of assets
    // 2. Conservative debt treatment
    // 3. More precise asset classification
    
    if (asset.category === 'business') {
      // Shafi'i method may have more detailed categorization
      // For now, we use the standard calculation
      return baseZakat;
    }
    
    return baseZakat;
  }

  /**
   * Calculate the zakatable amount for an asset
   * Some assets may have deductions or special calculations
   */
  private calculateZakatableAmount(asset: Asset): number {
    // For most assets, the entire value is zakatable
    // Special cases can be handled here (e.g., business assets might deduct liabilities)
    
    switch (asset.category) {
      case 'business':
        // For business assets, we might subtract liabilities
        // This would require more complex logic based on asset details
        return asset.value;
      
      case 'property':
        // Investment property is zakatable, but personal residence is not
        // This determination would be based on asset subcategory
        return asset.value;
      
      default:
        return asset.value;
    }
  }

  /**
   * Calculate method-specific zakat for an asset
   */
  private calculateMethodSpecificZakat(asset: Asset, method: string): number {
    // Calculate base zakat rate
    const zakatRate = this.getZakatRate(asset.category, method);
    const zakatableAmount = this.calculateZakatableAmount(asset);
    const baseZakat = (zakatableAmount * zakatRate) / 100;
    
    // Apply method-specific rules
    switch (method) {
      case ZAKAT_METHODS.HANAFI.id:
        return this.applyHanafiRules(asset, baseZakat);
      case ZAKAT_METHODS.SHAFII.id:
        return this.applyShafiiRules(asset, baseZakat);
      default:
        return baseZakat;
    }
  }

  /**
   * Apply Hanafi-specific calculation rules
   */
  private applyHanafiRules(asset: Asset, baseZakat: number): number {
    // Hanafi-specific rules:
    // 1. Include all business assets comprehensively
    // 2. More liberal debt deduction approach
    // 3. Trade goods valued at market value
    
    switch (asset.category) {
      case 'business':
        // Hanafi method includes all business assets and inventory
        // Apply comprehensive business asset treatment
        return baseZakat;
      
      case 'debts':
        // Hanafi method allows comprehensive debt deduction
        // Debts reduce overall zakatable amount
        return 0; // Debts themselves don't generate zakat
      
      default:
        return baseZakat;
    }
  }

  /**
   * Apply Shafi'i-specific calculation rules
   */
  private applyShafiiRules(asset: Asset, baseZakat: number): number {
    // Shafi'i-specific rules:
    // 1. Detailed asset categorization
    // 2. Conservative debt deduction
    // 3. Specific treatment for different asset categories
    
    switch (asset.category) {
      case 'business':
        // Shafi'i method has more detailed categorization
        // Different rates may apply based on business type
        return baseZakat;
      
      case 'gold':
      case 'silver':
        // Shafi'i method may have specific rules for precious metals
        return baseZakat;
      
      case 'debts':
        // Conservative debt treatment in Shafi'i method
        return 0;
      
      default:
        return baseZakat;
    }
  }

  /**
   * Get the zakat rate for a specific asset category and method
   */
  private getZakatRate(category: string, method: string): number {
    // Most assets use the standard 2.5% rate
    // Agricultural assets have different rates
    
    switch (category) {
      case 'agricultural':
        // This would need more sophisticated logic based on irrigation method
        return ZAKAT_RATES.AGRICULTURAL_RAIN_FED; // Default to rain-fed rate
      
      default:
        return ZAKAT_RATES.STANDARD_RATE;
    }
  }

  /**
   * Get asset category configuration
   */
  private getAssetCategoryConfig(categoryId: string) {
    return Object.values(ASSET_CATEGORIES).find(cat => cat.id === categoryId);
  }

  /**
   * Calculate totals from zakat assets
   */
  private calculateTotals(zakatAssets: ZakatAsset[], totalExpenses: number = 0): ZakatTotals {
    const grossTotalAssets = zakatAssets.reduce((sum, asset) => sum + asset.value, 0);
    const grossZakatableAssets = zakatAssets.reduce((sum, asset) => sum + asset.zakatableAmount, 0);
    
    // Apply expense deductions to zakatable assets (but not below 0)
    const netZakatableAssets = Math.max(0, grossZakatableAssets - totalExpenses);
    
    return {
      totalAssets: grossTotalAssets,
      totalZakatableAssets: netZakatableAssets,
      totalZakatDue: zakatAssets.reduce((sum, asset) => sum + asset.zakatDue, 0),
      totalExpenses,
      netZakatableAssets
    };
  }

  /**
   * Get methodology recommendations based on region
   */
  getMethodologyRecommendations(region?: string): string[] {
    if (!region) {
      return [ZAKAT_METHODS.STANDARD.id, ZAKAT_METHODS.HANAFI.id, ZAKAT_METHODS.SHAFII.id];
    }

    // Type assertion for the regional map since TypeScript can't infer all possible string keys
    const recommendations = (REGIONAL_METHODOLOGY_MAP as any)[region];
    return recommendations || [ZAKAT_METHODS.STANDARD.id];
  }

  /**
   * Get educational content for a methodology
   */
  getMethodologyEducation(methodId: string) {
    switch (methodId) {
      case ZAKAT_METHODS.HANAFI.id:
        return METHODOLOGY_EDUCATION.HANAFI;
      case ZAKAT_METHODS.SHAFII.id:
        return METHODOLOGY_EDUCATION.SHAFII;
      case ZAKAT_METHODS.CUSTOM.id:
        return METHODOLOGY_EDUCATION.CUSTOM;
      case ZAKAT_METHODS.STANDARD.id:
      default:
        return METHODOLOGY_EDUCATION.STANDARD;
    }
  }

  /**
   * Get detailed methodology information including calculation differences
   */
  getMethodologyComparison(goldPrice: number, silverPrice: number) {
    const methods = Object.values(ZAKAT_METHODS);
    return methods.map(method => {
      const nisab = this.calculateNisab(goldPrice, silverPrice, method.id);
      const education = this.getMethodologyEducation(method.id);
      
      return {
        ...method,
        nisab,
        education,
        effectiveNisabValue: nisab.effectiveNisab,
        nisabSource: nisab.nisabBasis
      };
    });
  }

  /**
   * Validate calculation request
   */
  validateCalculationRequest(request: ZakatCalculationRequest): void {
    if (!request.calculationDate) {
      throw new Error('Calculation date is required');
    }

    if (!request.calendarType || !Object.values(CALENDAR_TYPES).some(type => type.id === request.calendarType)) {
      throw new Error('Valid calendar type is required');
    }

    if (!request.method || !Object.values(ZAKAT_METHODS).some(method => method.id === request.method)) {
      throw new Error('Valid calculation method is required');
    }

    if (!request.includeAssets || request.includeAssets.length === 0) {
      throw new Error('At least one asset must be included in calculation');
    }

    // Validate date format
    const date = new Date(request.calculationDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid calculation date format');
    }

    // Validate custom nisab if provided
    if (request.customNisab !== undefined && (request.customNisab < 0 || !isFinite(request.customNisab))) {
      throw new Error('Custom nisab must be a positive number');
    }
  }

  /**
   * Generate detailed calculation breakdown for transparency
   */
  private generateCalculationBreakdown(
    method: string, 
    nisab: NisabInfo, 
    assets: ZakatAsset[], 
    totals: ZakatTotals, 
    meetsNisab: boolean
  ): CalculationBreakdown {
    // Get method information
    const methodInfo = Object.values(ZAKAT_METHODS).find(m => m.id === method) || ZAKAT_METHODS.STANDARD;
    
    const steps: { step: string; description: string; value: number }[] = [];
    
    // Step 1: Nisab calculation
    steps.push({
      step: '1. Nisab Calculation',
      description: `${methodInfo.name} uses ${nisab.nisabBasis} basis`,
      value: nisab.effectiveNisab
    });

    // Step 2: Asset valuation
    steps.push({
      step: '2. Total Asset Value',
      description: 'Sum of all included assets',
      value: totals.totalAssets
    });

    // Step 3: Zakatable amount after deductions
    steps.push({
      step: '3. Zakatable Amount',
      description: 'Assets after expense deductions',
      value: totals.totalZakatableAssets
    });

    // Step 4: Nisab comparison
    steps.push({
      step: '4. Nisab Threshold Check',
      description: `Assets ${meetsNisab ? 'meet' : 'do not meet'} nisab threshold`,
      value: meetsNisab ? 1 : 0
    });

    // Step 5: Zakat calculation
    if (meetsNisab) {
      steps.push({
        step: '5. Zakat Due (2.5%)',
        description: 'Standard zakat rate applied to zakatable assets',
        value: totals.totalZakatDue
      });
    } else {
      steps.push({
        step: '5. Zakat Due',
        description: 'No zakat due - below nisab threshold',
        value: 0
      });
    }

    return {
      methodology: {
        name: methodInfo.name,
        description: methodInfo.description,
        nisabBasis: nisab.nisabBasis
      },
      steps
    };
  }
}

// Export singleton instance
export const zakatService = new ZakatService();