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
import { getPrismaClient } from './utils';

const logger = new Logger('AuthVerification');

/**
 * GET /api/auth/verify-email
 * Validate verification token
 */
export const verifyEmailHandler = asyncHandler(async (req: ExpressRequest, res: ExpressResponse) => {
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
});