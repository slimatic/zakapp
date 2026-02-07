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

/**
 * Nisab Year Records Routes (T048-T049)
 * 
 * API endpoints for Nisab Year Record management:
 * - List records with filtering
 * - Create new record
 * - Get single record with live data
 * - Update record
 * - Delete record (DRAFT only)
 * - Finalize record
 * - Unlock record
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { NisabYearRecordService } from '../services/nisabYearRecordService';
import { AuditTrailService } from '../services/auditTrailService';
import type {
  CreateNisabYearRecordDto,
  UpdateNisabYearRecordDto,
  FinalizeRecordDto,
  UnlockRecordDto,
} from '@zakapp/shared';

const router = Router();

// Middleware: Require authentication only for nisab year records routes
router.use('/api/nisab-year-records', authMiddleware);

// Create service instances
const nisabYearRecordService = new NisabYearRecordService();
const auditTrailService = new AuditTrailService();

/**
 * T050: GET /api/nisab-year-records
 * List all records for authenticated user with optional filters
 * 
 * Query parameters (all optional):
 * - status: comma-separated list (DRAFT, FINALIZED, UNLOCKED)
 * - hijriYear: specific Hijri year (e.g., 1445H)
 * - startDate: ISO date string for date range start
 * - endDate: ISO date string for date range end
 * - limit: results per page (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     records: NisabYearRecord[],
 *     total: number,
 *     limit: number,
 *     offset: number,
 *     hasMore: boolean
 *   }
 * }
 */
router.get('/api/nisab-year-records', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const filters: Record<string, any> = {};
    if (req.query.status) {
      filters.status = (req.query.status as string).split(',');
    }
    if (req.query.hijriYear) {
      filters.hijriYear = req.query.hijriYear as string;
    }
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const result = await nisabYearRecordService.getRecords(req.userId, filters, limit, offset);

    res.status(200).json({
      success: true,
      data: {
        records: result.records,
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'FETCH_FAILED',
      message: error.message,
    });
  }
});

/**
 * GET /api/nisab-year-records/status
 * Get current Hawl tracking status for authenticated user
 * 
 * Returns active DRAFT record status if one exists
 * 
 * Response:
 * {
 *   active: boolean,
 *   recordId?: string,
 *   hawlStartDate?: Date,
 *   hawlCompletionDate?: Date,
 *   daysRemaining?: number,
 *   nisabBasis?: 'gold' | 'silver',
 *   currentWealth?: number,
 *   nisabThreshold?: number
 * }
 */
router.get('/api/nisab-year-records/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Get active DRAFT record
    const result = await nisabYearRecordService.getRecords(userId, { status: ['DRAFT'] }, 1, 0);

    if (result.records.length === 0) {
      // No active Hawl
      res.status(200).json({
        active: false,
      });
      return;
    }

    const record = result.records[0];
    
    // Calculate days remaining
    const now = new Date();
    const completionDate = new Date(record.hawlCompletionDate);
    const daysRemaining = Math.ceil((completionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      active: true,
      recordId: record.id,
      hawlStartDate: record.hawlStartDate,
      hawlCompletionDate: record.hawlCompletionDate,
      daysRemaining: Math.max(0, daysRemaining),
      nisabBasis: record.nisabBasis?.toLowerCase() || 'gold',
      currentWealth: parseFloat(record.totalWealth),
      nisabThreshold: parseFloat(record.nisabThresholdAtStart || '0'),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'STATUS_FETCH_FAILED',
      message: error.message,
    });
  }
});

/**
 * T051: POST /api/nisab-year-records
 * Create a new Nisab Year Record (starts in DRAFT status)
 * 
 * Request body:
 * {
 *   hawlStartDate: string|Date,        // Required: ISO date when wealth reached Nisab
 *   hawlStartDateHijri: string,        // Required: Hijri date (e.g., 1445-01-01H)
 *   hawlCompletionDate: string|Date,   // Required: Calculated end of 354-day Hawl
 *   hawlCompletionDateHijri: string,   // Required: Hijri date of completion
 *   nisabBasis: string,                // Required: GOLD or SILVER
 *   totalWealth?: number,              // Optional: Initial wealth
 *   userNotes?: string                 // Optional: User notes
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: NisabYearRecordResponse
 * }
 */
router.post('/api/nisab-year-records', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dto: CreateNisabYearRecordDto = req.body;

    // Basic validation
    if (!dto.hawlStartDate) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'hawlStartDate is required',
      });
    }

    if (!dto.hawlStartDateHijri) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'hawlStartDateHijri is required',
      });
    }

    if (!['GOLD', 'SILVER'].includes(dto.nisabBasis)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'nisabBasis must be GOLD or SILVER',
      });
    }

    if (dto.nisabThresholdAtStart !== undefined && dto.nisabThresholdAtStart < 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'nisabThresholdAtStart cannot be negative',
      });
    }

    const record = await nisabYearRecordService.createRecord(req.userId, dto);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'CREATE_FAILED',
      message: error.message,
    });
  }
});

/**
 * T052: GET /api/nisab-year-records/:id
 * Get single record with live tracking data
 * 
 * Response:
 * {
 *   success: true,
 *   data: NisabYearRecordResponse (includes liveHawlData if DRAFT)
 * }
 */
router.get('/api/nisab-year-records/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await nisabYearRecordService.getRecord(req.userId, req.params.id as string);

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    if (error.message === 'Record not found' || error.message.includes('Unauthorized')) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Record not found',
      });
    }

    res.status(400).json({
      success: false,
      error: 'FETCH_FAILED',
      message: error.message,
    });
  }
});

/**
 * T053: PUT /api/nisab-year-records/:id
 * Update record details (DRAFT status only)
 * 
 * Request body:
 * {
 *   notes?: string,
 *   nisabBasis?: string     // GOLD or SILVER
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: NisabYearRecordResponse
 * }
 */
router.put('/api/nisab-year-records/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dto: UpdateNisabYearRecordDto = req.body;

    if (req.body.status) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Status can only be changed via finalize/unlock endpoints',
      });
    }

    const record = await nisabYearRecordService.updateRecord(req.userId, req.params.id as string, dto);

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    if (error.message.includes('Cannot update')) {
      return res.status(409).json({
        success: false,
        error: 'INVALID_STATE',
        message: error.message,
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Record not found',
      });
    }

    res.status(400).json({
      success: false,
      error: 'UPDATE_FAILED',
      message: error.message,
    });
  }
});

/**
 * T054: DELETE /api/nisab-year-records/:id
 * Delete a record (DRAFT or UNLOCKED status only, not FINALIZED)
 * 
 * Response:
 * {
 *   success: true,
 *   message: 'Record deleted successfully'
 * }
 */
router.delete('/api/nisab-year-records/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await nisabYearRecordService.deleteRecord(req.userId, req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    if (error.message.includes('Cannot delete')) {
      return res.status(409).json({
        success: false,
        error: 'INVALID_STATE',
        message: error.message,
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Record not found',
      });
    }

    res.status(400).json({
      success: false,
      error: 'DELETE_FAILED',
      message: error.message,
    });
  }
});

/**
 * T098: GET /api/nisab-year-records/:id/assets/refresh
 * Get current zakatable assets for a DRAFT record (for manual refresh)
 * 
 * Validations:
 * - Record must be DRAFT status (cannot refresh FINALIZED/UNLOCKED)
 * - User must own the record
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     assets: Array<{
 *       id: string,
 *       name: string,
 *       category: string,
 *       value: number,
 *       isZakatable: boolean,
 *       addedAt: string
 *     }>,
 *     totalWealth: number,
 *     zakatableWealth: number
 *   }
 * }
 */
router.get(
  '/api/nisab-year-records/:id/assets/refresh',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Fetch the record
      const record = await nisabYearRecordService.getRecord(req.userId, req.params.id as string);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: 'RECORD_NOT_FOUND',
          message: 'Record not found',
        });
      }

      // Validate record status - allow only DRAFT
      if (record.status !== 'DRAFT') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_STATUS',
          message: 'Can only refresh assets for DRAFT records',
        });
      }

      // Fetch current zakatable assets
      const wealthAggregationService = nisabYearRecordService['wealthAggregationService'];
      const allAssets = await wealthAggregationService.getZakatableAssets(req.userId);

      // Filter to only return zakatable assets
      const zakatableAssets = allAssets.filter(asset => asset.isZakatable);

      // Calculate totals (use per-asset zakatableValue when present)
      const totalWealth = allAssets.reduce((sum, asset) => sum + (asset.value || 0), 0);
      const zakatableWealth = zakatableAssets
        .reduce((sum, asset) => sum + (typeof (asset as any).zakatableValue === 'number' ? (asset as any).zakatableValue : (asset.value || 0)), 0);

      res.status(200).json({
        success: true,
        data: {
          assets: zakatableAssets.map(asset => ({
            id: asset.id,
            name: asset.name,
            category: asset.category,
            value: asset.value,
            isZakatable: asset.isZakatable,
            calculationModifier: (asset as any).calculationModifier,
            zakatableValue: (asset as any).zakatableValue,
            addedAt: asset.addedAt.toISOString(),
          })),
          totalWealth,
          zakatableWealth,
        },
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Record not found',
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You do not have permission to access this record',
        });
      }

      res.status(400).json({
        success: false,
        error: 'REFRESH_FAILED',
        message: error.message,
      });
    }
  }
);

/**
 * T055: POST /api/nisab-year-records/:id/finalize
 * Finalize a DRAFT record (transition to FINALIZED)
 * 
 * Validations:
 * - Record must be DRAFT or REFINALIZED
 * - Hawl must be complete (354 days)
 * - Current Hawl period must have zakatble wealth
 * 
 * Request body:
 * {
 *   finalizationNotes?: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: NisabYearRecordResponse (with finalZakatAmount calculated)
 * }
 */
router.post(
  '/api/nisab-year-records/:id/finalize',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto: FinalizeRecordDto = req.body || {};

      const record = await nisabYearRecordService.finalizeRecord(req.userId, req.params.id as string, dto);

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      if (error.message.includes('Cannot finalize')) {
        return res.status(409).json({
          success: false,
          error: 'INVALID_STATE',
          message: error.message,
        });
      }

      if (error.message.includes('Hawl')) {
        return res.status(400).json({
          success: false,
          error: 'HAWL_INCOMPLETE',
          message: error.message,
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Record not found',
        });
      }

      res.status(400).json({
        success: false,
        error: 'FINALIZATION_FAILED',
        message: error.message,
      });
    }
  }
);

/**
 * T056: POST /api/nisab-year-records/:id/unlock
 * Unlock a FINALIZED record (transition to UNLOCKED for corrections)
 * 
 * Request body:
 * {
 *   recordId: string,       // Required: Record ID to unlock
 *   unlockReason: string    // Required: Min 10 chars, max 500 chars
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: NisabYearRecordResponse
 * }
 * 
 * Audit: Unlock reason is encrypted and stored in audit trail
 */
router.post(
  '/api/nisab-year-records/:id/unlock',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto: UnlockRecordDto = req.body;

      if (!dto.unlockReason) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'unlockReason is required',
        });
      }

      if (dto.unlockReason.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'unlockReason must be at least 10 characters',
        });
      }

      if (dto.unlockReason.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'unlockReason must not exceed 500 characters',
        });
      }

      const record = await nisabYearRecordService.unlockRecord(req.userId, req.params.id as string, dto);

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      if (error.message.includes('Cannot unlock')) {
        return res.status(409).json({
          success: false,
          error: 'INVALID_STATE',
          message: error.message,
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Record not found',
        });
      }

      res.status(400).json({
        success: false,
        error: 'UNLOCK_FAILED',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/nisab-year-records/:id/audit
 * Get audit trail for a specific record
 * Bonus endpoint for viewing all changes
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     entries: AuditTrailEntry[],
 *     integrity: AuditTrailIntegrity
 *   }
/**
 * T056: GET /api/nisab-year-records/:id/audit
 * Get audit trail for a record
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     entries: AuditTrailEntry[],
 *     integrity: { isValid: boolean; issues: string[] }
 *   }
 * }
 */
router.get('/api/nisab-year-records/:id/audit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Verify user owns the record first (authorization check)
    await nisabYearRecordService.getRecord(req.userId, req.params.id as string);

    const entries = await auditTrailService.getAuditTrail(req.params.id as string);
    const integrity = await auditTrailService.verifyAuditTrailIntegrity(req.params.id as string);

    res.status(200).json({
      success: true,
      data: {
        entries,
        integrity,
      },
    });
  } catch (error) {
    if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Record not found',
      });
    }

    res.status(400).json({
      success: false,
      error: 'AUDIT_FETCH_FAILED',
      message: error.message,
    });
  }
});

export default router;
