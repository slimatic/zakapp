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
import { Response, Request } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/AuthMiddleware';
import { validateSchema } from '../middleware/ValidationMiddleware';
import { asyncHandler } from '../middleware/ErrorHandler';
import { ZakatEngine } from '../services/zakatEngine';
import { CurrencyService } from '../services/currencyService';
import { CalendarService } from '../services/calendarService';
import { NisabService } from '../services/NisabService';
import { UserService } from '../services/UserService';
import { PaymentRecordService } from '../services/payment-record.service';
import { CalculationHistoryService } from '../services/CalculationHistoryService';
import { PaymentRecordsController } from '../controllers/payment-records.controller';
import { Logger } from '../utils/logger';

// Issue #310: currencies the platform supports for display/conversion.
// Mirrors the client CURRENCY_CONFIG list in client/src/utils/formatters.ts.
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'TRY', 'INR', 'PKR', 'BDT', 'MYR', 'IDR'];
const logger = new Logger('ZakatRoutes');
import { z } from 'zod';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { getJwtSecret } from '../config/security';

async function getUserActiveLiabilities(userId: string) {
  const liabilities = await prisma.liability.findMany({
    where: { userId, isActive: true },
    select: { type: true, amount: true, name: true },
  });
  
  const total = liabilities.reduce((sum, l) => sum + l.amount, 0);
  
  return {
    total,
    liabilities: liabilities.map(l => ({ type: l.type, amount: l.amount, name: l.name })),
  };
}

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
 * Zakat Calculation Request Schema (matches API contract)
 */
const ZakatCalculationRequestSchema = z.object({
  method: z.enum(['standard', 'hanafi', 'shafii', 'maliki', 'hanbali', 'custom']),
  calendarType: z.enum(['lunar', 'solar']).default('lunar'),
  calculationDate: z.string().optional(), // ISO date, defaults to today
  includeAssets: z.array(z.string()).optional(), // Asset IDs to include
  includeLiabilities: z.array(z.string()).optional(), // Liability IDs to include
  customNisab: z.number().optional(), // Custom nisab threshold
  // Issue #310: display currency for the calculation result. If omitted the
  // server resolves it from the authenticated user's saved currency preference.
  // The engine still computes in USD internally and converts the OUTPUT.
  currency: z.string().length(3).optional()
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
 * Helper function to group assets by category
 */
const groupAssetsByCategory = (assets: any[]): any[] => {
  const categoryGroups = new Map<string, { category: string; totalValue: number; assets: any[] }>();

  for (const asset of assets) {
    const category = asset.category || 'uncategorized';
    const existing = categoryGroups.get(category) || {
      category,
      totalValue: 0,
      assets: []
    };

    existing.totalValue += asset.zakatValue || asset.value || 0;
    existing.assets.push(asset);
    categoryGroups.set(category, existing);
  }

  return Array.from(categoryGroups.values()).map(group => ({
    category: group.category,
    totalValue: group.totalValue,
    assetCount: group.assets.length,
    assets: group.assets
  }));
};

// Initialize services
const currencyService = new CurrencyService();
const calendarService = new CalendarService();
const nisabService = new NisabService();
const paymentService = new PaymentRecordService();
const calculationHistoryService = new CalculationHistoryService();
const zakatEngine = new ZakatEngine(currencyService, calendarService, nisabService);

// Initialize controllers
const paymentRecordsController = new PaymentRecordsController();

/**
 * POST /api/zakat/calculate
 * Calculate Zakat using the new ZakatEngine (matches API contract)
 */
router.post('/calculate',
  authenticate,
  validateSchema(ZakatCalculationRequestSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { method, calendarType, calculationDate, includeAssets, customNisab } = req.body;

      // Map method to methodology (API uses 'method', engine uses 'methodology')
      const methodologyMap: Record<string, 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM'> = {
        'standard': 'STANDARD',
        'hanafi': 'HANAFI',
        'shafii': 'SHAFII',
        'maliki': 'CUSTOM', // Map to CUSTOM for now
        'hanbali': 'CUSTOM', // Map to CUSTOM for now
        'custom': 'CUSTOM'
      };

      const methodology = methodologyMap[method] || 'STANDARD';

      // Prepare calculation request
      const calcRequest = {
        methodology,
        calendarType: calendarType || 'lunar',
        calculationDate: calculationDate || new Date().toISOString(),
        includeAssets: includeAssets || [],
        customNisab
      };

      const liabilityData = await getUserActiveLiabilities(req.userId!);

      const result = await zakatEngine.calculateZakat({
        ...calcRequest,
        userId: req.userId
      });

      const netWorth = result.result.totals.totalAssets - liabilityData.total;

      // Issue #310: present results in the USER's currency. The engine computes
      // in USD internally; convert the OUTPUT numbers so an IDR user sees IDR
      // totals and an IDR nisab. Resolution order: explicit request currency →
      // user's saved preference → USD.
      let displayCurrency = typeof req.body.currency === 'string' ? req.body.currency.toUpperCase() : '';
      if (!displayCurrency) {
        try {
          const settings = await new UserService().getSettings(req.userId!);
          const saved = (settings as { currency?: string }).currency;
          if (typeof saved === 'string' && saved.trim()) displayCurrency = saved.toUpperCase();
        } catch {
          // Settings unavailable — fall through to USD
        }
      }
      if (!SUPPORTED_CURRENCIES.includes(displayCurrency)) displayCurrency = 'USD';

      let presentation = {
        totalAssets: result.result.totals.totalAssets,
        totalZakatDue: result.result.totals.totalZakatDue,
        netWorth,
        nisabThreshold: result.result.nisab.effectiveNisab
      };
      let fxRate = 1.0;
      if (displayCurrency !== 'USD') {
        try {
          fxRate = await currencyService.getExchangeRate('USD', displayCurrency);
          presentation = {
            totalAssets: presentation.totalAssets * fxRate,
            totalZakatDue: presentation.totalZakatDue * fxRate,
            netWorth: presentation.netWorth * fxRate,
            nisabThreshold: presentation.nisabThreshold * fxRate
          };
        } catch (err) {
          logger.warn(`FX conversion to ${displayCurrency} failed, presenting USD: ${err instanceof Error ? err.message : err}`);
          displayCurrency = 'USD';
          fxRate = 1.0;
        }
      }
      const displayNetWorth = presentation.netWorth;

      const savedCalculation = await prisma.zakatCalculation.create({
        data: {
          userId: req.userId!,
          calculationDate: new Date(),
          methodology: result.methodology.id,
          calendarType: result.result.calendarType,
          totalAssets: result.result.totals.totalAssets,
          totalLiabilities: liabilityData.total,
          netWorth,
          nisabThreshold: result.result.nisab.effectiveNisab,
          nisabSource: result.result.nisab.nisabBasis,
          isZakatObligatory: result.result.meetsNisab,
          zakatAmount: result.result.totals.totalZakatDue,
          zakatRate: result.methodology.zakatRate,
          breakdown: JSON.stringify(result.breakdown),
          assetsIncluded: JSON.stringify(result.result.assets),
          liabilitiesIncluded: JSON.stringify(liabilityData.liabilities),
          regionalAdjustments: null
        }
      });

      // Save calculation to history (for audit and tracking)
      try {
        // Calculate Zakat year boundaries
        const calculationDate = new Date(calcRequest.calculationDate);
        const zakatYear = await calendarService.calculateZakatYear(calculationDate, calcRequest.calendarType as 'HIJRI' | 'GREGORIAN');

        await calculationHistoryService.saveCalculation(req.userId!, {
          methodology: result.methodology.id,
          calendarType: calcRequest.calendarType,
          totalWealth: netWorth,
          nisabThreshold: result.result.nisab.effectiveNisab,
          zakatDue: result.result.totals.totalZakatDue,
          zakatRate: result.methodology.zakatRate,
          assetBreakdown: result.breakdown.assetCalculations || [],
          notes: `Zakat calculation using ${result.methodology.id} methodology`,
          metadata: {
            calculationId: savedCalculation.id,
            meetsNisab: result.result.meetsNisab,
            nisabBasis: result.result.nisab.nisabBasis,
            totalLiabilities: liabilityData.total
          },
          zakatYearStart: zakatYear.startDate,
          zakatYearEnd: zakatYear.endDate
        });
      } catch {
        // Log error but don't fail the calculation
        // Note: Failed to save calculation to history
      }

      // Transform result to match API contract format
      const response = createResponse(true, {
        calculation: {
          id: savedCalculation.id,
          calculationDate: result.result.calculationDate,
          methodology: result.methodology.id,
          calendarType: result.result.calendarType,
          summary: {
          totalAssets: presentation.totalAssets,
          totalLiabilities: liabilityData.total,
          netWorth: displayNetWorth,
          nisabThreshold: presentation.nisabThreshold,
          nisabSource: result.result.nisab.nisabBasis,
          isZakatObligatory: result.result.meetsNisab,
          zakatDue: presentation.totalZakatDue,
          zakatRate: result.methodology.zakatRate,
          currency: displayCurrency,
          fxRateFromUSD: fxRate
          },
           breakdown: {
             assetsByCategory: groupAssetsByCategory(result.result.assets),
             liabilities: liabilityData.liabilities,
             methodologyRules: {
               nisabCalculation: result.result.nisab,
               assetTreatment: result.methodology.businessAssetTreatment,
               liabilityDeduction: result.methodology.debtDeduction
             }
           },
          educationalContent: {
            nisabExplanation: `Nisab threshold of ${result.result.nisab.effectiveNisab} based on ${result.result.nisab.nisabBasis}`,
            methodologyExplanation: result.methodology.explanation,
            scholarlyReferences: result.methodology.scholarlyBasis
          }
        }
      });

      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'CALCULATION_ERROR',
        message: 'Unable to calculate Zakat',
        details: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/zakat/nisab
 * Get current nisab thresholds (matches API contract)
 */
router.get('/nisab', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const nisabService = new NisabService();
    const userService = new UserService();
    const logger = new Logger('ZakatRoutes');

    // Currency resolution order (issue #310):
    // 1. Explicit ?currency= query param (explicit user intent for this call)
    // 2. Authenticated user's saved currency preference (settings.currency, encrypted blob)
    // 3. USD fallback
    // Never silently default to USD when the user has a preference — an IDR user
    // must get an IDR nisab or their zakat due is mis-stated by the FX rate.
    const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'TRY', 'INR', 'PKR', 'BDT', 'MYR', 'IDR'];
    let currency = typeof req.query.currency === 'string' ? req.query.currency.toUpperCase() : '';
    if (!currency) {
      try {
        const settings = await userService.getSettings(req.userId!);
        const saved = (settings as { currency?: string }).currency;
        if (typeof saved === 'string' && saved.trim()) currency = saved.toUpperCase();
      } catch (err) {
        logger.warn(`Could not load user currency preference, falling back to USD: ${err instanceof Error ? err.message : err}`);
      }
    }
    if (!SUPPORTED_CURRENCIES.includes(currency)) currency = 'USD';

    const methodology = typeof req.query.methodology === 'string' ? req.query.methodology : 'standard';
    const nisabInfo = await nisabService.calculateNisab(methodology, currency);

    const response = createResponse(true, {
      effectiveDate: new Date().toISOString(),
      currency,
      goldPrice: {
        pricePerGram: nisabInfo.goldNisab / 87.48, // Approximate grams for gold nisab
        currency,
        nisabGrams: 87.48,
        nisabValue: nisabInfo.goldNisab
      },
      silverPrice: {
        pricePerGram: nisabInfo.silverNisab / 612.36, // Approximate grams for silver nisab
        currency,
        nisabGrams: 612.36,
        nisabValue: nisabInfo.silverNisab
      },
      recommendation: nisabInfo.goldNisab <= nisabInfo.silverNisab ? 'gold' : 'silver',
      lastUpdated: new Date().toISOString(),
      source: 'NisabService calculation'
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
 * Get available calculation methodologies (matches API contract)
 */
router.get('/methodologies', async (req, res: Response) => {
  try {
    const { ZAKAT_METHODS } = await import('../../../shared/src/constants');

    const methodologies = Object.values(ZAKAT_METHODS).map(method => ({
      id: method.id,
      name: method.name,
      description: method.description,
      scholarlySource: method.scholarlyBasis.join(', '),
      features: {
        nisabBasis: method.nisabBasis,
        zakatRate: `${method.zakatRate}%`,
        liabilityDeduction: method.debtDeduction,
        calendarSupport: method.calendarSupport
      },
      isDefault: method.id === 'standard'
    }));

    const response = createResponse(true, {
      methodologies
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

/**
 * POST /api/zakat/payments
 * Record a new Zakat payment
 */
router.post('/payments',
  authenticate,
  validateSchema(z.object({
    calculationId: z.string().optional(),
    amount: z.number().positive(),
    paymentDate: z.string(),
    recipient: z.string().optional(),
    notes: z.string().optional()
  })),
  paymentRecordsController.createPayment
);

/**
 * GET /api/zakat/payments
 * Get user's payment records with optional filtering
 */
router.get('/payments',
  authenticate,
  paymentRecordsController.getPayments
);

/**
 * GET /api/zakat/payments/:id
 * Get a specific payment record
 */
router.get('/payments/:id',
  authenticate,
  paymentRecordsController.getPayment
);

/**
 * PUT /api/zakat/payments/:id
 * Update a payment record
 */
router.put('/payments/:id',
  authenticate,
  validateSchema(z.object({
    amount: z.number().positive().optional(),
    paymentDate: z.string().optional(),
    recipient: z.string().optional(),
    notes: z.string().optional(),
    snapshotId: z.string().optional()
  })),
  paymentRecordsController.updatePayment
);

/**
 * DELETE /api/zakat/payments/:id
 * Delete a payment record
 */
router.delete('/payments/:id',
  authenticate,
  paymentRecordsController.deletePayment
);

/**
 * GET /api/zakat/payments/:id/receipt
 * Generate payment receipt
 */
router.get('/payments/:id/receipt',
  authenticate,
  paymentRecordsController.getReceipt
);

/**
 * GET /api/receipts/:token
 * Get payment receipt by token (public access)
 */
router.get('/receipts/:token',
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const tokenStr = token as string;

      // Verify token
      const decoded = jwt.verify(tokenStr, getJwtSecret()) as unknown as { paymentId: string; userId: string };

      const payment = await paymentService.getPayment(decoded.userId, decoded.paymentId);

      if (!payment) {
        const response = createResponse(false, undefined, {
          code: 'RECEIPT_NOT_FOUND',
          message: 'Payment receipt not found'
        });
        return res.status(404).json(response);
      }

      const response = createResponse(true, {
        receipt: {
          paymentId: payment.id,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          recipient: payment.recipient,
          notes: payment.notes,
          calculationId: payment.calculationId,
          generatedAt: new Date().toISOString()
        }
      });
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'RECEIPT_ACCESS_ERROR',
        message: 'Invalid or expired receipt link',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/zakat/history
 * Get calculation history for authenticated user
 */
router.get('/history',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const methodology = req.query.methodology as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await calculationHistoryService.getCalculationHistory(userId, {
        page,
        limit,
        methodology,
        startDate,
        endDate
      });

      const response = createResponse(true, result);
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'HISTORY_FETCH_ERROR',
        message: 'Failed to fetch calculation history',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(500).json(response);
    }
  })
);

export default router;