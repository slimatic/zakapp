/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * Standardized Authentication Routes
 * Implements API contracts with standard response format
 *
 * Follows ZakApp constitutional principles:
 * - Privacy & Security First: JWT token management with refresh rotation
 * - User-Centric Design: Clear error messages and validation
 * - Spec-Driven Development: Compliant with API contracts
 *
 * This file is a facade. The handlers were split into ./auth/* by topic; the router,
 * the mount order, and the exported API are unchanged. Import from here as before.
 */

import express from 'express';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/AuthMiddleware';

import { registerLoginRoutes } from './auth/login';
import { registerRegisterRoutes } from './auth/register';
import { registerRefreshRoutes } from './auth/refresh';
import { registerProfileRoutes } from './auth/profile';
import { registerVerificationRoutes } from './auth/verification';
import { registerPasswordRoutes } from './auth/password';

export { resetAuthState } from './auth/_shared';

const router = express.Router();

registerLoginRoutes(router);
registerRegisterRoutes(router);
registerRefreshRoutes(router);
registerProfileRoutes(router);
registerVerificationRoutes(router);
registerPasswordRoutes(router);

// Test helper endpoint - only in test environment
if (process.env.NODE_ENV === 'test') {
  router.get('/test/validate-token',
    authenticate,
    (req: AuthenticatedRequest, res: ExpressResponse) => {
      res.json({
        success: true,
        data: {
          userId: req.userId,
          valid: true
        }
      });
    }
  );
}

export default router;
