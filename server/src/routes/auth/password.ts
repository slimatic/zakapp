/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * POST /reset-password and POST /confirm-reset
 *
 * Extracted from the single-file routes/auth.ts. Route bodies are unchanged —
 * only the enclosing function and the import list are new.
 */

import express from 'express';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { asyncHandler } from '../../middleware/ErrorHandler';
import { emailService } from '../../services/EmailService';
import { AuthService } from '../../services/AuthService';
import {
  logger,
} from './_shared';

export function registerPasswordRoutes(router: express.Router): void {
router.post('/reset-password',
  asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
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
      // Returns a placeholder for unknown emails (no enumeration); a real
      // random token persisted to PasswordReset when the user exists.
      const resetToken = await authService.generateResetToken(email);

      // Send the reset email (token is voided if the email send fails hard)
      if (resetToken && resetToken !== 'reset-token-generated') {
        try {
          await emailService.sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
          logger.error('Failed to send password reset email', emailError);
          // Do not fail the request — response already generic to prevent enumeration
        }
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
  })
);

router.post('/confirm-reset',
  asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Token and new password are required'
        }
      });
      return;
    }

    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters with mixed case, numbers, and symbols'
        }
      });
      return;
    }

    try {
      const authService = new AuthService();
      await authService.resetPassword(token, password);

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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'Invalid or expired reset token'
        }
      });
    }
  })
);
}
