/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * GET /verify-email and POST /resend-verification
 *
 * Extracted from the single-file routes/auth.ts. Route bodies are unchanged —
 * only the enclosing function and the import list are new.
 */

import express from 'express';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { asyncHandler } from '../../middleware/ErrorHandler';
import crypto from 'crypto';
import { emailService } from '../../services/EmailService';
import {
  logger,
  getPrismaClient,
} from './_shared';

export function registerVerificationRoutes(router: express.Router): void {
router.get('/verify-email',
  asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Token is required' }
      });
      return;
    }

    const user = await getPrismaClient().user.findUnique({
      where: { verificationToken: token }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      });
      return;
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      res.status(400).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' }
      });
      return;
    }

    await getPrismaClient().user.update({
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
  })
);

router.post('/resend-verification',
  asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
    const genericResponse = {
      success: true,
      message: 'If that account exists and is not yet verified, a new verification email has been sent.'
    };

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' }
      });
      return;
    }

    try {
      const user = await getPrismaClient().user.findUnique({ where: { email } });

      // Unknown address or already verified: no send, still generic 200.
      if (!user || user.isVerified) {
        res.status(200).json(genericResponse);
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await getPrismaClient().user.update({
        where: { id: user.id },
        data: { verificationToken: token, verificationTokenExpires: expiry }
      });

      const sent = await emailService.sendVerificationEmail(
        user.email, token, undefined, user.username || undefined
      );

      if (!sent) {
        logger.error(`Resend verification email failed to send for user ${user.id}`);
        res.status(503).json({
          success: false,
          error: {
            code: 'VERIFICATION_EMAIL_FAILED',
            message: 'We could not send the verification email right now. Please try again shortly.'
          }
        });
        return;
      }
    } catch (err) {
      logger.error('resend-verification failed', err);
      res.status(503).json({
        success: false,
        error: {
          code: 'VERIFICATION_EMAIL_FAILED',
          message: 'We could not send the verification email right now. Please try again shortly.'
        }
      });
      return;
    }

    res.status(200).json(genericResponse);
  })
);
}
