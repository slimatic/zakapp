import { Asset, AssetCategoryType, ASSET_CATEGORIES } from '@zakapp/shared';
import {
  readUserFile,
  writeUserFile,
  generateUserId,
} from '../utils/fileSystem.js';
import { CreateAssetRequest, UpdateAssetRequest } from '../utils/validation.js';

// Asset storage interface
interface StoredAsset extends Asset {
  userId: string;
}

interface AssetFilters {
  category?: string;
  subCategory?: string;
  year?: string;
  zakatEligible?: boolean;
  currency?: string;
  search?: string; // Search in asset names and descriptions
  minValue?: number;
  maxValue?: number;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
}

class AssetService {
  private readonly ASSETS_FILE = 'assets.json';
  private readonly ASSET_HISTORY_FILE = 'asset_history.json';

  /**
   * Get all assets for a user with optional filtering
   */
  async getUserAssets(userId: string, filters: AssetFilters = {}): Promise<Asset[]> {
    try {
      const assetsData = await readUserFile(userId, this.ASSETS_FILE);
      let assets = (assetsData.assets || []) as Asset[];

      // Apply filters
      if (filters.category) {
        assets = assets.filter(asset => asset.category === filters.category);
      }

      if (filters.subCategory) {
        assets = assets.filter(asset => asset.subCategory === filters.subCategory);
      }

      if (filters.year) {
        const year = parseInt(filters.year);
        assets = assets.filter(asset => {
          const assetYear = new Date(asset.createdAt).getFullYear();
          return assetYear === year;
        });
      }

      if (filters.zakatEligible !== undefined) {
        assets = assets.filter(asset => asset.zakatEligible === filters.zakatEligible);
      }

      if (filters.currency) {
        assets = assets.filter(asset => asset.currency === filters.currency);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        assets = assets.filter(asset => 
          asset.name.toLowerCase().includes(searchTerm) ||
          (asset.description && asset.description.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.minValue !== undefined) {
        assets = assets.filter(asset => asset.value >= filters.minValue!);
      }

      if (filters.maxValue !== undefined) {
        assets = assets.filter(asset => asset.value <= filters.maxValue!);
      }

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        assets = assets.filter(asset => new Date(asset.createdAt) >= fromDate);
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        assets = assets.filter(asset => new Date(asset.createdAt) <= toDate);
      }

      return assets;
    } catch (error) {
      // If file doesn't exist, return empty array
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Create a new asset
   */
  async createAsset(userId: string, assetData: CreateAssetRequest): Promise<Asset> {
    const assetId = generateUserId(); // Reuse the UUID generator
    const now = new Date().toISOString();

    const asset: Asset = {
      assetId,
      name: assetData.name,
      category: assetData.category,
      subCategory: assetData.subCategory,
      value: assetData.value,
      currency: assetData.currency,
      description: assetData.description,
      zakatEligible: assetData.zakatEligible,
      createdAt: now,
      updatedAt: now,
    };

    // Get existing assets
    const existingAssets = await this.getUserAssets(userId);
    const updatedAssets = [...existingAssets, asset];

    // Save assets
    await writeUserFile(userId, this.ASSETS_FILE, { assets: updatedAssets });

    // Track history
    await this.addAssetHistory(userId, assetId, 'created', asset);

    return asset;
  }

  /**
   * Update an existing asset
   */
  async updateAsset(userId: string, assetId: string, updateData: UpdateAssetRequest): Promise<Asset | null> {
    const existingAssets = await this.getUserAssets(userId);
    const assetIndex = existingAssets.findIndex(asset => asset.assetId === assetId);

    if (assetIndex === -1) {
      return null;
    }

    const existingAsset = existingAssets[assetIndex];
    const now = new Date().toISOString();

    const updatedAsset: Asset = {
      ...existingAsset,
      ...updateData,
      updatedAt: now,
    };

    existingAssets[assetIndex] = updatedAsset;

    // Save assets
    await writeUserFile(userId, this.ASSETS_FILE, { assets: existingAssets });

    // Track history
    await this.addAssetHistory(userId, assetId, 'updated', updatedAsset, existingAsset);

    return updatedAsset;
  }

  /**
   * Delete an asset
   */
  async deleteAsset(userId: string, assetId: string): Promise<boolean> {
    const existingAssets = await this.getUserAssets(userId);
    const assetIndex = existingAssets.findIndex(asset => asset.assetId === assetId);

    if (assetIndex === -1) {
      return false;
    }

    const deletedAsset = existingAssets[assetIndex];
    existingAssets.splice(assetIndex, 1);

    // Save assets
    await writeUserFile(userId, this.ASSETS_FILE, { assets: existingAssets });

    // Track history
    await this.addAssetHistory(userId, assetId, 'deleted', deletedAsset);

    return true;
  }

  /**
   * Get asset by ID
   */
  async getAssetById(userId: string, assetId: string): Promise<Asset | null> {
    const assets = await this.getUserAssets(userId);
    return assets.find(asset => asset.assetId === assetId) || null;
  }

  /**
   * Get assets by category
   */
  async getAssetsByCategory(userId: string, category: AssetCategoryType): Promise<Asset[]> {
    return this.getUserAssets(userId, { category });
  }

  /**
   * Get asset history for a user
   */
  async getAssetHistory(userId: string, assetId?: string): Promise<any[]> {
    try {
      const historyData = await readUserFile(userId, this.ASSET_HISTORY_FILE);
      let history: any[] = Array.isArray(historyData.history) ? historyData.history : [];

      if (assetId) {
        history = history.filter((entry: any) => entry.assetId === assetId);
      }

      return history;
    } catch (error) {
      // If file doesn't exist, return empty array
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Add an entry to asset history
   */
  private async addAssetHistory(
    userId: string,
    assetId: string,
    action: 'created' | 'updated' | 'deleted',
    newData: Asset,
    oldData?: Asset
  ): Promise<void> {
    try {
      const historyData = await readUserFile(userId, this.ASSET_HISTORY_FILE);
      const history: any[] = Array.isArray(historyData.history) ? historyData.history : [];

      const historyEntry = {
        historyId: generateUserId(),
        assetId,
        action,
        timestamp: new Date().toISOString(),
        newData,
        oldData,
      };

      history.push(historyEntry);

      // Keep only last 100 entries per asset to prevent unbounded growth
      const filteredHistory = history
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100);

      await writeUserFile(userId, this.ASSET_HISTORY_FILE, { history: filteredHistory });
    } catch (error) {
      console.error('Failed to record asset history:', error);
      // Don't fail the main operation if history recording fails
    }
  }

  /**
   * Get asset statistics for a user
   */
  async getAssetStatistics(userId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    totalZakatEligible: number;
    assetsByCategory: Record<string, number>;
  }> {
    const assets = await this.getUserAssets(userId);

    const statistics = {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + asset.value, 0),
      totalZakatEligible: assets
        .filter(asset => asset.zakatEligible)
        .reduce((sum, asset) => sum + asset.value, 0),
      assetsByCategory: {} as Record<string, number>,
    };

    // Group by category
    assets.forEach(asset => {
      const category = asset.category;
      statistics.assetsByCategory[category] = (statistics.assetsByCategory[category] || 0) + asset.value;
    });

    return statistics;
  }

  /**
   * Get assets grouped by category
   */
  async getAssetsGroupedByCategory(userId: string): Promise<Record<string, Asset[]>> {
    const assets = await this.getUserAssets(userId);
    const grouped: Record<string, Asset[]> = {};
    
    assets.forEach(asset => {
      if (!grouped[asset.category]) {
        grouped[asset.category] = [];
      }
      grouped[asset.category].push(asset);
    });
    
    return grouped;
  }

  /**
   * Get available subcategories for a specific category
   */
  getSubcategoriesForCategory(category: string): readonly {id: string, name: string, zakatRate: number}[] {
    const categoryKey = category.toUpperCase() as keyof typeof ASSET_CATEGORIES;
    const categoryData = ASSET_CATEGORIES[categoryKey];
    return categoryData?.subCategories || [];
  }

  /**
   * Get enhanced asset statistics with category breakdown
   */
  async getEnhancedAssetStatistics(userId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    totalZakatEligible: number;
    assetsByCategory: Record<string, {count: number, totalValue: number, zakatEligibleValue: number}>;
    assetsByCurrency: Record<string, {count: number, totalValue: number}>;
  }> {
    const assets = await this.getUserAssets(userId);
    
    const stats = {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + asset.value, 0),
      totalZakatEligible: assets
        .filter(asset => asset.zakatEligible)
        .reduce((sum, asset) => sum + asset.value, 0),
      assetsByCategory: {} as Record<string, {count: number, totalValue: number, zakatEligibleValue: number}>,
      assetsByCurrency: {} as Record<string, {count: number, totalValue: number}>,
    };

    // Group by category
    assets.forEach(asset => {
      const category = asset.category;
      if (!stats.assetsByCategory[category]) {
        stats.assetsByCategory[category] = { count: 0, totalValue: 0, zakatEligibleValue: 0 };
      }
      stats.assetsByCategory[category].count++;
      stats.assetsByCategory[category].totalValue += asset.value;
      if (asset.zakatEligible) {
        stats.assetsByCategory[category].zakatEligibleValue += asset.value;
      }
    });

    // Group by currency  
    assets.forEach(asset => {
      const currency = asset.currency;
      if (!stats.assetsByCurrency[currency]) {
        stats.assetsByCurrency[currency] = { count: 0, totalValue: 0 };
      }
      stats.assetsByCurrency[currency].count++;
      stats.assetsByCurrency[currency].totalValue += asset.value;
    });

    return stats;
  }
}

// Export singleton instance
export const assetService = new AssetService();