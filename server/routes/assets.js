/**
 * Asset management routes
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { Asset, Liability } = require('../models');
const dataStore = require('../utils/dataStore');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/assets/questionnaire
 * Asset discovery questionnaire to help users identify their assets
 */
router.get('/questionnaire', async (req, res) => {
  try {
    const questionnaire = {
      title: 'Asset Discovery Questionnaire',
      description: 'This questionnaire will help you identify all your Zakat-eligible assets.',
      sections: [
        {
          id: 'cash_and_savings',
          title: 'Cash and Savings',
          description: 'Money in bank accounts, cash at home, and savings',
          questions: [
            {
              id: 'checking_accounts',
              type: 'currency',
              question: 'How much money do you have in checking accounts?',
              assetType: 'checking',
              required: true
            },
            {
              id: 'savings_accounts',
              type: 'currency',
              question: 'How much money do you have in savings accounts?',
              assetType: 'savings',
              required: true
            },
            {
              id: 'cash_home',
              type: 'currency',
              question: 'How much cash do you keep at home?',
              assetType: 'cash',
              required: true
            },
            {
              id: 'foreign_currency',
              type: 'currency',
              question: 'Do you have money in foreign currencies?',
              assetType: 'foreign_currency',
              required: false
            }
          ]
        },
        {
          id: 'investments',
          title: 'Investments',
          description: 'Stocks, bonds, mutual funds, and other investments',
          questions: [
            {
              id: 'stocks',
              type: 'currency',
              question: 'What is the current value of your stocks?',
              assetType: 'stocks',
              required: false
            },
            {
              id: 'bonds',
              type: 'currency', 
              question: 'What is the current value of your bonds?',
              assetType: 'bonds',
              required: false
            },
            {
              id: 'mutual_funds',
              type: 'currency',
              question: 'What is the current value of your mutual funds?',
              assetType: 'mutual_funds',
              required: false
            },
            {
              id: 'retirement_accounts',
              type: 'currency',
              question: 'What is the current value of your retirement accounts (401k, IRA, etc.)?',
              assetType: 'retirement',
              required: false,
              note: 'Some scholars differ on whether retirement accounts are subject to Zakat'
            }
          ]
        },
        {
          id: 'precious_metals',
          title: 'Precious Metals',
          description: 'Gold and silver jewelry, coins, and bars',
          questions: [
            {
              id: 'gold_jewelry',
              type: 'weight_or_currency',
              question: 'How much gold jewelry do you own?',
              assetType: 'gold',
              units: 'grams',
              required: false
            },
            {
              id: 'gold_coins_bars',
              type: 'weight_or_currency',
              question: 'How much gold in coins or bars do you own?',
              assetType: 'gold',
              units: 'grams',
              required: false
            },
            {
              id: 'silver_jewelry',
              type: 'weight_or_currency',
              question: 'How much silver jewelry do you own?',
              assetType: 'silver',
              units: 'grams',
              required: false
            },
            {
              id: 'silver_coins_bars',
              type: 'weight_or_currency',
              question: 'How much silver in coins or bars do you own?',
              assetType: 'silver',
              units: 'grams',
              required: false
            }
          ]
        },
        {
          id: 'business_assets',
          title: 'Business Assets',
          description: 'Business inventory, equipment, and receivables',
          questions: [
            {
              id: 'business_inventory',
              type: 'currency',
              question: 'What is the value of your business inventory?',
              assetType: 'business_inventory',
              required: false
            },
            {
              id: 'business_receivables',
              type: 'currency',
              question: 'How much money is owed to your business (accounts receivable)?',
              assetType: 'business_receivables',
              required: false
            },
            {
              id: 'business_cash',
              type: 'currency',
              question: 'How much cash does your business have?',
              assetType: 'business_cash',
              required: false
            }
          ]
        },
        {
          id: 'other_assets',
          title: 'Other Assets',
          description: 'Other potentially Zakat-eligible assets',
          questions: [
            {
              id: 'loans_given',
              type: 'currency',
              question: 'How much money have you lent to others (that you expect to get back)?',
              assetType: 'loans_given',
              required: false
            },
            {
              id: 'cryptocurrencies',
              type: 'currency',
              question: 'What is the current value of your cryptocurrencies?',
              assetType: 'cryptocurrency',
              required: false,
              note: 'Scholars have different opinions on cryptocurrency Zakat'
            }
          ]
        },
        {
          id: 'liabilities',
          title: 'Debts and Liabilities',
          description: 'Money you owe to others',
          questions: [
            {
              id: 'credit_card_debt',
              type: 'currency',
              question: 'How much credit card debt do you have?',
              assetType: 'debt',
              liability: true,
              required: false
            },
            {
              id: 'personal_loans',
              type: 'currency',
              question: 'How much do you owe in personal loans?',
              assetType: 'debt',
              liability: true,
              required: false
            },
            {
              id: 'mortgage',
              type: 'currency',
              question: 'How much do you owe on your mortgage?',
              assetType: 'mortgage',
              liability: true,
              required: false,
              note: 'Some scholars differ on whether mortgage debt is deductible from Zakat'
            },
            {
              id: 'other_debts',
              type: 'currency',
              question: 'Do you have any other debts?',
              assetType: 'debt',
              liability: true,
              required: false
            }
          ]
        }
      ],
      guidance: {
        general: 'Only include assets that you have owned for a full lunar year or that you intend to keep for investment/savings purposes.',
        valuation: 'Use current market values for all assets. For jewelry, use the gold/silver content value, not retail price.',
        debts: 'Only include debts that are due within the year and that you plan to pay from your Zakat-eligible assets.'
      }
    };

    res.json(questionnaire);

  } catch (error) {
    console.error('Get questionnaire error:', error);
    res.status(500).json({
      error: 'Failed to load questionnaire'
    });
  }
});

/**
 * POST /api/assets/process-questionnaire
 * Process questionnaire responses and create asset/liability objects
 */
router.post('/process-questionnaire', [
  body('responses').isObject().withMessage('Questionnaire responses are required'),
  body('currency').optional().isString().withMessage('Currency must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { responses, currency = 'USD' } = req.body;

    const assets = [];
    const liabilities = [];

    // Process responses and create asset/liability objects
    for (const [questionId, response] of Object.entries(responses)) {
      if (!response || (typeof response === 'number' && response <= 0)) {
        continue;
      }

      // Map question IDs to asset creation
      const assetMapping = {
        checking_accounts: { type: 'checking', name: 'Checking Account' },
        savings_accounts: { type: 'savings', name: 'Savings Account' },
        cash_home: { type: 'cash', name: 'Cash at Home' },
        foreign_currency: { type: 'cash', name: 'Foreign Currency' },
        stocks: { type: 'stocks', name: 'Stock Investments' },
        bonds: { type: 'bonds', name: 'Bond Investments' },
        mutual_funds: { type: 'investment', name: 'Mutual Funds' },
        retirement_accounts: { type: 'retirement', name: 'Retirement Accounts', zakatEligible: false },
        gold_jewelry: { type: 'gold', name: 'Gold Jewelry', category: 'jewelry' },
        gold_coins_bars: { type: 'gold', name: 'Gold Coins/Bars', category: 'investment' },
        silver_jewelry: { type: 'silver', name: 'Silver Jewelry', category: 'jewelry' },
        silver_coins_bars: { type: 'silver', name: 'Silver Coins/Bars', category: 'investment' },
        business_inventory: { type: 'business', name: 'Business Inventory' },
        business_receivables: { type: 'business', name: 'Accounts Receivable' },
        business_cash: { type: 'business', name: 'Business Cash' },
        loans_given: { type: 'loans_receivable', name: 'Loans Given to Others' },
        cryptocurrencies: { type: 'cryptocurrency', name: 'Cryptocurrencies' },
      };

      const liabilityMapping = {
        credit_card_debt: { type: 'debt', name: 'Credit Card Debt' },
        personal_loans: { type: 'debt', name: 'Personal Loans' },
        mortgage: { type: 'mortgage', name: 'Mortgage Debt', deductibleFromZakat: false },
        other_debts: { type: 'debt', name: 'Other Debts' }
      };

      if (assetMapping[questionId]) {
        const config = assetMapping[questionId];
        const asset = new Asset({
          type: config.type,
          category: config.category,
          name: config.name,
          value: typeof response === 'object' ? response.value : response,
          currency,
          zakatEligible: config.zakatEligible !== undefined ? config.zakatEligible : true,
          metadata: typeof response === 'object' ? response.metadata : {}
        });
        assets.push(asset);
      } else if (liabilityMapping[questionId]) {
        const config = liabilityMapping[questionId];
        const liability = new Liability({
          type: config.type,
          name: config.name,
          amount: typeof response === 'object' ? response.value : response,
          currency,
          deductibleFromZakat: config.deductibleFromZakat !== undefined ? config.deductibleFromZakat : true
        });
        liabilities.push(liability);
      }
    }

    res.json({
      message: 'Questionnaire processed successfully',
      assets,
      liabilities,
      summary: {
        totalAssets: assets.length,
        totalLiabilities: liabilities.length,
        zakatEligibleAssets: assets.filter(a => a.zakatEligible).length,
        deductibleLiabilities: liabilities.filter(l => l.deductibleFromZakat).length
      }
    });

  } catch (error) {
    console.error('Process questionnaire error:', error);
    res.status(500).json({
      error: 'Failed to process questionnaire'
    });
  }
});

/**
 * GET /api/assets/templates
 * Get asset templates for manual entry
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = {
      cash: {
        type: 'cash',
        name: 'Cash',
        description: 'Physical cash, checking accounts, savings accounts',
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Account/Cash Name' },
          { name: 'value', type: 'currency', required: true, label: 'Current Value' },
          { name: 'description', type: 'text', required: false, label: 'Description' }
        ],
        zakatEligible: true
      },
      investment: {
        type: 'investment',
        name: 'Investment',
        description: 'Stocks, bonds, mutual funds, ETFs',
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Investment Name' },
          { name: 'value', type: 'currency', required: true, label: 'Current Market Value' },
          { name: 'category', type: 'select', required: true, label: 'Investment Type',
            options: ['stocks', 'bonds', 'mutual_funds', 'etf', 'other'] },
          { name: 'description', type: 'text', required: false, label: 'Description' }
        ],
        zakatEligible: true
      },
      gold: {
        type: 'gold',
        name: 'Gold',
        description: 'Gold jewelry, coins, bars',
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Gold Item Name' },
          { name: 'value', type: 'currency', required: true, label: 'Current Value' },
          { name: 'weight', type: 'number', required: false, label: 'Weight (grams)' },
          { name: 'purity', type: 'select', required: false, label: 'Purity',
            options: ['24k', '22k', '18k', '14k', '10k', 'other'] },
          { name: 'category', type: 'select', required: true, label: 'Category',
            options: ['jewelry', 'coins', 'bars', 'other'] }
        ],
        zakatEligible: true
      },
      silver: {
        type: 'silver',
        name: 'Silver',
        description: 'Silver jewelry, coins, bars',
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Silver Item Name' },
          { name: 'value', type: 'currency', required: true, label: 'Current Value' },
          { name: 'weight', type: 'number', required: false, label: 'Weight (grams)' },
          { name: 'purity', type: 'select', required: false, label: 'Purity',
            options: ['999', '925', '900', 'other'] },
          { name: 'category', type: 'select', required: true, label: 'Category',
            options: ['jewelry', 'coins', 'bars', 'other'] }
        ],
        zakatEligible: true
      },
      business: {
        type: 'business',
        name: 'Business Asset',
        description: 'Business inventory, receivables, cash',
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Asset Name' },
          { name: 'value', type: 'currency', required: true, label: 'Current Value' },
          { name: 'category', type: 'select', required: true, label: 'Business Asset Type',
            options: ['inventory', 'receivables', 'cash', 'equipment', 'other'] },
          { name: 'description', type: 'text', required: false, label: 'Description' }
        ],
        zakatEligible: true
      },
      property: {
        type: 'property',
        name: 'Property',
        description: 'Real estate investments (not primary residence)',
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Property Name/Address' },
          { name: 'value', type: 'currency', required: true, label: 'Current Market Value' },
          { name: 'category', type: 'select', required: true, label: 'Property Type',
            options: ['rental', 'commercial', 'land', 'other'] },
          { name: 'description', type: 'text', required: false, label: 'Description' }
        ],
        zakatEligible: false, // Property value itself is not typically subject to Zakat
        note: 'Property values are typically not subject to Zakat, but rental income is'
      }
    };

    res.json({
      templates,
      guidance: {
        valuation: 'Always use current market values for asset valuation',
        ownership: 'Only include assets you have owned for a full lunar year',
        consultation: 'When in doubt, consult with a knowledgeable Islamic scholar'
      }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      error: 'Failed to load asset templates'
    });
  }
});

/**
 * POST /api/assets/validate
 * Validate asset data before calculation
 */
router.post('/validate', [
  body('assets').isArray().withMessage('Assets array is required'),
  body('liabilities').optional().isArray().withMessage('Liabilities must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { assets, liabilities = [] } = req.body;

    // Validate assets
    const assetValidation = [];
    const liabilityValidation = [];
    
    for (const asset of assets) {
      const validation = {
        id: asset.id,
        name: asset.name,
        valid: true,
        errors: [],
        warnings: []
      };

      // Required field validation
      if (!asset.name) validation.errors.push('Asset name is required');
      if (!asset.type) validation.errors.push('Asset type is required');
      if (typeof asset.value !== 'number' || asset.value < 0) {
        validation.errors.push('Valid asset value is required');
      }

      // Type-specific validation
      if (asset.type === 'gold' || asset.type === 'silver') {
        if (asset.metadata?.weight && asset.metadata.weight <= 0) {
          validation.warnings.push('Weight should be greater than 0');
        }
      }

      // Zakat eligibility warnings
      if (asset.type === 'property') {
        validation.warnings.push('Property value is typically not subject to Zakat');
      }
      if (asset.type === 'retirement') {
        validation.warnings.push('Scholars differ on retirement account Zakat obligations');
      }

      if (validation.errors.length > 0) {
        validation.valid = false;
      }

      assetValidation.push(validation);
    }

    // Validate liabilities
    for (const liability of liabilities) {
      const validation = {
        id: liability.id,
        name: liability.name,
        valid: true,
        errors: [],
        warnings: []
      };

      if (!liability.name) validation.errors.push('Liability name is required');
      if (!liability.type) validation.errors.push('Liability type is required');
      if (typeof liability.amount !== 'number' || liability.amount < 0) {
        validation.errors.push('Valid liability amount is required');
      }

      // Type-specific warnings
      if (liability.type === 'mortgage') {
        validation.warnings.push('Scholars differ on mortgage debt deductibility');
      }

      if (validation.errors.length > 0) {
        validation.valid = false;
      }

      liabilityValidation.push(validation);
    }

    const overallValid = assetValidation.every(v => v.valid) && liabilityValidation.every(v => v.valid);

    res.json({
      valid: overallValid,
      assets: assetValidation,
      liabilities: liabilityValidation,
      summary: {
        totalAssets: assets.length,
        validAssets: assetValidation.filter(v => v.valid).length,
        totalLiabilities: liabilities.length,
        validLiabilities: liabilityValidation.filter(v => v.valid).length,
        totalErrors: [...assetValidation, ...liabilityValidation].reduce((sum, v) => sum + v.errors.length, 0),
        totalWarnings: [...assetValidation, ...liabilityValidation].reduce((sum, v) => sum + v.warnings.length, 0)
      }
    });

  } catch (error) {
    console.error('Validate assets error:', error);
    res.status(500).json({
      error: 'Failed to validate assets'
    });
  }
});

module.exports = router;