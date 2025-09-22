import express from 'express';
import { userService } from '../services/userService.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import {
  changePasswordSchema,
  updateProfileSchema,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../utils/validation.js';
import { ERROR_CODES } from '@zakapp/shared';

const router = express.Router();

/**
 * GET /users/profile
 * Get current user profile information
 */
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
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

    const userProfile = await userService.getUserById(user.userId);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User profile not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        userId: userProfile.userId,
        username: userProfile.username,
        email: userProfile.email,
        createdAt: userProfile.createdAt,
        lastLogin: userProfile.lastLogin,
        preferences: userProfile.preferences,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to get user profile',
      },
    });
  }
});

/**
 * PUT /users/profile
 * Update user profile information
 */
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), async (req: AuthenticatedRequest, res) => {
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

    const updates: UpdateProfileRequest = req.body;

    const updatedUser = await userService.updateUserProfile(user.userId, updates);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId: updatedUser.userId,
        username: updatedUser.username,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
        preferences: updatedUser.preferences,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        error: {
          code: ERROR_CODES.USER_EXISTS,
          message: 'Email already exists',
        },
      });
    }

    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update profile',
      },
    });
  }
});

/**
 * POST /users/change-password
 * Change user password
 */
router.post('/change-password', authenticateToken, validateBody(changePasswordSchema), async (req: AuthenticatedRequest, res) => {
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

    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    const success = await userService.changePassword(user.userId, currentPassword, newPassword);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Current password is incorrect',
        },
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to change password',
      },
    });
  }
});

export { router as usersRouter };