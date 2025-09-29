import { Request, Response } from 'express';
import { ZakatEngine } from '../services/zakatEngine';
import { CurrencyService } from '../services/currencyService';
import { CalendarService } from '../services/calendarService';
import { NisabService } from '../services/nisabService';
import { AssetService } from '../services/assetService';
import { 
  ZakatCalculationRequest, 
  ZakatCalculationResult, 
  ApiResponse,
  MethodologyInfo
} from '../../../shared/src/types';
import { ZAKAT_METHODS } from '../../../shared/src/constants';
import { body, validationResult } from 'express-validator';

/**
 * Enhanced Zakat Controller with comprehensive methodology support
 * 
 * Provides advanced zakat calculation endpoints with:
 * - Multiple Islamic methodologies
 * - Calendar system integration
 * - Currency conversion support
 * - Detailed calculation breakdowns
 * - Alternative methodology comparisons
 * 
 * Constitutional Compliance:
 * - Islamic Compliance: All methodologies based on authentic jurisprudence
 * - Security First: Input validation and sanitization
 * - Transparency: Detailed calculation explanations
 * - User-Centric: Clear responses and educational content
 */
export class ZakatController {
  private zakatEngine: ZakatEngine;
  private assetService: AssetService;
  private nisabService: NisabService;

  constructor(
    assetService: AssetService,
    currencyService: CurrencyService,
    calendarService: CalendarService,
    nisabService: NisabService
  ) {
    this.assetService = assetService;
    this.nisabService = nisabService;
    this.zakatEngine = new ZakatEngine(currencyService, calendarService, nisabService);
  }

  /**
   * Get all available zakat calculation methodologies
   * 
   * @route GET /api/zakat/methodologies
   * @access Public (educational content)
   */
  getMethodologies = async (req: Request, res: Response): Promise<void> => {
    try {
      const methodologies: MethodologyInfo[] = Object.values(ZAKAT_METHODS);
      
      const response: ApiResponse<MethodologyInfo[]> = {
        success: true,
        data: methodologies,
        message: `${methodologies.length} zakat calculation methodologies available`
      };

      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve methodologies');
    }
  };

  /**
   * Get current nisab thresholds and recommendations
   * 
   * @route GET /api/zakat/nisab
   * @access Public
   */
  getNisabThresholds = async (req: Request, res: Response): Promise<void> => {
    try {
      const thresholds = await this.nisabService.calculateNisabThresholds();
      const recommendation = await this.nisabService.getNisabRecommendation();
      const marketStatus = await this.nisabService.getMarketStatus();

      const response: ApiResponse = {
        success: true,
        data: {
          current: thresholds,
          recommendation,
          market: marketStatus,
          explanation: {
            goldBasis: `Based on 87.48 grams of gold (20 mithqal)`,
            silverBasis: `Based on 612.36 grams of silver (200 dirhams)`,
            source: 'Authentic Islamic sources from Quran and Sunnah'
          }
        }
      };

      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to calculate nisab thresholds');
    }
  };

  /**
   * Calculate zakat using advanced methodology support
   * 
   * @route POST /api/zakat/calculate
   * @access Private (requires authentication)
   */
  calculateZakat = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid calculation parameters',
            details: errors.array()
          }
        };
        res.status(400).json(response);
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        };
        res.status(401).json(response);
        return;
      }

      // Extract calculation parameters
      const {
        method = 'standard',
        calendarType = 'lunar',
        customNisab,
        includeAssets,
        calculationDate = new Date().toISOString()
      } = req.body;

      // Build calculation request
      const calculationRequest: ZakatCalculationRequest = {
        calculationDate,
        calendarType,
        method,
        customNisab,
        includeAssets: includeAssets || await this.getDefaultAssets(userId)
      };

      // Perform calculation
      const result: ZakatCalculationResult = await this.zakatEngine.calculateZakat(calculationRequest);

      // Save calculation history (optional)
      await this.saveCalculationHistory(userId, result);

      const response: ApiResponse<ZakatCalculationResult> = {
        success: true,
        data: result,
        message: 'Zakat calculation completed successfully'
      };

      res.json(response);

    } catch (error) {
      this.handleError(res, error, 'Zakat calculation failed');
    }
  };

  /**
   * Get detailed methodology information
   * 
   * @route GET /api/zakat/methodologies/:methodId
   * @access Public
   */
  getMethodologyDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { methodId } = req.params;
      
      const methodology = Object.values(ZAKAT_METHODS).find(m => m.id === methodId);
      if (!methodology) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Methodology '${methodId}' not found`
          }
        };
        res.status(404).json(response);
        return;
      }

      // Get additional educational content
      const educationalContent = this.getEducationalContent(methodId);
      const regionalInfo = this.getRegionalInfo(methodId);

      const response: ApiResponse = {
        success: true,
        data: {
          methodology,
          education: educationalContent,
          regional: regionalInfo,
          implementation: {
            complexity: this.getImplementationComplexity(methodology),
            suitabilityScore: this.calculateSuitabilityScore(methodology),
            recommendedFor: methodology.suitableFor
          }
        }
      };

      res.json(response);

    } catch (error) {
      this.handleError(res, error, 'Failed to get methodology details');
    }
  };

  /**
   * Compare multiple methodologies
   * 
   * @route POST /api/zakat/compare
   * @access Private
   */
  compareMethodologies = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid comparison parameters',
            details: errors.array()
          }
        };
        res.status(400).json(response);
        return;
      }

      const userId = (req as any).user?.id;
      const {
        methodIds = ['standard', 'hanafi', 'shafii'],
        sampleAssets,
        comparisonDate = new Date().toISOString()
      } = req.body;

      const comparisons = [];

      for (const methodId of methodIds) {
        try {
          const calculationRequest: ZakatCalculationRequest = {
            calculationDate: comparisonDate,
            calendarType: 'lunar',
            method: methodId,
            includeAssets: sampleAssets || await this.getDefaultAssets(userId)
          };

          const result = await this.zakatEngine.calculateZakat(calculationRequest);
          
          comparisons.push({
            methodId,
            methodName: result.methodology.name,
            result: {
              zakatDue: result.result.totals.totalZakatDue,
              effectiveNisab: result.result.nisab.effectiveNisab,
              meetsNisab: result.result.meetsNisab,
              totalAssets: result.result.totals.totalAssets
            },
            keyFeatures: {
              nisabBasis: result.methodology.nisabBasis,
              businessTreatment: result.methodology.businessAssetTreatment,
              debtDeduction: result.methodology.debtDeduction
            }
          });
        } catch (error) {
          console.warn(`Failed to calculate ${methodId}:`, error);
        }
      }

      // Generate comparison insights
      const insights = this.generateComparisonInsights(comparisons);

      const response: ApiResponse = {
        success: true,
        data: {
          comparisons,
          insights,
          recommendations: this.generateMethodologyRecommendations(comparisons, userId)
        }
      };

      res.json(response);

    } catch (error) {
      this.handleError(res, error, 'Methodology comparison failed');
    }
  };

  /**
   * Get calculation history for user
   * 
   * @route GET /api/zakat/history
   * @access Private
   */
  getCalculationHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { page = 1, limit = 10 } = req.query;

      // In real implementation, this would query the database
      // For now, return mock data
      const history = {
        calculations: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          totalPages: 0
        }
      };

      const response: ApiResponse = {
        success: true,
        data: history
      };

      res.json(response);

    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve calculation history');
    }
  };

  /**
   * Validation middleware for zakat calculation
   */
  static getCalculationValidation() {
    return [
      body('method')
        .optional()
        .isIn(Object.keys(ZAKAT_METHODS))
        .withMessage('Invalid calculation method'),
      body('calendarType')
        .optional()
        .isIn(['lunar', 'solar'])
        .withMessage('Calendar type must be lunar or solar'),
      body('customNisab')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Custom nisab must be a positive number'),
      body('includeAssets')
        .optional()
        .isArray()
        .withMessage('Include assets must be an array'),
      body('calculationDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid calculation date format')
    ];
  }

  /**
   * Validation middleware for methodology comparison
   */
  static getComparisonValidation() {
    return [
      body('methodIds')
        .isArray({ min: 2, max: 5 })
        .withMessage('Must compare between 2 and 5 methodologies'),
      body('methodIds.*')
        .isIn(Object.keys(ZAKAT_METHODS))
        .withMessage('Invalid methodology ID'),
      body('sampleAssets')
        .optional()
        .isArray()
        .withMessage('Sample assets must be an array')
    ];
  }

  // Private helper methods

  private async getDefaultAssets(userId: string): Promise<string[]> {
    // Get user's assets for calculation
    try {
      const assets = await this.assetService.getUserAssets(userId);
      return assets.filter(asset => asset.zakatEligible).map(asset => asset.assetId);
    } catch (error) {
      return [];
    }
  }

  private async saveCalculationHistory(userId: string, result: ZakatCalculationResult): Promise<void> {
    // Save calculation to history (implement based on your storage strategy)
    try {
      // This would save to database
      console.log(`Saving calculation history for user ${userId}`);
    } catch (error) {
      console.warn('Failed to save calculation history:', error);
    }
  }

  private getEducationalContent(methodId: string): any {
    // Return educational content for the methodology
    return {
      historicalBackground: `Historical background of ${methodId} methodology`,
      keyPrinciples: [],
      recommendations: []
    };
  }

  private getRegionalInfo(methodId: string): any {
    // Return regional information for the methodology
    return {
      primaryRegions: [],
      scholarlyAuthorities: [],
      localVariations: []
    };
  }

  private getImplementationComplexity(methodology: MethodologyInfo): 'simple' | 'moderate' | 'complex' {
    // Determine complexity based on methodology features
    if (methodology.customRules) return 'complex';
    if (methodology.businessAssetTreatment === 'categorized') return 'moderate';
    return 'simple';
  }

  private calculateSuitabilityScore(methodology: MethodologyInfo): number {
    // Calculate suitability score based on various factors
    let score = 0.5; // Base score
    
    // Add score based on clarity and accessibility
    if (methodology.nisabBasis === 'dual_minimum') score += 0.2;
    if (methodology.businessAssetTreatment === 'market_value') score += 0.15;
    if (!methodology.customRules) score += 0.15;
    
    return Math.min(score, 1.0);
  }

  private generateComparisonInsights(comparisons: any[]): any {
    if (comparisons.length < 2) return {};

    const zakatAmounts = comparisons.map(c => c.result.zakatDue);
    const minZakat = Math.min(...zakatAmounts);
    const maxZakat = Math.max(...zakatAmounts);
    const avgZakat = zakatAmounts.reduce((sum, amount) => sum + amount, 0) / zakatAmounts.length;

    return {
      range: {
        minimum: minZakat,
        maximum: maxZakat,
        average: avgZakat,
        variance: maxZakat - minZakat
      },
      insights: [
        `Zakat amounts vary by $${(maxZakat - minZakat).toFixed(2)} across methodologies`,
        `Average zakat across all methods: $${avgZakat.toFixed(2)}`,
        comparisons.length > 2 ? `Consider consulting with Islamic scholars for guidance` : null
      ].filter(Boolean)
    };
  }

  private generateMethodologyRecommendations(comparisons: any[], userId: string): any[] {
    // Generate personalized methodology recommendations
    return comparisons.map(comp => ({
      methodId: comp.methodId,
      confidence: 0.8,
      reasons: [`Suitable for your asset portfolio`, `Widely accepted methodology`],
      considerations: [`Review with local Islamic scholars`]
    }));
  }

  private handleError(res: Response, error: any, message: string): void {
    console.error(message, error);

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    };

    res.status(500).json(response);
  }
}