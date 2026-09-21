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

import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler, AppError, ErrorCode } from '../middleware/ErrorHandler';
import { UserService } from '../services/UserService';
import { PrismaClient } from '@prisma/client';

const userService = new UserService();

export class UserController {
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    const profile = await userService.getProfile(userId);

    const response: ApiResponse = {
      success: true,
      data: {
        user: profile
      }
    };

    res.status(200).json(response);
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const updateData = req.body;

    const updatedProfile = await userService.updateProfile(userId, updateData);

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    };

    res.status(200).json(response);
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new passwords are required', 400, ErrorCode.VALIDATION_ERROR);
    }

    // FR-012: Enforce minimum password length of 8 characters
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400, ErrorCode.VALIDATION_ERROR);
    }

    await userService.changePassword(userId, { currentPassword, newPassword });

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully'
    };

    res.status(200).json(response);
  });

  getSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Real sessions from UserService. This previously returned a single hardcoded
    // object ("Chrome on Windows", 127.0.0.1) that described no actual session, so
    // a user checking whether their account had been accessed saw a fiction.
    const sessions = await userService.getSessions(userId);

    const response: ApiResponse = {
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceInfo: s.userAgent || 'Unknown device',
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastActive: s.refreshedAt ?? s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: false,
      })),
    };

    res.status(200).json(response);
  });

  deleteSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    if (!id) {
      throw new AppError('Session ID is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    // Previously returned success while doing nothing, so a user who tried to
    // terminate a session was told it was revoked and it was not.
    await userService.revokeSession(userId, id);

    const response: ApiResponse = {
      success: true,
      message: 'Session terminated successfully',
    };

    res.status(200).json(response);
  });

  getSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Use UserService to get settings (handles decryption)
    const settings = await userService.getSettings(userId);

    const response: ApiResponse = {
      success: true,
      data: settings
    };

    res.status(200).json(response);
  });

  updateSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const settingsUpdate = req.body;

    // Use UserService to update settings (handles encryption)
    const updatedSettings = await userService.updateSettings(userId, settingsUpdate);

    const response: ApiResponse = {
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    };

    res.status(200).json(response);
  });

  deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { password } = req.body;
    const userId = req.userId!;

    if (!password) {
      throw new AppError('Password confirmation is required for account deletion', 400, ErrorCode.VALIDATION_ERROR);
    }

    await userService.deleteAccount(userId, password);

    const response: ApiResponse = {
      success: true,
      message: 'Account deletion initiated. You will receive a confirmation email.'
    };

    res.status(200).json(response);
  });

  exportRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { format = 'json' } = req.body;
    const userId = req.userId!;

    try {
      // Get user profile
      const profile = await userService.getProfile(userId);

      // Get user's assets
      // const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const assets = await prisma.asset.findMany({
        where: { userId }
      });

      const calculations = await prisma.zakatCalculation.findMany({
        where: { userId },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });

      const payments = await prisma.zakatPayment.findMany({
        where: { userId },
        take: 50,
        orderBy: { paymentDate: 'desc' }
      });

      await prisma.$disconnect();

      // Build export data
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          createdAt: profile.createdAt
        },
        assets: assets.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          currentValue: a.currentValue,
          currency: a.currency,
          createdAt: a.createdAt
        })),
        calculations: calculations.map((c: any) => ({
          id: c.id,
          totalAssets: c.totalAssets,
          zakatableAmount: c.zakatableAmount,
          zakatDue: c.zakatDue,
          methodology: c.methodology,
          createdAt: c.createdAt
        })),
        payments: payments.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          paymentDate: p.paymentDate,
          recipient: p.recipient
        }))
      };

      // Set headers for file download
      const filename = `zakapp-export-${Date.now()}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.status(200).send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      // Fallback to simple response if export fails
      const response: ApiResponse = {
        success: true,
        message: 'Export request submitted',
        data: {
          status: 'processing'
        }
      };
      res.status(200).json(response);
    }
  });

  exportStatus = asyncHandler(async (_req: AuthenticatedRequest, _res: Response) => {
    // The export endpoint streams the file synchronously, so no stored export
    // request exists to poll. This previously fabricated a completed status with
    // a download URL under /api/export/download/, a route that is NOT mounted
    // (see routes/export.ts) — so the URL 404'd every time.
    throw new AppError(
      'Export status polling is not supported: exports are streamed immediately by POST /api/user/export-request',
      501,
      ErrorCode.NOT_FOUND
    );
  });

  getPrivacySettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Real stored settings, not a hardcoded object. The previous version returned
    // the same fixed values for every user and ignored the database entirely, so
    // the privacy preference shown could differ from what was saved.
    const settings = await userService.getPrivacySettings(userId);

    const response: ApiResponse = {
      success: true,
      privacySettings: {
        // The client reads `analytics`; UserService persists it under
        // privacy.analyticsEnabled. Map explicitly rather than hoping the shapes
        // agree, and keep the other keys the client may read.
        analytics: settings.analyticsEnabled,
        dataSharing: false,
        marketing: false,
        shareWithThirdParties: false,
        publicProfile: false,
        searchEngineIndexing: false,
        activityTracking: false,
      },
    };

    res.status(200).json(response);
  });

  updatePrivacySettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { analytics } = req.body ?? {};

    // Previously echoed the request body back with an updatedAt stamp and wrote
    // nothing, so the UI showed "Privacy settings updated successfully!" while the
    // database was unchanged — and the setting silently reverted on reload.
    const updated = await userService.updatePrivacySettings(userId, { analyticsEnabled: analytics });

    const response: ApiResponse = {
      success: true,
      message: 'Privacy settings updated successfully',
      privacySettings: {
        analytics: updated.privacy?.analyticsEnabled ?? false,
        dataSharing: false,
        marketing: false,
      },
    };

    res.status(200).json(response);
  });

  getAuditLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const limit = Number(req.query.limit ?? 50) || 50;

    // Previously returned two hardcoded entries ("asset_created", "Savings
    // Account") for every user. A user auditing their own account activity was
    // shown fabricated history, which defeats the purpose of an audit log.
    const auditLog = await userService.getAuditLog(userId, limit);

    const response: ApiResponse = {
      success: true,
      auditLog,
    };

    res.status(200).json(response);
  });

  backup = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { includeHistory = true, encrypted = true } = req.body;
    const userId = req.userId!;

    // Previously this returned a fabricated receipt: size was the string
    // "2.5 MB" regardless of the data, and downloadUrl pointed at
    // /api/user/backup/download/... — a route that does not exist anywhere in the
    // codebase, so following it 404'd. A user was told a backup had been created
    // and given a link to nothing.
    //
    // UserService.createBackup() does assemble REAL data (profile, assets,
    // calculations, payments) with a true byte size, so return that. No download
    // URL is offered because none is implemented — exporting data is handled by
    // POST /api/user/export-request, which streams the file directly.
    const backup = await userService.createBackup(userId);

    const response: ApiResponse = {
      success: true,
      message: 'Backup assembled successfully',
      backup: {
        id: backup.backupId,
        createdAt: backup.createdAt.toISOString(),
        size: backup.size,
        includeHistory,
        encrypted,
        // Deliberately absent: downloadUrl. Nothing serves a stored backup file.
        data: backup.data,
      },
    };

    res.status(201).json(response);
  });

  restore = asyncHandler(async (_req: AuthenticatedRequest, _res: Response) => {
    // This used to answer "Data restoration completed successfully" with a
    // fabricated restored-item count (assets: 5, calculations: 3, payments: 2,
    // settings: 1) and restore nothing at all. That is the most dangerous possible
    // response in this file: a user who believed their data had been restored
    // would stop worrying about it.
    //
    // No restore implementation exists (UserService.restoreFromBackup() is a stub
    // that returns a success message without touching the database). Answer
    // honestly instead of pretending.
    throw new AppError(
      'Data restore is not implemented in this release. No data was modified.',
      501,
      ErrorCode.NOT_FOUND
    );
  });
}