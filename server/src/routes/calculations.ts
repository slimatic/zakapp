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

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { CalculationHistoryService, SaveCalculationRequest } from '../services/CalculationHistoryService';
import { ZakatEngine } from '../services/zakatEngine';
import { CurrencyService } from '../services/currencyService';
import { CalendarService } from '../services/calendarService';
import { NisabService } from '../services/NisabService';
import { authMiddleware } from '../middleware/auth';
import { Logger } from '../utils/logger';

const logger = new Logger('CalculationsRoute');


const router = express.Router();
const calculationHistoryService = new CalculationHistoryService();

// Initialize ZakatEngine dependencies
const currencyService = new CurrencyService();
const calendarService = new CalendarService();
const nisabService = new NisabService();
const zakatEngine = new ZakatEngine(currencyService, calendarService, nisabService);

/**
 * Authenticated Request Interface
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Save Calculation Request Schema
 */
const SaveCalculationSchema = z.object({
  methodology: z.enum(['standard', 'hanafi', 'shafii', 'custom']),
  calendarType: z.enum(['hijri', 'gregorian']),
  totalWealth: z.number().min(0),
  nisabThreshold: z.number().min(0),
  zakatDue: z.number().min(0),
  zakatRate: z.number().min(0).max(100).optional().default(2.5),
  assetBreakdown: z.record(z.unknown()),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  zakatYearStart: z.string().datetime(),
  zakatYearEnd: z.string().datetime(),
  methodologyConfigId: z.string().uuid().optional()
});

/**
 * Get Calculations Query Schema
 */
const GetCalculationsQuerySchema = z.object({
  methodology: z.enum(['standard', 'hanafi', 'shafii', 'custom']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['calculationDate', 'totalWealth', 'zakatDue']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

/**
 * Compare Calculations Schema
 */
const CompareCalculationsSchema = z.object({
  methodologies: z.array(z.enum(['STANDARD', 'HANAFI', 'SHAFII', 'CUSTOM'])).min(2).max(4),
  customConfigIds: z.array(z.string().uuid()).optional(),
  referenceDate: z.string().optional()
});

/**
 * Trend Analysis Query Schema
 */
const TrendAnalysisQuerySchema = z.object({
  period: z.enum(['1month', '3months', '6months', '1year', '2years', 'all']).optional()
});

/**
 * Update Notes Schema
 */
const UpdateNotesSchema = z.object({
  notes: z.string()
});

/**
 * POST /api/calculations
 * Save a new calculation to history
 */
router.post('/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate request body
      const validatedData = SaveCalculationSchema.parse(req.body);

      // Ensure required fields have defaults
      const calculationData: SaveCalculationRequest = {
        methodology: validatedData.methodology,
        calendarType: validatedData.calendarType,
        totalWealth: validatedData.totalWealth,
        nisabThreshold: validatedData.nisabThreshold,
        zakatDue: validatedData.zakatDue,
        zakatRate: validatedData.zakatRate || 2.5,
        assetBreakdown: validatedData.assetBreakdown,
        notes: validatedData.notes,
        metadata: validatedData.metadata,
        zakatYearStart: new Date(validatedData.zakatYearStart),
        zakatYearEnd: new Date(validatedData.zakatYearEnd),
        methodologyConfigId: validatedData.methodologyConfigId
      };

      // Get user ID from auth token
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      // Save calculation
      const calculation = await calculationHistoryService.saveCalculation(userId, calculationData);

      return res.status(201).json({
        success: true,
        message: 'Calculation saved successfully',
        calculation
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      logger.error('Calculation error:', error);


      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Calculation not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Calculation not found'
        });
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to save calculation'
      });
    }
  }
);

/**
 * GET /api/calculations
 * List calculation history with filters and pagination
 */
router.get('/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate query parameters
      const query = GetCalculationsQuerySchema.parse(req.query);

      // Get user ID from auth token
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      // Build filters
      const filters = {
        methodology: query.methodology,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      };

      // Get calculation history
      const result = await calculationHistoryService.getCalculationHistory(userId, filters);

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      logger.error('Get calculations error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve calculation history'
      });
    }
  }
);

/**
 * GET /api/calculations/trends/analysis
 * Get trend analysis for calculations over time
 */
router.get('/trends/analysis',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate query parameters
      const query = TrendAnalysisQuerySchema.parse(req.query);

      // Get user ID from auth token
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      // Get trend analysis
      const trends = await calculationHistoryService.getTrendAnalysis(userId, {
        period: query.period
      });

      return res.status(200).json({
        success: true,
        trends
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      logger.error('Get trends error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve trend analysis'
      });
    }
  }
);

/**
 * GET /api/calculations/:id
 * Get a specific calculation by ID
 */
router.get('/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get user ID from auth token
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const calculationId = req.params.id as string;

      // Get calculation
      const calculation = await calculationHistoryService.getCalculationById(userId, calculationId);

      return res.status(200).json({
        success: true,
        calculation
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      logger.error('Get calculation error:', error);

      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Calculation not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Calculation not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve calculation'
      });
    }
  }
);

/**
 * POST /api/calculations/compare
 * Compare multiple calculations
 */
router.post('/compare',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate request body
      const validatedData = CompareCalculationsSchema.parse(req.body);

      // Get user ID from auth token
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      // Compare methodologies using ZakatEngine
      const comparison = await zakatEngine.compareMethodologies({
        methodologies: validatedData.methodologies.map(m => m.toLowerCase()),
        customConfigIds: validatedData.customConfigIds,
        referenceDate: validatedData.referenceDate,
        userId
      });

      return res.status(200).json({
        success: true,
        comparison
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      logger.error('Compare calculations error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }

      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('At least 2 methodologies') ||
        errorMessage.includes('Maximum 4 methodologies')) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: errorMessage
        });
      }

      if (errorMessage.includes('not found or access denied')) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'One or more calculations not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to compare calculations'
      });
    }
  }
);

/**
 * PATCH /api/calculations/:id/notes
 * Update calculation notes
 */
router.patch('/:id/notes',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate request body
      const validatedData = UpdateNotesSchema.parse(req.body);

      // Get user ID from auth token
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const calculationId = req.params.id as string;

      // Update notes
      const calculation = await calculationHistoryService.updateCalculationNotes(
        userId,
        calculationId,
        validatedData.notes
      );

      return res.status(200).json({
        success: true,
        message: 'Notes updated successfully',
        calculation
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      logger.error('Update notes error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }

      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Calculation not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Calculation not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update notes'
      });
    }
  }
);

/**
 * DELETE /api/calculations/:id
 * Delete a calculation from history
 */
router.delete('/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get user ID from auth token
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const calculationId = req.params.id as string;

      // Delete calculation
      const result = await calculationHistoryService.deleteCalculation(userId, calculationId);

      return res.status(200).json(result);
    } catch (error) {
      // eslint-disable-next-line no-console
      logger.error('Delete calculation error:', error);

      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Calculation not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Calculation not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete calculation'
      });
    }
  }
);

/**
 * Safely extracts error message from unknown error type
 * @param error - The caught error (unknown type in strict mode)
 * @returns Error message string or default message
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default router;
