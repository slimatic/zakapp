import express from 'express';
import { assetService } from '../services/assetService.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { ERROR_CODES } from '@zakapp/shared';

const router = express.Router();

/**
 * POST /assets/bulk/import
 * Import multiple assets from JSON data
 */
router.post(
  '/import',
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

      const { assets, mergeStrategy = 'merge' } = req.body;

      if (!assets || !Array.isArray(assets)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Assets array is required',
          },
        });
      }

      let assetsData = assets;

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      // Process each asset
      for (const assetData of assetsData) {
        try {
          if (mergeStrategy === 'replace' && assetData.assetId) {
            // Try to update existing asset
            const existingAsset = await assetService.getAssetById(
              userId,
              assetData.assetId
            );
            if (existingAsset) {
              const updatedAsset = await assetService.updateAsset(
                userId,
                assetData.assetId,
                assetData
              );
              results.push({
                status: 'updated',
                asset: updatedAsset,
              });
            } else {
              // Create new asset if doesn't exist
              const newAsset = await assetService.createAsset(
                userId,
                assetData
              );
              results.push({
                status: 'created',
                asset: newAsset,
              });
            }
          } else {
            // Always create new asset
            const newAsset = await assetService.createAsset(userId, assetData);
            results.push({
              status: 'created',
              asset: newAsset,
            });
          }
          successCount++;
        } catch (error) {
          results.push({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            data: assetData,
          });
          errorCount++;
        }
      }

      res.json({
        success: true,
        message: `Import completed: ${successCount} successful, ${errorCount} failed`,
        data: {
          summary: {
            total: assetsData.length,
            successful: successCount,
            failed: errorCount,
          },
          results,
        },
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to import assets',
        },
      });
    }
  }
);

/**
 * GET /assets/bulk/export
 * Export all user assets as JSON (optionally encrypted)
 */
router.get(
  '/export',
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

      const { format = 'json' } = req.query;

      // Get all user assets
      const assets = await assetService.getUserAssets(userId);

      // Create export data
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        assets,
        metadata: {
          totalAssets: assets.length,
          totalValue: assets.reduce((sum, asset) => sum + asset.value, 0),
          categories: [...new Set(assets.map(asset => asset.category))],
        },
      };

      let responseData: any = exportData;

      // Set appropriate headers for download
      if (format === 'download') {
        const filename = `zakapp-assets-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );
        res.setHeader('Content-Type', 'application/json');
      }

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('Bulk export error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to export assets',
        },
      });
    }
  }
);

/**
 * POST /assets/bulk/validate
 * Validate asset data before import
 */
router.post(
  '/validate',
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

      const { assets } = req.body;

      if (!assets || !Array.isArray(assets)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Assets array is required',
          },
        });
      }

      let assetsData = assets;

      const validationResults = [];
      let validCount = 0;
      let invalidCount = 0;

      // Validate each asset
      for (let i = 0; i < assetsData.length; i++) {
        const assetData = assetsData[i];
        try {
          // Basic validation - you can enhance this with more sophisticated validation
          if (
            !assetData.name ||
            !assetData.category ||
            !assetData.subCategory
          ) {
            throw new Error(
              'Missing required fields: name, category, or subCategory'
            );
          }

          if (typeof assetData.value !== 'number' || assetData.value < 0) {
            throw new Error('Value must be a non-negative number');
          }

          if (!assetData.currency || assetData.currency.length !== 3) {
            throw new Error('Currency must be a 3-letter code');
          }

          validationResults.push({
            index: i,
            status: 'valid',
            asset: assetData,
          });
          validCount++;
        } catch (error) {
          validationResults.push({
            index: i,
            status: 'invalid',
            error:
              error instanceof Error
                ? error.message
                : 'Unknown validation error',
            asset: assetData,
          });
          invalidCount++;
        }
      }

      res.json({
        success: true,
        message: `Validation completed: ${validCount} valid, ${invalidCount} invalid`,
        data: {
          summary: {
            total: assetsData.length,
            valid: validCount,
            invalid: invalidCount,
          },
          results: validationResults,
        },
      });
    } catch (error) {
      console.error('Bulk validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to validate assets',
        },
      });
    }
  }
);

export { router as assetBulkRouter };
