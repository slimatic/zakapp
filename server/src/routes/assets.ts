import * as express from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/AuthMiddleware';
import { SimpleValidation } from '../utils/SimpleValidation';
import { EncryptionService } from '../services/EncryptionService';
import { v4 as uuidv4 } from 'uuid';

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
  type: 'cash' | 'gold' | 'silver' | 'crypto' | 'business' | 'investment';
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
    
    // Get user's encrypted assets
    const assets = userAssets[userId] || [];
    
    const response = createResponse(true, { assets });
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
 * POST /api/assets
 * Create new encrypted asset
 */
router.post('/', 
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate request data
      const validation = validateAssetData(req.body);
      const { type, value, currency, description } = validation;

      const userId = req.userId!;
      
      // Generate encryption key from user ID (in production, use proper key management)
      const encryptionKey = await EncryptionService.deriveKey(userId, 'asset-salt');
      
      // Encrypt the asset value
      const encryptedValue = await EncryptionService.encrypt(value.toString(), encryptionKey);
      
      // Create new asset
      const newAsset: EncryptedAsset = {
        id: uuidv4(),
        type,
        encryptedValue,
        currency,
        description,
        lastUpdated: new Date().toISOString()
      };
      
      // Store asset
      if (!userAssets[userId]) {
        userAssets[userId] = [];
      }
      userAssets[userId].push(newAsset);
      
      const response = createResponse(true, { asset: newAsset });
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
      // Validate request data (partial update allowed)
      const validation = validateAssetData(req.body, true);
      const updateData = validation;

      const userId = req.userId!;
      const assetId = req.params.id;
      
      // Find user's assets
      const assets = userAssets[userId] || [];
      const assetIndex = assets.findIndex(asset => asset.id === assetId);
      
      if (assetIndex === -1) {
        const response = createResponse(false, undefined, {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        });
        return res.status(404).json(response);
      }
      
      const existingAsset = assets[assetIndex];
      const { type, value, currency, description } = updateData;
      
      // Update encrypted value if provided
      let encryptedValue = existingAsset.encryptedValue;
      if (value !== undefined) {
        const encryptionKey = await EncryptionService.deriveKey(userId, 'asset-salt');
        encryptedValue = await EncryptionService.encrypt(value.toString(), encryptionKey);
      }
      
      // Update asset
      const updatedAsset: EncryptedAsset = {
        ...existingAsset,
        type: type || existingAsset.type,
        encryptedValue,
        currency: currency || existingAsset.currency,
        description: description !== undefined ? description : existingAsset.description,
        lastUpdated: new Date().toISOString()
      };
      
      assets[assetIndex] = updatedAsset;
      
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
 * Delete existing asset
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const assetId = req.params.id;
    
    // Find user's assets
    const assets = userAssets[userId] || [];
    const assetIndex = assets.findIndex(asset => asset.id === assetId);
    
    if (assetIndex === -1) {
      const response = createResponse(false, undefined, {
        code: 'ASSET_NOT_FOUND',
        message: 'Asset not found'
      });
      return res.status(404).json(response);
    }
    
    // Remove asset
    assets.splice(assetIndex, 1);
    
    const response = createResponse(true, { message: 'Asset deleted successfully' });
    res.status(200).json(response);
  } catch (error) {
    const response = createResponse(false, undefined, {
      code: 'ASSET_DELETION_ERROR',
      message: 'Failed to delete asset',
      details: [error instanceof Error ? error.message : 'Unknown error']
    });
    res.status(500).json(response);
  }
});

export default router;