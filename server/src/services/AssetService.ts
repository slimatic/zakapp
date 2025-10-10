import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development-purposes-32';

export interface CreateAssetDto {
  category: string;
  name: string;
  value: number;
  currency: string;
  acquisitionDate: Date;
  metadata?: any;
  notes?: string;
}

export interface UpdateAssetDto {
  category?: string;
  name?: string;
  value?: number;
  currency?: string;
  acquisitionDate?: Date;
  metadata?: any;
  notes?: string;
}

export interface AssetFilters {
  category?: string;
  currency?: string;
  minValue?: number;
  maxValue?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'value' | 'createdAt' | 'acquisitionDate';
  sortOrder?: 'asc' | 'desc';
}

export class AssetService {
  /**
   * Create a new asset
   */
  async createAsset(userId: string, assetData: CreateAssetDto) {
    // Validate asset category
    const validCategories = ['cash', 'gold', 'silver', 'business', 'property', 'stocks', 'crypto'];
    if (!validCategories.includes(assetData.category.toLowerCase())) {
      throw new Error('Invalid asset category');
    }

    // Encrypt metadata if provided
    let encryptedMetadata = null;
    if (assetData.metadata) {
      encryptedMetadata = await EncryptionService.encryptObject(assetData.metadata, ENCRYPTION_KEY);
    }

    const asset = await prisma.asset.create({
      data: {
        userId,
        category: assetData.category.toUpperCase(),
        name: assetData.name,
        value: assetData.value,
        currency: assetData.currency,
        acquisitionDate: assetData.acquisitionDate,
        metadata: encryptedMetadata,
        notes: assetData.notes || null,
        isActive: true
      }
    });

    return this.decryptAsset(asset);
  }

  /**
   * Get all assets for a user
   */
  async getUserAssets(userId: string, filters: AssetFilters = {}) {
    const {
      category,
      currency,
      minValue,
      maxValue,
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
    const decryptedAssets = assets.map(asset => this.decryptAsset(asset));

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

    // Encrypt metadata if provided
    if (updateData.metadata) {
      updatePayload.metadata = await EncryptionService.encryptObject(updateData.metadata, ENCRYPTION_KEY);
    }

    // Update category to uppercase if provided
    if (updateData.category) {
      updatePayload.category = updateData.category.toUpperCase();
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

    return { success: true };
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

    return decrypted;
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