import { Request, Response, NextFunction } from 'express';
import {
  verifyToken,
  extractTokenFromHeader,
  JWTPayload,
} from '../utils/auth.js';
import { ERROR_CODES } from '@zakapp/shared';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Authentication middleware to verify JWT tokens
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Access token is required',
      },
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    let message = 'Invalid or expired token';
    let code = ERROR_CODES.UNAUTHORIZED;

    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        message = 'Token has expired';
        code = ERROR_CODES.UNAUTHORIZED; // Use UNAUTHORIZED for now
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token';
      }
    }

    res.status(401).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
}

/**
 * Optional authentication middleware (allows both authenticated and unauthenticated requests)
 */
export function optionalAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    try {
      const decoded = verifyToken(token);
      (req as AuthenticatedRequest).user = decoded;
    } catch (error) {
      // Silently fail for optional authentication
      // User will be undefined
    }
  }

  next();
}
