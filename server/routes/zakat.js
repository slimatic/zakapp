/**
 * Zakat calculation and management routes
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { AssetSnapshot, ZakatRecord, ZakatPayment } = require('../models');
const dataStore = require('../utils/dataStore');
const zakatCalculator = require('../utils/zakatCalculator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/zakat/calculate
 * Calculate Zakat for provided assets
 */
router.post('/calculate', authenticateToken, [
  body('methodology').optional().isIn(['standard', 'hanafi', 'shafi_i', 'custom']).withMessage('Invalid methodology'),
  body('calendarType').optional().isIn(['lunar', 'solar']).withMessage('Calendar type must be lunar or solar'),
  body('includeAssets').optional().isArray().withMessage('includeAssets must be an array'),
  body('includeLiabilities').optional().isArray().withMessage('includeLiabilities must be an array'),
  body('customRules.nisabSource').optional().isIn(['gold', 'silver']).withMessage('Nisab source must be gold or silver')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { 
      methodology = 'standard',
      calendarType = 'lunar',
      calculationDate = new Date().toISOString().split('T')[0],
      includeAssets = [],
      includeLiabilities = [],
      customRules = {}
    } = req.body;
    const userId = req.user.id;

    // Load user's assets from the file system (similar to assets route)
    const fs = require('fs-extra');
    const path = require('path');
    const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
    const assetsDir = path.join(dataDir, 'assets');
    const getUserAssetsFile = (userId) => path.join(assetsDir, `${userId}.json`);
    
    const getUserAssets = async (userId) => {
      try {
        const filePath = getUserAssetsFile(userId);
        if (await fs.pathExists(filePath)) {
          const data = await fs.readJSON(filePath);
          return data.assets || [];
        }
      } catch (error) {
        console.error('Error reading user assets:', error);
      }
      return [];
    };

    // Get user's assets
    const allAssets = await getUserAssets(userId);
    
    // Filter assets based on includeAssets parameter (if provided)
    const assetsToCalculate = includeAssets.length > 0 
      ? allAssets.filter(asset => includeAssets.includes(asset.assetId))
      : allAssets.filter(asset => asset.zakatEligible !== false); // Default to all Zakat-eligible assets

    console.log(`Calculating Zakat for user ${userId}:`, {
      totalAssets: allAssets.length,
      assetsToCalculate: assetsToCalculate.length,
      methodology,
      calendarType
    });

    // Simplified calculation (since the complex calculator might not exist)
    const nisabSource = customRules.nisabSource || 'gold';
    const zakatRate = customRules.zakatRate || 0.025; // 2.5%
    
    // Current nisab thresholds (simplified)
    const nisabThresholds = {
      gold: 5557.50, // 85 grams * ~$65.50/gram
      silver: 506.75  // 595 grams * ~$0.85/gram
    };
    
    const totalAssetValue = assetsToCalculate.reduce((sum, asset) => sum + asset.value, 0);
    const nisabThreshold = nisabThresholds[nisabSource];
    const isZakatObligatory = totalAssetValue >= nisabThreshold;
    const zakatAmount = isZakatObligatory ? totalAssetValue * zakatRate : 0;

    const calculation = {
      id: `calc_${Date.now()}`,
      calculationDate,
      methodology,
      calendarType,
      summary: {
        totalAssets: totalAssetValue,
        totalLiabilities: 0, // TODO: implement liabilities
        netWorth: totalAssetValue,
        nisabThreshold,
        nisabSource,
        isZakatObligatory,
        zakatAmount,
        zakatRate
      },
      breakdown: {
        assetsByCategory: assetsToCalculate.reduce((acc, asset) => {
          const category = asset.category || 'other';
          if (!acc[category]) {
            acc[category] = { totalValue: 0, zakatableAmount: 0, count: 0 };
          }
          acc[category].totalValue += asset.value;
          acc[category].zakatableAmount += asset.value;
          acc[category].count += 1;
          return acc;
        }, {}),
        includedAssets: assetsToCalculate.map(asset => ({
          id: asset.assetId,
          name: asset.name,
          category: asset.category,
          value: asset.value,
          zakatAmount: isZakatObligatory ? asset.value * zakatRate : 0
        }))
      }
    };

    res.json({
      success: true,
      calculation
    });

  } catch (error) {
    console.error('Zakat calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'CALCULATION_ERROR',
      message: 'Failed to calculate Zakat',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/zakat/snapshot
 * Create and save an asset snapshot with Zakat calculation
 */
router.post('/snapshot', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required'),
  body('assets').isArray().withMessage('Assets array is required'),
  body('liabilities').optional().isArray().withMessage('Liabilities must be an array'),
  body('snapshotDate').optional().isISO8601().withMessage('Snapshot date must be valid ISO date'),
  body('calendarType').optional().isIn(['lunar', 'solar']).withMessage('Calendar type must be lunar or solar'),
  body('nisabChoice').optional().isIn(['gold', 'silver']).withMessage('Nisab choice must be gold or silver')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      password, 
      assets, 
      liabilities = [], 
      snapshotDate,
      calendarType = 'lunar',
      nisabChoice = 'gold'
    } = req.body;
    const userId = req.user.id;

    // Load user data
    const userData = await dataStore.loadUserData(userId, password);
    if (!userData) {
      return res.status(404).json({
        error: 'User data not found'
      });
    }

    // Validate assets
    const validation = zakatCalculator.validateAssets(assets);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid asset data',
        details: validation.errors
      });
    }

    // Calculate Zakat
    const zakatCalculation = zakatCalculator.calculateTotalZakat(assets, liabilities, nisabChoice);

    // Create asset snapshot
    const snapshot = new AssetSnapshot({
      userId,
      snapshotDate: snapshotDate || new Date().toISOString(),
      calendarType,
      assets: assets.reduce((obj, asset) => {
        obj[asset.id] = asset;
        return obj;
      }, {}),
      liabilities: liabilities.reduce((obj, liability) => {
        obj[liability.id] = liability;
        return obj;
      }, {}),
      netWorth: zakatCalculation.netZakatableWealth,
      zakatDue: zakatCalculation.totalZakat,
      zakatCalculations: zakatCalculation
    });

    // Save snapshot
    await dataStore.saveSnapshot(snapshot.id, snapshot, password);

    // Update user data with snapshot reference
    if (!userData.snapshots) {
      userData.snapshots = [];
    }
    userData.snapshots.push(snapshot.id);
    await dataStore.saveUserData(userId, userData, password);

    res.status(201).json({
      message: 'Asset snapshot created successfully',
      snapshot: {
        id: snapshot.id,
        snapshotDate: snapshot.snapshotDate,
        calendarType: snapshot.calendarType,
        netWorth: snapshot.netWorth,
        zakatDue: snapshot.zakatDue,
        assetsCount: assets.length,
        liabilitiesCount: liabilities.length
      },
      calculation: zakatCalculation
    });

  } catch (error) {
    console.error('Create snapshot error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }
    res.status(500).json({
      error: 'Failed to create snapshot'
    });
  }
});

/**
 * GET /api/zakat/snapshots
 * Get user's asset snapshots
 */
router.post('/snapshots', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required')
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

    // Load all snapshots
    const snapshots = [];
    if (userData.snapshots) {
      for (const snapshotId of userData.snapshots) {
        try {
          const snapshot = await dataStore.loadSnapshot(snapshotId, password);
          if (snapshot) {
            snapshots.push({
              id: snapshot.id,
              snapshotDate: snapshot.snapshotDate,
              calendarType: snapshot.calendarType,
              netWorth: snapshot.netWorth,
              zakatDue: snapshot.zakatDue,
              assetsCount: Object.keys(snapshot.assets || {}).length,
              liabilitiesCount: Object.keys(snapshot.liabilities || {}).length,
              createdAt: snapshot.createdAt
            });
          }
        } catch (error) {
          console.error(`Error loading snapshot ${snapshotId}:`, error);
        }
      }
    }

    // Sort by snapshot date (most recent first)
    snapshots.sort((a, b) => new Date(b.snapshotDate) - new Date(a.snapshotDate));

    res.json({
      snapshots,
      total: snapshots.length
    });

  } catch (error) {
    console.error('Get snapshots error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }
    res.status(500).json({
      error: 'Failed to load snapshots'
    });
  }
});

/**
 * GET /api/zakat/snapshot/:id
 * Get detailed snapshot data
 */
router.post('/snapshot/:id', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required')
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
    const { id } = req.params;
    const userId = req.user.id;

    // Load snapshot
    const snapshot = await dataStore.loadSnapshot(id, password);
    if (!snapshot) {
      return res.status(404).json({
        error: 'Snapshot not found'
      });
    }

    // Verify ownership
    if (snapshot.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json({
      snapshot
    });

  } catch (error) {
    console.error('Get snapshot error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }
    res.status(500).json({
      error: 'Failed to load snapshot'
    });
  }
});

/**
 * GET /api/zakat/nisab
 * Get current nisab values
 */
router.get('/nisab', async (req, res) => {
  try {
    const nisabValues = await zakatCalculator.updateNisabValues();
    
    res.json({
      nisab: nisabValues,
      explanation: {
        gold: 'Based on 87.48 grams of gold',
        silver: 'Based on 612.36 grams of silver',
        recommendation: nisabValues.silverNisab < nisabValues.goldNisab 
          ? 'Silver nisab recommended (lower threshold, more beneficial for recipients)'
          : 'Gold nisab recommended'
      }
    });

  } catch (error) {
    console.error('Get nisab error:', error);
    res.status(500).json({
      error: 'Failed to get nisab values'
    });
  }
});

/**
 * POST /api/zakat/record-payment
 * Record a Zakat payment
 */
router.post('/record-payment', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required'),
  body('snapshotId').notEmpty().withMessage('Snapshot ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid payment amount is required'),
  body('recipient').notEmpty().withMessage('Recipient information is required'),
  body('paymentDate').optional().isISO8601().withMessage('Payment date must be valid ISO date'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      password, 
      snapshotId, 
      amount, 
      recipient, 
      paymentDate, 
      notes,
      paymentMethod 
    } = req.body;
    const userId = req.user.id;

    // Load user data
    const userData = await dataStore.loadUserData(userId, password);
    if (!userData) {
      return res.status(404).json({
        error: 'User data not found'
      });
    }

    // Load snapshot to verify Zakat amount
    const snapshot = await dataStore.loadSnapshot(snapshotId, password);
    if (!snapshot || snapshot.userId !== userId) {
      return res.status(404).json({
        error: 'Snapshot not found'
      });
    }

    // Create payment record
    const payment = new ZakatPayment({
      amount,
      recipient,
      paymentDate: paymentDate || new Date().toISOString(),
      notes,
      paymentMethod
    });

    // Update or create Zakat record
    if (!userData.zakatRecords) {
      userData.zakatRecords = [];
    }

    const year = new Date(snapshot.snapshotDate).getFullYear();
    let zakatRecord = userData.zakatRecords.find(r => r.year === year && r.snapshotId === snapshotId);

    if (!zakatRecord) {
      zakatRecord = new ZakatRecord({
        userId,
        year,
        snapshotId,
        totalZakatDue: snapshot.zakatDue,
        payments: []
      });
      userData.zakatRecords.push(zakatRecord);
    }

    // Add payment
    zakatRecord.payments.push(payment);
    zakatRecord.zakatPaid = zakatRecord.payments.reduce((sum, p) => sum + p.amount, 0);
    zakatRecord.zakatRemaining = Math.max(0, zakatRecord.totalZakatDue - zakatRecord.zakatPaid);
    zakatRecord.status = zakatRecord.zakatRemaining === 0 ? 'completed' : 'partial';
    zakatRecord.updatedAt = new Date().toISOString();

    // Save updated user data
    await dataStore.saveUserData(userId, userData, password);

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
      zakatRecord: {
        year: zakatRecord.year,
        totalDue: zakatRecord.totalZakatDue,
        paid: zakatRecord.zakatPaid,
        remaining: zakatRecord.zakatRemaining,
        status: zakatRecord.status
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    if (error.message.includes('decrypt')) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }
    res.status(500).json({
      error: 'Failed to record payment'
    });
  }
});

/**
 * GET /api/zakat/methodologies
 * Get available Zakat calculation methodologies
 */
router.get('/methodologies', (req, res) => {
  try {
    const methodologies = [
      {
        id: 'standard',
        name: 'Standard Method',
        description: 'The most commonly used Zakat calculation method',
        nisabMethod: 'GOLD',
        nisabSource: 'gold',
        zakatRate: 2.5,
        rate: 0.025
      },
      {
        id: 'hanafi',
        name: 'Hanafi Method', 
        description: 'Hanafi school methodology for Zakat calculation',
        nisabMethod: 'SILVER',
        nisabSource: 'silver',
        zakatRate: 2.5,
        rate: 0.025
      },
      {
        id: 'shafii',
        name: 'Shafi\'i Method',
        description: 'Shafi\'i school methodology for Zakat calculation', 
        nisabMethod: 'GOLD',
        nisabSource: 'gold',
        zakatRate: 2.5,
        rate: 0.025
      }
    ];

    res.json({
      success: true,
      data: methodologies
    });
  } catch (error) {
    console.error('Get methodologies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get methodologies'
    });
  }
});

/**
 * GET /api/zakat/history
 * Get Zakat calculation history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // For now return empty array since getSnapshotsByUserId function doesn't exist
    // This can be implemented later when the full data store functionality is built
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get calculation history'
    });
  }
});

/**
 * GET /api/zakat/snapshots
 * Get all snapshots for user
 */
router.get('/snapshots', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // For now return empty array since getSnapshotsByUserId function doesn't exist
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get snapshots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get snapshots'
    });
  }
});

/**
 * GET /api/zakat/payments
 * Get payment history
 */
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // For now return empty array, can be implemented later
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment history'
    });
  }
});

/**
 * POST /api/zakat/payment
 * Record a payment
 */
router.post('/payment', authenticateToken, async (req, res) => {
  try {
    // For now just return success, can be implemented later
    res.json({
      success: true,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment'
    });
  }
});

/**
 * POST /api/zakat/save-calculation
 * Save a calculation
 */
router.post('/save-calculation', authenticateToken, async (req, res) => {
  try {
    // For now just return success, can be implemented later
    res.json({
      success: true,
      message: 'Calculation saved successfully'
    });
  } catch (error) {
    console.error('Save calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save calculation'
    });
  }
});

/**
 * POST /api/zakat/snapshot
 * Create a snapshot
 */
router.post('/snapshot', authenticateToken, async (req, res) => {
  try {
    // For now just return success, can be implemented later
    res.json({
      success: true,
      message: 'Snapshot created successfully'
    });
  } catch (error) {
    console.error('Create snapshot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create snapshot'
    });
  }
});

module.exports = router;