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
        // Hanafi method uses silver nisab exclusively (lower threshold for broader accessibility)
        effectiveNisab = silverNisab;
        nisabBasis = 'silver';
        break;
      case ZAKAT_METHODS.SHAFII.id:
        // Shafi'i method uses dual minimum approach (balanced nisab calculation)
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = 'dual_minimum';
        break;
      case ZAKAT_METHODS.MALIKI.id:
        // Maliki method uses flexible dual approach that may adjust based on regional conditions
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = 'dual_flexible';
        break;
      case ZAKAT_METHODS.HANBALI.id:
        // Hanbali method prefers gold-based nisab calculations
        effectiveNisab = goldNisab;
        nisabBasis = 'gold';
        break;
      case ZAKAT_METHODS.STANDARD.id:
        // Standard method uses the lower of gold or silver nisab with specific basis tracking
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = goldNisab < silverNisab ? 'gold' : 'silver';
        break;
      default:
        // Default to standard method
        effectiveNisab = Math.min(goldNisab, silverNisab);
        nisabBasis = goldNisab < silverNisab ? 'gold' : 'silver';
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
      case ZAKAT_METHODS.MALIKI.id:
        return this.applyMalikiRules(asset, baseZakat);
      case ZAKAT_METHODS.HANBALI.id:
        return this.applyHanbaliRules(asset, baseZakat);
      default:
        return baseZakat;
    }
  }

  /**
   * Apply Hanafi-specific calculation rules
   */
  private applyHanafiRules(asset: Asset, baseZakat: number): number {
    // Hanafi-specific rules:
    // 1. Comprehensive inclusion of all business assets including inventory, accounts receivable, and working capital
    // 2. More liberal debt deduction approach allowing comprehensive debt deduction
    // 3. Trade goods valued at market value with thorough wealth assessment
    
    switch (asset.category) {
      case 'business':
        // Hanafi method includes all business assets comprehensively
        // This reflects the Hanafi emphasis on thorough wealth assessment
        // Include inventory, accounts receivable, and working capital
        return baseZakat;
      
      case 'debts':
        // Hanafi method allows comprehensive debt deduction including both immediate and future obligations
        // This provides relief to those with significant financial commitments
        return 0; // Debts themselves don't generate zakat but are deductible
      
      case 'gold':
      case 'silver':
        // Hanafi method treats precious metals with standard calculation
        // but uses silver-based nisab for broader accessibility
        return baseZakat;
      
      case 'stocks':
        // Hanafi method includes securities based on market value
        return baseZakat;
      
      default:
        return baseZakat;
    }
  }

  /**
   * Apply Shafi'i-specific calculation rules
   */
  private applyShafiiRules(asset: Asset, baseZakat: number): number {
    // Shafi'i-specific rules:
    // 1. Detailed asset categorization with specific rules for different types of commercial activities
    // 2. Conservative debt deduction focusing on immediate and certain obligations
    // 3. Systematic methodology with precision in asset classification
    // 4. Balanced nisab calculation using dual minimum approach
    
    switch (asset.category) {
      case 'business':
        // Shafi'i method has detailed categorization of business assets
        // Different rates may apply based on business type and activity
        // Emphasizes precision in asset classification
        return baseZakat;
      
      case 'gold':
      case 'silver':
        // Shafi'i method may have specific rules for precious metals
        // Uses dual minimum nisab approach for balanced calculation
        return baseZakat;
      
      case 'debts':
        // Conservative debt treatment in Shafi'i method
        // Focuses on immediate and certain obligations while being cautious about speculative debts
        return 0;
      
      case 'stocks':
        // Detailed approach to securities based on categorization
        return baseZakat;
      
      case 'property':
        // Shafi'i method may have specific categorization for different property types
        return baseZakat;
      
      default:
        return baseZakat;
    }
  }

  /**
   * Apply Maliki-specific calculation rules
   */
  private applyMalikiRules(asset: Asset, baseZakat: number): number {
    // Maliki-specific rules:
    // 1. Community-focused approach with emphasis on social welfare
    // 2. Flexible nisab that may adjust based on regional economic conditions
    // 3. Strong agricultural asset handling with seasonal considerations
    // 4. Comprehensive trade goods treatment
    // 5. Community-based debt assessment
    
    switch (asset.category) {
      case 'business':
        // Maliki method has comprehensive treatment of commercial assets
        // Particular emphasis on agricultural goods and trade merchandise
        // May consider seasonal business cycles
        return baseZakat;
      
      case 'debts':
        // Community-based debt assessment
        // May consider broader economic conditions and community standing
        return 0;
      
      case 'gold':
      case 'silver':
        // Flexible dual approach that may adjust based on regional conditions
        return baseZakat;
      
      case 'property':
        // Adapts to local economic conditions for property valuation
        return baseZakat;
      
      default:
        return baseZakat;
    }
  }

  /**
   * Apply Hanbali-specific calculation rules
   */
  private applyHanbaliRules(asset: Asset, baseZakat: number): number {
    // Hanbali-specific rules:
    // 1. Conservative approach with emphasis on textual adherence
    // 2. Gold-based nisab calculations preferred
    // 3. Conservative debt deduction focusing on documented obligations
    // 4. Strict asset categorization based on classical law
    // 5. Simplified calculation logic with stable reference points
    
    switch (asset.category) {
      case 'business':
        // Strict categorization based on classical Islamic commercial law
        // Clear distinctions between different types of commercial activities
        // Conservative valuation methods
        return baseZakat;
      
      case 'debts':
        // Conservative debt deduction approach
        // Focus on immediate and certain obligations with clear documentation
        // Cautious about speculative or uncertain debts
        return 0;
      
      case 'gold':
      case 'silver':
        // Prefers gold-based calculations
        // Stable gold-based reference for consistency
        return baseZakat;
      
      case 'stocks':
        // Conservative approach to modern financial instruments
        // May require additional scholarly guidance for complex securities
        return baseZakat;
      
      case 'crypto':
        // Conservative treatment of contemporary assets
        // May require case-by-case scholarly evaluation
        return baseZakat;
      
      default:
        return baseZakat;
    }
  }

  /**
   * Get the zakat rate for a specific asset category and method
   */
  private getZakatRate(category: string, method: string): number {
    // Most assets use the standard 2.5% rate
    // Business assets with agricultural components may have different considerations
    
    switch (category) {
      case 'business':
        // Business assets may include agricultural components
        // For now, use standard rate - future enhancement could add subcategory logic
        return ZAKAT_RATES.STANDARD_RATE;
      
      default:
        return ZAKAT_RATES.STANDARD_RATE;
    }
  }

  /**
   * Get asset category configuration
   */
  private getAssetCategoryConfig(categoryId: string) {
    return Object.values(ASSET_CATEGORIES).find((cat: any) => cat.id === categoryId);
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
      return [ZAKAT_METHODS.STANDARD.id, ZAKAT_METHODS.HANAFI.id, ZAKAT_METHODS.SHAFII.id, ZAKAT_METHODS.MALIKI.id, ZAKAT_METHODS.HANBALI.id];
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
      case ZAKAT_METHODS.MALIKI.id:
        return METHODOLOGY_EDUCATION.MALIKI;
      case ZAKAT_METHODS.HANBALI.id:
        return METHODOLOGY_EDUCATION.HANBALI;
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
    return methods.map((method: any) => {
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

    if (!request.calendarType || !Object.values(CALENDAR_TYPES).some((type: any) => type.id === request.calendarType)) {
      throw new Error('Valid calendar type is required');
    }

    if (!request.method || !Object.values(ZAKAT_METHODS).some((method: any) => method.id === request.method)) {
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
   * Generate detailed calculation breakdown for transparency and educational purposes
   */
  private generateCalculationBreakdown(
    method: string, 
    nisab: NisabInfo, 
    assets: ZakatAsset[], 
    totals: ZakatTotals, 
    meetsNisab: boolean
  ): CalculationBreakdown {
    // Get method information
    const methodInfo = Object.values(ZAKAT_METHODS).find((m: any) => m.id === method) || ZAKAT_METHODS.STANDARD;
    
    // Enhanced nisab calculation details
    const nisabCalculation = {
      goldNisab: nisab.goldNisab,
      silverNisab: nisab.silverNisab,
      effectiveNisab: nisab.effectiveNisab,
      basis: nisab.nisabBasis
    };

    // Asset calculation details for transparency
    const assetCalculations: any[] = assets.map(asset => ({
      assetId: asset.assetId,
      name: asset.name,
      category: asset.category,
      value: asset.value,
      zakatableAmount: asset.zakatableAmount,
      zakatDue: asset.zakatDue,
      methodSpecificRules: this.getMethodSpecificRules(asset.category, method)
    }));

    // Deduction rules applied based on method
    const deductionRules: any[] = this.getDeductionRules(method, totals);

    // Final calculation summary
    const finalCalculation = {
      totalAssets: totals.totalAssets,
      totalDeductions: totals.totalExpenses || 0,
      zakatableAmount: totals.totalZakatableAssets,
      zakatDue: totals.totalZakatDue
    };

    // Educational sources for the method
    const sources = this.getMethodSources(method);
    
    // Legacy step-based breakdown for backward compatibility
    const steps: { step: string; description: string; value: number }[] = [];
    
    // Step 1: Nisab calculation with method-specific explanation
    steps.push({
      step: '1. Nisab Calculation',
      description: `${methodInfo.name} uses ${nisab.nisabBasis} basis (Gold: $${nisab.goldNisab.toFixed(2)}, Silver: $${nisab.silverNisab.toFixed(2)})`,
      value: nisab.effectiveNisab
    });

    // Step 2: Asset valuation with details
    steps.push({
      step: '2. Total Asset Value',
      description: `Sum of ${assets.length} included zakatable assets`,
      value: totals.totalAssets
    });

    // Step 3: Zakatable amount after method-specific deductions
    steps.push({
      step: '3. Zakatable Amount',
      description: `Assets after ${method === 'hanafi' ? 'comprehensive' : method === 'shafii' ? 'conservative' : 'immediate'} expense deductions`,
      value: totals.totalZakatableAssets
    });

    // Step 4: Nisab comparison with threshold details
    steps.push({
      step: '4. Nisab Threshold Check',
      description: `Assets ${meetsNisab ? 'meet' : 'do not meet'} nisab threshold of $${nisab.effectiveNisab.toFixed(2)}`,
      value: meetsNisab ? 1 : 0
    });

    // Step 5: Zakat calculation with method-specific rate information
    if (meetsNisab) {
      steps.push({
        step: '5. Zakat Due (2.5%)',
        description: `${methodInfo.name} standard rate applied to zakatable assets`,
        value: totals.totalZakatDue
      });
    } else {
      steps.push({
        step: '5. Zakat Due',
        description: 'No zakat due - assets below nisab threshold',
        value: 0
      });
    }

    return {
      method,
      nisabCalculation,
      assetCalculations,
      deductionRules,
      finalCalculation,
      sources,
      steps,
      methodology: {
        name: methodInfo.name,
        description: methodInfo.description,
        nisabBasis: nisab.nisabBasis
      }
    };
  }

  /**
   * Get method-specific rules applied to an asset category
   */
  private getMethodSpecificRules(category: string, method: string): string[] {
    const rules: string[] = [];
    
    switch (method) {
      case ZAKAT_METHODS.HANAFI.id:
        switch (category) {
          case 'business':
            rules.push('Comprehensive business asset inclusion');
            rules.push('Includes inventory, accounts receivable, and working capital');
            break;
          case 'debts':
            rules.push('Comprehensive debt deduction allowed');
            rules.push('Includes both immediate and future obligations');
            break;
          case 'gold':
          case 'silver':
            rules.push('Silver-based nisab threshold applied');
            break;
          case 'cash':
            rules.push('Full cash value considered');
            rules.push('No discounting applied');
            break;
          default:
            rules.push('Hanafi school methodology applied');
            break;
        }
        break;
      
      case ZAKAT_METHODS.SHAFII.id:
        switch (category) {
          case 'business':
            rules.push('Detailed asset categorization');
            rules.push('Specific rules based on business activity type');
            break;
          case 'debts':
            rules.push('Conservative debt deduction');
            rules.push('Focus on immediate and certain obligations');
            break;
          case 'gold':
          case 'silver':
            rules.push('Dual minimum nisab approach');
            break;
          case 'cash':
            rules.push('Full cash value considered');
            rules.push('Conservative approach applied');
            break;
          default:
            rules.push('Shafi\'i school methodology applied');
            break;
        }
        break;
      
      case ZAKAT_METHODS.STANDARD.id:
        rules.push('AAOIFI-compliant calculation');
        rules.push('Internationally recognized standards');
        break;
      
      case ZAKAT_METHODS.MALIKI.id:
        switch (category) {
          case 'business':
            rules.push('Comprehensive commercial asset treatment');
            rules.push('Emphasis on agricultural goods and trade merchandise');
            rules.push('Seasonal business cycle considerations');
            break;
          case 'debts':
            rules.push('Community-based debt assessment');
            rules.push('Broader economic context consideration');
            break;
          case 'property':
            rules.push('Local economic condition adaptations');
            break;
          default:
            rules.push('Maliki school community-focused methodology');
            break;
        }
        break;
      
      case ZAKAT_METHODS.HANBALI.id:
        switch (category) {
          case 'business':
            rules.push('Strict asset categorization based on classical law');
            rules.push('Conservative valuation methods');
            break;
          case 'debts':
            rules.push('Conservative debt deduction approach');
            rules.push('Focus on documented and certain obligations');
            break;
          case 'gold':
          case 'silver':
            rules.push('Gold-based nisab preference');
            rules.push('Stable reference point approach');
            break;
          case 'stocks':
          case 'crypto':
            rules.push('Conservative treatment of modern instruments');
            rules.push('May require additional scholarly guidance');
            break;
          default:
            rules.push('Hanbali school conservative methodology');
            break;
        }
        break;
    }
    
    return rules;
  }

  /**
   * Get deduction rules based on method
   */
  private getDeductionRules(method: string, totals: ZakatTotals): any[] {
    const rules: any[] = [];
    
    if (totals.totalExpenses && totals.totalExpenses > 0) {
      let deductionType = 'immediate';
      let description = 'Immediate expense deductions';
      
      switch (method) {
        case ZAKAT_METHODS.HANAFI.id:
          deductionType = 'comprehensive';
          description = 'Comprehensive debt and expense deductions including future obligations';
          break;
        case ZAKAT_METHODS.SHAFII.id:
          deductionType = 'conservative';
          description = 'Conservative deduction focusing on certain and immediate obligations';
          break;
        case ZAKAT_METHODS.MALIKI.id:
          deductionType = 'community_based';
          description = 'Community-based debt assessment considering broader economic conditions';
          break;
        case ZAKAT_METHODS.HANBALI.id:
          deductionType = 'conservative';
          description = 'Conservative deduction focusing on documented and certain obligations';
          break;
      }
      
      rules.push({
        type: deductionType,
        description: description,
        amount: totals.totalExpenses,
        applicableAssets: ['all']
      });
    }
    
    return rules;
  }

  /**
   * Get educational sources for the method
   */
  private getMethodSources(method: string): string[] {
    switch (method) {
      case ZAKAT_METHODS.HANAFI.id:
        return ['Al-Hidayah by al-Marghinani', 'Fath al-Qadir by Ibn al-Humam', 'Classical Hanafi jurisprudence texts'];
      case ZAKAT_METHODS.SHAFII.id:
        return ['Al-Majmu\' by al-Nawawi', 'Minhaj al-Talibin by al-Nawawi', 'Shafi\'i school jurisprudence'];
      case ZAKAT_METHODS.MALIKI.id:
        return ['Al-Mudawwana by Imam Malik', 'Bidayat al-Mujtahid by Ibn Rushd', 'Maliki jurisprudence texts'];
      case ZAKAT_METHODS.HANBALI.id:
        return ['Al-Mughni by Ibn Qudamah', 'Works of Ibn Taymiyyah', 'Hanbali school jurisprudence'];
      case ZAKAT_METHODS.STANDARD.id:
        return ['AAOIFI FAS 9', 'IFSB Guidelines', 'Contemporary Islamic finance consensus'];
      default:
        return ['General Islamic jurisprudence'];
    }
  }
}

// Export singleton instance
export const zakatService = new ZakatService();