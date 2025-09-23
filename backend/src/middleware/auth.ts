import { Request, Response, NextFunction } from 'express';
import {
  verifyToken,
  extractTokenFromHeader,
  JWTPayload,
} from '../utils/auth.js';
import { isTokenBlacklisted, updateSessionActivity } from '../utils/session.js';
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

  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Token has been invalidated',
      },
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    (req as AuthenticatedRequest).user = decoded;
    
    // Update session activity asynchronously
    updateSessionActivity(decoded.userId).catch(console.error);
    
    next();
  } catch (error) {
    let message = 'Invalid or expired token';
    let code = ERROR_CODES.UNAUTHORIZED;

    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        message = 'Token has expired';
        code = ERROR_CODES.UNAUTHORIZED; // Map to UNAUTHORIZED since TOKEN_EXPIRED is not available in this context
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

  if (token && !isTokenBlacklisted(token)) {
    try {
      const decoded = verifyToken(token);
      (req as AuthenticatedRequest).user = decoded;
      
      // Update session activity asynchronously
      updateSessionActivity(decoded.userId).catch(console.error);
    } catch (error) {
      // Silently fail for optional authentication
      // User will be undefined
    }
  }

  next();
}
