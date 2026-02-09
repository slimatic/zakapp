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
import { randomBytes, randomUUID } from 'crypto';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/ErrorHandler';
import { AuthService } from '../services/AuthService';
import { generateSessionId, invalidateAllUserRefreshTokens } from '../utils/jwt';
import { generateResetToken, validateResetToken, useResetToken, invalidateUserResetTokens } from '../utils/resetTokens';
import { emailService } from '../services/EmailService';
import { SettingsService } from '../services/SettingsService';
import { prisma } from '../utils/prisma';

const authService = new AuthService();

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, username } = req.body;

    // Validation - collect all errors
    const validationErrors: Array<{ field: string, message: string }> = [];

    if (!email) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!password) {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      validationErrors.push({ field: 'password', message: 'Password must be at least 8 characters with mixed case, numbers, and symbols' });
    }

    if (!firstName) {
      validationErrors.push({ field: 'firstName', message: 'First name is required' });
    }

    if (!lastName) {
      validationErrors.push({ field: 'lastName', message: 'Last name is required' });
    }

    if (!username) {
      validationErrors.push({ field: 'username', message: 'Username is required' });
    } else if (username.length < 3) {
      validationErrors.push({ field: 'username', message: 'Username must be at least 3 characters' });
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: validationErrors
      });
      return;
    }

    try {
      // Create user
      const result = await authService.register({ email, password, firstName, lastName, username });
      if (!result) {
        res.status(400).json({
          success: false,
          error: 'REGISTRATION_FAILED',
          message: 'Failed to create user'
        });
        return;
      }

      // Generate verification token
      const token = crypto.randomUUID();

      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          verificationToken: token,
          verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      // Create user response
      const userResponse = {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        createdAt: result.user.createdAt,
        isAdmin: result.user.userType === 'ADMIN_USER' || (result.user.email && process.env.ADMIN_EMAILS?.split(',').map((e: string) => e.trim().toLowerCase()).includes(result.user.email.toLowerCase())),
        maxAssets: result.user.maxAssets,
        maxNisabRecords: result.user.maxNisabRecords,
        maxPayments: result.user.maxPayments,
        salt: result.user.salt,
        isVerified: false
      };

      const response: ApiResponse = {
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        user: userResponse,
        tokens: result.tokens
      };

      try {
        // Fire and forget email (don't block response) or wait?
        // Better to wait briefly or log error, but return success to user.
        await emailService.sendVerificationEmail(email, token, firstName, username);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue, user can request resend later
      }

      res.status(201).json(response);
    } catch (error: any) {
      if (error.message === 'User with this email or username already exists') {
        res.status(409).json({
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'Email address is already registered'
        });
        return;
      }
      throw error;
    }
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Verification token is required'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired verification token'
      });
      return;
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      res.status(400).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Verification token has expired'
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validation - collect all errors
    const validationErrors: Array<{ field: string, message: string }> = [];

    if (!email) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!password) {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: validationErrors
      });
      return;
    }

    // Authenticate user
    const result = await authService.login({ email, password });
    if (!result) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
      return;
    }

    // Check email verification status
    const settings = await SettingsService.getSettings();
    const userVerified = result.user.isVerified !== false; // Default to true if undefined (legacy users)

    if (settings.requireEmailVerification && !userVerified) {
      res.status(403).json({
        success: false,
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification is required to log in.'
      });
      return;
    }

    // Create user response
    const userResponse = {
      id: result.user.id,
      email: result.user.email,
      username: result.user.username,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      createdAt: result.user.createdAt,
      isAdmin: result.user.userType === 'ADMIN_USER' || (result.user.email && process.env.ADMIN_EMAILS?.split(',').map((e: string) => e.trim().toLowerCase()).includes(result.user.email.toLowerCase())),
      maxAssets: result.user.maxAssets,
      maxNisabRecords: result.user.maxNisabRecords,
      maxPayments: result.user.maxPayments,
      salt: result.user.salt,
      isVerified: result.user.isVerified
    };

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      user: userResponse,
      tokens: result.tokens
    };

    res.status(200).json(response);
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    // Validation
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Refresh token is required'
      });
      return;
    }

    try {
      // Use AuthService to refresh tokens
      const tokens = await authService.refreshTokens(refreshToken);

      const response: ApiResponse = {
        success: true,
        tokens,
        // Also provide direct access for tests that expect it
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      };

      res.status(200).json(response);
    } catch (error: any) {
      let statusCode = 401;
      let errorCode = 'INVALID_TOKEN';
      let message = 'Invalid refresh token';

      if (error.message === 'TOKEN_EXPIRED') {
        errorCode = 'TOKEN_EXPIRED';
        message = 'Refresh token has expired';
      } else if (error.message === 'TOKEN_USED') {
        errorCode = 'TOKEN_USED';
        message = 'Refresh token has already been used';
      } else if (error.message === 'TOKEN_INVALIDATED') {
        errorCode = 'TOKEN_INVALIDATED';
        message = 'Refresh token has been invalidated';
      }

      res.status(statusCode).json({
        success: false,
        error: errorCode,
        message
      });
    }
  });

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { logoutFromAllDevices } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    if (logoutFromAllDevices) {
      // Invalidate all sessions for this user
      // TODO: Implement invalidateUserSession
      // invalidateUserSession(req.userId);
      invalidateAllUserRefreshTokens(req.userId);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } else {
      // For regular logout, invalidate access token and all user's refresh tokens for security
      if (token) {
        // TODO: Implement invalidateToken
        // invalidateToken(token);
      }
      invalidateAllUserRefreshTokens(req.userId);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  });

  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    // Get user from storage
    const user = await authService.getUserById(req.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
      return;
    }

    const isAdmin = user.userType === 'ADMIN_USER' || (user.email && process.env.ADMIN_EMAILS?.split(',').map((e: string) => e.trim().toLowerCase()).includes(user.email.toLowerCase()));

    // Create user response with profile and settings
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.createdAt, // For now, same as created
      maxAssets: user.maxAssets,
      maxNisabRecords: user.maxNisabRecords,
      maxPayments: user.maxPayments,
      isVerified: user.isVerified,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        currency: 'USD',
        locale: 'en',
        timezone: user.timezone,
        salt: user.salt
      },
      settings: {
        defaultCalculationMethod: 'standard',
        nisabMethod: 'gold',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profileVisibility: 'private',
          analyticsOptOut: false
        }
      }
    };

    // Create session information
    const sessionInfo = {
      id: generateSessionId(),
      lastAccessAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
    };

    const response: ApiResponse = {
      success: true,
      user: userResponse,
      session: sessionInfo
    };

    res.status(200).json(response);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Validation
    const validationErrors: Array<{ field: string, message: string }> = [];

    if (!email) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: validationErrors
      });
      return;
    }

    // Privacy-first: Always return success to prevent email enumeration
    // In real implementation, would send email if user exists
    const userId = await authService.getUserIdByEmail(email);
    const resetTokenId = randomUUID(); // Always use UUID format for security
    const expiresIn = 3600; // 1 hour in seconds
    const eventId = `pwd_reset_${Date.now()}_${randomBytes(4).toString('hex')}`;

    if (userId) {
      // Invalidate any existing reset tokens for this user
      invalidateUserResetTokens(userId);

      const resetToken = await generateResetToken(userId, email);

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Continue to prevent information leakage about email existence
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Password reset email sent',
      resetTokenId,
      expiresIn,
      eventId
    };

    res.status(200).json(response);
  });

  confirmReset = asyncHandler(async (req: Request, res: Response) => {
    const { token, password, confirmPassword } = req.body;

    // Validation
    const validationErrors: Array<{ field: string, message: string }> = [];

    if (!token) {
      validationErrors.push({ field: 'token', message: 'Reset token is required' });
    }

    if (!password) {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      validationErrors.push({ field: 'password', message: 'Password must be at least 8 characters with mixed case, numbers, and symbols' });
    }

    if (confirmPassword && password !== confirmPassword) {
      validationErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    if (validationErrors.length > 0) {
      // If there's only one error and it's password mismatch, use specific message
      if (validationErrors.length === 1 && validationErrors[0] && validationErrors[0].field === 'confirmPassword') {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: validationErrors[0].message,
          details: validationErrors
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: validationErrors
      });
      return;
    }

    // Validate reset token
    let tokenData;
    try {
      tokenData = validateResetToken(token);
      if (!tokenData) {
        res.status(400).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        });
        return;
      }
    } catch (error: any) {
      if (error.message === 'TOKEN_EXPIRED') {
        res.status(400).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Reset token has expired'
        });
        return;
      }
      if (error.message === 'TOKEN_USED') {
        res.status(400).json({
          success: false,
          error: 'TOKEN_USED',
          message: 'Reset token has already been used'
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid reset token'
      });
      return;
    }

    try {
      // Update password
      const success = await authService.updatePassword(tokenData.userId, password);
      if (!success) {
        res.status(400).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
        return;
      }

      // Use the reset token to prevent reuse
      useResetToken(token);

      // Invalidate all user sessions for security
      // TODO: Implement invalidateUserSession
      // invalidateUserSession(tokenData.userId);
      invalidateAllUserRefreshTokens(tokenData.userId);

      const response: ApiResponse = {
        success: true,
        message: 'Password reset successfully',
        eventId: `pwd-reset-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update password'
      });
    }
  });
}

export const authController = new AuthController();