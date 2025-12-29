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