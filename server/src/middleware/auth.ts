/**
 * Auth Middleware Exports
 * Wraps AuthMiddleware.ts for cleaner imports in route files
 * 
 * Usage:
 *   import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
 *   router.use(authMiddleware);
 */

import { Response, NextFunction } from 'express';
import { AuthMiddleware } from './AuthMiddleware';
import { AuthenticatedRequest } from '../types';

const authMiddlewareInstance = new AuthMiddleware();

/**
 * Express middleware for authentication
 * Can be used directly: router.use(authMiddleware)
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  authMiddlewareInstance.authenticate(req, res, next);
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  authMiddlewareInstance.requireAdmin(req, res, next);
};

// Export AuthenticatedRequest for type usage in route files
export { AuthenticatedRequest };