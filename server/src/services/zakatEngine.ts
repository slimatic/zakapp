import { 
  ZakatCalculation, 
  ZakatCalculationRequest, 
  MethodologyComparisonRequest,
  MethodologyComparison,
  Asset, 
  MethodologyInfo,
  NisabInfo,
  ZakatCalculationResult,
  CalendarCalculation,
  CalculationBreakdown,
  AssetCalculation,
  AlternativeCalculation
} from '@zakapp/shared';
import { ZAKAT_METHODS } from '@zakapp/shared';
import { CurrencyService } from './currencyService';
import { CalendarService } from './calendarService';
import { NisabService } from './NisabService';
import { randomUUID } from 'crypto';

/**
 * Advanced Zakat Calculation Engine
 * 
 * This service implements the core zakat calculation logic with support for:
 * - Multiple Islamic methodologies (Hanafi, Shafi'i, Maliki, Hanbali, Standard, Custom)
 * - Calendar system integration (lunar/solar)
 * - Asset-specific calculation rules
 * - Comprehensive nisab threshold management
 * - Detailed calculation breakdown and transparency
 * 
 * Constitutional Compliance:
 * - Islamic Compliance: All calculations follow authentic Islamic jurisprudence
 * - Transparency: Detailed breakdowns show calculation methodology
 * - Privacy & Security: No sensitive data stored in calculations
 * - User-Centric: Clear explanations and educational content
 */
export class ZakatEngine {
  private currencyService: CurrencyService;
  private calendarService: CalendarService;
  private nisabService: NisabService;
  
  // Performance optimization: Cache methodology info and nisab calculations
  private methodologyCache = new Map<string, MethodologyInfo>();
  private nisabCache = new Map<string, { info: NisabInfo; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    currencyService: CurrencyService,
    calendarService: CalendarService,
    nisabService: NisabService
  ) {
    this.currencyService = currencyService;
    this.calendarService = calendarService;
    this.nisabService = nisabService;
  }

  /**
   * Calculate zakat using comprehensive methodology support
   * 
   * @param request - Calculation parameters including method, assets, calendar type
   * @returns Complete calculation result with methodology details and alternatives
   */
  async calculateZakat(request: ZakatCalculationRequest & { assets?: Asset[]; userId?: string }): Promise<ZakatCalculationResult> {
    try {
    // Get methodology information (method may be optional in request types)
    const methodId = (request.method as string) || 'standard';
    const methodology = this.getMethodologyInfo(methodId);
      
      // Get current nisab values
      const nisabInfo = await this.calculateNisabThreshold(methodology, request.customNisab);
      
      // Get calendar information if needed
      const calendarInfo = request.calendarType === 'lunar'
        ? await this.calendarService.getCalendarInfo(new Date(request.calculationDate || Date.now()))
        : undefined;

      // Load and validate assets
  const assets = request.assets || (request.userId ? await this.loadAssets(request.userId, request.includeAssets || []) : []);
      const validatedAssets = this.validateAssets(assets);

      // Perform main calculation
      const calculation = await this.performCalculation(
        validatedAssets,
        methodology,
        nisabInfo,
        request,
        calendarInfo
      );

      // Generate detailed breakdown
      const breakdown = this.generateBreakdown(calculation, methodology, nisabInfo, validatedAssets);

      // Calculate alternatives for comparison
      const alternatives = await this.calculateAlternatives(validatedAssets, request, calculation);

      return {
        result: calculation,
        methodology,
        breakdown,
        assumptions: this.generateAssumptions(methodology, nisabInfo),
        sources: this.getScholarlySources(methodology.id),
        alternatives
      };

    } catch (error) {
      throw new Error(`Zakat calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare multiple Zakat calculation methodologies using the same asset data.
   * Returns comparison results without creating snapshots.
   * 
   * @param request - Comparison request with methodologies to compare
   * @param assets - Asset data to use for all calculations
   * @returns Array of methodology comparison results
   */
  async compareMethodologies(
    request: MethodologyComparisonRequest & { assets?: Asset[]; userId?: string }
  ): Promise<MethodologyComparison[]> {
    try {
      const referenceDate = request.referenceDate ? new Date(request.referenceDate) : new Date();
      
      // Load assets if not provided
      const assets = request.assets || (request.userId ? await this.loadAssets(request.userId, []) : []);
      const validatedAssets = this.validateAssets(assets);

      // Calculate using each methodology
      const results: MethodologyComparison[] = [];
      
    const methodList = request.methodologies || [];
    for (let i = 0; i < methodList.length; i++) {
      const methodId = methodList[i];
        const customConfigId = request.customConfigIds?.[i];
        
        // Get methodology info
        const methodology = this.getMethodologyInfo(methodId);
        
        // Get nisab threshold
        const nisabInfo = await this.calculateNisabThreshold(methodology, undefined); // No custom nisab for comparison
        
        // Perform calculation
        const calculation = await this.performCalculation(
          validatedAssets,
          methodology,
          nisabInfo,
          {
            methodology: methodId as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM',
            calculationDate: referenceDate.toISOString(),
            calendarType: 'lunar', // Default to lunar for comparison
            includeAssets: validatedAssets.map(a => a.assetId) || [],
            customNisab: undefined
          },
          undefined // No calendar info for comparison
        );

        // Calculate difference from first methodology
        let difference = { absolute: 0, percentage: 0 };
        if (results.length > 0) {
          const firstResult = results[0];
          const absoluteDiff = calculation.totals.totalZakatDue - firstResult.zakatDue;
          const percentageDiff = firstResult.zakatDue !== 0 ? (absoluteDiff / firstResult.zakatDue) * 100 : 0;
          difference = {
            absolute: absoluteDiff,
            percentage: percentageDiff
          };
        }

        results.push({
          methodology: methodId.toUpperCase(),
          methodologyConfigId: customConfigId,
          totalWealth: calculation.totals.totalZakatableAssets,
          nisabThreshold: nisabInfo.effectiveNisab,
          zakatDue: calculation.totals.totalZakatDue,
          isAboveNisab: calculation.meetsNisab,
          difference
        });
      }

      return results;

    } catch (error) {
      throw new Error(`Methodology comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getMethodologyInfo(methodId: string): MethodologyInfo {
    // Check cache first
    const cached = this.methodologyCache.get(methodId);
    if (cached) {
      return cached;
    }

    const method = Object.values(ZAKAT_METHODS).find(m => m.id === methodId);
    if (!method) {
      throw new Error(`Unknown methodology: ${methodId}`);
    }
    
    // Cast to mutable type to fix readonly array issues
    const methodologyInfo: MethodologyInfo = {
      ...method,
      scholarlyBasis: [...method.scholarlyBasis],
      regions: [...method.regions],
      calendarSupport: [...method.calendarSupport],
      suitableFor: [...method.suitableFor],
      pros: [...method.pros],
      cons: [...method.cons]
    };

    // Cache the result
    this.methodologyCache.set(methodId, methodologyInfo);
    
    return methodologyInfo;
  }

  /**
   * Calculate nisab threshold based on methodology and current market prices
   */
  private async calculateNisabThreshold(methodology: MethodologyInfo, customNisab?: number): Promise<NisabInfo> {
    if (customNisab) {
      return {
        goldNisab: customNisab,
        silverNisab: customNisab,
        effectiveNisab: customNisab,
        nisabBasis: 'custom',
        calculationMethod: methodology.id
      };
    }

    // Check cache first
    const cacheKey = `${methodology.id}_USD`;
    const cached = this.nisabCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.info;
    }

    // Get nisab information from NisabService
    const nisabInfo = await this.nisabService.calculateNisab(methodology.id, 'USD');
    
    // Cache the result
    this.nisabCache.set(cacheKey, { info: nisabInfo, timestamp: Date.now() });
    
    return nisabInfo;
  }

  /**
   * Flexible nisab calculation for Maliki methodology
   */
  private async calculateFlexibleNisab(goldNisab: number, silverNisab: number): Promise<number> {
    // This is a simplified implementation - in practice, this would consider:
    // - Regional economic conditions
    // - Local purchasing power
    // - Community consensus
    // For now, we'll use the lower threshold to be more inclusive
    return Math.min(goldNisab, silverNisab);
  }

  /**
   * Load assets for calculation
   * In production, this would load from database
   * For testing/unit purposes, returns mock assets based on assetIds
   */
  private async loadAssets(userId: string, assetIds: string[]): Promise<Asset[]> {
    // Import PrismaClient directly to avoid issues with AssetService
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Build where clause
      const where: {
        userId: string;
        isActive: boolean;
        id?: { in: string[] };
      } = {
        userId,
        isActive: true
      };

      // Filter by specific asset IDs if provided
      if (assetIds.length > 0) {
        where.id = { in: assetIds };
      }

      // Load assets from database
      const dbAssets = await prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      // Transform database assets to ZakatEngine Asset format
      return dbAssets.map(asset => ({
        assetId: asset.id,
        name: asset.name,
        category: asset.category.toLowerCase() as Asset['category'],
        subCategory: this.mapAssetSubCategory(asset.category),
        value: asset.value,
        currency: asset.currency,
        description: asset.notes || undefined,
        zakatEligible: this.isAssetZakatEligible(asset.category),
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString()
      }));
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Validate assets for zakat calculation
   */
  private validateAssets(assets: Asset[]): Asset[] {
    const validAssets = assets.filter(asset => {
      // Basic validation
      if (!asset.value || asset.value <= 0) return false;
      if (!asset.currency) return false;
      if (!asset.category) return false;
      
      return true;
    });

    if (validAssets.length === 0) {
      throw new Error('No valid assets found for calculation');
    }

    return validAssets;
  }

  /**
   * Perform the main zakat calculation
   */
  private async performCalculation(
    assets: Asset[],
    methodology: MethodologyInfo,
    nisabInfo: NisabInfo,
    request: ZakatCalculationRequest,
    calendarInfo?: CalendarCalculation
  ): Promise<ZakatCalculation> {
    const calculationId = randomUUID();
    const calculationDate = new Date(request.calculationDate).toISOString();

    // Convert all assets to base currency (USD)
    const convertedAssets = await this.convertAssetsToBaseCurrency(assets);

    // Apply methodology-specific rules
    const methodologyAssets = this.applyMethodologyRules(convertedAssets, methodology);

    // Calculate individual asset zakat amounts
    const zakatAssets = this.calculateAssetZakat(methodologyAssets, methodology);

    // Calculate totals
    const totalAssets = zakatAssets.reduce((sum, asset) => sum + asset.value, 0);
    const totalZakatableAssets = zakatAssets.reduce((sum, asset) => sum + asset.zakatableAmount, 0);
    const totalZakatDue = zakatAssets.reduce((sum, asset) => sum + asset.zakatDue, 0);

    // Check nisab eligibility
    const meetsNisab = totalZakatableAssets >= nisabInfo.effectiveNisab;

    // Apply calendar adjustments if needed
    const adjustedZakatDue = calendarInfo 
      ? this.applyCalendarAdjustment(totalZakatDue, calendarInfo)
      : totalZakatDue;

    const totals = {
      totalAssets,
      totalZakatableAssets,
      totalZakatDue: meetsNisab ? adjustedZakatDue : 0
    };

    return {
      calculationId,
      calculationDate,
      calendarType: request.calendarType,
      method: methodology.id,
      methodInfo: {
        name: methodology.name,
        description: methodology.description,
        nisabBasis: methodology.nisabBasis
      },
      nisab: nisabInfo,
      assets: meetsNisab ? zakatAssets : zakatAssets.map(a => ({ ...a, zakatDue: 0 })),
      totals,
      meetsNisab,
      status: 'pending',
      createdAt: new Date().toISOString(),
      calendarInfo: calendarInfo || undefined,
      sources: this.getScholarlySources(methodology.id)
    };
  }

  /**
   * Convert assets to base currency for calculation (optimized with batching)
   */
  private async convertAssetsToBaseCurrency(assets: Asset[]): Promise<Asset[]> {
    // Group assets by currency for batch processing
    const assetsByCurrency = new Map<string, Asset[]>();
    
    for (const asset of assets) {
      if (!assetsByCurrency.has(asset.currency)) {
        assetsByCurrency.set(asset.currency, []);
      }
      assetsByCurrency.get(asset.currency)!.push(asset);
    }

    const convertedAssets: Asset[] = [];
    const usdAssets = assetsByCurrency.get('USD') || [];
    
    // Add USD assets directly (no conversion needed)
    convertedAssets.push(...usdAssets);

    // Batch convert non-USD currencies
    const conversionPromises: Promise<void>[] = [];
    const currencyResults = new Map<string, number>();

    for (const [currency] of assetsByCurrency) {
      if (currency === 'USD') continue;
      
      conversionPromises.push(
        this.currencyService.getExchangeRate(currency, 'USD')
          .then(rate => {
            currencyResults.set(currency, rate);
          })
          .catch(() => {
            // Fallback to 1.0 rate
            currencyResults.set(currency, 1.0);
          })
      );
    }

    // Wait for all currency conversions to complete
    await Promise.all(conversionPromises);

    // Apply conversions
    for (const [currency, currencyAssets] of assetsByCurrency) {
      if (currency === 'USD') continue;
      
      const rate = currencyResults.get(currency) || 1.0;
      for (const asset of currencyAssets) {
        const convertedAsset = {
          ...asset,
          value: asset.value * rate,
          originalValue: asset.value,
          originalCurrency: asset.currency,
          currency: 'USD',
          exchangeRate: rate
        };
        convertedAssets.push(convertedAsset);
      }
    }

    return convertedAssets;
  }

  /**
   * Apply methodology-specific rules to assets
   */
  private applyMethodologyRules(assets: Asset[], methodology: MethodologyInfo): Asset[] {
    return assets.map(asset => {
      let zakatEligible = asset.zakatEligible;
      let adjustedValue = asset.value;

      // Apply business asset treatment rules
      if (asset.category === 'business') {
        switch (methodology.businessAssetTreatment) {
          case 'comprehensive':
            // Include all business assets at full value
            zakatEligible = true;
            break;
          case 'categorized':
            // Apply specific rules based on business asset type
            zakatEligible = this.isCategorizedBusinessAssetEligible(asset);
            break;
          case 'market_value':
            // Use current market value
            zakatEligible = true;
            adjustedValue = this.getMarketValue(asset);
            break;
        }
      }

      // Apply other methodology-specific adjustments
      return {
        ...asset,
        zakatEligible,
        value: adjustedValue
      };
    });
  }

  /**
   * Check if categorized business asset is eligible
   */
  private isCategorizedBusinessAssetEligible(asset: Asset): boolean {
    // Implement specific categorization rules
    // This would be based on the asset's subcategory and business type
    return asset.zakatEligible; // Simplified for now
  }

  /**
   * Get market value for asset
   */
  private getMarketValue(asset: Asset): number {
    // This would typically call external APIs or use internal valuation
    // For now, return the asset's current value
    return asset.value;
  }

  /**
   * Calculate zakat for individual assets
   */
  private calculateAssetZakat(assets: Asset[], methodology: MethodologyInfo): AssetCalculation[] {
    return assets.map(asset => {
      if (!asset.zakatEligible) {
        return {
          assetId: asset.assetId,
          name: asset.name,
          category: asset.category,
          value: asset.value,
          zakatableAmount: 0,
          zakatDue: 0,
          methodSpecificRules: ['Asset not eligible for zakat']
        };
      }

      const zakatableAmount = this.calculateZakatableAmount(asset, methodology);
      const zakatDue = zakatableAmount * (methodology.zakatRate / 100);

      return {
        assetId: asset.assetId,
        name: asset.name,
        category: asset.category,
        value: asset.value,
        zakatableAmount,
        zakatDue,
        methodSpecificRules: this.getMethodSpecificRules(asset, methodology)
      };
    });
  }

  /**
   * Calculate zakatable amount for an asset
   */
  private calculateZakatableAmount(asset: Asset, methodology: MethodologyInfo): number {
    // Methodology parameter available for future methodology-specific zakatable amount calculations
    void methodology; // Explicitly mark as intentionally unused for now

    switch (asset.category) {
      case 'cash':
      case 'gold':
      case 'silver':
      case 'crypto':
        return asset.value; // Fully zakatable
      
      case 'business':
        // Apply business-specific rules
        return this.calculateBusinessZakatableAmount(asset);
      
      case 'property':
        // Investment property - use current market value
        return asset.value;
      
      case 'stocks':
        // Apply stock-specific rules
        return this.calculateStockZakatableAmount(asset);
      
      case 'debts':
        // Receivables - typically fully zakatable if collectible
        return asset.value;
      
      default:
        return asset.value;
    }
  }

  /**
   * Calculate zakatable amount for business assets
   */
  private calculateBusinessZakatableAmount(asset: Asset): number {
    // This would implement detailed business asset rules based on methodology
    // For now, return full value
    return asset.value;
  }

  /**
   * Calculate zakatable amount for stock assets
   */
  private calculateStockZakatableAmount(asset: Asset): number {
    // This would implement stock-specific rules
    // Different methodologies may treat stocks differently
    return asset.value;
  }

  /**
   * Apply calendar adjustments for lunar calculations
   */
  private applyCalendarAdjustment(zakatDue: number, calendarInfo: CalendarCalculation): number {
    // Apply lunar year adjustment (354 days vs 365 days)
    if (calendarInfo.calculationPeriod === 'lunar') {
      return zakatDue * calendarInfo.adjustmentFactor;
    }
    return zakatDue;
  }

  /**
   * Generate detailed calculation breakdown
   */
  private generateBreakdown(
    calculation: ZakatCalculation,
    methodology: MethodologyInfo,
    nisabInfo: NisabInfo,
    assets: Asset[]
  ): CalculationBreakdown {
    const assetCalculations: AssetCalculation[] = assets.map(asset => {
      const zakatAsset = calculation.assets.find(za => za.assetId === asset.assetId);
      return {
        assetId: asset.assetId,
        name: asset.name,
        category: asset.category,
        value: asset.value,
        zakatableAmount: zakatAsset?.zakatableAmount || 0,
        zakatDue: zakatAsset?.zakatDue || 0,
        methodSpecificRules: this.getMethodSpecificRules(asset, methodology)
      };
    });

    return {
      method: methodology.id,
      nisabCalculation: {
        goldNisab: nisabInfo.goldNisab,
        silverNisab: nisabInfo.silverNisab,
        effectiveNisab: nisabInfo.effectiveNisab,
        basis: nisabInfo.nisabBasis
      },
      assetCalculations,
      finalCalculation: {
        totalAssets: calculation.totals.totalAssets,
        totalDeductions: 0, // Would include debt deductions
        zakatableAmount: calculation.totals.totalZakatableAssets,
        zakatDue: calculation.totals.totalZakatDue
      },
      sources: this.getScholarlySources(methodology.id),
      methodology: {
        name: methodology.name,
        description: methodology.description,
        nisabBasis: methodology.nisabBasis
      }
    };
  }

  /**
   * Get method-specific rules applied to an asset
   */
  private getMethodSpecificRules(asset: Asset, methodology: MethodologyInfo): string[] {
    const rules: string[] = [];
    
    rules.push(`Applied ${methodology.name} methodology`);
    rules.push(`Nisab basis: ${methodology.nisabBasis}`);
    rules.push(`Business treatment: ${methodology.businessAssetTreatment}`);
    
    if (asset.category === 'business') {
      rules.push(`Business asset treatment: ${methodology.businessAssetTreatment}`);
    }
    
    return rules;
  }

  /**
   * Calculate alternative methodologies for comparison
   */
  private async calculateAlternatives(
    assets: Asset[],
    request: ZakatCalculationRequest,
    primaryCalculation: ZakatCalculation
  ): Promise<AlternativeCalculation[]> {
    const alternatives: AlternativeCalculation[] = [];
    const otherMethods = Object.values(ZAKAT_METHODS).filter(m => m.id !== request.method);

    // Calculate up to 3 alternative methodologies
    for (const method of otherMethods.slice(0, 3)) {
      try {
        const altMethodology = {
          ...method,
          scholarlyBasis: [...method.scholarlyBasis],
          regions: [...method.regions],
          calendarSupport: [...method.calendarSupport],
          suitableFor: [...method.suitableFor],
          pros: [...method.pros],
          cons: [...method.cons]
        } as MethodologyInfo;

        // Get nisab for alternative method
        const altNisabInfo = await this.calculateNisabThreshold(altMethodology, request.customNisab);
        
        // Get calendar info if needed
        const altCalendarInfo = request.calendarType === 'lunar' 
          ? await this.calendarService.getCalendarInfo(new Date(request.calculationDate))
          : undefined;

        // Perform calculation directly (avoid recursion)
        const altCalculation = await this.performCalculation(
          assets,
          altMethodology,
          altNisabInfo,
          request,
          altCalendarInfo
        );
        
        alternatives.push({
          methodId: method.id,
          methodName: method.name,
          zakatDue: altCalculation.totals.totalZakatDue,
          effectiveNisab: altNisabInfo.effectiveNisab,
          differences: this.calculateMethodDifferences(primaryCalculation, altCalculation, altMethodology)
        });
      } catch {
        // Skip failed alternative calculations
        // Log error for debugging if needed
      }
    }

    return alternatives;
  }

  /**
   * Calculate differences between methodologies
   */
  private calculateMethodDifferences(primary: ZakatCalculation, alternative: ZakatCalculation, altMethod: MethodologyInfo): string[] {
    const differences: string[] = [];
    
    const zakatDiff = alternative.totals.totalZakatDue - primary.totals.totalZakatDue;
    if (Math.abs(zakatDiff) > 1) {
      differences.push(`Zakat amount differs by $${Math.abs(zakatDiff).toFixed(2)} (${zakatDiff > 0 ? 'higher' : 'lower'})`);
    }
    
    if (primary.nisab.nisabBasis !== alternative.nisab.nisabBasis) {
      differences.push(`Uses ${alternative.nisab.nisabBasis} nisab vs ${primary.nisab.nisabBasis}`);
    }
    
    differences.push(`Business treatment: ${altMethod.businessAssetTreatment}`);
    differences.push(`Debt approach: ${altMethod.debtDeduction}`);
    
    return differences;
  }

  /**
   * Generate calculation assumptions
   */
  private generateAssumptions(methodology: MethodologyInfo, nisabInfo: NisabInfo): string[] {
    return [
      `Using ${methodology.name} methodology`,
      `Nisab calculated based on ${nisabInfo.nisabBasis}`,
      `Current nisab threshold: $${nisabInfo.effectiveNisab.toFixed(2)}`,
      `Standard zakat rate: ${methodology.zakatRate}%`,
      `Currency conversion rates as of calculation date`,
      'All asset values as reported by user',
      'No extraordinary circumstances considered'
    ];
  }

  /**
   * Get scholarly sources for methodology
   */
  private getScholarlySources(methodId: string): string[] {
    const sources: { [key: string]: string[] } = {
      hanafi: [
        'Al-Hidayah by Burhan al-Din al-Marghinani',
        'Fath al-Qadir by Ibn al-Humam',
        'Contemporary Hanafi Fiqh Academies'
      ],
      shafii: [
        'Al-Majmu\' Sharh al-Muhadhdhab by Imam al-Nawawi',
        'Minhaj al-Talibin by Imam al-Nawawi',
        'AAOIFI Shafi\'i Guidelines'
      ],
      maliki: [
        'Al-Mudawwana by Imam Malik',
        'Bidayat al-Mujtahid by Ibn Rushd',
        'North African Fiqh Academies'
      ],
      hanbali: [
        'Al-Mughni by Ibn Qudamah',
        'Works of Ibn Taymiyyah',
        'Saudi Fiqh Academy'
      ],
      standard: [
        'AAOIFI Financial Accounting Standard 9 (FAS 9)',
        'IFSB Guidelines',
        'Contemporary Islamic Finance Research'
      ]
    };

    return sources[methodId] || ['Contemporary Islamic scholarship'];
  }

  /**
   * Map database asset category to ZakatEngine subCategory
   */
  private mapAssetSubCategory(category: string): string {
    const categoryLower = category.toLowerCase();
    
    switch (categoryLower) {
      case 'cash':
        return 'savings'; // Default subCategory for cash
      case 'gold':
        return 'jewelry'; // Default subCategory for gold
      case 'silver':
        return 'jewelry'; // Default subCategory for silver
      case 'business':
        return 'inventory'; // Default subCategory for business
      case 'property':
        return 'residential'; // Default subCategory for property
      case 'stocks':
        return 'equities'; // Default subCategory for stocks
      case 'crypto':
        return 'bitcoin'; // Default subCategory for crypto
      default:
        return 'other'; // Default fallback
    }
  }

  /**
   * Determine if an asset category is eligible for Zakat
   */
  private isAssetZakatEligible(category: string): boolean {
    const categoryLower = category.toLowerCase();
    
    // Assets that are generally zakatable
    const zakatableCategories = ['cash', 'gold', 'silver', 'business', 'stocks', 'crypto'];
    
    // Assets that are generally not zakatable
    const nonZakatableCategories = ['property']; // Real estate for personal use
    
    if (zakatableCategories.includes(categoryLower)) {
      return true;
    }
    
    if (nonZakatableCategories.includes(categoryLower)) {
      return false;
    }
    
    // Default to eligible for unknown categories (conservative approach)
    return true;
  }
}