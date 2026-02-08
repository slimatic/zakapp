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

import express from 'express';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticate } from '../../middleware/AuthMiddleware';
import { asyncHandler } from '../../middleware/ErrorHandler';
import { Logger } from '../../utils/logger';
import { EncryptionService } from '../../services/EncryptionService';
import { DEFAULT_LIMITS } from '../../config/limits';
import { getPrismaClient, ENCRYPTION_KEY, loggedProfileDecryptionFailures } from './utils';

const logger = new Logger('AuthProfile');

/**
 * GET /api/auth/me
 * Get current user information
 */
export const profileHandler = asyncHandler(async (req: AuthenticatedRequest, res: ExpressResponse) => {
  try {
    const user = await getPrismaClient().user.findUnique({
      where: { id: req.userId! }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Decrypt profile to get name
    let profile = { firstName: '', lastName: '' };
    try {
      if (user.profile) {
        // Debug info to help diagnose unexpected stored formats (redacted)
        try {
          const sample = typeof user.profile === 'string' ? user.profile.slice(0, 200) : JSON.stringify(user.profile).slice(0, 200);
          logger.debug(`Profile stored type=${typeof user.profile} sample=${sample}`);
        } catch (dbg) {
          // ignore debug failure
        }

        profile = await EncryptionService.decryptObject(user.profile, ENCRYPTION_KEY);
      }
    } catch (error) {
      const key = `${user.id}`;
      if (!loggedProfileDecryptionFailures.has(key)) {
        loggedProfileDecryptionFailures.add(key);
        // Decryption may fail for legacy/unclean data; log at debug level and continue with fallback
        logger.debug(`Profile decryption failed for user ${user.id} <${user.email}> in /me endpoint: ${error instanceof Error ? error.message : String(error)} - falling back to empty profile`);
      } else {
        logger.debug(`Skipping repeated profile decryption log for user ${user.id}`);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          name: `${profile.firstName} ${profile.lastName}`.trim() || user.email,
          isAdmin: user.userType === 'ADMIN_USER' || (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes(user.email.toLowerCase()),
          userType: user.userType,
          isVerified: user.isVerified,
          profile: profile,
          preferences: {
            calendar: user.preferredCalendar,
            methodology: user.preferredMethodology
          },
          maxAssets: user.maxAssets ?? DEFAULT_LIMITS.MAX_ASSETS,
          maxNisabRecords: user.maxNisabRecords ?? DEFAULT_LIMITS.MAX_NISAB_RECORDS,
          maxPayments: user.maxPayments ?? DEFAULT_LIMITS.MAX_PAYMENTS,
          maxLiabilities: (user as any).maxLiabilities ?? DEFAULT_LIMITS.MAX_LIABILITIES,
          createdAt: user.createdAt.toISOString()
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve user information'
      }
    });
  }
});