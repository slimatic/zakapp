/**
 * User management routes for zakapp
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const dataStore = require('../utils/dataStore');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

/**
 * GET /api/user/profile
 * Get user profile (requires password for decryption)
 */
router.post('/profile', [
  body('password').notEmpty().withMessage('Password is required for data access')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password } = req.body;
    const userId = req.user.id;

    // Load user data
    const userData = await dataStore.loadUserData(userId, password);
    if (!userData) {
      return res.status(404).json({
        error: 'User data not found'
      });
    }

    res.json({
      user: userData.user,
      snapshots: userData.snapshots || [],
      zakatRecords: userData.zakatRecords || []
    });

  } catch (error) {
    console.error('Get profile error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }
    res.status(500).json({
      error: 'Failed to load user profile'
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', [
  body('password').notEmpty().withMessage('Current password is required'),
  body('updates').isObject().withMessage('Updates object is required'),
  body('updates.email').optional().isEmail().withMessage('Valid email is required'),
  body('updates.settings').optional().isObject().withMessage('Settings must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password, updates } = req.body;
    const userId = req.user.id;

    // Load current user data
    const userData = await dataStore.loadUserData(userId, password);
    if (!userData) {
      return res.status(404).json({
        error: 'User data not found'
      });
    }

    // Update user object
    const user = userData.user;
    if (updates.email) user.email = updates.email;
    if (updates.settings) {
      user.settings = { ...user.settings, ...updates.settings };
    }
    user.updatedAt = new Date().toISOString();

    // Save updated data
    userData.user = user;
    await dataStore.saveUserData(userId, userData, password);

    res.json({
      message: 'Profile updated successfully',
      user: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

/**
 * POST /api/user/change-password
 * Change user password
 */
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Load user data with current password
    const userData = await dataStore.loadUserData(userId, currentPassword);
    if (!userData) {
      return res.status(401).json({
        error: 'Invalid current password'
      });
    }

    // Hash new password
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password hash
    userData.user.passwordHash = newPasswordHash;
    userData.user.updatedAt = new Date().toISOString();

    // Save data with new password
    await dataStore.saveUserData(userId, userData, newPassword);

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid current password'
      });
    }
    res.status(500).json({
      error: 'Failed to change password'
    });
  }
});

/**
 * POST /api/user/export
 * Export user data
 */
router.post('/export', [
  body('password').notEmpty().withMessage('Password is required for data export')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password } = req.body;
    const userId = req.user.id;

    // Export user data
    const exportData = await dataStore.exportUserData(userId, password);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="zakapp-export-${userId}-${Date.now()}.json"`);

    res.json(exportData);

  } catch (error) {
    console.error('Export data error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }
    res.status(500).json({
      error: 'Failed to export data'
    });
  }
});

/**
 * DELETE /api/user/account
 * Delete user account (with confirmation)
 */
router.delete('/account', [
  body('password').notEmpty().withMessage('Password is required'),
  body('confirmation')
    .equals('DELETE_MY_ACCOUNT')
    .withMessage('Confirmation text must be "DELETE_MY_ACCOUNT"')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password } = req.body;
    const userId = req.user.id;

    // Verify password by trying to load user data
    const userData = await dataStore.loadUserData(userId, password);
    if (!userData) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }

    // Delete user files
    const fs = require('fs-extra');
    const path = require('path');
    
    const userFile = path.join(dataStore.dataDir, 'users', `${userId}.json`);
    await fs.remove(userFile);

    // Delete associated snapshots
    if (userData.snapshots) {
      for (const snapshotId of userData.snapshots) {
        const snapshotFile = path.join(dataStore.dataDir, 'snapshots', `${snapshotId}.json`);
        await fs.remove(snapshotFile).catch(() => {}); // Ignore errors
      }
    }

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }
    res.status(500).json({
      error: 'Failed to delete account'
    });
  }
});

module.exports = router;