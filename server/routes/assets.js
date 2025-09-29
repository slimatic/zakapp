const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Debug middleware to log all requests to this router
router.use((req, res, next) => {
  console.log(`\n🔍 ASSETS ROUTE: ${req.method} ${req.originalUrl}`);
  console.log('📝 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  next();
});

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/assets
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Assets request received for user:', userId);
    
    res.json({
      success: true,
      data: {
        assets: []
      }
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch assets'
      }
    });
  }
});

// POST /api/v1/assets
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Create asset request for user:', userId, 'Data:', req.body);
    
    const newAsset = {
      assetId: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: {
        asset: newAsset
      }
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create asset'
      }
    });
  }
});

module.exports = router;
