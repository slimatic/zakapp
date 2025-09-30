import express from 'express';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { JWTService } from '../services/JWTService';
import { authenticate } from '../middleware/AuthMiddleware';
import { handleValidationErrors, validateUserLogin, validateUserRegistration } from '../middleware/ValidationMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { UserStore } from '../utils/userStore';
import crypto from 'crypto';

/**
 * Standardized Authentication Routes
 * Implements API contracts with standard response format
 * 
 * Follows ZakApp constitutional principles:
 * - Privacy & Security First: JWT token management with refresh rotation
 * - User-Centric Design: Clear error messages and validation
 * - Spec-Driven Development: Compliant with API contracts
 */

const router = express.Router();
const jwtService = new JWTService();

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post('/login', 
  validateUserLogin,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      // Authenticate user
      const user = await UserStore.authenticateUser(email, password);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
        return;
      }

      // Generate tokens
      const accessToken = jwtService.createAccessToken({
        userId: user.id,
        email: user.email,
        role: 'user'
      });

      const refreshToken = jwtService.createRefreshToken(user.id);

      // Respond with standard format
      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            preferences: {} // TODO: Add user preferences when implemented
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed due to server error'
        }
      });
    }
  })
);

/**
 * POST /api/auth/register
 * Register new user account
 */
router.post('/register',
  validateUserRegistration,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, username } = req.body;

    try {
      // Check if email already exists
      if (UserStore.emailExists(email)) {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Email address is already registered'
          }
        });
        return;
      }

      // Create new user
      const user = await UserStore.createUser(email, username, password);

      // Generate tokens
      const accessToken = jwtService.createAccessToken({
        userId: user.id,
        email: user.email,
        role: 'user'
      });

      const refreshToken = jwtService.createRefreshToken(user.id);

      // Respond with standard format
      res.status(201).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            preferences: {} // TODO: Add user preferences when implemented
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Email address is already registered'
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Registration failed due to server error'
        }
      });
    }
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
      return;
    }

    try {
      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);
      
      // Find user
      const user = UserStore.getUserById(decoded.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }

      // Generate new tokens
      const newAccessToken = jwtService.createAccessToken({
        userId: user.id,
        email: user.email,
        role: 'user'
      });

      const newRefreshToken = jwtService.createRefreshToken(user.id);

      // Respond with standard format
      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }
  })
);

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // In a production environment, you would:
      // 1. Add the access token to a blacklist
      // 2. Remove refresh tokens from database
      // 3. Clear any user sessions
      
      // For now, we'll just acknowledge the logout
      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Logout failed due to server error'
        }
      });
    }
  })
);

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = UserStore.getUserById(req.userId!);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            preferences: {}, // TODO: Add user preferences when implemented
            createdAt: user.createdAt
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve user information'
        }
      });
    }
  })
);

/**
 * POST /api/auth/reset-password
 * Request password reset
 */
router.post('/reset-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required'
        }
      });
      return;
    }

    try {
      // In production, this would:
      // 1. Generate a secure reset token
      // 2. Store it in database with expiration
      // 3. Send email with reset link
      
      // For now, just acknowledge the request
      res.status(200).json({
        success: true,
        data: {
          message: 'If the email exists, a password reset link has been sent'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Password reset failed due to server error'
        }
      });
    }
  })
);

// Test helper endpoint - only in test environment
if (process.env.NODE_ENV === 'test') {
  router.get('/test/validate-token', 
    authenticate,
    (req: AuthenticatedRequest, res: Response) => {
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