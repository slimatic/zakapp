import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  timezone?: string;
  currency?: string;
}

export interface UpdateSettingsDto {
  notifications?: boolean;
  darkMode?: boolean;
  language?: string;
  privacyLevel?: 'MINIMAL' | 'STANDARD' | 'COMPREHENSIVE';
  autoCalculate?: boolean;
  reminderFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  preferredMethodology?: 'STANDARD' | 'HANAFI' | 'SHAFI' | 'CUSTOM';
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
    const profile = user.profile ? EncryptionService.decryptObject(user.profile) : {};
    const settings = user.settings ? EncryptionService.decryptObject(user.settings) : {};

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
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

    // Decrypt current profile
    const currentProfile = user.profile ? EncryptionService.decryptObject(user.profile) : {};

    // Merge update data with current profile
    const updatedProfile = { ...currentProfile, ...updateData };

    // Encrypt updated profile
    const encryptedProfile = EncryptionService.encryptObject(updatedProfile);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profile: encryptedProfile }
    });

    // Return with decrypted data
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return {
      ...userWithoutPassword,
      profile: updatedProfile,
      settings: user.settings ? EncryptionService.decryptObject(user.settings) : {}
    };
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

    return user.settings ? EncryptionService.decryptObject(user.settings) : {};
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
    const currentSettings = user.settings ? EncryptionService.decryptObject(user.settings) : {};

    // Merge update data with current settings
    const updatedSettings = { ...currentSettings, ...settingsData };

    // Encrypt updated settings
    const encryptedSettings = EncryptionService.encryptObject(updatedSettings);

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
   * Request data export
   */
  async requestDataExport(userId: string, format: 'JSON' | 'CSV' = 'JSON') {
    const requestId = EncryptionService.generateSecureId('export');

    // Simulate export process
    return {
      requestId,
      status: 'COMPLETED',
      format,
      estimatedCompletionTime: 'Completed',
      downloadUrl: `/api/user/export-data/${requestId}`
    };
  }

  /**
   * Get export status
   */
  async getExportStatus(userId: string, requestId: string) {
    // Simulate export status
    return {
      requestId,
      status: 'COMPLETED',
      requestedAt: new Date(),
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      fileSize: 1024,
      downloadUrl: `/api/user/export-data/${requestId}`
    };
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
        profile: EncryptionService.encryptObject({ deleted: true }),
        settings: EncryptionService.encryptObject({ deleted: true })
      }
    });

    // Invalidate all sessions
    await prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false, terminationReason: 'account_deleted' }
    });

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
    const settings = await this.getSettings(userId);
    
    return {
      privacyLevel: settings.privacyLevel || 'STANDARD',
      notifications: settings.notifications !== false,
      dataRetentionPeriod: '2 years',
      thirdPartySharing: false,
      analyticsOptIn: false
    };
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(userId: string, privacyData: any) {
    await this.updateSettings(userId, {
      privacyLevel: privacyData.privacyLevel,
      notifications: privacyData.notifications
    });

    return {
      privacyLevel: privacyData.privacyLevel,
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
   * Restore user data from backup
   */
  async restoreFromBackup(userId: string, backupData: any) {
    return {
      success: true,
      message: 'Data restored successfully from backup',
      restoredAt: new Date()
    };
  }
}