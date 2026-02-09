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

import * as express from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/AuthMiddleware';
import { SimpleValidation } from '../utils/SimpleValidation';
import { AssetService, UpdateAssetDto } from '../services/AssetService';

// Simple UUID v4 implementation to avoid Jest ES module issues
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const router = express.Router();

/**
 * Standard API Response Format
 */
interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  metadata?: {
    timestamp: string;
    version: string;
  };
}

/**
 * Encrypted Asset Interface
 */
interface EncryptedAsset {
  id: string;
  category: 'cash' | 'gold' | 'silver' | 'crypto' | 'business' | 'investment' | 'property' | 'stocks' | 'debts' | 'expenses';
  encryptedValue: string;
  currency: string;
  description?: string;
  lastUpdated: string;
}

/**
 * Asset Creation Request Schema
 */
// Asset validation function
const validateAssetData = (data: any, isPartial = false): any => {
  const validation = SimpleValidation.validateAsset(data, isPartial);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  return validation.data;
};

/**
 * Temporary in-memory storage for demonstration
 * In production, this would be replaced with proper database operations
 */
const userAssets: { [userId: string]: EncryptedAsset[] } = {};

/**
 * Helper function to create StandardResponse
 */
const createResponse = <T>(success: boolean, data?: T, error?: { code: string; message: string; details?: any[] }): StandardResponse<T> => {
  return {
    success,
    data,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
};

/**
 * GET /api/assets
 * Retrieve user's encrypted assets
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { modifierType, page, limit } = req.query;

    // Get user's assets using the real service with filter support
    const assetService = new AssetService();
    const filters = {
      modifierType: modifierType as 'passive' | 'restricted' | 'full' | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    };

    const result = await assetService.getUserAssets(userId, filters);

    // Create summary statistics
    const summary = {
      totalAssets: result.assets.length,
      totalValue: result.assets.reduce((sum, asset) => sum + asset.value, 0),
      baseCurrency: 'USD',
      categoryCounts: result.assets.reduce((counts: Record<string, number>, asset) => {
        const category = asset.category.toLowerCase();
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {} as Record<string, number>),
      modifierBreakdown: result.assets.reduce((breakdown: Record<string, number>, asset) => {
        const modifier = asset.calculationModifier || 1.0;
        const label = modifier === 0.0 ? 'restricted' : modifier === 0.3 ? 'passive' : 'full';
        breakdown[label] = (breakdown[label] || 0) + 1;
        return breakdown;
      }, {} as Record<string, number>)
    };
    // Net zakatable value across selected assets: only include those marked eligible
    (summary as any).totalZakatableValue = result.assets.reduce((sum: number, asset: any) => {
      if (!asset.zakatEligible) return sum;
      const modifier = typeof asset.calculationModifier === 'number' ? asset.calculationModifier : 1.0;
      return sum + (modifier * (asset.value || 0));
    }, 0);

    // Match API contract format
    const response = {
      success: true,
      data: {
        assets: result.assets,
        summary,
        pagination: result.pagination
      }
    };

    res.status(200).json(response);
  } catch (error) {
    const response = createResponse(false, undefined, {
      code: 'ASSETS_RETRIEVAL_ERROR',
      message: 'Failed to retrieve assets',
      details: [error instanceof Error ? error.message : 'Unknown error']
    });
    res.status(500).json(response);
  }
});

/**
 * GET /api/assets/summary
 * Retrieve user's asset portfolio summary
 */
router.get('/summary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get user's assets using the real service
    const assetService = new AssetService();
    const result = await assetService.getUserAssets(userId);

    // Create detailed summary statistics
    const summary = {
      totalValueUSD: result.assets.reduce((sum, asset) => sum + asset.value, 0),
      totalAssets: result.assets.length,
      assetBreakdown: result.assets.reduce((breakdown: Record<string, number>, asset) => {
        const category = asset.category.toLowerCase();
        breakdown[category] = (breakdown[category] || 0) + asset.value;
        return breakdown;
      }, {} as Record<string, number>),
      currencyBreakdown: result.assets.reduce((breakdown: Record<string, number>, asset) => {
        const currency = asset.currency;
        breakdown[currency] = (breakdown[currency] || 0) + asset.value;
        return breakdown;
      }, {} as Record<string, number>),
      categoryCounts: result.assets.reduce((counts: Record<string, number>, asset) => {
        const category = asset.category.toLowerCase();
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {} as Record<string, number>)
    };

    const response = createResponse(true, { summary });
    res.status(200).json(response);
  } catch (error) {
    const response = createResponse(false, undefined, {
      code: 'SUMMARY_RETRIEVAL_ERROR',
      message: 'Failed to retrieve asset summary',
      details: [error instanceof Error ? error.message : 'Unknown error']
    });
    res.status(500).json(response);
  }
});

/**
 * GET /api/assets/deleted
 * Retrieve user's deleted assets
 */
router.get('/deleted', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get user's deleted assets using the real service
    const assetService = new AssetService();
    const result = await assetService.getDeletedAssets(userId);

    const response = createResponse(true, { assets: result.assets });
    res.status(200).json(response);
  } catch (error) {
    const response = createResponse(false, undefined, {
      code: 'DELETED_ASSETS_RETRIEVAL_ERROR',
      message: 'Failed to retrieve deleted assets',
      details: [error instanceof Error ? error.message : 'Unknown error']
    });
    res.status(500).json(response);
  }
});

/**
 * GET /api/assets/:id
 * Retrieve specific asset by ID
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const assetId = req.params.id as string;

    // Use the AssetService to get the asset
    const assetService = new AssetService();
    const asset = await assetService.getAssetById(userId, assetId);

    if (!asset) {
      const response = createResponse(false, undefined, {
        code: 'ASSET_NOT_FOUND',
        message: 'Asset not found'
      });
      return res.status(404).json(response);
    }

    const response = createResponse(true, { asset });
    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Asset not found') {
      const response = createResponse(false, undefined, {
        code: 'ASSET_NOT_FOUND',
        message: 'Asset not found'
      });
      return res.status(404).json(response);
    }

    const response = createResponse(false, undefined, {
      code: 'ASSET_RETRIEVAL_ERROR',
      message: 'Failed to retrieve asset',
      details: [error instanceof Error ? error.message : 'Unknown error']
    });
    res.status(500).json(response);
  }
});

/**
 * POST /api/assets
 * Create new encrypted asset
 */
router.post('/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate request data
      const validation = SimpleValidation.validateAsset(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: validation.errors
        });
        return;
      }

      const { category, name, value, currency, description, subCategory, zakatEligible, acquisitionDate, notes, isPassiveInvestment, isRestrictedAccount } = validation.data;

      const userId = req.userId!;

      // Build metadata object
      const metadata: any = {};
      if (description) {
        metadata.description = description;
      }
      if (subCategory) {
        metadata.subCategory = subCategory;
      }
      if (zakatEligible !== undefined) {
        metadata.zakatEligible = zakatEligible;
      }

      // Use the AssetService to create the asset
      const assetService = new AssetService();
      const asset = await assetService.createAsset(userId, {
        category,
        name: name || `${category} asset`, // Default name if not provided
        value,
        currency,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(), // Use provided date or default to current
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        notes: notes || description, // Use notes if provided, otherwise description
        isPassiveInvestment: isPassiveInvestment || false,
        isRestrictedAccount: isRestrictedAccount || false,
      });

      const response = createResponse(true, { asset });
      res.status(201).json(response);
    } catch (error) {
      // Distinguish validation errors vs internal errors to return appropriate status
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errMsg.includes('Invalid asset category') || errMsg.includes('Passive investment') || errMsg.includes('Restricted account') || errMsg.includes('cannot be both')) {
        const response = createResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: errMsg
        });
        return res.status(400).json(response);
      }

      const response = createResponse(false, undefined, {
        code: 'ASSET_CREATION_ERROR',
        message: 'Failed to create asset',
        details: [errMsg]
      });
      res.status(500).json(response);
    }
  }
);

/**
 * PUT /api/assets/:id
 * Update existing asset
 */
router.put('/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const assetId = req.params.id as string;

      // Check if update data is empty
      const hasUpdateData = Object.keys(req.body).length > 0;
      if (!hasUpdateData) {
        const response = createResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Update data cannot be empty'
        });
        return res.status(400).json(response);
      }

      // Validate request data (partial update)
      const validation = SimpleValidation.validateAsset(req.body, true);
      if (!validation.isValid) {
        const response = createResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: validation.errors
        });
        return res.status(400).json(response);
      }

      // Transform request data to match UpdateAssetDto
      const { description, subCategory, zakatEligible, ...otherData } = req.body;
      const updateData: Partial<UpdateAssetDto> = { ...otherData };

      // Build metadata object with all the extra fields
      const metadataFields: any = {};
      if (description !== undefined) {
        metadataFields.description = description;
      }
      if (subCategory !== undefined) {
        metadataFields.subCategory = subCategory;
      }
      if (zakatEligible !== undefined) {
        metadataFields.zakatEligible = zakatEligible;
      }

      // Only set metadata if we have fields to update
      if (Object.keys(metadataFields).length > 0) {
        updateData.metadata = metadataFields;
      }

      // Use AssetService to update the asset
      const assetService = new AssetService();
      const updatedAsset = await assetService.updateAsset(userId, assetId, updateData);

      const response = createResponse(true, { asset: updatedAsset });
      res.status(200).json(response);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errMsg === 'Asset not found') {
        const response = createResponse(false, undefined, {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        });
        return res.status(404).json(response);
      }
      if (errMsg.includes('Passive investment') || errMsg.includes('Restricted account') || errMsg.includes('cannot be both')) {
        const response = createResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: errMsg
        });
        return res.status(400).json(response);
      }

      const response = createResponse(false, undefined, {
        code: 'ASSET_UPDATE_ERROR',
        message: 'Failed to update asset',
        details: [errMsg]
      });
      res.status(500).json(response);
    }
  }
);

  /**
   * DELETE /api/assets/:id
   * Delete existing asset with comprehensive validation and features
   */
  router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const assetId = req.params.id as string;
      const forceDelete = req.query.force === 'true';

      // Validate ID format (UUID or CUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const cuidRegex = /^c[a-z0-9]{20,30}$/; // Standard CUID format

      if (!uuidRegex.test(assetId) && !cuidRegex.test(assetId)) {
        const response = createResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid asset ID format',
          details: ['Invalid asset ID format', 'Asset ID must be a valid UUID or CUID']
        });
        return res.status(400).json(response);
      }

      // Use AssetService to delete the asset
      const assetService = new AssetService();
      let deletedAsset;
      
      if (forceDelete) {
        deletedAsset = await assetService.forceDeleteAsset(userId, assetId);
      } else {
        deletedAsset = await assetService.deleteAsset(userId, assetId);
      }

      // Generate a mock audit log ID (since we don't have a generic AssetAudit table yet)
      const auditLogId = generateUUID();

      // Destructure to exclude sensitive fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { value, encryptedValue, ...safeAssetData } = deletedAsset;

      // Return response with deletion information
      const responseData: any = {
        deletedAssetId: assetId,
        deletedAsset: {
          ...safeAssetData,
          id: deletedAsset.assetId, // Map assetId to id for API contract
          type: deletedAsset.category, // Map category to type for API contract
          deletedAt: new Date().toISOString() // Add deletedAt timestamp
        },
        auditLogId: auditLogId,
        recoverable: !forceDelete,
        message: forceDelete ? 'Asset permanently deleted' : 'Asset deleted successfully'
      };

      // Only include recoveryDeadline if not force deleted
      if (!forceDelete) {
        responseData.recoveryDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const response = createResponse(true, responseData);
      res.status(200).json(response);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (errMsg === 'Asset not found') {
        const response = createResponse(false, undefined, {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        });
        return res.status(404).json(response);
      }

      const response = createResponse(false, undefined, {
        code: 'ASSET_DELETE_ERROR',
        message: 'Failed to delete asset',
        details: [errMsg]
      });
      res.status(500).json(response);
    }
  });

/**
 * POST /api/assets/:id/recover
 * Recover a deleted asset
 */
router.post('/:id/recover', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const assetId = req.params.id as string;

    // Recover the asset using the real service
    const assetService = new AssetService();
    const asset = await assetService.recoverAsset(userId, assetId);

    const response = createResponse(true, { asset });
    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Deleted asset not found') {
      const response = createResponse(false, undefined, {
        code: 'DELETED_ASSET_NOT_FOUND',
        message: 'Deleted asset not found'
      });
      return res.status(404).json(response);
    }

    const response = createResponse(false, undefined, {
      code: 'ASSET_RECOVERY_ERROR',
      message: 'Failed to recover asset',
      details: [error instanceof Error ? error.message : 'Unknown error']
    });
    res.status(500).json(response);
  }
});

export default router;