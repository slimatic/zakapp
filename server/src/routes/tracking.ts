import * as express from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/AuthMiddleware';
import { YearlySnapshotService } from '../services/YearlySnapshotService';
import { PaymentRecordService } from '../services/PaymentRecordService';
import { AnalyticsService } from '../services/AnalyticsService';
import { AnnualSummaryService } from '../services/AnnualSummaryService';
import { ReminderService } from '../services/ReminderService';
import { CalendarConversionService } from '../services/CalendarConversionService';
import { ComparisonService } from '../services/ComparisonService';
import {
  snapshotRateLimit,
  analyticsRateLimit,
  paymentRateLimit,
  validateUserOwnership,
  validateSnapshotId,
  validatePaymentId,
  validatePagination,
  validateDateRange,
  validateComparisonIds,
} from '../middleware/security';

const router = express.Router();

// Initialize services
const snapshotService = new YearlySnapshotService();
const paymentService = new PaymentRecordService();
const analyticsService = new AnalyticsService();
const summaryService = new AnnualSummaryService();
const reminderService = new ReminderService();
const calendarService = new CalendarConversionService();
const comparisonService = new ComparisonService();

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
  };
}

/**
 * Helper function to send success response
 */
function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const response: StandardResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
  res.status(statusCode).json(response);
}

/**
 * Helper function to send error response
 */
function sendError(res: Response, code: string, message: string, statusCode: number = 400, details?: any[]): void {
  const response: StandardResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
  res.status(statusCode).json(response);
}

/**
 * POST /api/tracking/snapshots
 * Create a new yearly snapshot
 * @route T037
 */
router.post('/snapshots', authenticate, validateUserOwnership, snapshotRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const {
      calculationDate,
      gregorianYear,
      gregorianMonth,
      gregorianDay,
      hijriYear,
      hijriMonth,
      hijriDay,
      totalWealth,
      totalLiabilities,
      zakatableWealth,
      zakatAmount,
      methodologyUsed,
      nisabThreshold,
      nisabType,
      status,
      assetBreakdown,
      calculationDetails,
      userNotes,
      isPrimary
    } = req.body;

    // Validation
    if (!calculationDate || !gregorianYear || !hijriYear || totalWealth === undefined || totalLiabilities === undefined || zakatAmount === undefined) {
      return sendError(res, 'VALIDATION_ERROR', 'Missing required fields', 400);
    }

    const snapshot = await snapshotService.createSnapshot(userId, {
      calculationDate,
      gregorianYear,
      gregorianMonth,
      gregorianDay,
      hijriYear,
      hijriMonth,
      hijriDay,
      totalWealth,
      totalLiabilities,
      zakatableWealth,
      zakatAmount,
      methodologyUsed,
      nisabThreshold,
      nisabType,
      status,
      assetBreakdown,
      calculationDetails,
      userNotes,
      isPrimary
    });

    sendSuccess(res, { snapshot }, 201);
  } catch (error: any) {
    console.error('Error creating snapshot:', error);
    if (error.message?.includes('already exists')) {
      return sendError(res, 'DUPLICATE_SNAPSHOT', error.message, 409);
    }
    sendError(res, 'INTERNAL_ERROR', 'Failed to create snapshot', 500);
  }
});

/**
 * GET /api/tracking/snapshots
 * List all snapshots with pagination
 * @route T038
 */
router.get('/snapshots', authenticate, validateUserOwnership, validatePagination, snapshotRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const status = req.query.status as 'draft' | 'finalized' | 'all';
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const result = await snapshotService.listSnapshots(userId, {
      page,
      limit,
      sortOrder,
      status,
      year
    });

    sendSuccess(res, {
      snapshots: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error fetching snapshots:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch snapshots', 500);
  }
});

/**
 * GET /api/tracking/snapshots/:id
 * Get a single snapshot by ID
 * @route T039
 */
router.get('/snapshots/:id', authenticate, validateUserOwnership, validateSnapshotId, snapshotRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { id } = req.params;

    if (!id) {
      return sendError(res, 'VALIDATION_ERROR', 'Snapshot ID is required', 400);
    }

    const snapshot = await snapshotService.getSnapshot(id, userId);

    if (!snapshot) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    sendSuccess(res, { snapshot });
  } catch (error: any) {
    console.error('Error fetching snapshot:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch snapshot', 500);
  }
});

/**
 * PUT /api/tracking/snapshots/:id
 * Update a snapshot (only if not finalized)
 * @route T040
 */
router.put('/snapshots/:id', authenticate, validateUserOwnership, validateSnapshotId, snapshotRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { id } = req.params;

    if (!id) {
      return sendError(res, 'VALIDATION_ERROR', 'Snapshot ID is required', 400);
    }

    // Verify ownership and finalization status
    const existing = await snapshotService.getSnapshot(id, userId);
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    if (existing.status === 'finalized') {
      return sendError(res, 'INVALID_OPERATION', 'Cannot update a finalized snapshot', 400);
    }

    const {
      totalWealth,
      totalLiabilities,
      zakatAmount,
      methodologyUsed,
      assetBreakdown,
      calculationDetails,
      userNotes
    } = req.body;

    // Validation for numeric fields
    if (totalWealth !== undefined && (typeof totalWealth !== 'number' || totalWealth < 0)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid totalWealth (must be non-negative number)', 400);
    }

    if (totalLiabilities !== undefined && (typeof totalLiabilities !== 'number' || totalLiabilities < 0)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid totalLiabilities (must be non-negative number)', 400);
    }

    if (zakatAmount !== undefined && (typeof zakatAmount !== 'number' || zakatAmount < 0)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid zakatAmount (must be non-negative number)', 400);
    }

    const snapshot = await snapshotService.updateSnapshot(id, userId, {
      totalWealth,
      totalLiabilities,
      zakatAmount,
      methodologyUsed,
      assetBreakdown,
      calculationDetails,
      userNotes
    });

    sendSuccess(res, { snapshot });
  } catch (error: any) {
    console.error('Error updating snapshot:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to update snapshot', 500);
  }
});

/**
 * DELETE /api/tracking/snapshots/:id
 * Delete a snapshot
 * @route T041
 */
router.delete('/snapshots/:id', authenticate, validateUserOwnership, validateSnapshotId, snapshotRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { id } = req.params;

    if (!id) {
      return sendError(res, 'VALIDATION_ERROR', 'Snapshot ID is required', 400);
    }

    // Verify ownership
    const existing = await snapshotService.getSnapshot(id, userId);
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    await snapshotService.deleteSnapshot(id, userId);

    sendSuccess(res, { message: 'Snapshot deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting snapshot:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to delete snapshot', 500);
  }
});

/**
 * POST /api/tracking/snapshots/:id/finalize
 * Finalize a snapshot (make it immutable)
 * @route T042
 */
router.post('/snapshots/:id/finalize', authenticate, validateUserOwnership, validateSnapshotId, snapshotRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { id } = req.params;

    if (!id) {
      return sendError(res, 'VALIDATION_ERROR', 'Snapshot ID is required', 400);
    }

    // Verify ownership and finalization status
    const existing = await snapshotService.getSnapshot(id, userId);
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    if (existing.status === 'finalized') {
      return sendError(res, 'INVALID_OPERATION', 'Snapshot is already finalized', 400);
    }

    const snapshot = await snapshotService.finalizeSnapshot(id, userId);

    sendSuccess(res, { snapshot, message: 'Snapshot finalized successfully' });
  } catch (error: any) {
    console.error('Error finalizing snapshot:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to finalize snapshot', 500);
  }
});

/**
 * GET /api/tracking/comparison
 * Compare multiple snapshots
 * @route T043
 */
router.get('/comparison', authenticate, validateUserOwnership, validateComparisonIds, analyticsRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const snapshotIds = req.query.snapshotIds as string | string[];

    if (!snapshotIds) {
      return sendError(res, 'VALIDATION_ERROR', 'snapshotIds query parameter is required', 400);
    }

    const ids = Array.isArray(snapshotIds) ? snapshotIds : [snapshotIds];

    if (ids.length < 2) {
      return sendError(res, 'VALIDATION_ERROR', 'At least 2 snapshot IDs are required for comparison', 400);
    }

    if (ids.length > 10) {
      return sendError(res, 'VALIDATION_ERROR', 'Maximum 10 snapshots can be compared at once', 400);
    }

    // Verify all snapshots belong to the user
    for (const id of ids) {
      const snapshot = await snapshotService.getSnapshot(id, userId);
      if (!snapshot) {
        return sendError(res, 'NOT_FOUND', `Snapshot with ID ${id} not found`, 404);
      }
    }

    const comparison = await comparisonService.compareSnapshots(ids, userId);

    sendSuccess(res, { comparison });
  } catch (error: any) {
    console.error('Error comparing snapshots:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to compare snapshots', 500);
  }
});

// Additional helpful endpoints beyond T037-T044

/**
 * GET /api/tracking/snapshots/:id/payments
 * Get all payment records for a snapshot
 */
router.get('/snapshots/:id/payments', authenticate, validateUserOwnership, validateSnapshotId, paymentRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { id } = req.params;

    // Verify snapshot ownership
    const snapshot = await snapshotService.getSnapshot(id, userId);
    if (!snapshot) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    const payments = await paymentService.getPaymentsBySnapshot(id, userId);

    sendSuccess(res, { payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch payments', 500);
  }
});

/**
 * GET /api/tracking/reminders
 * Get all reminders for the user
 */
router.get('/reminders', authenticate, validateUserOwnership, snapshotRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const status = req.query.status as 'pending' | 'shown' | 'acknowledged' | 'dismissed';
    const eventType = req.query.eventType as string;

    const reminders = await reminderService.listReminders(userId, { status, eventType: eventType as any });

    sendSuccess(res, { reminders: reminders.data, total: reminders.total });
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch reminders', 500);
  }
});

/**
 * POST /api/tracking/reminders/trigger
 * Trigger automatic reminders for the user
 */
router.post('/reminders/trigger', authenticate, validateUserOwnership, snapshotRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const reminders = await reminderService.triggerAutomaticReminders(userId);

    sendSuccess(res, { reminders, count: reminders.length });
  } catch (error: any) {
    console.error('Error triggering reminders:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to trigger reminders', 500);
  }
});

/**
 * PUT /api/tracking/reminders/:id/acknowledge
 * Acknowledge a reminder
 */
router.put('/reminders/:id/acknowledge', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { id } = req.params;

    // Verify ownership
    const existing = await reminderService.getReminder(id, userId);
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Reminder not found', 404);
    }

    const reminder = await reminderService.acknowledgeReminder(id, userId);

    sendSuccess(res, { reminder });
  } catch (error: any) {
    console.error('Error acknowledging reminder:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to acknowledge reminder', 500);
  }
});

export default router;
