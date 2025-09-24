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
import {
  ERROR_CODES,
  ASSET_CATEGORIES,
  AssetCategoryType,
} from '@zakapp/shared';

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
      category: category as AssetCategoryType,
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
router.post(
  '/',
  authenticateToken,
  validateBody(createAssetSchema),
  async (req: AuthenticatedRequest, res) => {
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
  }
);

/**
 * PUT /assets/:assetId
 * Update an existing asset
 */
router.put(
  '/:assetId',
  authenticateToken,
  validateBody(updateAssetSchema),
  async (req: AuthenticatedRequest, res) => {
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
  }
);

/**
 * DELETE /assets/:assetId
 * Delete an asset
 */
router.delete(
  '/:assetId',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
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
  }
);

/**
 * GET /assets/categories
 * Get available asset categories and subcategories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = Object.values(ASSET_CATEGORIES).map(category => ({
      ...category,
      subCategories: category.subCategories, // Include the actual subcategories
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

/**
 * GET /assets/history
 * Get history for all user assets
 */
router.get(
  '/history',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
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

      const history = await assetService.getAssetHistory(userId);

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      console.error('Get asset history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to retrieve asset history',
        },
      });
    }
  }
);

/**
 * GET /assets/statistics
 * Get comprehensive asset statistics
 */
router.get(
  '/statistics',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
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

      const statistics = await assetService.getAssetStatistics(userId);

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      console.error('Get asset statistics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to retrieve asset statistics',
        },
      });
    }
  }
);

/**
 * GET /assets/grouped
 * Get assets grouped by category
 */
router.get(
  '/grouped',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
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

      const assets = await assetService.getUserAssets(userId);
      const groupedAssets: Record<string, any[]> = {};

      // Group assets by category
      assets.forEach(asset => {
        if (!groupedAssets[asset.category]) {
          groupedAssets[asset.category] = [];
        }
        groupedAssets[asset.category].push(asset);
      });

      res.json({
        success: true,
        data: { groupedAssets },
      });
    } catch (error) {
      console.error('Get grouped assets error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to retrieve grouped assets',
        },
      });
    }
  }
);

/**
 * GET /assets/categories/:category/subcategories
 * Get subcategories for a specific asset category
 */
router.get('/categories/:category/subcategories', async (req, res) => {
  try {
    const { category } = req.params;
    const categoryData = Object.values(ASSET_CATEGORIES).find(
      cat => cat.id === category
    );

    if (!categoryData) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Category not found',
        },
      });
    }

    res.json({
      success: true,
      data: { subcategories: categoryData.subCategories },
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to retrieve subcategories',
      },
    });
  }
});

/**
 * GET /assets/:assetId
 * Get a single asset by ID
 */
router.get(
  '/:assetId',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
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

      const asset = await assetService.getAssetById(userId, assetId);

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
        data: { asset },
      });
    } catch (error) {
      console.error('Get asset error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to retrieve asset',
        },
      });
    }
  }
);

/**
 * GET /assets/:assetId/history
 * Get history for a specific asset
 */
router.get(
  '/:assetId/history',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
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

      // First check if asset exists
      const asset = await assetService.getAssetById(userId, assetId);
      if (!asset) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Asset not found',
          },
        });
      }

      const history = await assetService.getAssetHistory(userId, assetId);

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      console.error('Get asset history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to retrieve asset history',
        },
      });
    }
  }
);

export { router as assetsRouter };
