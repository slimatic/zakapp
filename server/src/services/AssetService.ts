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

import { EncryptionService } from './EncryptionService';
import { determineModifier } from '../utils/assetModifiers';
// import { PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '@zakapp/shared';

const PASSIVE_INVESTMENT_TYPES = [
  'STOCK',
  'ETF',
  'MUTUAL_FUND',
  'ROTH_IRA',
] as const;

const RESTRICTED_ACCOUNT_TYPES = [
  '401K',
  'TRADITIONAL_IRA',
  'PENSION',
  'ROTH_IRA',
] as const;
import { prisma } from '../utils/prisma';

import { getEncryptionKey } from '../config/security';

const ENCRYPTION_KEY = getEncryptionKey();

export interface CreateAssetDto {
  category: string;
  name: string;
  value: number;
  currency: string;
  acquisitionDate: Date;
  metadata?: any;
  notes?: string;
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}

export interface UpdateAssetDto {
  category?: string;
  name?: string;
  value?: number;
  currency?: string;
  acquisitionDate?: Date;
  metadata?: any;
  notes?: string;
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}

export interface AssetFilters {
  category?: string;
  currency?: string;
  minValue?: number;
  maxValue?: number;
  modifierType?: 'passive' | 'restricted' | 'full';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'value' | 'createdAt' | 'acquisitionDate';
  sortOrder?: 'asc' | 'desc';
}

export class AssetService {
  /**
   * Create a new asset
   * Automatically calculates and applies calculation modifier based on asset flags
   */
  async createAsset(userId: string, assetData: CreateAssetDto) {
    // Check resource limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxAssets: true }
    });

    // Default to strict limit if user fetch fails or property missing (shouldn't happen)
    const envLimit = parseInt(process.env.DEFAULT_MAX_ASSETS || '50');
    const limit = user?.maxAssets ?? envLimit;

    // Count active assets
    const currentCount = await prisma.asset.count({
      where: { userId, isActive: true }
    });

    if (currentCount >= limit) {
      throw new Error(`Asset limit reached. You can create a maximum of ${limit} assets.`);
    }

    // Normalize and validate asset category (accept common variants)
    const validCategories = ['cash', 'gold', 'silver', 'business', 'property', 'stocks', 'crypto', 'debts', 'expenses', '401k', 'traditional ira', 'roth ira', 'pension'];

    // Normalize input by trimming, lowercasing and treating spaces, hyphens and
    // underscores as equivalent separators (e.g. PRIMARY_RESIDENCE -> primary residence)
    const normalizeKey = (input: string) => input.trim().toLowerCase().replace(/[_\s-]+/g, ' ');

    const CATEGORY_SYNONYMS: Record<string, string> = {
      'investment account': 'stocks',
      'investment_account': 'stocks',
      'investment-account': 'stocks',
      'investment': 'stocks',
      'stock': 'stocks',
      'stocks': 'stocks',
      'crypto': 'crypto',
      'cryptocurrency': 'crypto',
      'bank account': 'cash',
      'bank_account': 'cash',
      '401k': '401k',
      'traditional ira': 'traditional ira',
      'roth ira': 'roth ira',
      'pension': 'pension',
      'business inventory': 'business',
      'business': 'business',
      'property': 'property',
      'primary residence': 'property',
      'debts': 'debts',
      'loan receivable': 'debts',
      'expenses': 'expenses',
      'other': 'expenses'
    };

    const rawCategory = String(assetData.category || '').trim();
    const key = normalizeKey(rawCategory);
    const normalizedCategory = CATEGORY_SYNONYMS[key] || key;

    if (!validCategories.includes(normalizedCategory)) {
      throw new Error('Invalid asset category');
    }

    // Validate modifier flags
    const isPassiveInvestment = assetData.isPassiveInvestment || false;
    const isRestrictedAccount = assetData.isRestrictedAccount || false;

    // Passive only valid for specific types (compare case-insensitively)
    const passiveTypes = (PASSIVE_INVESTMENT_TYPES as readonly string[]).map(s => String(s).toLowerCase());
    if (isPassiveInvestment && !passiveTypes.includes(normalizedCategory)) {
      throw new Error('Passive investment flag can only be set for Stock, ETF, Mutual Fund, or Roth IRA');
    }

    // Restricted only valid for specific types
    const restrictedTypes = (RESTRICTED_ACCOUNT_TYPES as readonly string[]).map(s => String(s).toLowerCase());
    if (isRestrictedAccount && !restrictedTypes.includes(normalizedCategory)) {
      throw new Error('Restricted account flag can only be set for 401k, Traditional IRA, Pension, or Roth IRA');
    }

    // Cannot be both passive and restricted
    if (isPassiveInvestment && isRestrictedAccount) {
      throw new Error('Asset cannot be both passive investment and restricted account');
    }

    // Calculate modifier
    const calculationModifier = determineModifier({
      isRestrictedAccount,
      isPassiveInvestment,
    });

    // Encrypt metadata if provided
    let encryptedMetadata = null;
    if (assetData.metadata) {
      encryptedMetadata = await EncryptionService.encryptObject(assetData.metadata, ENCRYPTION_KEY);
    }

    const asset = await prisma.asset.create({
      data: {
        userId,
        category: normalizedCategory,
        name: assetData.name,
        value: assetData.value,
        currency: assetData.currency,
        acquisitionDate: assetData.acquisitionDate,
        metadata: encryptedMetadata,
        notes: assetData.notes || null,
        calculationModifier,
        isPassiveInvestment,
        isRestrictedAccount,
        isActive: true
      }
    });

    return this.decryptAsset(asset);
  }

  /**
   * Get all assets for a user with modifier filtering support
   */
  async getUserAssets(userId: string, filters: AssetFilters = {}) {
    const {
      category,
      currency,
      minValue,
      maxValue,
      modifierType,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Build where clause
    const where: any = {
      userId,
      isActive: true
    };

    if (category) {
      where.category = category.toUpperCase();
    }

    if (currency) {
      where.currency = currency.toUpperCase();
    }

    // Add modifier type filter
    if (modifierType) {
      switch (modifierType) {
        case 'passive':
          where.calculationModifier = 0.3;
          break;
        case 'restricted':
          where.calculationModifier = 0.0;
          break;
        case 'full':
          where.calculationModifier = 1.0;
          break;
      }
    }

    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {};
      if (minValue !== undefined) where.value.gte = minValue;
      if (maxValue !== undefined) where.value.lte = maxValue;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get assets with pagination
    const [assets, totalCount] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.asset.count({ where })
    ]);

    // Decrypt assets
    const decryptedAssets = await Promise.all(assets.map(asset => this.decryptAsset(asset)));

    // Calculate portfolio summary
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const assetsByCategory = assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + asset.value;
      return acc;
    }, {} as Record<string, number>);

    return {
      assets: decryptedAssets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      summary: {
        totalValue,
        assetCount: totalCount,
        assetsByCategory
      }
    };
  }

  /**
   * Get asset by ID
   */
  async getAssetById(userId: string, assetId: string) {
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
        isActive: true
      }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    return this.decryptAsset(asset);
  }

  /**
   * Update asset
   * Recalculates modifier if flags change
   */
  async updateAsset(userId: string, assetId: string, updateData: UpdateAssetDto) {
    // Check if asset exists and belongs to user
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
        isActive: true
      }
    });

    if (!existingAsset) {
      throw new Error('Asset not found');
    }

    // Prepare update data
    const updatePayload: any = { ...updateData };

    // Validate modifier flags if they're being updated
    const newIsPassiveInvestment = updateData.isPassiveInvestment !== undefined ? updateData.isPassiveInvestment : existingAsset.isPassiveInvestment;
    const newIsRestrictedAccount = updateData.isRestrictedAccount !== undefined ? updateData.isRestrictedAccount : existingAsset.isRestrictedAccount;

    // Normalize and validate new category (treat underscores/hyphens/spaces equivalently)
    const normalizeKey = (input: string) => String(input).trim().toLowerCase().replace(/[_\s-]+/g, ' ');
    const CATEGORY_SYNONYMS: Record<string, string> = {
      'investment account': 'stocks',
      'investment_account': 'stocks',
      'investment-account': 'stocks',
      'investment': 'stocks',
      'stock': 'stocks',
      'stocks': 'stocks',
      'crypto': 'crypto',
      'cryptocurrency': 'crypto',
      'bank account': 'cash',
      'bank_account': 'cash',
      '401k': '401k',
      'traditional ira': 'traditional ira',
      'roth ira': 'roth ira',
      'pension': 'pension',
      'business inventory': 'business',
      'business': 'business',
      'property': 'property',
      'primary residence': 'property',
      'debts': 'debts',
      'loan receivable': 'debts',
      'expenses': 'expenses',
      'other': 'expenses'
    };

    const newCategoryRaw = updateData.category ? updateData.category : existingAsset.category;
    const newCategoryNormalized = CATEGORY_SYNONYMS[normalizeKey(newCategoryRaw)] || normalizeKey(newCategoryRaw);

    const passiveTypes = (PASSIVE_INVESTMENT_TYPES as readonly string[]).map(s => {
      const k = normalizeKey(String(s));
      return CATEGORY_SYNONYMS[k] || k;
    });
    const restrictedTypes = (RESTRICTED_ACCOUNT_TYPES as readonly string[]).map(s => {
      const k = normalizeKey(String(s));
      return CATEGORY_SYNONYMS[k] || k;
    });

    // Validate passive flag
    if (newIsPassiveInvestment && !passiveTypes.includes(newCategoryNormalized)) {
      throw new Error('Passive investment flag can only be set for Stock, ETF, Mutual Fund, or Roth IRA');
    }

    // Validate restricted flag
    if (newIsRestrictedAccount && !restrictedTypes.includes(newCategoryNormalized)) {
      throw new Error('Restricted account flag can only be set for 401k, Traditional IRA, Pension, or Roth IRA');
    }

    // Validate mutually exclusive flags
    if (newIsPassiveInvestment && newIsRestrictedAccount) {
      throw new Error('Asset cannot be both passive investment and restricted account');
    }

    // Recalculate modifier if flags changed
    let calculationModifier = existingAsset.calculationModifier;
    if (updateData.isPassiveInvestment !== undefined || updateData.isRestrictedAccount !== undefined || updateData.category) {
      calculationModifier = determineModifier({
        isRestrictedAccount: newIsRestrictedAccount,
        isPassiveInvestment: newIsPassiveInvestment,
      });
      updatePayload.calculationModifier = calculationModifier;
    }

    // Handle metadata: merge with existing metadata
    if (updateData.metadata) {
      // Decrypt existing metadata if it exists
      let existingMetadata = {};
      if (existingAsset.metadata) {
        try {
          existingMetadata = await EncryptionService.decryptObject(existingAsset.metadata, ENCRYPTION_KEY);
        } catch {
          existingMetadata = {};
        }
      }

      // Merge new metadata with existing
      const mergedMetadata = { ...existingMetadata, ...updateData.metadata };
      updatePayload.metadata = await EncryptionService.encryptObject(mergedMetadata, ENCRYPTION_KEY);
    }

    // Update category to normalized canonical value (lowercase) if provided
    if (updateData.category) {
      updatePayload.category = newCategoryNormalized;
    }

    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: updatePayload
    });

    return this.decryptAsset(updatedAsset);
  }

  /**
   * Delete asset (soft delete)
   */
  async deleteAsset(userId: string, assetId: string) {
    // Check if asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
        isActive: true
      }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Soft delete
    await prisma.asset.update({
      where: { id: assetId },
      data: { isActive: false }
    });

    return { success: true, deletedAssetId: assetId };
  }

  /**
   * Get deleted (soft-deleted) assets for a user
   */
  async getDeletedAssets(userId: string) {
    const assets = await prisma.asset.findMany({
      where: {
        userId,
        isActive: false
      },
      orderBy: { updatedAt: 'desc' }
    });

    const decryptedAssets = await Promise.all(assets.map(asset => this.decryptAsset(asset)));
    return { assets: decryptedAssets };
  }

  /**
   * Recover a soft-deleted asset
   */
  async recoverAsset(userId: string, assetId: string) {
    // Check if asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
        isActive: false
      }
    });

    if (!asset) {
      throw new Error('Deleted asset not found');
    }

    // Check resource limits before recovering
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxAssets: true }
    });

    if (user) {
      const limit = user.maxAssets ?? parseInt(process.env.DEFAULT_MAX_ASSETS || '50');
      const currentCount = await prisma.asset.count({
        where: { userId, isActive: true }
      });

      if (currentCount >= limit) {
        throw new Error(`Asset limit reached. You cannot recover this asset because you have reached your maximum of ${limit} assets.`);
      }
    }

    // Recover asset
    const recoveredAsset = await prisma.asset.update({
      where: { id: assetId },
      data: { isActive: true }
    });

    return this.decryptAsset(recoveredAsset);
  }

  /**
   * Create multiple assets (bulk create)
   */
  async createBulkAssets(userId: string, assetsData: CreateAssetDto[]) {
    const results = [];
    const errors = [];

    for (let i = 0; i < assetsData.length; i++) {
      try {
        const assetData = assetsData[i];
        if (!assetData) continue;

        const asset = await this.createAsset(userId, assetData);
        results.push({ success: true, asset, index: i });
      } catch (error: any) {
        errors.push({
          success: false,
          error: error.message,
          index: i,
          asset: assetsData[i]
        });
      }
    }

    return {
      results,
      errors,
      summary: {
        total: assetsData.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * Import assets from CSV/JSON
   */
  async importAssets(userId: string, format: 'CSV' | 'JSON', data: any[]) {
    const results = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      try {
        // Validate and transform data
        const assetData = this.transformImportData(data[i]);
        const asset = await this.createAsset(userId, assetData);
        results.push({ success: true, asset, index: i });
      } catch (error: any) {
        errors.push({
          success: false,
          error: error.message,
          index: i,
          rawData: data[i]
        });
      }
    }

    return {
      results,
      errors,
      summary: {
        total: data.length,
        successful: results.length,
        failed: errors.length,
        format
      }
    };
  }

  /**
   * Export assets to different formats
   */
  async exportAssets(userId: string, format: 'CSV' | 'JSON' | 'PDF', filters: AssetFilters = {}) {
    const { assets } = await this.getUserAssets(userId, { ...filters, limit: 1000 });

    if (format === 'CSV') {
      return this.exportToCSV(assets);
    } else if (format === 'JSON') {
      return this.exportToJSON(assets);
    } else if (format === 'PDF') {
      return this.exportToPDF(assets);
    }

    throw new Error('Unsupported export format');
  }

  /**
   * Get asset categories with counts and values
   */
  async getAssetCategories(userId: string) {
    const assets = await prisma.asset.findMany({
      where: { userId, isActive: true },
      select: {
        category: true,
        value: true,
        currency: true
      }
    });

    const categories = assets.reduce((acc, asset) => {
      const category = asset.category;
      if (!acc[category]) {
        acc[category] = {
          name: category,
          count: 0,
          totalValue: 0,
          assets: []
        };
      }
      acc[category].count++;
      acc[category].totalValue += asset.value;
      acc[category].assets.push({
        value: asset.value,
        currency: asset.currency
      });
      return acc;
    }, {} as Record<string, any>);

    return Object.values(categories);
  }

  /**
   * Get asset templates for quick creation
   */
  getAssetTemplates() {
    return {
      CASH: {
        name: 'Cash Holdings',
        fields: ['name', 'value', 'currency', 'acquisitionDate'],
        metadata: {
          accountType: 'savings',
          institution: ''
        }
      },
      GOLD: {
        name: 'Gold Assets',
        fields: ['name', 'value', 'currency', 'acquisitionDate'],
        metadata: {
          purity: '24k',
          weight: '',
          form: 'jewelry'
        }
      },
      CRYPTO: {
        name: 'Cryptocurrency',
        fields: ['name', 'value', 'currency', 'acquisitionDate'],
        metadata: {
          symbol: '',
          quantity: '',
          exchange: ''
        }
      },
      BUSINESS: {
        name: 'Business Assets',
        fields: ['name', 'value', 'currency', 'acquisitionDate'],
        metadata: {
          businessType: '',
          ownership: '',
          valuation: 'book_value'
        }
      }
    };
  }

  /**
   * Validate asset data
   */
  async validateAsset(userId: string, assetData: CreateAssetDto) {
    const errors = [];

    // Required field validation
    if (!assetData.name?.trim()) {
      errors.push('Asset name is required');
    }

    if (!assetData.category?.trim()) {
      errors.push('Asset category is required');
    }

    if (assetData.value === undefined || assetData.value === null || assetData.value < 0) {
      errors.push('Asset value must be a positive number');
    }

    if (!assetData.currency?.trim()) {
      errors.push('Currency is required');
    }

    if (!assetData.acquisitionDate) {
      errors.push('Acquisition date is required');
    }

    // Category-specific validation
    if (assetData.category) {
      const categoryErrors = this.validateCategorySpecificFields(assetData);
      errors.push(...categoryErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Private: Decrypt asset data
   */
  private async decryptAsset(asset: any) {
    const decrypted = { ...asset };

    if (asset.metadata) {
      try {
        decrypted.metadata = await EncryptionService.decryptObject(asset.metadata, ENCRYPTION_KEY);
      } catch (error) {
        decrypted.metadata = null;
      }
    }

    // Transform to match shared Asset interface
    // Compute a server-suggested default for the passive checkbox using simple heuristics
    const passiveTypes = (PASSIVE_INVESTMENT_TYPES as readonly string[]).map(s => String(s).toLowerCase());
    const categoryLower = String(asset.category || '').toLowerCase();

    let suggestedPassiveDefault = false;
    try {
      // If category is a passive-investment type and asset is not restricted, suggest passive when no recent trade activity
      if (passiveTypes.includes(categoryLower) && !Boolean(asset.isRestrictedAccount)) {
        const recentTradesCount = Number(decrypted.metadata?.recentTradeCount || decrypted.metadata?.recentTradeHistory?.length || 0);
        const lastTradeDaysAgo = decrypted.metadata?.lastTradeDaysAgo ? Number(decrypted.metadata.lastTradeDaysAgo) : null;

        if (recentTradesCount === 0 && (!lastTradeDaysAgo || lastTradeDaysAgo > 90)) {
          suggestedPassiveDefault = true;
        }
      }
    } catch (e) {
      suggestedPassiveDefault = false;
    }

    return {
      assetId: asset.id,
      name: asset.name,
      category: asset.category.toLowerCase(),
      acquisitionDate: asset.acquisitionDate.toISOString(),
      subCategory: decrypted.metadata?.subCategory || '',
      value: asset.value,
      currency: asset.currency,
      description: decrypted.metadata?.description || asset.notes || '',
      zakatEligible: decrypted.metadata?.zakatEligible ?? true,
      // Modifier fields used by frontend + summary calculations
      calculationModifier: asset.calculationModifier ?? 1.0,
      isPassiveInvestment: Boolean(asset.isPassiveInvestment),
      isRestrictedAccount: Boolean(asset.isRestrictedAccount),
      // Server heuristic suggestion only (UI may pre-check based on this)
      suggestedPassiveDefault,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString()
    };
  }

  /**
   * Private: Transform import data to CreateAssetDto
   */
  private transformImportData(data: any): CreateAssetDto {
    return {
      name: data.name || data.Name || '',
      category: data.category || data.Category || data.type || '',
      value: parseFloat(data.value || data.Value || data.amount || '0'),
      currency: data.currency || data.Currency || 'USD',
      acquisitionDate: new Date(data.acquisitionDate || data.date || Date.now()),
      metadata: data.metadata || data.details || {},
      notes: data.notes || data.Notes || ''
    };
  }

  /**
   * Private: Export to CSV format
   */
  private exportToCSV(assets: any[]) {
    const headers = ['Name', 'Category', 'Value', 'Currency', 'Acquisition Date', 'Notes'];
    const rows = assets.map(asset => [
      asset.name,
      asset.category,
      asset.value,
      asset.currency,
      asset.acquisitionDate.toISOString().split('T')[0],
      asset.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return {
      data: csvContent,
      filename: `assets_export_${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv'
    };
  }

  /**
   * Private: Export to JSON format
   */
  private exportToJSON(assets: any[]) {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      assets: assets.map(asset => ({
        name: asset.name,
        category: asset.category,
        value: asset.value,
        currency: asset.currency,
        acquisitionDate: asset.acquisitionDate,
        metadata: asset.metadata,
        notes: asset.notes
      }))
    };

    return {
      data: JSON.stringify(exportData, null, 2),
      filename: `assets_export_${new Date().toISOString().split('T')[0]}.json`,
      contentType: 'application/json'
    };
  }

  /**
   * Private: Export to PDF format
   */
  private exportToPDF(assets: any[]) {
    // This would normally generate a PDF, but for now return a simple summary
    const summary = {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + asset.value, 0),
      categories: [...new Set(assets.map(asset => asset.category))],
      exportDate: new Date().toISOString()
    };

    return {
      data: `PDF Export Summary: ${JSON.stringify(summary, null, 2)}`,
      filename: `assets_export_${new Date().toISOString().split('T')[0]}.pdf`,
      contentType: 'application/pdf'
    };
  }

  /**
   * Private: Validate category-specific fields
   */
  private validateCategorySpecificFields(assetData: CreateAssetDto): string[] {
    const errors: string[] = [];
    const category = assetData.category?.toUpperCase();

    switch (category) {
      case 'GOLD':
      case 'SILVER':
        if (assetData.metadata && !assetData.metadata.purity) {
          errors.push('Purity is required for precious metals');
        }
        break;
      case 'CRYPTO':
        if (assetData.metadata && !assetData.metadata.symbol) {
          errors.push('Cryptocurrency symbol is required');
        }
        break;
      case 'BUSINESS':
        if (assetData.metadata && !assetData.metadata.businessType) {
          errors.push('Business type is required for business assets');
        }
        break;
    }

    return errors;
  }
}