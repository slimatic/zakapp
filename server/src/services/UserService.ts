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

import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';
import { getEncryptionKey } from '../config/security';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  timezone?: string;
  currency?: string;
}

export interface UpdateSettingsDto {
  notifications?: {
    zakatReminders?: boolean;
    calculationUpdates?: boolean;
    marketPriceAlerts?: boolean;
    monthlyReports?: boolean;
    emailNotifications?: boolean;
    browserNotifications?: boolean;
  };
  calculations?: {
    defaultMethodology?: string;
    autoSaveCalculations?: boolean;
    showEducationalContent?: boolean;
    includePreviousYearComparison?: boolean;
    defaultCurrency?: string;
    roundingMethod?: 'up' | 'down' | 'nearest';
  };
  display?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    dateFormat?: string;
    numberFormat?: string;
    calendarSystem?: 'lunar' | 'solar';
    showIslamicDates?: boolean;
  };
  privacy?: {
    analyticsEnabled?: boolean;
    crashReportingEnabled?: boolean;
    dataRetentionPeriod?: number;
    encryptionLevel?: 'standard' | 'high';
  };
  backup?: {
    autoBackupEnabled?: boolean;
    backupFrequency?: 'daily' | 'weekly' | 'monthly';
    maxBackups?: number;
    includeCalculationHistory?: boolean;
  };
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  /**
   * Get user profile with decrypted data
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Decrypt profile data
    const profile = user.profile ? await EncryptionService.decryptObject<{ [key: string]: unknown }>(user.profile, getEncryptionKey()) : {};
    const settings = user.settings ? await EncryptionService.decryptObject(user.settings, getEncryptionKey()) : {};

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;

    // Flatten profile data into root and explicitly return profile/settings as well
    // This ensures user.firstName works (from flattened profile) AND user.profile works (legacy)
    return {
      ...userWithoutPassword,
      ...profile, // Flatten decrypted profile fields (firstName, lastName, etc.) to root
      profile,
      settings
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Extract fields that belong to the root User model
    const { email, username, ...profileFields } = updateData as any;

    try {
      // Decrypt current profile
      const currentProfile = user.profile ? await EncryptionService.decryptObject<{ [key: string]: unknown }>(user.profile, getEncryptionKey()) : {};

      // Merge update data with current profile
      // We keep email/username in profile blob too for redundancy/completeness if desired, 
      // or we can remove them. The frontend sends them in updateData.
      // Let's keep the full updateData in the encrypted blob for now to matching existing behavior.
      const updatedProfile = { ...currentProfile, ...updateData };

      // Encrypt updated profile
      const encryptedProfile = await EncryptionService.encryptObject(updatedProfile, getEncryptionKey());

      // Prepare root update data (only if provided)
      const rootUpdateData: any = { profile: encryptedProfile };
      if (email) rootUpdateData.email = email;
      if (username) rootUpdateData.username = username;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: rootUpdateData
      });

      // Return with decrypted data
      const { passwordHash, ...userWithoutPassword } = updatedUser;

      return {
        ...userWithoutPassword,
        ...updatedProfile, // Flatten
        profile: updatedProfile,
        settings: user.settings ? await EncryptionService.decryptObject(user.settings, getEncryptionKey()) : {}
      };
    } catch (error: any) {
      // Handle unique constraint violations for email/username
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'Field';
        throw new Error(`${field} already exists`);
      }
      throw error;
    }
  }

  /**
   * Get user settings
   */
  async getSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.settings ? await EncryptionService.decryptObject<{ [key: string]: unknown }>(user.settings, getEncryptionKey()) : {};
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, settingsData: UpdateSettingsDto) {
    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Decrypt current settings
    const currentSettings = user.settings ? await EncryptionService.decryptObject<{ [key: string]: unknown }>(user.settings, getEncryptionKey()) : {};

    // Merge update data with current settings
    const updatedSettings = { ...currentSettings, ...settingsData };

    // Encrypt updated settings
    const encryptedSettings = await EncryptionService.encryptObject(updatedSettings, getEncryptionKey());

    await prisma.user.update({
      where: { id: userId },
      data: { settings: encryptedSettings }
    });

    return updatedSettings;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, passwordData: ChangePasswordDto) {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(passwordData.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });

    // Invalidate all sessions
    await prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false }
    });

    return { success: true };
  }

  /**
   * Get user sessions
   */
  async getSessions(userId: string) {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        refreshedAt: true,
        expiresAt: true
      }
    });

    return sessions;
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId,
        isActive: true
      }
    });

    if (!session) {
      throw new Error('Session not found or already revoked');
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false, terminationReason: 'user_revoked' }
    });

    return { success: true };
  }

  /**
   * Revoke all sessions
   */
  async revokeAllSessions(userId: string) {
    await prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, terminationReason: 'user_revoked_all' }
    });

    return { success: true };
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string, password: string) {
    // Verify password before deletion
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Password verification failed');
    }

    // Soft delete - mark as inactive
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        // Clear sensitive data
        email: `deleted_${Date.now()}@example.com`,
        profile: await EncryptionService.encryptObject({ deleted: true }, getEncryptionKey()),
        settings: await EncryptionService.encryptObject({ deleted: true }, getEncryptionKey())
      }
    });

    // Invalidate all sessions
    await prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false, terminationReason: 'account_deleted' }
    });

    // Safe CouchDB Cleanup
    try {
      const { syncService } = require('./SyncService');
      await syncService.deleteUser(userId);
    } catch (error) {
      console.error('Failed to cleanup CouchDB data during account deletion:', error);
      // Do not block the response, as the primary account is deleted
    }

    return { success: true, message: 'Account scheduled for deletion' };
  }

  /**
   * Cancel account deletion (within grace period)
   */
  async cancelAccountDeletion(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.isActive) {
      throw new Error('No pending account deletion found');
    }

    // Reactivate account
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true }
    });

    return { success: true, message: 'Account deletion cancelled successfully' };
  }

  /**
   * Get user activity audit log
   */
  async getAuditLog(userId: string, limit: number = 50) {
    const sessions = await prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        refreshedAt: true,
        isActive: true,
        terminationReason: true
      }
    });

    // Transform to audit log format
    const auditLog = sessions.map(session => ({
      id: session.id,
      action: session.isActive ? 'LOGIN' : 'LOGOUT',
      details: {
        userAgent: session.userAgent,
        ip: session.ipAddress,
        terminationReason: session.terminationReason
      },
      timestamp: session.createdAt,
      lastActive: session.refreshedAt
    }));

    return auditLog;
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings(userId: string) {
    type StoredPrivacySettings = {
      privacy?: {
        analyticsEnabled?: boolean;
        crashReportingEnabled?: boolean;
        encryptionLevel?: unknown;
        dataRetentionPeriod?: unknown;
      };
      notifications?: boolean;
      privacyLevel?: unknown;
    };

    const settings = (await this.getSettings(userId)) as StoredPrivacySettings;
    const privacy = settings.privacy ?? {};

    // Read the values that updatePrivacySettings actually persists. The previous
    // version returned analyticsOptIn/thirdPartySharing/dataRetentionPeriod as
    // hardcoded constants and never consulted `settings.privacy`, so a saved
    // preference was written to the database and then silently ignored on read —
    // the toggle reverted on reload.
    const analyticsEnabled = privacy.analyticsEnabled === true;

    return {
      privacyLevel: settings.privacyLevel || 'STANDARD',
      notifications: settings.notifications !== false,
      analyticsEnabled,
      crashReportingEnabled: privacy.crashReportingEnabled === true,
      encryptionLevel: privacy.encryptionLevel,
      // Only report a retention period that is actually configured; do not assert
      // a policy on the user's behalf.
      dataRetentionPeriod: privacy.dataRetentionPeriod ?? null,
      thirdPartySharing: false,
      // Kept for callers using the older key name.
      analyticsOptIn: analyticsEnabled,
    };
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(userId: string, privacyData: any) {
    await this.updateSettings(userId, {
      privacy: {
        analyticsEnabled: privacyData.analyticsEnabled,
        crashReportingEnabled: privacyData.crashReportingEnabled,
        dataRetentionPeriod: privacyData.dataRetentionPeriod,
        encryptionLevel: privacyData.encryptionLevel
      },
      notifications: privacyData.notifications
    });

    return {
      privacy: {
        analyticsEnabled: privacyData.analyticsEnabled,
        crashReportingEnabled: privacyData.crashReportingEnabled,
        dataRetentionPeriod: privacyData.dataRetentionPeriod,
        encryptionLevel: privacyData.encryptionLevel
      },
      notifications: privacyData.notifications,
      dataRetentionPeriod: '2 years',
      thirdPartySharing: false,
      analyticsOptIn: false
    };
  }

  /**
   * Create user data backup
   */
  async createBackup(userId: string) {
    const user = await this.getProfile(userId);
    const assets = await prisma.asset.findMany({
      where: { userId }
    });
    const calculations = await prisma.zakatCalculation.findMany({
      where: { userId }
    });
    const payments = await prisma.zakatPayment.findMany({
      where: { userId }
    });

    const backupData = {
      user: {
        profile: user,
        assets,
        calculations,
        payments
      },
      createdAt: new Date().toISOString(),
      version: '1.0'
    };

    const backupId = EncryptionService.generateSecureId('backup');

    return {
      backupId,
      data: backupData,
      size: JSON.stringify(backupData).length,
      createdAt: new Date()
    };
  }

  /**
   * NOTE: a `restoreFromBackup()` stub used to live here. It returned
   * `{ success: true, message: 'Data restored successfully from backup' }` and
   * touched no data at all.
   *
   * It had no callers, so nothing was misled by it in practice — but it sat one
   * `await userService.restoreFromBackup(...)` away from telling a user their data
   * was recovered when nothing had happened. That is the most dangerous shape a
   * stub can take, because a user who believes a restore succeeded stops worrying
   * about their data.
   *
   * The endpoint that would have called it (`POST /api/user/restore`) already
   * returns 501 NOT_IMPLEMENTED. Restore is now unimplemented in exactly one
   * obvious way rather than two contradictory ones.
   *
   * If restore is ever built, it belongs here as a real implementation with tests
   * over the entity list and conflict semantics — not as a success-shaped return.
   */
}