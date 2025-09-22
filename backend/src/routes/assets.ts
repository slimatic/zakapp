import express from 'express';
import { assetService } from '../services/assetService.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import {
  createAssetSchema,
  updateAssetSchema,
  CreateAssetRequest,
  UpdateAssetRequest,
} from '../utils/validation.js';
import { ERROR_CODES, ASSET_CATEGORIES } from '@zakapp/shared';

const router = express.Router();

/**
 * GET /assets
 * Get all user assets with optional filtering
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User authentication required',
        },
      });
    }

    const { category, year } = req.query;
    const assets = await assetService.getUserAssets(userId, {
      category: category as string,
      year: year as string,
    });

    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalZakatEligible = assets
      .filter(asset => asset.zakatEligible)
      .reduce((sum, asset) => sum + asset.value, 0);

    res.json({
      success: true,
      data: {
        assets,
        totalValue,
        totalZakatEligible,
      },
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to retrieve assets',
      },
    });
  }
});

/**
 * POST /assets
 * Create a new asset
 */
router.post('/', authenticateToken, validateBody(createAssetSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User authentication required',
        },
      });
    }

    const assetData: CreateAssetRequest = req.body;
    const asset = await assetService.createAsset(userId, assetData);

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: { asset },
    });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to create asset',
      },
    });
  }
});

/**
 * PUT /assets/:assetId
 * Update an existing asset
 */
router.put('/:assetId', authenticateToken, validateBody(updateAssetSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { assetId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User authentication required',
        },
      });
    }

    const updateData: UpdateAssetRequest = req.body;
    const asset = await assetService.updateAsset(userId, assetId, updateData);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Asset not found',
        },
      });
    }

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: { asset },
    });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update asset',
      },
    });
  }
});

/**
 * DELETE /assets/:assetId
 * Delete an asset
 */
router.delete('/:assetId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { assetId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User authentication required',
        },
      });
    }

    const success = await assetService.deleteAsset(userId, assetId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Asset not found',
        },
      });
    }

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to delete asset',
      },
    });
  }
});

/**
 * GET /assets/categories
 * Get available asset categories and subcategories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = Object.values(ASSET_CATEGORIES).map(category => ({
      ...category,
      subCategories: [], // TODO: Implement subcategories
    }));

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to retrieve categories',
      },
    });
  }
});

export { router as assetsRouter };