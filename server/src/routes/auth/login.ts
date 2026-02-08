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
import { jwtService } from '../../services/JWTService';
import { loginRateLimit } from '../../middleware/RateLimitMiddleware';
import { validateUserLogin } from '../../middleware/ValidationMiddleware';
import { asyncHandler } from '../../middleware/ErrorHandler';
import { Logger } from '../../utils/logger';
import bcrypt from 'bcryptjs';
import { EncryptionService } from '../../services/EncryptionService';
import { SettingsService } from '../../services/SettingsService';
import { DEFAULT_LIMITS } from '../../config/limits';
import { getPrismaClient, ENCRYPTION_KEY, loggedProfileDecryptionFailures } from './utils';

const logger = new Logger('AuthLogin');

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export const loginHandler = asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
  const { email, username, password } = req.body;

  try {
    // Find user in database by either email or username
    let user;

    if (email) {
      // Try to find by email (unique)
      user = await getPrismaClient().user.findUnique({ where: { email } });
    } else if (username) {
      // Find by username using findFirst since username is not a unique field in the schema
      user = await getPrismaClient().user.findFirst({ where: { username } });
    }

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email/username or password'
        }
      });
      return;
    }

    // Check Email Verification
    const settings = await SettingsService.getSettings();
    if (settings.requireEmailVerification && user.isVerified === false) {
      res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email verification is required to log in. Please check your email for the verification link.'
        }
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Update last login
    try {
      await getPrismaClient().user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } catch (error: any) {
      // Handle P2025 (Record to update not found) - user deleted concurrently
      if (error.code === 'P2025') {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
        return;
      }
      throw error;
    }

    // Generate tokens
    const accessToken = jwtService.createAccessToken({
      userId: user.id,
      email: user.email,
      role: 'user'
    });

    const refreshToken = jwtService.createRefreshToken(user.id);

    // Decrypt profile data
    let profileData = {};
    if (user.profile) {
      try {
        profileData = await EncryptionService.decryptObject(user.profile, ENCRYPTION_KEY);
      } catch (error) {
        logger.error('Failed to decrypt profile data during login', error);

        // Fallback to empty profile, but we lose salt?
        // If decryption fails, user can't login on new device anyway.
      }
    }

    // Respond with standard format
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: (profileData as any).firstName || '',
          lastName: (profileData as any).lastName || '',
          isAdmin: user.userType === 'ADMIN_USER' || (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes(user.email.toLowerCase()),
          userType: user.userType,
          isVerified: user.isVerified,
          profile: profileData, // Includes salt
          preferences: {
            calendar: user.preferredCalendar,
            methodology: user.preferredMethodology
          },
          maxAssets: user.maxAssets ?? DEFAULT_LIMITS.MAX_ASSETS,
          maxNisabRecords: user.maxNisabRecords ?? DEFAULT_LIMITS.MAX_NISAB_RECORDS,
          maxPayments: user.maxPayments ?? DEFAULT_LIMITS.MAX_PAYMENTS,
          maxLiabilities: (user as any).maxLiabilities ?? DEFAULT_LIMITS.MAX_LIABILITIES
        },
        tokens: {
          accessToken,
          refreshToken
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    logger.error('Login error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed due to server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      }
    });
  }
});

export const loginRoute = [
  loginRateLimit,
  validateUserLogin,
  loginHandler
];