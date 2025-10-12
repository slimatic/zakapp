import * as express from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/AuthMiddleware';
import { validateSchema } from '../middleware/ValidationMiddleware';
import { SimpleIslamicCalculationService } from '../services/SimpleIslamicCalculationService';
import { SimpleNisabService } from '../services/SimpleNisabService';
import { SimpleEducationalContentService } from '../services/SimpleEducationalContentService';
import { EncryptionService } from '../services/EncryptionService';
import { z } from 'zod';

const router = express.Router();

/**
 * Standard API Response Format
 */
interface StandardResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
  metadata?: {
    timestamp: string;
    version: string;
  };
}

/**
 * Encrypted Asset Interface for Zakat Calculation
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
 * Zakat Calculation Request Schema
 */
const ZakatCalculationRequestSchema = z.object({
  methodology: z.enum(['standard', 'hanafi', 'shafii', 'maliki', 'hanbali', 'custom']),
  assets: z.array(z.object({
    id: z.string(),
    type: z.enum(['cash', 'gold', 'silver', 'crypto', 'business', 'investment']),
    encryptedValue: z.string(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    description: z.string().optional(),
    lastUpdated: z.string()
  })),
  nisabSource: z.enum(['gold', 'silver']).default('gold')
});

/**
 * Helper function to create StandardResponse
 */
const createResponse = <T>(success: boolean, data?: T, error?: { code: string; message: string; details?: string[] }): StandardResponse<T> => {
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
 * POST /api/zakat/calculate
 * Calculate Zakat based on user's encrypted assets
 */
router.post('/calculate',
  authenticate,
  validateSchema(ZakatCalculationRequestSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { methodology, assets, nisabSource } = req.body;
      
      // Handle 'custom' methodology by defaulting to 'standard' calculation
      // Custom rules would be applied separately if provided
      const effectiveMethodology = methodology === 'custom' ? 'standard' : methodology;
      
      // Generate decryption key from user ID
      const encryptionKey = await EncryptionService.deriveKey(userId, 'asset-salt');
      
      // Decrypt asset values
      const decryptedAssets = await Promise.all(
        assets.map(async (asset: EncryptedAsset) => {
          try {
            const decryptedValue = await EncryptionService.decrypt(asset.encryptedValue, encryptionKey);
            return {
              id: asset.id,
              type: asset.type,
              value: parseFloat(decryptedValue),
              currency: asset.currency,
              description: asset.description
            };
          } catch (error) {
            throw new Error(`Failed to decrypt asset ${asset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );
      
      // Get current nisab threshold using SimpleNisabService
      const nisabInfo = await SimpleNisabService.calculateNisabThreshold(effectiveMethodology, nisabSource);
      
      // Calculate Zakat using Simple Islamic Calculation Service
      const calculationResult = await SimpleIslamicCalculationService.calculateZakat(
        decryptedAssets,
        effectiveMethodology,
        nisabInfo.effectiveNisab
      );
      
      // Get educational content for the methodology
      const educationalContent = await SimpleEducationalContentService.getMethodologyEducation(effectiveMethodology);
      
      // Prepare detailed calculations for each asset
      const calculations = decryptedAssets.map(asset => {
        const zakatableValue = calculationResult.assetCalculations.find(calc => calc.assetId === asset.id)?.zakatableValue || 0;
        const zakatAmount = zakatableValue * 0.025; // 2.5% standard rate
        
        return {
          assetId: asset.id,
          assetType: asset.type,
          zakatableValue,
          zakatAmount
        };
      });
      
      const response = createResponse(true, {
        zakatAmount: calculationResult.totalZakat,
        nisabThreshold: nisabInfo.effectiveNisab,
        totalAssetValue: calculationResult.totalValue,
        methodology: methodology,
        calculations,
        educationalContent: {
          methodologyExplanation: educationalContent.explanation,
          sources: educationalContent.sources,
          calculationSteps: [
            `1. Total asset value: ${calculationResult.totalValue} USD`,
            `2. Nisab threshold (${nisabSource}): ${nisabInfo.effectiveNisab} USD`,
            `3. Assets above nisab: ${calculationResult.totalValue >= nisabInfo.effectiveNisab ? 'Yes' : 'No'}`,
            `4. Zakat rate: 2.5%`,
            `5. Zakat amount: ${calculationResult.totalZakat} USD`
          ]
        }
      });
      
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'ZAKAT_CALCULATION_ERROR',
        message: 'Failed to calculate Zakat',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/zakat/nisab
 * Get current nisab thresholds (public endpoint)
 */
router.get('/nisab', async (req, res: Response) => {
  try {
    const { methodology = 'standard', source = 'gold' } = req.query;
    
    const nisabInfo = await SimpleNisabService.calculateNisabThreshold(
      methodology as string,
      source as 'gold' | 'silver'
    );
    
    const educationalContent = SimpleNisabService.getEducationalContent();
    
    const response = createResponse(true, {
      nisab: nisabInfo,
      educational: educationalContent
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = createResponse(false, undefined, {
      code: 'NISAB_RETRIEVAL_ERROR',
      message: 'Failed to retrieve nisab information',
      details: [error instanceof Error ? error.message : 'Unknown error']
    });
    res.status(500).json(response);
  }
});

/**
 * GET /api/zakat/methodologies
 * Get available calculation methodologies (public endpoint)
 */
router.get('/methodologies', async (req, res: Response) => {
  try {
    const methodologies = SimpleIslamicCalculationService.getAvailableMethodologies();
    
    const educationalContent = await SimpleEducationalContentService.getEducationalContent('beginner');
    
    const response = createResponse(true, {
      methodologies,
      educational: educationalContent
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = createResponse(false, undefined, {
      code: 'METHODOLOGIES_RETRIEVAL_ERROR',
      message: 'Failed to retrieve calculation methodologies',
      details: [error instanceof Error ? error.message : 'Unknown error']
    });
    res.status(500).json(response);
  }
});

export default router;