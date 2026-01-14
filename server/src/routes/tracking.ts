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
import { PrismaClient } from '@prisma/client';
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
const prisma = new PrismaClient();

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
      calculationId,
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

    let snapshotData: {
      calculationDate?: string;
      gregorianYear?: number;
      gregorianMonth?: number;
      gregorianDay?: number;
      hijriYear?: number;
      hijriMonth?: number;
      hijriDay?: number;
      totalWealth?: number;
      totalLiabilities?: number;
      zakatableWealth?: number;
      zakatAmount?: number;
      methodologyUsed?: string;
      nisabThreshold?: number;
      nisabType?: string;
      status?: string;
      assetBreakdown?: any;
      calculationDetails?: any;
      userNotes?: string;
      isPrimary?: boolean;
    } = {};

    // If calculationId is provided, populate data from calculation
    if (calculationId) {
      const calculation = await prisma.zakatCalculation.findFirst({
        where: {
          id: calculationId,
          userId
        }
      });

      if (!calculation) {
        return sendError(res, 'NOT_FOUND', 'Calculation not found', 404);
      }

      // Parse breakdown JSON
      const breakdown = JSON.parse(calculation.breakdown);

      snapshotData = {
        calculationDate: calculation.calculationDate.toISOString(),
        gregorianYear: calculation.calculationDate.getFullYear(),
        gregorianMonth: calculation.calculationDate.getMonth() + 1,
        gregorianDay: calculation.calculationDate.getDate(),
        hijriYear: req.body.year || calculation.calculationDate.getFullYear(), // Use provided year or calculation year
        hijriMonth: 1, // Default to Muharram
        hijriDay: 1, // Default to 1st
        totalWealth: calculation.totalAssets,
        totalLiabilities: calculation.totalLiabilities,
        zakatableWealth: calculation.totalAssets - calculation.totalLiabilities,
        zakatAmount: calculation.zakatAmount,
        methodologyUsed: (calculation.methodology.charAt(0).toUpperCase() + calculation.methodology.slice(1)) as 'Standard' | 'Hanafi' | 'Shafii' | 'Custom',
        nisabThreshold: calculation.nisabThreshold,
        nisabType: (calculation.nisabSource === 'gold' ? 'gold' : 'silver') as 'gold' | 'silver',
        status: 'finalized' as 'draft' | 'finalized',
        assetBreakdown: breakdown,
        calculationDetails: calculation,
        userNotes: req.body.notes || 'Created from calculation',
        isPrimary: true
      };
    } else {
      // Use provided data
      snapshotData = {
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
      };
    }

    // Validation
    if (!snapshotData.calculationDate || !snapshotData.gregorianYear || !snapshotData.hijriYear || snapshotData.totalWealth === undefined || snapshotData.totalLiabilities === undefined || snapshotData.zakatAmount === undefined) {
      return sendError(res, 'VALIDATION_ERROR', 'Missing required fields', 400);
    }

    const snapshot = await snapshotService.createSnapshot(userId, {
      calculationDate: snapshotData.calculationDate!,
      gregorianYear: snapshotData.gregorianYear!,
      gregorianMonth: snapshotData.gregorianMonth!,
      gregorianDay: snapshotData.gregorianDay!,
      hijriYear: snapshotData.hijriYear!,
      hijriMonth: snapshotData.hijriMonth!,
      hijriDay: snapshotData.hijriDay!,
      totalWealth: snapshotData.totalWealth!,
      totalLiabilities: snapshotData.totalLiabilities!,
      zakatableWealth: snapshotData.zakatableWealth!,
      zakatAmount: snapshotData.zakatAmount!,
      methodologyUsed: snapshotData.methodologyUsed as 'Standard' | 'Hanafi' | 'Shafii' | 'Custom',
      nisabThreshold: snapshotData.nisabThreshold!,
      nisabType: snapshotData.nisabType as 'gold' | 'silver',
      status: snapshotData.status as 'draft' | 'finalized',
      assetBreakdown: snapshotData.assetBreakdown,
      calculationDetails: snapshotData.calculationDetails,
      userNotes: snapshotData.userNotes,
      isPrimary: snapshotData.isPrimary
    });

    console.log('✅ Snapshot created successfully:', snapshot.id);
    sendSuccess(res, { snapshot }, 201);
  } catch (error: any) {
    console.error('❌ ERROR CREATING SNAPSHOT:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error object:', error);

    if (error.message?.includes('already exists')) {
      return sendError(res, 'DUPLICATE_SNAPSHOT', error.message, 409);
    }
    sendError(res, 'INTERNAL_ERROR', `Failed to create snapshot: ${error.message}`, 500);
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

    const snapshot = await snapshotService.getSnapshot(id as string, userId);

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
    const existing = await snapshotService.getSnapshot(id as string, userId);
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

    const snapshot = await snapshotService.updateSnapshot(id as string, userId, {
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
    const existing = await snapshotService.getSnapshot(id as string, userId);
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    await snapshotService.deleteSnapshot(id as string, userId);

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
    const existing = await snapshotService.getSnapshot(id as string, userId);
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    if (existing.status === 'finalized') {
      return sendError(res, 'INVALID_OPERATION', 'Snapshot is already finalized', 400);
    }

    const snapshot = await snapshotService.finalizeSnapshot(id as string, userId);

    sendSuccess(res, { snapshot, message: 'Snapshot finalized successfully' });
  } catch (error: any) {
    console.error('Error finalizing snapshot:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to finalize snapshot', 500);
  }
});

/**
 * GET /api/tracking/analytics/metrics
 * Fetch analytics metrics with caching
 */
router.get('/analytics/metrics', authenticate, validateUserOwnership, analyticsRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const metricType = req.query.metricType as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!metricType) {
      return sendError(res, 'VALIDATION_ERROR', 'metricType query parameter is required', 400);
    }

    const validMetricTypes = [
      'wealth_trend',
      'zakat_trend',
      'payment_distribution',
      'asset_composition',
      'yearly_comparison',
      'nisab_compliance',
      'payment_consistency'
    ];

    if (!validMetricTypes.includes(metricType)) {
      return sendError(res, 'VALIDATION_ERROR', `Invalid metricType. Must be one of: ${validMetricTypes.join(', ')}`, 400);
    }

    const metric = await (analyticsService as any).getMetric(userId, metricType, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    sendSuccess(res, {
      metric,
      data: metric?.calculatedValue,
      metadata: {
        period: startDate && endDate ? `${startDate} to ${endDate}` : 'all time',
        lastUpdated: metric?.calculatedAt ? (typeof metric.calculatedAt === 'string' ? metric.calculatedAt : metric.calculatedAt.toISOString()) : new Date().toISOString(),
        dataPoints: Array.isArray(metric?.calculatedValue) ? metric.calculatedValue.length : 1
      },
      summary: {
        metricType,
        cached: metric ? true : false
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics metrics:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch analytics metrics', 500);
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
 * GET /api/tracking/payments
 * Get all payment records for the authenticated user across all Nisab Year Records
 * Supports filtering by category
 */
router.get('/payments', authenticate, paymentRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { category } = req.query;

    const payments = await paymentService.getAllPayments(userId, category as string | undefined);

    sendSuccess(res, { payments });
  } catch (error: any) {
    console.error('Error fetching all payments:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch payments', 500);
  }
});

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
    const snapshot = await snapshotService.getSnapshot(id as string, userId);
    if (!snapshot) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    const payments = await paymentService.getPaymentsBySnapshot(id as string, userId);

    sendSuccess(res, { payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch payments', 500);
  }
});

/**
 * POST /api/tracking/snapshots/:id/payments
 * Create a new payment record for a snapshot
 */
router.post('/snapshots/:id/payments', authenticate, validateUserOwnership, validateSnapshotId, paymentRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { id: snapshotId } = req.params;

    // Verify snapshot ownership
    const snapshot = await snapshotService.getSnapshot(snapshotId as string, userId);
    if (!snapshot) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    const paymentData = {
      ...req.body,
      snapshotId
    };

    console.log('DEBUG - Payment data received:', JSON.stringify(paymentData, null, 2));

    const payment = await paymentService.createPayment(userId, paymentData);

    sendSuccess(res, { payment }, 201);
  } catch (error: any) {
    console.error('Error creating payment:', error);
    sendError(res, 'INTERNAL_ERROR', error.message || 'Failed to create payment', 500);
  }
});

/**
 * PUT /api/tracking/snapshots/:snapshotId/payments/:paymentId
 * Update an existing payment record
 */
router.put('/snapshots/:snapshotId/payments/:paymentId', authenticate, validateUserOwnership, paymentRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { snapshotId, paymentId } = req.params;

    // Verify snapshot ownership
    const snapshot = await snapshotService.getSnapshot(snapshotId as string, userId);
    if (!snapshot) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    const payment = await paymentService.updatePayment(paymentId as string, userId, req.body);

    sendSuccess(res, { payment });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    if (error.message === 'Payment not found') {
      return sendError(res, 'NOT_FOUND', 'Payment not found', 404);
    }
    sendError(res, 'INTERNAL_ERROR', error.message || 'Failed to update payment', 500);
  }
});

/**
 * DELETE /api/tracking/snapshots/:snapshotId/payments/:paymentId
 * Delete a payment record
 */
router.delete('/snapshots/:snapshotId/payments/:paymentId', authenticate, validateUserOwnership, paymentRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const { snapshotId, paymentId } = req.params;

    // Verify snapshot ownership
    const snapshot = await snapshotService.getSnapshot(snapshotId as string, userId);
    if (!snapshot) {
      return sendError(res, 'NOT_FOUND', 'Snapshot not found', 404);
    }

    await paymentService.deletePayment(paymentId as string, userId);

    sendSuccess(res, { message: 'Payment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    sendError(res, 'INTERNAL_ERROR', error.message || 'Failed to delete payment', 500);
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
    const existing = await reminderService.getReminder(id as string, userId);
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Reminder not found', 404);
    }

    const reminder = await reminderService.acknowledgeReminder(id as string, userId);

    sendSuccess(res, { reminder });
  } catch (error: any) {
    console.error('Error acknowledging reminder:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to acknowledge reminder', 500);
  }
});

export default router;
