import express from 'express';
import { userService } from '../services/userService.js';
import { generateToken, getTokenExpirationInfo } from '../utils/auth.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  RegisterRequest,
  LoginRequest,
} from '../utils/validation.js';
import { ERROR_CODES } from '@zakapp/shared';

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user account
 */
router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { username, email, password }: RegisterRequest = req.body;

    // Check if user already exists
    if (await userService.userExists(username, email)) {
      return res.status(409).json({
        success: false,
        error: {
          code: ERROR_CODES.USER_EXISTS,
          message: 'Username or email already exists',
        },
      });
    }

    // Create new user
    const user = await userService.createUser(username, email, password);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to register user',
      },
    });
  }
});

/**
 * POST /auth/login
 * Authenticate user and receive access token
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { username, password }: LoginRequest = req.body;

    // Authenticate user
    const user = await userService.authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid username or password',
        },
      });
    }

    // Generate JWT token
    const token = generateToken(user);
    const { expiresIn } = getTokenExpirationInfo(token);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
        },
        token,
        expiresIn,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to authenticate user',
      },
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh authentication token
 */
router.post(
  '/refresh',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'User authentication required',
          },
        });
      }

      // Get fresh user data
      const freshUser = await userService.getUserById(user.userId);

      if (!freshUser) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'User not found',
          },
        });
      }

      // Generate new token
      const token = generateToken(freshUser);
      const { expiresIn } = getTokenExpirationInfo(token);

      res.json({
        success: true,
        data: {
          token,
          expiresIn,
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to refresh token',
        },
      });
    }
  }
);

/**
 * POST /auth/logout
 * Logout user and invalidate token
 */
router.post(
  '/logout',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      // For now, just return success since we're using stateless JWT
      // In a production system, you might want to blacklist tokens
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to logout',
        },
      });
    }
  }
);

export { router as authRouter };
