import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';

// Mock authentication middleware - in real implementation this would verify JWT
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new AppError('Access token required', 401, 'UNAUTHORIZED');
  }

  // Mock token verification - extract user ID from token format "token-{userId}"
  if (token.startsWith('token-user-')) {
    const userId = token.replace('token-', '');
    req.userId = userId;
    req.user = {
      id: userId,
      email: 'user@example.com',
      name: 'Mock User'
    };
  } else {
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  next();
};