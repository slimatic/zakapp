import { Asset, AssetCategoryType } from '@zakapp/shared';
import {
  readUserFile,
  writeUserFile,
  generateUserId,
} from '../utils/fileSystem.js';
import { CreateAssetRequest, UpdateAssetRequest } from '../utils/validation.js';
import { StoredAsset, AssetFilters, AssetHistory, AssetSummary } from '../models/index.js';



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

      if (filters.year) {
        const year = parseInt(filters.year);
        assets = assets.filter(asset => {
          const assetYear = new Date(asset.createdAt).getFullYear();
          return assetYear === year;
        });
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
}

// Export singleton instance
export const assetService = new AssetService();