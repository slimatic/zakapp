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
import { registrationRateLimit } from '../../middleware/RateLimitMiddleware';
import { validateUserRegistration, handleValidationErrors } from '../../middleware/ValidationMiddleware';
import { asyncHandler } from '../../middleware/ErrorHandler';
import { Logger } from '../../utils/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { EncryptionService } from '../../services/EncryptionService';
import { emailService } from '../../services/EmailService';
import { DEFAULT_LIMITS } from '../../config/limits';
import { getPrismaClient, ENCRYPTION_KEY } from './utils';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const logger = new Logger('AuthRegister');

/**
 * POST /api/auth/register
 * Register new user account
 */
export const registerHandler = asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
  // Normalize email to lowercase first
  req.body.email = req.body.email.toLowerCase();

  const { email: normalizedEmail, username, password, firstName, lastName, phoneNumber, dateOfBirth, salt, plainFirstName } = req.body;

  try {
    // Check if user already exists in database by email
    const existingUser = await getPrismaClient().user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email address is already registered'
        }
      });
      return;
    }

    // Also check if username is already taken (if provided)

    if (username) {
      // Use findFirst to check for an existing username (schema may not mark username as unique)
      const existingUsername = await getPrismaClient().user.findFirst({ where: { username } });

      if (existingUsername) {
        res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_ALREADY_EXISTS',
            message: 'Username is already taken'
          }
        });
        return;
      }
    }

    // Hash password
    // Create encrypted profile and settings
    const passwordHash = await bcrypt.hash(password, 12);

    let profileData: any = {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      salt // Store salt for multi-device sync
    };

    const settingsData = {
      currency: 'USD',
      notifications: true,
      darkMode: false,
      language: 'en',
      privacyLevel: 'STANDARD',
      autoCalculate: true,
      reminderFrequency: 'MONTHLY',
      preferredMethodology: 'STANDARD'
    };

    const encryptedProfile = await EncryptionService.encryptObject(profileData, ENCRYPTION_KEY);
    const encryptedSettings = await EncryptionService.encryptObject(settingsData, ENCRYPTION_KEY);

    // Create user in database
    const createData: any = {
      email: normalizedEmail,
      passwordHash,
      profile: encryptedProfile,
      settings: encryptedSettings,
      isActive: true,
      lastLoginAt: new Date(),
      preferredCalendar: 'gregorian',
      preferredMethodology: 'standard'
    };

    if (username) {
      createData.username = username;
    }

    const user = await getPrismaClient().user.create({ data: createData });

    // Create security record for the user
    await getPrismaClient().userSecurity.create({
      data: {
        userId: user.id
      }
    });

    // Email Verification Logic
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await getPrismaClient().user.update({
        where: { id: user.id },
        data: {
          verificationToken: token,
          verificationTokenExpires: expiry,
          isVerified: false
        }
      });

      await emailService.sendVerificationEmail(normalizedEmail, token, plainFirstName || firstName, username);
    } catch (err) {
      logger.error('Failed to initiate email verification', err);
    }

    // Generate tokens
    const accessToken = jwtService.createAccessToken({
      userId: user.id,
      email: user.email,
      role: 'user'
    });

    const refreshToken = jwtService.createRefreshToken(user.id);

    // Decrypt profile data
    if (user.profile) {
      try {
        profileData = await EncryptionService.decryptObject(user.profile, ENCRYPTION_KEY);
      } catch (error) {
        logger.error('Failed to decrypt profile data', error);
        profileData = {}; // Reset on error
      }
    } else {
      profileData = {};
    }

    // Respond with standard format matching contract expectations
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt.toISOString(),
          profile: profileData,
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
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
   } catch (error) {
      // Handle Prisma unique constraint violations (duplicate email)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        // Check if it's an email uniqueness violation
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes('email')) {
          res.status(409).json({
            success: false,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'Email address is already registered'
            }
          });
          return;
        }
      }

     if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
       res.status(409).json({
         success: false,
         error: {
           code: 'EMAIL_ALREADY_EXISTS',
           message: 'Email address is already registered'
         }
       });
       return;
     }

     // eslint-disable-next-line no-console
     logger.error('Registration error:', error);

     res.status(500).json({
       success: false,
       error: {
         code: 'INTERNAL_ERROR',
         message: 'Registration failed due to server error'
       }
     });
   }
});

export const registerRoute = [
  registrationRateLimit,
  validateUserRegistration,
  handleValidationErrors,
  registerHandler
];