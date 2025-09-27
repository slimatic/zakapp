import { randomUUID } from 'crypto';
import { userAssets } from '../controllers/AssetController';

// Import shared types (for now create local interfaces matching expected structure)
interface Asset {
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

interface ZakatCalculationRequest {
  methodologyId: string;
  year?: number;
  includeAssetTypes?: string[];
  excludeAssetIds?: string[];
}

interface Methodology {
  id: string;
  name: string;
  description: string;
  nisabMethod: 'GOLD' | 'SILVER' | 'DUAL';
  zakatRate: number;
}

interface AssetBreakdown {
  type: string;
  totalValue: number;
  zakatableAmount: number;
  zakatOwed: number;
}

interface ZakatCalculation {
  id: string;
  userId: string;
  methodology: Methodology;
  totalAssetValue: number;
  zakatableAmount: number;
  zakatOwed: number;
  nisabThreshold: number;
  nisabMethod: 'GOLD' | 'SILVER' | 'DUAL';
  isAboveNisab: boolean;
  zakatRate: number;
  assetBreakdown: AssetBreakdown[];
  reason?: string;
}

const METHODOLOGIES: { [key: string]: Methodology } = {
  'standard': {
    id: 'standard',
    name: 'Standard',
    description: 'Standard Zakat calculation methodology',
    nisabMethod: 'DUAL',
    zakatRate: 2.5
  },
  'hanafi': {
    id: 'hanafi',
    name: 'Hanafi',
    description: 'Hanafi school methodology',
    nisabMethod: 'SILVER',
    zakatRate: 2.5
  }
};

// Mock nisab values (should be from external API in real implementation)
const NISAB_VALUES = {
  GOLD: 2947.78, // ~85g * $65/g
  SILVER: 357.00, // ~595g * $0.6/g
  get DUAL() { return Math.min(this.GOLD, this.SILVER); }
};

export class ZakatService {
  
  /**
   * Get user assets from existing AssetController storage
   */
  async getUserAssets(userId: string): Promise<Asset[]> {
    return userAssets[userId] || [];
  }

  /**
   * Calculate Zakat based on request and available assets
   */
  async calculateZakat(
    request: ZakatCalculationRequest, 
    userId: string
  ): Promise<ZakatCalculation> {
    
    if (!request.methodologyId) {
      throw new Error('Methodology ID is required');
    }

    const methodology = METHODOLOGIES[request.methodologyId];
    if (!methodology) {
      throw new Error(`Unknown methodology: ${request.methodologyId}`);
    }

    // Get user assets
    const allUserAssets = await this.getUserAssets(userId);

    // Filter assets based on request
    let includedAssets = allUserAssets;
    
    if (request.includeAssetTypes && request.includeAssetTypes.length > 0) {
      includedAssets = includedAssets.filter(asset => 
        request.includeAssetTypes!.includes(asset.type)
      );
    }
    
    if (request.excludeAssetIds && request.excludeAssetIds.length > 0) {
      includedAssets = includedAssets.filter(asset => 
        !request.excludeAssetIds!.includes(asset.id)
      );
    }

    // Calculate totals
    const totalAssetValue = includedAssets.reduce((sum, asset) => sum + asset.value, 0);
    
    // All assets are fully zakatable for simplicity (in real implementation this would be more complex)
    const zakatableAmount = totalAssetValue;

    // Determine nisab threshold based on methodology
    let nisabThreshold: number;
    let nisabMethod: 'GOLD' | 'SILVER' | 'DUAL';
    switch (methodology.nisabMethod) {
      case 'GOLD':
        nisabThreshold = NISAB_VALUES.GOLD;
        nisabMethod = 'GOLD';
        break;
      case 'SILVER':
        nisabThreshold = NISAB_VALUES.SILVER;
        nisabMethod = 'SILVER';
        break;
      case 'DUAL':
      default:
        nisabThreshold = NISAB_VALUES.DUAL;
        nisabMethod = 'DUAL';
        break;
    }

    const isAboveNisab = zakatableAmount >= nisabThreshold;
    const zakatOwed = isAboveNisab ? (zakatableAmount * methodology.zakatRate / 100) : 0;

    // Generate asset breakdown
    const assetBreakdown = this.generateAssetBreakdown(includedAssets, methodology, isAboveNisab);

    const result: ZakatCalculation = {
      id: randomUUID(),
      userId,
      methodology,
      totalAssetValue,
      zakatableAmount,
      zakatOwed,
      nisabThreshold,
      nisabMethod,
      isAboveNisab,
      zakatRate: methodology.zakatRate,
      assetBreakdown
    };

    if (!isAboveNisab) {
      result.reason = 'Below nisab threshold';
    }

    return result;
  }

  /**
   * Generate detailed asset breakdown
   */
  private generateAssetBreakdown(
    assets: Asset[], 
    methodology: Methodology, 
    isAboveNisab: boolean
  ): AssetBreakdown[] {
    const breakdownMap = new Map<string, AssetBreakdown>();

    assets.forEach(asset => {
      const existing = breakdownMap.get(asset.type);
      const zakatOwed = isAboveNisab ? (asset.value * methodology.zakatRate / 100) : 0;
      
      if (existing) {
        existing.totalValue += asset.value;
        existing.zakatableAmount += asset.value; // Simplified - all assets fully zakatable
        existing.zakatOwed += zakatOwed;
      } else {
        breakdownMap.set(asset.type, {
          type: asset.type,
          totalValue: asset.value,
          zakatableAmount: asset.value, // Simplified - all assets fully zakatable
          zakatOwed
        });
      }
    });

    return Array.from(breakdownMap.values());
  }

  /**
   * Validate calculation request
   */
  validateCalculationRequest(request: ZakatCalculationRequest): void {
    if (!request.methodologyId) {
      throw new Error('Methodology ID is required');
    }

    if (!METHODOLOGIES[request.methodologyId]) {
      throw new Error('Invalid methodology ID');
    }
  }
}

export const zakatService = new ZakatService();