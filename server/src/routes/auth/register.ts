/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * POST /register
 *
 * Extracted from the single-file routes/auth.ts. Route bodies are unchanged —
 * only the enclosing function and the import list are new.
 */

import express from 'express';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { jwtService } from '../../services/JWTService';
import { handleValidationErrors, validateUserLogin, validateUserRegistration } from '../../middleware/ValidationMiddleware';
import { registrationRateLimit, loginRateLimit } from '../../middleware/RateLimitMiddleware';
import { asyncHandler } from '../../middleware/ErrorHandler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { EncryptionService } from '../../services/EncryptionService';
import { emailService } from '../../services/EmailService';
import { SettingsService } from '../../services/SettingsService';
import { DEFAULT_LIMITS } from '../../config/limits';
import {
  logger,
  getPrismaClient,
  ENCRYPTION_KEY,
} from './_shared';

export function registerRegisterRoutes(router: express.Router): void {
router.post('/register',
  registrationRateLimit,
  validateUserRegistration,
  handleValidationErrors,
  asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
    // Gate on the operator's allowRegistration setting BEFORE any validation or
    // user creation, so it cannot be bypassed with a malformed body.
    //
    // Fail closed: if reading the setting throws, refuse rather than silently
    // falling through to open registration.
    // Retain the full settings object: requireEmailVerification is needed later to
    // decide whether a failed send must fail the request.
    let settings: Awaited<ReturnType<typeof SettingsService.getSettings>>;
    try {
      settings = await SettingsService.getSettings();
      if (!settings.allowRegistration) {
        res.status(403).json({
          success: false,
          error: {
            code: 'REGISTRATION_DISABLED',
            message: 'Registration is currently disabled'
          }
        });
        return;
      }
    } catch (settingsError) {
      logger.error('Failed to read allowRegistration setting; refusing registration', settingsError);
      res.status(503).json({
        success: false,
        error: {
          code: 'REGISTRATION_UNAVAILABLE',
          message: 'Registration is temporarily unavailable'
        }
      });
      return;
    }

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
        // A username must not collide with ANY identifier, in either direction:
        //   - another account's username
        //   - another account's email
        //
        // The email case matters because login resolves an identifier against both
        // columns (`routes/auth/login.ts`). If a username could equal a different
        // user's email, that single identifier would match two rows and `findFirst`
        // would hand back a nondeterministic one — in the worst case letting the
        // wrong account's password unlock the other.
        const normalizedUsername = username.toLowerCase();
        const existingUsername = await getPrismaClient().user.findFirst({
          where: {
            OR: [
              { username },
              { email: normalizedUsername },
            ],
          },
        });

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
      //
      // The token write and the send are tracked separately on purpose. Previously both
      // sat in one try/catch that only logged, so a failed send still returned 201 and the
      // user was told to check an inbox that would never receive anything. Registration
      // must not claim success when the required verification email did not leave.
      let verificationEmailSent: boolean | null = null;

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

        verificationEmailSent = await emailService.sendVerificationEmail(
          normalizedEmail, token, plainFirstName || firstName, username
        );
      } catch (err) {
        logger.error('Failed to initiate email verification', err);
        verificationEmailSent = false;
      }

      if (settings.requireEmailVerification && verificationEmailSent !== true) {
        logger.error(
          `Registration verification email failed for ${normalizedEmail}; ` +
          `user ${user.id} created but not notified. Registration would leave this ` +
          `account unable to log in, so the request fails loudly instead of reporting success.`
        );
        res.status(503).json({
          success: false,
          error: {
            code: 'VERIFICATION_EMAIL_FAILED',
            message:
              'Your account was created, but we could not send the verification email. ' +
              'Please try signing in and requesting a new verification email, or contact the administrator.'
          }
        });
        return;
      }

      // Generate tokens
      const accessToken = jwtService.createAccessToken({
        userId: user.id,
        email: user.email,
        role: 'user'
      });

      const refreshToken = jwtService.createRefreshToken(user.id);

      // Persist the session (#312)
      try {
        await getPrismaClient().userSession.create({
          data: {
            userId: user.id,
            accessToken,
            refreshToken,
            ipAddress: req.ip || null,
            userAgent: (req.headers['user-agent'] as string) || null,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isActive: true
          }
        });
      } catch (sessionErr) {
        logger.error('Failed to persist session on register (non-fatal):', sessionErr);
      }

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
      // Ensure createdAt is a string for JSON serialization
      const userCreatedAt = user.createdAt instanceof Date 
        ? user.createdAt.toISOString() 
        : String(user.createdAt || new Date().toISOString());
      
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            createdAt: userCreatedAt,
            isActive: user.isActive,
            isVerified: user.isVerified,
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
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error) {
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
  })
);
}
