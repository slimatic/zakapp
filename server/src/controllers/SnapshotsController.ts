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

import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler, AppError, ErrorCode } from '../middleware/ErrorHandler';
import { CalculationSnapshotService } from '../services/snapshot.service';
import { CreateCalculationSnapshotRequest } from '@zakapp/shared';

const snapshotService = new CalculationSnapshotService();

export class SnapshotsController {
  /**
   * Create a new calculation snapshot
   * POST /api/snapshots
   */
  createSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    const request: CreateCalculationSnapshotRequest = req.body;

    // Validate request
    if (!request.methodology) {
      throw new AppError('Methodology is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    if (!['STANDARD', 'HANAFI', 'SHAFII', 'CUSTOM'].includes(request.methodology)) {
      throw new AppError('Invalid methodology', 400, ErrorCode.VALIDATION_ERROR);
    }

    if (request.methodology === 'CUSTOM' && !request.methodologyConfigId) {
      throw new AppError('methodologyConfigId is required for CUSTOM methodology', 400, ErrorCode.VALIDATION_ERROR);
    }

    try {
      const snapshot = await snapshotService.createSnapshot(userId, request);

      const response: ApiResponse = {
        success: true,
        data: snapshot
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('SnapshotsController - Create snapshot error:', error);
      throw error;
    }
  });

  /**
   * Get all snapshots for the authenticated user
   * GET /api/snapshots
   */
  getSnapshots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    try {
      const snapshots = await snapshotService.getSnapshots(userId);

      const response: ApiResponse = {
        success: true,
        data: snapshots
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('SnapshotsController - Get snapshots error:', error);
      throw error;
    }
  });

  /**
   * Get a specific snapshot by ID
   * GET /api/snapshots/:id
   */
  getSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Snapshot ID is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    try {
      const snapshot = await snapshotService.getSnapshot(userId, id as string);

      if (!snapshot) {
        throw new AppError('Snapshot not found', 404, ErrorCode.NOT_FOUND);
      }

      const response: ApiResponse = {
        success: true,
        data: snapshot
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('SnapshotsController - Get snapshot error:', error);
      throw error;
    }
  });

  /**
   * Compare two snapshots
   * GET /api/snapshots/compare?from=:id1&to=:id2
   */
  compareSnapshots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    const { from, to } = req.query;

    if (!from || !to) {
      throw new AppError('Both from and to snapshot IDs are required', 400, ErrorCode.VALIDATION_ERROR);
    }

    try {
      const comparison = await snapshotService.compareSnapshots(
        userId,
        from as string,
        to as string
      );

      const response: ApiResponse = {
        success: true,
        data: comparison
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('SnapshotsController - Compare snapshots error:', error);
      throw error;
    }
  });

  /**
   * Delete a snapshot
   * DELETE /api/snapshots/:id
   */
  deleteSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Snapshot ID is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    try {
      await snapshotService.deleteSnapshot(userId, id as string);

      const response: ApiResponse = {
        success: true,
        message: 'Snapshot deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('SnapshotsController - Delete snapshot error:', error);
      throw error;
    }
  });

  /**
   * Unlock a snapshot for editing
   * POST /api/snapshots/:id/unlock
   */
  unlockSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      throw new AppError('Snapshot ID is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new AppError('Unlock reason is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    try {
      await snapshotService.unlockSnapshot(userId, id as string, reason.trim());

      const response: ApiResponse = {
        success: true,
        message: 'Snapshot unlocked successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('SnapshotsController - Unlock snapshot error:', error);
      throw error;
    }
  });

  /**
   * Lock a snapshot
   * POST /api/snapshots/:id/lock
   */
  lockSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Snapshot ID is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    try {
      await snapshotService.lockSnapshot(userId, id as string);

      const response: ApiResponse = {
        success: true,
        message: 'Snapshot locked successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('SnapshotsController - Lock snapshot error:', error);
      throw error;
    }
  });

  /**
   * Export snapshot data as JSON
   * GET /api/snapshots/:id/export
   */
  exportSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Snapshot ID is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    try {
      const snapshot = await snapshotService.getSnapshot(userId, id as string);

      if (!snapshot) {
        throw new AppError('Snapshot not found', 404, ErrorCode.NOT_FOUND);
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="snapshot-${id}.json"`);

      res.status(200).json(snapshot);
    } catch (error) {
      console.error('SnapshotsController - Export snapshot error:', error);
      throw error;
    }
  });
}

export default new SnapshotsController();