import { randomUUID } from 'crypto';
import { userAssets } from '../controllers/AssetController';
import { ZakatEngine } from './zakatEngine';
import { CurrencyService } from './currencyService';
import { CalendarService } from './calendarService';
import { NisabService } from './nisabService';
import { AssetService } from './assetService';
import { 
  ZakatCalculationRequest, 
  ZakatCalculationResult,
  MethodologyInfo,
  Asset,
  ZakatCalculation
} from '../../../shared/src/types';
import { ZAKAT_METHODS } from '../../../shared/src/constants';

// Legacy interfaces for backward compatibility
interface LegacyAsset {
  id: string;
  name: string;
  type: string;
  value: number;
  currency: string;
  weight?: number;
  unit?: string;
  cryptoType?: string;
  quantity?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface LegacyZakatCalculationRequest {
  methodologyId: string;
  year?: number;
  includeAssetTypes?: string[];
  excludeAssetIds?: string[];
}

interface LegacyMethodology {
  id: string;
  name: string;
  description: string;
  nisabMethod: 'GOLD' | 'SILVER' | 'DUAL';
  zakatRate: number;
}

interface LegacyAssetBreakdown {
  type: string;
  totalValue: number;
  zakatableAmount: number;
  zakatOwed: number;
}

interface LegacyZakatCalculation {
  id: string;
  userId: string;
  methodology: LegacyMethodology;
  totalAssetValue: number;
  zakatableAmount: number;
  zakatOwed: number;
  nisabThreshold: number;
  nisabMethod: 'GOLD' | 'SILVER' | 'DUAL';
  isAboveNisab: boolean;
  zakatRate: number;
  assetBreakdown: LegacyAssetBreakdown[];
  reason?: string;
}

export class ZakatService {
  private zakatEngine: ZakatEngine;
  private assetService: AssetService;
  private nisabService: NisabService;

  constructor() {
    // Initialize services
    const currencyService = new CurrencyService();
    const calendarService = new CalendarService();
    this.nisabService = new NisabService();
    this.assetService = new AssetService();
    
    // Initialize zakat engine
    this.zakatEngine = new ZakatEngine(currencyService, calendarService, this.nisabService);
  }

  /**
   * Get all available methodologies
   */
  getMethodologies(): MethodologyInfo[] {
    return Object.values(ZAKAT_METHODS);
  }

  /**
   * Get current nisab information
   */
  async getNisab() {
    return await this.nisabService.calculateNisabThresholds();
  }

  /**
   * Get user assets from existing AssetController storage
   */
  async getUserAssets(userId: string): Promise<LegacyAsset[]> {
    return userAssets[userId] || [];
  }

  /**
   * Enhanced calculate Zakat using the new ZakatEngine
   */
  async calculateZakat(
    request: LegacyZakatCalculationRequest, 
    userId: string
  ): Promise<LegacyZakatCalculation> {
    
    if (!request.methodologyId) {
      throw new Error('Methodology ID is required');
    }

    try {
      // Convert legacy assets to new format
      const legacyAssets = await this.getUserAssets(userId);
      const assets = this.convertLegacyAssets(legacyAssets);

      // Filter assets based on request
      let filteredAssets = assets;
      if (request.includeAssetTypes && request.includeAssetTypes.length > 0) {
        filteredAssets = assets.filter(asset => request.includeAssetTypes!.includes(asset.category));
      }
      if (request.excludeAssetIds && request.excludeAssetIds.length > 0) {
        filteredAssets = filteredAssets.filter(asset => !request.excludeAssetIds!.includes(asset.assetId));
      }

      // Create modern calculation request
      const modernRequest: ZakatCalculationRequest = {
        calculationDate: new Date().toISOString(),
        calendarType: 'lunar',
        method: request.methodologyId,
        includeAssets: filteredAssets.map(asset => asset.assetId)
      };

      // Use modern calculation engine but with asset data
      const result = await this.calculateWithAssets(modernRequest, filteredAssets);

      // Convert back to legacy format
      return this.convertToLegacyCalculation(result, userId);

    } catch (error) {
      console.error('Zakat calculation error:', error);
      throw new Error(`Zakat calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate zakat with provided assets (used internally)
   */
  private async calculateWithAssets(request: ZakatCalculationRequest, assets: Asset[]): Promise<ZakatCalculationResult> {
    // Get methodology information
    const methodology = Object.values(ZAKAT_METHODS).find(m => m.id === request.method);
    if (!methodology) {
      throw new Error(`Unknown methodology: ${request.method}`);
    }

    // Get nisab values
    const nisabInfo = await this.nisabService.calculateNisabThresholds();
    
    // Determine effective nisab based on methodology
    let effectiveNisab: number;
    let nisabBasis: string;

    switch (methodology.nisabBasis) {
      case 'gold':
        effectiveNisab = nisabInfo.goldNisab;
        nisabBasis = 'gold';
        break;
      case 'silver':
        effectiveNisab = nisabInfo.silverNisab;
        nisabBasis = 'silver';
        break;
      case 'dual_minimum':
      default:
        effectiveNisab = Math.min(nisabInfo.goldNisab, nisabInfo.silverNisab);
        nisabBasis = nisabInfo.goldNisab < nisabInfo.silverNisab ? 'gold' : 'silver';
        break;
    }

    // Calculate totals
    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const zakatableAssets = assets.filter(asset => asset.zakatEligible);
    const totalZakatableAssets = zakatableAssets.reduce((sum, asset) => sum + asset.value, 0);
    
    // Check nisab eligibility
    const meetsNisab = totalZakatableAssets >= effectiveNisab;
    const zakatRate = methodology.zakatRate / 100;
    const totalZakatDue = meetsNisab ? totalZakatableAssets * zakatRate : 0;

    // Calculate individual asset zakat
    const zakatAssets = zakatableAssets.map(asset => ({
      assetId: asset.assetId,
      name: asset.name,
      category: asset.category,
      value: asset.value,
      zakatableAmount: meetsNisab ? asset.value : 0,
      zakatDue: meetsNisab ? asset.value * zakatRate : 0
    }));

    // Create calculation result
    const calculation: ZakatCalculation = {
      calculationId: randomUUID(),
      calculationDate: request.calculationDate,
      calendarType: request.calendarType,
      method: methodology.id,
      methodInfo: {
        name: methodology.name,
        description: methodology.description,
        nisabBasis: methodology.nisabBasis
      },
      nisab: {
        goldNisab: nisabInfo.goldNisab,
        silverNisab: nisabInfo.silverNisab,
        effectiveNisab,
        nisabBasis,
        calculationMethod: methodology.id
      },
      assets: zakatAssets,
      totals: {
        totalAssets,
        totalZakatableAssets,
        totalZakatDue
      },
      meetsNisab,
      status: 'pending',
      createdAt: new Date().toISOString(),
      sources: [`${methodology.name} methodology applied`]
    };

    // Mock result structure
    return {
      result: calculation,
      methodology,
      breakdown: {
        method: methodology.id,
        methodology: {
          name: methodology.name,
          description: methodology.description,
          nisabBasis: methodology.nisabBasis
        }
      },
      assumptions: [
        `Using ${methodology.name} methodology`,
        `Nisab threshold: $${effectiveNisab.toFixed(2)}`,
        `Standard zakat rate: ${methodology.zakatRate}%`
      ],
      sources: [`${methodology.name} methodology`],
      alternatives: []
    };
  }

  /**
   * Convert legacy assets to modern format
   */
  private convertLegacyAssets(legacyAssets: LegacyAsset[]): Asset[] {
    return legacyAssets.map(legacy => ({
      assetId: legacy.id,
      name: legacy.name,
      category: this.mapLegacyTypeToCategory(legacy.type),
      subCategory: legacy.type,
      value: legacy.value,
      currency: legacy.currency,
      description: '',
      zakatEligible: true, // Assume all assets are zakat eligible for now
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt
    }));
  }

  /**
   * Map legacy asset types to new categories
   */
  private mapLegacyTypeToCategory(legacyType: string): any {
    const typeMapping: { [key: string]: any } = {
      'cash': 'cash',
      'savings': 'cash',
      'gold': 'gold',
      'silver': 'silver',
      'crypto': 'crypto',
      'stocks': 'stocks',
      'business': 'business',
      'property': 'property',
      'debt': 'debts'
    };
    return typeMapping[legacyType] || 'cash';
  }

  /**
   * Convert modern calculation result to legacy format
   */
  private convertToLegacyCalculation(result: ZakatCalculationResult, userId: string): LegacyZakatCalculation {
    const methodology = result.methodology;
    const calculation = result.result;

    // Create asset breakdown by category
    const assetBreakdown: LegacyAssetBreakdown[] = [];
    const categoryTotals: { [key: string]: { totalValue: number; zakatableAmount: number; zakatOwed: number } } = {};

    calculation.assets.forEach(asset => {
      if (!categoryTotals[asset.category]) {
        categoryTotals[asset.category] = { totalValue: 0, zakatableAmount: 0, zakatOwed: 0 };
      }
      categoryTotals[asset.category].totalValue += asset.value;
      categoryTotals[asset.category].zakatableAmount += asset.zakatableAmount;
      categoryTotals[asset.category].zakatOwed += asset.zakatDue;
    });

    Object.entries(categoryTotals).forEach(([type, totals]) => {
      assetBreakdown.push({
        type,
        totalValue: totals.totalValue,
        zakatableAmount: totals.zakatableAmount,
        zakatOwed: totals.zakatOwed
      });
    });

    return {
      id: calculation.calculationId,
      userId,
      methodology: {
        id: methodology.id,
        name: methodology.name,
        description: methodology.description,
        nisabMethod: this.mapNisabBasisToLegacy(methodology.nisabBasis),
        zakatRate: methodology.zakatRate
      },
      totalAssetValue: calculation.totals.totalAssets,
      zakatableAmount: calculation.totals.totalZakatableAssets,
      zakatOwed: calculation.totals.totalZakatDue,
      nisabThreshold: calculation.nisab.effectiveNisab,
      nisabMethod: this.mapNisabBasisToLegacy(calculation.nisab.nisabBasis),
      isAboveNisab: calculation.meetsNisab,
      zakatRate: methodology.zakatRate,
      assetBreakdown
    };
  }

  /**
   * Map nisab basis to legacy format
   */
  private mapNisabBasisToLegacy(nisabBasis: string): 'GOLD' | 'SILVER' | 'DUAL' {
    switch (nisabBasis) {
      case 'gold':
        return 'GOLD';
      case 'silver':
        return 'SILVER';
      case 'dual_minimum':
      case 'dual_flexible':
      default:
        return 'DUAL';
    }
  }

  /**
   * Validate calculation request (legacy support)
   */
  validateCalculationRequest(request: LegacyZakatCalculationRequest): void {
    if (!request.methodologyId) {
      throw new Error('Methodology ID is required');
    }

    // Check if methodology exists in new system
    const methodologyExists = Object.values(ZAKAT_METHODS).some(m => m.id === request.methodologyId);
    if (!methodologyExists) {
      throw new Error('Invalid methodology ID');
    }
  }

  /**
   * Get methodology information (legacy support)
   */
  getMethodology(methodId: string): LegacyMethodology | null {
    const methodology = Object.values(ZAKAT_METHODS).find(m => m.id === methodId);
    if (!methodology) {
      return null;
    }

    return {
      id: methodology.id,
      name: methodology.name,
      description: methodology.description,
      nisabMethod: this.mapNisabBasisToLegacy(methodology.nisabBasis),
      zakatRate: methodology.zakatRate
    };
  }

  /**
   * Get all methodologies (legacy support)
   */
  getAllMethodologies(): LegacyMethodology[] {
    return Object.values(ZAKAT_METHODS).map(methodology => ({
      id: methodology.id,
      name: methodology.name,
      description: methodology.description,
      nisabMethod: this.mapNisabBasisToLegacy(methodology.nisabBasis),
      zakatRate: methodology.zakatRate
    }));
  }
}

export const zakatService = new ZakatService();