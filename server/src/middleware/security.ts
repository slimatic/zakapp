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

/**
 * Tracking Security Middleware
 * 
 * Provides security enhancements specific to tracking & analytics endpoints:
 * - Rate limiting for expensive analytics queries
 * - User ownership validation helper
 * - Request validation middleware
 * 
 * Constitutional Principles:
 * - Privacy & Security First: Rate limiting prevents abuse
 * - User-Centric Design: Clear error messages
 * - Quality & Reliability: Defense in depth
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from '../types';

/**
 * Rate limiter for tracking snapshot operations
 * More permissive than auth endpoints but still protected
 */
export const snapshotRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes per user
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many snapshot operations. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID for authenticated requests
    return (req as AuthenticatedRequest).userId || req.ip || 'unknown';
  },
});

/**
 * Rate limiter for analytics/comparison queries
 * Moderate limits - allowing for page loads with multiple charts
 */
export const analyticsRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes (allows ~10 page refreshes)
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many analytics requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as AuthenticatedRequest).userId || req.ip || 'unknown';
  },
});

/**
 * Rate limiter for payment recording
 * Moderate limits to prevent spam
 */
export const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40, // 40 requests per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many payment operations. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as AuthenticatedRequest).userId || req.ip || 'unknown';
  },
});

/**
 * Middleware to validate user ownership of tracking resources
 * This is a helper that adds common ownership checks
 * 
 * Note: Actual ownership verification happens in service layer,
 * this middleware is for early validation and logging
 */
export function validateUserOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User authentication required',
      },
    });
    return;
  }

  // Attach userId to request for downstream use
  // Services will perform actual ownership verification
  next();
}

/**
 * Middleware to validate snapshot ID parameter
 */
export function validateSnapshotId(req: Request, res: Response, next: NextFunction): void {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim() === '') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Valid snapshot ID is required',
      },
    });
    return;
  }

  next();
}

/**
 * Middleware to validate payment ID parameter
 */
export function validatePaymentId(req: Request, res: Response, next: NextFunction): void {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim() === '') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Valid payment ID is required',
      },
    });
    return;
  }

  next();
}

/**
 * Middleware to validate pagination parameters
 */
export function validatePagination(req: Request, res: Response, next: NextFunction): void {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Page number must be >= 1',
      },
    });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Limit must be between 1 and 100',
      },
    });
    return;
  }

  next();
}

/**
 * Middleware to validate date range for analytics queries
 */
export function validateDateRange(req: Request, res: Response, next: NextFunction): void {
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid start date format',
        },
      });
      return;
    }

    if (isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid end date format',
        },
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before end date',
        },
      });
      return;
    }

    // Limit range to 10 years maximum
    const tenYears = 10 * 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > tenYears) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Date range cannot exceed 10 years',
        },
      });
      return;
    }
  }

  next();
}

/**
 * Middleware to sanitize and validate comparison snapshot IDs
 */
export function validateComparisonIds(req: Request, res: Response, next: NextFunction): void {
  const { snapshotIds } = req.query;

  if (!snapshotIds) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Snapshot IDs are required for comparison',
      },
    });
    return;
  }

  const ids = (snapshotIds as string).split(',').map(id => id.trim());

  if (ids.length < 2) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'At least 2 snapshots required for comparison',
      },
    });
    return;
  }

  if (ids.length > 5) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Cannot compare more than 5 snapshots at once',
      },
    });
    return;
  }

  // Check for valid ID format (non-empty strings)
  if (ids.some(id => !id || id.trim() === '')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'All snapshot IDs must be valid',
      },
    });
    return;
  }

  next();
}
