/**
 * Authentication routes for zakapp
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const dataStore = require('../utils/dataStore');
const fs = require('fs-extra');
const path = require('path');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authenticateToken 
} = require('../middleware/auth');

const router = express.Router();

// Simple user index for basic info (not encrypted)
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
const userIndexFile = path.join(dataDir, 'user-index.json');

// Helper to read/write user index
const readUserIndex = async () => {
  try {
    if (await fs.pathExists(userIndexFile)) {
      return await fs.readJSON(userIndexFile);
    }
  } catch (error) {
    console.error('Error reading user index:', error);
  }
  return {};
};

const writeUserIndex = async (userIndex) => {
  try {
    await fs.ensureDir(dataDir);
    await fs.writeJSON(userIndexFile, userIndex, { spaces: 2 });
  } catch (error) {
    console.error('Error writing user index:', error);
    throw error;
  }
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists using index
    const existingUserId = await dataStore.findUserByUsername(username);
    if (existingUserId) {
      return res.status(409).json({
        error: 'User already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      passwordHash
    });

    // Save user data (encrypted with their password)
    await dataStore.saveUserData(user.id, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        settings: user.settings
      },
      snapshots: [],
      zakatRecords: [],
      createdAt: new Date().toISOString()
    }, password);

    // Also save basic user info to index (for /me endpoint)
    const userIndex = await readUserIndex();
    userIndex[user.id] = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    await writeUserIndex(userIndex);

    // Generate tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login',
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username using index
    const userId = await dataStore.findUserByUsername(username);
    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Load user data with password
    const userData = await dataStore.loadUserData(userId, password);
    if (!userData) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const userPasswordHash = userData.user.passwordHash;
    if (!userPasswordHash) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, userPasswordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Update user index with latest login
    const userIndex = await readUserIndex();
    if (userIndex[userId]) {
      userIndex[userId].lastLogin = new Date().toISOString();
      await writeUserIndex(userIndex);
    }

    res.json({
      message: 'Login successful',
      user: new User(userData.user).toJSON(),
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const userId = verifyRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = generateToken(userId);

    res.json({
      accessToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid refresh token'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client should delete tokens)
 */
router.post('/logout', authenticateToken, async (req, res) => {
  // In a stateless JWT setup, logout is mainly handled client-side
  // Here we could implement token blacklisting if needed
  res.json({
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Try to get user info from the user index
    const userIndex = await readUserIndex();
    const userInfo = userIndex[userId];
    
    if (userInfo) {
      res.json({
        success: true,
        data: {
          userId: userInfo.id,
          username: userInfo.username,
          email: userInfo.email,
          createdAt: userInfo.createdAt,
          lastLogin: new Date().toISOString(),
          preferences: {
            currency: 'USD',
            language: 'en',
            zakatMethod: 'standard',
            calendarType: 'lunar'
          }
        }
      });
    } else {
      // Fallback to default user data if not found in index
      res.json({
        success: true,
        data: {
          userId: userId,
          username: 'User',
          email: 'user@example.com',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferences: {
            currency: 'USD',
            language: 'en',
            zakatMethod: 'standard',
            calendarType: 'lunar'
          }
        }
      });
    }

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

module.exports = router;