import * as express from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/AuthMiddleware';
import { SimpleValidation } from '../utils/SimpleValidation';
import { EncryptionService } from '../services/EncryptionService';
import { AssetService, UpdateAssetDto } from '../services/AssetService';
import crypto from 'crypto';

// Simple UUID v4 implementation to avoid Jest ES module issues
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
    
    // Get user's assets using the real service
    const assetService = new AssetService();
    const result = await assetService.getUserAssets(userId);
    
    // Create summary statistics
    const summary = {
      totalAssets: result.assets.length,
      totalValue: result.assets.reduce((sum, asset) => sum + asset.value, 0),
      baseCurrency: 'USD',
      categoryCounts: result.assets.reduce((counts: Record<string, number>, asset) => {
        const category = asset.category.toLowerCase();
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {} as Record<string, number>)
    };

    // Match API contract format
    const response = {
      success: true,
      data: {
        assets: result.assets,
        summary
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
    const assetId = req.params.id;
    
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

      const { category, name, value, currency, description } = validation.data;

      const userId = req.userId!;
      
      // Use the AssetService to create the asset
      const assetService = new AssetService();
      const asset = await assetService.createAsset(userId, {
        category,
        name: name || `${category} asset`, // Default name if not provided
        value,
        currency,
        acquisitionDate: new Date(), // Default to current date
        metadata: { description }, // Store description in metadata
        notes: description // Also store as notes
      });
      
      const response = createResponse(true, { asset });
      res.status(201).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'ASSET_CREATION_ERROR',
        message: 'Failed to create asset',
        details: [error instanceof Error ? error.message : 'Unknown error']
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
      const assetId = req.params.id;

      // Check if update data is empty
      const hasUpdateData = Object.keys(req.body).length > 0;
      if (!hasUpdateData) {
        const response = createResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Update data cannot be empty'
        });
        return res.status(400).json(response);
      }

      // Transform request data to match UpdateAssetDto
      const { description, ...otherData } = req.body;
      const updateData: Partial<UpdateAssetDto> = { ...otherData };
      if (description) {
        updateData.metadata = { description };
      }

      // Use AssetService to update the asset
      const assetService = new AssetService();
      const updatedAsset = await assetService.updateAsset(userId, assetId, updateData);
      
      const response = createResponse(true, { asset: updatedAsset });
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'ASSET_UPDATE_ERROR',
        message: 'Failed to update asset',
        details: [error instanceof Error ? error.message : 'Unknown error']
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
    const assetId = req.params.id;
    
    // Use AssetService to delete the asset
    const assetService = new AssetService();
    await assetService.deleteAsset(userId, assetId);
    
    // Return response with soft delete information
    const response = createResponse(true, {
      deletedAssetId: assetId,
      recoverable: true,
      recoveryDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      message: 'Asset deleted successfully'
    });
    res.status(200).json(response);
  } catch (error) {
    const response = createResponse(false, undefined, {
      code: 'ASSET_DELETE_ERROR',
      message: 'Failed to delete asset',
      details: [error instanceof Error ? error.message : 'Unknown error']
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
    const assetId = req.params.id;
    
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