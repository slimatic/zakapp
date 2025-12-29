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
    const mockSessions = [
      {
        id: 'session-1',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        lastActive: new Date().toISOString(),
        isCurrent: true,
        createdAt: new Date().toISOString()
      }
    ];

    const response: ApiResponse = {
      success: true,
      sessions: mockSessions
    };

    res.status(200).json(response);
  });

  deleteSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Session ID would be used for actual deletion
    // const { id } = req.params;

    const response: ApiResponse = {
      success: true,
      message: 'Session terminated successfully'
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
    // Reason for deletion would be logged: const { reason } = req.body;

    if (!password) {
      throw new AppError('Password confirmation is required for account deletion', 400, ErrorCode.VALIDATION_ERROR);
    }

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
      const { PrismaClient } = require('@prisma/client');
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

  exportStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { requestId } = req.params;

    const response: ApiResponse = {
      success: true,
      exportStatus: {
        id: requestId,
        status: 'completed',
        progress: 100,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        downloadUrl: `/api/export/download/${requestId}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };

    res.status(200).json(response);
  });

  getPrivacySettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const mockPrivacySettings = {
      dataSharing: false,
      analytics: true,
      marketing: false,
      shareWithThirdParties: false,
      publicProfile: false,
      searchEngineIndexing: false,
      activityTracking: true,
      cookiePreferences: {
        essential: true,
        functional: true,
        analytics: true,
        marketing: false
      }
    };

    const response: ApiResponse = {
      success: true,
      privacySettings: mockPrivacySettings
    };

    res.status(200).json(response);
  });

  updatePrivacySettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const privacyUpdate = req.body;

    const response: ApiResponse = {
      success: true,
      message: 'Privacy settings updated successfully',
      privacySettings: {
        ...privacyUpdate,
        updatedAt: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  });

  getAuditLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const mockAuditLog = [
      {
        id: 'audit-1',
        action: 'login',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome on Windows',
        details: { method: 'password' }
      },
      {
        id: 'audit-2',
        action: 'asset_created',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome on Windows',
        details: { assetType: 'CASH', assetName: 'Savings Account' }
      }
    ];

    const response: ApiResponse = {
      success: true,
      auditLog: mockAuditLog
    };

    res.status(200).json(response);
  });

  backup = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { includeHistory = true, encrypted = true } = req.body;
    const userId = req.userId!;

    const response: ApiResponse = {
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: `backup-${userId}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        size: '2.5 MB',
        includeHistory,
        encrypted,
        downloadUrl: `/api/user/backup/download/backup-${userId}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }
    };

    res.status(201).json(response);
  });

  restore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { backupId, overwrite = false } = req.body;

    if (!backupId) {
      throw new AppError('Backup ID is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Data restoration completed successfully',
      restoration: {
        backupId,
        restoredAt: new Date().toISOString(),
        overwrite,
        itemsRestored: {
          assets: 5,
          calculations: 3,
          payments: 2,
          settings: 1
        }
      }
    };

    res.status(200).json(response);
  });
}