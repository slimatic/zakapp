import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { jwtService } from '../services/JWTService';

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'NO_TOKEN',
      message: 'Access token required'
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'INVALID_AUTH_FORMAT',
      message: 'Authorization header must be in format: Bearer <token>'
    });
    return;
  }

  const token = parts[1];
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Token missing in authorization header'
    });
    return;
  }

  try {
    const decoded = jwtService.verifyAccessToken(token);
    
    // Check if token is invalidated
    if (isTokenInvalidated(token)) {
      res.status(401).json({
        success: false,
        error: 'TOKEN_INVALIDATED',
        message: 'Token has been invalidated'
      });
      return;
    }

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email || '',
      name: '' // Name not included in token payload
    };
    
    next();
  } catch (error: any) {
    let errorCode = 'INVALID_TOKEN';
    let message = 'Invalid access token';

    if (error.message?.includes('expired') || error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      message = 'Access token has expired';
    }

    res.status(401).json({
      success: false,
      error: errorCode,
      message
    });
  }
};

// Track invalidated tokens
const invalidatedTokens = new Set<string>();
const invalidatedUserSessions = new Set<string>();

export function invalidateToken(token: string): void {
  invalidatedTokens.add(token);
}

export function invalidateUserSession(userId: string): void {
  invalidatedUserSessions.add(userId);
}

export function isTokenInvalidated(token: string): boolean {
  if (invalidatedTokens.has(token)) {
    return true;
  }
  
  // Check if token belongs to invalidated user session
  try {
    const decoded = jwtService.verifyAccessToken(token);
    return invalidatedUserSessions.has(decoded.userId);
  } catch {
    return false;
  }
}

export function clearInvalidatedTokens(): void {
  invalidatedTokens.clear();
  invalidatedUserSessions.clear();
}