const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// In-memory storage for assets (per user)
const userAssets = {};

// Helper to get user assets
const getUserAssets = (userId) => {
  if (!userAssets[userId]) {
    userAssets[userId] = [];
  }
  return userAssets[userId];
};

// Debug middleware to log all requests to this router
router.use((req, res, next) => {
  console.log(`\n🔍 ASSETS ROUTE: ${req.method} ${req.originalUrl}`);
  console.log('📝 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  next();
});

// All routes require authentication
router.use(authenticateToken);

// GET /api/assets
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Assets request received for user:', userId);
    
    const assets = getUserAssets(userId);
    console.log('Found assets:', assets.length);
    
    res.json({
      success: true,
      data: {
        assets: assets
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

// POST /api/assets
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Create asset request for user:', userId, 'Data:', req.body);
    
    // Validate required fields
    const { name, category, value, currency } = req.body;
    if (!name || !category || value === undefined || !currency) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: name, category, value, currency'
        }
      });
    }
    
    // Create new asset
    const newAsset = {
      assetId: Date.now().toString(),
      name,
      category,
      value: Number(value),
      currency,
      description: req.body.description || '',
      zakatEligible: req.body.zakatEligible !== undefined ? req.body.zakatEligible : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to user's assets
    const assets = getUserAssets(userId);
    assets.push(newAsset);
    
    console.log('Asset created:', newAsset);
    console.log('Total user assets:', assets.length);
    
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

// GET /api/assets/:id
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = req.params.id;
    
    const assets = getUserAssets(userId);
    const asset = assets.find(a => a.assetId === assetId);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        asset
      }
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch asset'
      }
    });
  }
});

// PUT /api/assets/:id
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = req.params.id;
    
    const assets = getUserAssets(userId);
    const assetIndex = assets.findIndex(a => a.assetId === assetId);
    
    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        }
      });
    }
    
    // Update asset
    const updatedAsset = {
      ...assets[assetIndex],
      ...req.body,
      assetId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    assets[assetIndex] = updatedAsset;
    
    res.json({
      success: true,
      data: {
        asset: updatedAsset
      }
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update asset'
      }
    });
  }
});

// DELETE /api/assets/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = req.params.id;
    
    const assets = getUserAssets(userId);
    const assetIndex = assets.findIndex(a => a.assetId === assetId);
    
    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        }
      });
    }
    
    // Remove asset
    assets.splice(assetIndex, 1);
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete asset'
      }
    });
  }
});

module.exports = router;
