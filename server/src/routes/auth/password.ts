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
import { asyncHandler } from '../../middleware/ErrorHandler';
import { Logger } from '../../utils/logger';
import { AuthService } from '../../services/AuthService';
import { emailService } from '../../services/EmailService';
import { validatePasswordResetConfirm } from '../../middleware/ValidationMiddleware';

const logger = new Logger('AuthPassword');

/**
 * POST /api/auth/reset-password
 * Request password reset
 */
export const resetPasswordHandler = asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_EMAIL',
        message: 'Email is required'
      }
    });
    return;
  }

  try {
    const authService = new AuthService();
    const resetToken = await authService.generateResetToken(email);

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      logger.error('Failed to send password reset email', emailError);
      // Continue anyway - don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'If the email exists, a password reset link has been sent'
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
        message: 'Password reset failed due to server error'
      }
    });
  }
});

/**
 * POST /api/auth/confirm-reset
 * Confirm password reset with token
 */
export const confirmResetHandler = asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
  const { token, newPassword } = req.body;

  try {
    const authService = new AuthService();
    await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset successfully'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_RESET_TOKEN',
        message: 'Invalid or expired reset token'
      }
    });
  }
});