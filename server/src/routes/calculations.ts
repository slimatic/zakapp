import express, { Request, Response } from 'express';
import { z } from 'zod';
import { CalculationHistoryService, SaveCalculationRequest } from '../services/CalculationHistoryService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const calculationHistoryService = new CalculationHistoryService();

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
  methodology: z.enum(['standard', 'hanafi', 'shafi', 'custom']),
  calendarType: z.enum(['hijri', 'gregorian']),
  totalWealth: z.number().min(0),
  nisabThreshold: z.number().min(0),
  zakatDue: z.number().min(0),
  zakatRate: z.number().min(0).max(100).optional().default(2.5),
  assetBreakdown: z.record(z.any()),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Get Calculations Query Schema
 */
const GetCalculationsQuerySchema = z.object({
  methodology: z.enum(['standard', 'hanafi', 'shafi', 'custom']).optional(),
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
  calculationIds: z.array(z.string()).min(2).max(10)
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
  authenticateToken,
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
        metadata: validatedData.metadata
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
      // eslint-disable-next-line no-console
      console.error('Save calculation error:', error);

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
  authenticateToken,
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
      console.error('Get calculations error:', error);

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
  authenticateToken,
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
      console.error('Get trends error:', error);

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
  authenticateToken,
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

      const calculationId = req.params.id;

      // Get calculation
      const calculation = await calculationHistoryService.getCalculationById(userId, calculationId);

      return res.status(200).json({
        success: true,
        calculation
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get calculation error:', error);

      if (error.message === 'Calculation not found or access denied') {
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
  authenticateToken,
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

      // Compare calculations
      const comparison = await calculationHistoryService.compareCalculations(
        userId,
        validatedData.calculationIds
      );

      return res.status(200).json({
        success: true,
        comparison
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Compare calculations error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }

      if (error.message.includes('At least 2 calculations') || 
          error.message.includes('Maximum 10 calculations')) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: error.message
        });
      }

      if (error.message.includes('not found or access denied')) {
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
  authenticateToken,
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

      const calculationId = req.params.id;

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
      console.error('Update notes error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }

      if (error.message === 'Calculation not found or access denied') {
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
  authenticateToken,
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

      const calculationId = req.params.id;

      // Delete calculation
      const result = await calculationHistoryService.deleteCalculation(userId, calculationId);

      return res.status(200).json(result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Delete calculation error:', error);

      if (error.message === 'Calculation not found or access denied') {
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

export default router;
