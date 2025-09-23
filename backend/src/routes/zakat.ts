import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { zakatService } from '../services/zakatService';
import { assetService } from '../services/assetService';
import type { ZakatCalculationRequest } from '@zakapp/shared';

const router = express.Router();

/**
 * POST /api/v1/zakat/calculate
 * Calculate Zakat for current assets
 */
router.post('/calculate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const calculationRequest = req.body as ZakatCalculationRequest;
    
    // Validate the calculation request
    zakatService.validateCalculationRequest(calculationRequest);

    // Get user's assets
    const userAssets = await assetService.getUserAssets(userId);

    // Perform the calculation
    const calculation = await zakatService.calculateZakat(
      calculationRequest, 
      userAssets
    );

    res.status(200).json({
      success: true,
      data: calculation
    });

  } catch (error) {
    console.error('Zakat calculation error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Calculation failed'
    });
  }
});

/**
 * GET /api/v1/zakat/nisab
 * Get current nisab thresholds
 */
router.get('/nisab', authenticateToken, async (req, res) => {
  try {
    const method = req.query.method as string || 'standard';
    
    // In a real implementation, these prices would come from an external API
    const goldPricePerGram = 65; // USD per gram
    const silverPricePerGram = 0.8; // USD per gram

    const nisab = zakatService.calculateNisab(goldPricePerGram, silverPricePerGram, method);

    res.status(200).json({
      success: true,
      data: {
        nisab,
        goldPricePerGram,
        silverPricePerGram,
        method,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Nisab calculation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate nisab'
    });
  }
});

/**
 * POST /api/v1/zakat/validate
 * Validate assets for zakat eligibility
 */
router.post('/validate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { assetIds, method = 'standard' } = req.body;

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Asset IDs array is required'
      });
    }

    // Get user's assets
    const userAssets = await assetService.getUserAssets(userId);

    // Filter requested assets
    const requestedAssets = userAssets.filter((asset) => 
      assetIds.includes(asset.assetId)
    );

    if (requestedAssets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid assets found for the provided IDs'
      });
    }

    // Calculate nisab
    const goldPricePerGram = 65;
    const silverPricePerGram = 0.8;
    const nisab = zakatService.calculateNisab(goldPricePerGram, silverPricePerGram, method);

    // Calculate total zakatable assets
    const totalZakatableValue = requestedAssets
      .filter((asset) => asset.zakatEligible)
      .reduce((sum, asset) => sum + asset.value, 0);

    const meetsNisab = zakatService.isEligibleForZakat(totalZakatableValue, nisab.effectiveNisab);

    // Calculate individual asset zakat amounts
    const assetValidations = requestedAssets.map((asset) => {
      const zakatAsset = zakatService.calculateAssetZakat(asset, method);
      return {
        assetId: asset.assetId,
        name: asset.name,
        value: asset.value,
        zakatEligible: asset.zakatEligible,
        zakatableAmount: zakatAsset.zakatableAmount,
        potentialZakatDue: meetsNisab ? zakatAsset.zakatDue : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        nisab,
        totalZakatableValue,
        meetsNisab,
        method,
        assets: assetValidations,
        calculationDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Zakat validation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    });
  }
});

export default router;