// Constants for the zakapp application

// Zakat calculation constants
export const ZAKAT_RATES = {
  STANDARD_RATE: 2.5, // 2.5% for most assets
  AGRICULTURAL_RAIN_FED: 10, // 10% for rain-fed crops
  AGRICULTURAL_IRRIGATED: 5, // 5% for irrigated crops
} as const;

// Nisab thresholds (in grams)
export const NISAB_THRESHOLDS = {
  GOLD_GRAMS: 87.48, // ~3 ounces of gold
  SILVER_GRAMS: 612.36, // ~21 ounces of silver
} as const;

// Supported currencies
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
] as const;

// Asset categories with their details
export const ASSET_CATEGORIES = {
  CASH: {
    id: 'cash',
    name: 'Cash & Bank Accounts',
    description: 'Liquid cash, savings, and checking accounts',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    defaultZakatEligible: true,
    nisabApplicable: true,
    subCategories: [
      {
        id: 'savings',
        name: 'Savings Account',
        description: 'Money in savings accounts',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['interestRate'],
      },
      {
        id: 'checking',
        name: 'Checking Account',
        description: 'Money in checking accounts',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: [],
      },
      {
        id: 'cash_on_hand',
        name: 'Cash on Hand',
        description: 'Physical cash in possession',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: [],
      },
      {
        id: 'certificates_of_deposit',
        name: 'Certificates of Deposit',
        description: 'Time deposits with fixed terms',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['interestRate', 'maturityDate'],
      },
      {
        id: 'money_market',
        name: 'Money Market Accounts',
        description: 'High-yield savings with limited transactions',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['interestRate'],
      },
    ],
  },
  GOLD: {
    id: 'gold',
    name: 'Gold',
    description: 'Gold jewelry, coins, and bars',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    defaultZakatEligible: true,
    nisabApplicable: true,
    subCategories: [
      {
        id: 'jewelry',
        name: 'Gold Jewelry',
        description: 'Gold jewelry for personal use or investment',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
      {
        id: 'coins',
        name: 'Gold Coins',
        description: 'Gold coins for investment',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
      {
        id: 'bars',
        name: 'Gold Bars',
        description: 'Gold bars and bullion',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
      {
        id: 'ornaments',
        name: 'Gold Ornaments',
        description: 'Decorative gold items',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
    ],
  },
  SILVER: {
    id: 'silver',
    name: 'Silver',
    description: 'Silver jewelry, coins, and bars',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    defaultZakatEligible: true,
    nisabApplicable: true,
    subCategories: [
      {
        id: 'jewelry',
        name: 'Silver Jewelry',
        description: 'Silver jewelry for personal use or investment',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
      {
        id: 'coins',
        name: 'Silver Coins',
        description: 'Silver coins for investment',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
      {
        id: 'bars',
        name: 'Silver Bars',
        description: 'Silver bars and bullion',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
      {
        id: 'ornaments',
        name: 'Silver Ornaments',
        description: 'Decorative silver items',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
      {
        id: 'utensils',
        name: 'Silver Utensils',
        description: 'Silver utensils and household items',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['weight', 'purity'],
      },
    ],
  },
  BUSINESS: {
    id: 'business',
    name: 'Business Assets',
    description: 'Business inventory, trade goods, and commercial assets',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    defaultZakatEligible: true,
    nisabApplicable: true,
    subCategories: [
      {
        id: 'inventory',
        name: 'Business Inventory',
        description: 'Goods held for sale in ordinary course of business',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['businessType', 'holdingPeriod'],
      },
      {
        id: 'trade_goods',
        name: 'Trade Goods',
        description: 'Goods acquired for trading purposes',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['businessType', 'holdingPeriod'],
      },
      {
        id: 'raw_materials',
        name: 'Raw Materials',
        description: 'Materials to be used in production',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['businessType'],
      },
      {
        id: 'finished_goods',
        name: 'Finished Goods',
        description: 'Completed products ready for sale',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['businessType'],
      },
      {
        id: 'work_in_progress',
        name: 'Work in Progress',
        description: 'Partially completed goods',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['businessType'],
      },
    ],
  },
  PROPERTY: {
    id: 'property',
    name: 'Investment Property',
    description: 'Real estate held for investment purposes',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    defaultZakatEligible: true,
    nisabApplicable: true,
    subCategories: [
      {
        id: 'residential_investment',
        name: 'Residential Investment',
        description:
          'Residential properties held for rental income or appreciation',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['propertyType', 'location', 'rentalIncome'],
      },
      {
        id: 'commercial',
        name: 'Commercial Property',
        description: 'Office buildings, retail spaces, warehouses',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['propertyType', 'location', 'rentalIncome'],
      },
      {
        id: 'land',
        name: 'Land',
        description: 'Undeveloped land held for investment',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['location'],
      },
      {
        id: 'agricultural',
        name: 'Agricultural Property',
        description: 'Farm land and agricultural properties',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['propertyType', 'location'],
      },
      {
        id: 'industrial',
        name: 'Industrial Property',
        description: 'Manufacturing facilities and industrial properties',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['propertyType', 'location', 'rentalIncome'],
      },
    ],
  },
  STOCKS: {
    id: 'stocks',
    name: 'Stocks & Securities',
    description: 'Shares, bonds, and other securities',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    defaultZakatEligible: true,
    nisabApplicable: true,
    subCategories: [
      {
        id: 'individual_stocks',
        name: 'Individual Stocks',
        description: 'Shares in individual companies',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['ticker', 'shares', 'dividendYield'],
      },
      {
        id: 'mutual_funds',
        name: 'Mutual Funds',
        description: 'Professionally managed investment funds',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['ticker', 'shares', 'dividendYield'],
      },
      {
        id: 'etfs',
        name: 'Exchange-Traded Funds',
        description: 'Funds that trade like stocks',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['ticker', 'shares', 'dividendYield'],
      },
      {
        id: 'bonds',
        name: 'Bonds',
        description: 'Government and corporate bonds',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['ticker', 'shares', 'dividendYield'],
      },
      {
        id: 'index_funds',
        name: 'Index Funds',
        description: 'Funds that track market indices',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['ticker', 'shares', 'dividendYield'],
      },
      {
        id: 'retirement_401k',
        name: '401(k) Retirement Account',
        description: 'Employer-sponsored retirement savings plan',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['employerMatch', 'vestingSchedule'],
      },
      {
        id: 'retirement_ira',
        name: 'IRA (Individual Retirement Account)',
        description: 'Individual retirement account (traditional or Roth)',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['iraType', 'contributionLimit'],
      },
      {
        id: 'retirement_other',
        name: 'Other Retirement Accounts',
        description: 'Other retirement investment accounts (403b, SEP-IRA, etc.)',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['accountType'],
      },
    ],
  },
  CRYPTO: {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Digital currencies and crypto assets',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    defaultZakatEligible: true,
    nisabApplicable: true,
    subCategories: [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        description: 'Bitcoin cryptocurrency',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['coinSymbol', 'quantity', 'stakingRewards'],
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        description: 'Ethereum cryptocurrency',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['coinSymbol', 'quantity', 'stakingRewards'],
      },
      {
        id: 'altcoins',
        name: 'Alternative Coins',
        description: 'Other cryptocurrencies besides Bitcoin',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['coinSymbol', 'quantity', 'stakingRewards'],
      },
      {
        id: 'stablecoins',
        name: 'Stablecoins',
        description: 'Cryptocurrencies pegged to stable assets',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['coinSymbol', 'quantity'],
      },
      {
        id: 'defi_tokens',
        name: 'DeFi Tokens',
        description: 'Decentralized Finance protocol tokens',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['coinSymbol', 'quantity', 'stakingRewards'],
      },
    ],
  },
  DEBTS: {
    id: 'debts',
    name: 'Debts & Receivables',
    description: 'Money owed to you by others',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    defaultZakatEligible: true,
    nisabApplicable: true,
    subCategories: [
      {
        id: 'accounts_receivable',
        name: 'Accounts Receivable',
        description: 'Money owed by customers for goods or services',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['debtor', 'dueDate'],
      },
      {
        id: 'personal_loans_given',
        name: 'Personal Loans Given',
        description: 'Money lent to individuals',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: [
          'debtor',
          'dueDate',
          'interestRate',
          'repaymentSchedule',
        ],
      },
      {
        id: 'business_loans_given',
        name: 'Business Loans Given',
        description: 'Money lent to businesses',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: [
          'debtor',
          'dueDate',
          'interestRate',
          'repaymentSchedule',
        ],
      },
      {
        id: 'promissory_notes',
        name: 'Promissory Notes',
        description: 'Written promises to pay specific amounts',
        zakatRate: ZAKAT_RATES.STANDARD_RATE,
        zakatEligible: true,
        specificFields: ['debtor', 'dueDate', 'interestRate'],
      },
    ],
  },
  EXPENSES: {
    id: 'expenses',
    name: 'Deductible Expenses',
    description: 'Expenses that can be deducted from zakat calculation',
    zakatRate: 0, // Expenses reduce zakat, they don't generate it
    zakatEligible: false,
    defaultZakatEligible: false,
    nisabApplicable: false,
    subCategories: [
      {
        id: 'debts_owed',
        name: 'Outstanding Debts',
        description: 'Debts you owe to others (credit cards, loans, mortgages)',
        zakatRate: 0,
        zakatEligible: false,
        specificFields: ['creditor', 'dueDate', 'interestRate'],
      },
      {
        id: 'essential_needs',
        name: 'Essential Living Expenses',
        description: 'Basic living expenses for the year (housing, food, clothing)',
        zakatRate: 0,
        zakatEligible: false,
        specificFields: ['expenseType', 'frequency'],
      },
      {
        id: 'family_obligations',
        name: 'Family Financial Obligations',
        description: 'Financial support for dependents and family members',
        zakatRate: 0,
        zakatEligible: false,
        specificFields: ['dependentCount', 'supportType'],
      },
      {
        id: 'business_liabilities',
        name: 'Business Liabilities',
        description: 'Business-related debts and obligations',
        zakatRate: 0,
        zakatEligible: false,
        specificFields: ['businessType', 'liabilityType'],
      },
    ],
  },
} as const;

/**
 * Zakat calculation methodologies with comprehensive methodology information.
 * 
 * This constant provides detailed information for four main zakat calculation approaches:
 * - Standard Method (AAOIFI-compliant): Modern international consensus approach
 * - Hanafi School Method: Silver-based nisab with comprehensive business inclusion
 * - Shafi'i School Method: Detailed categorization with dual nisab approach
 * - Custom Method: User-defined parameters for unique circumstances
 * 
 * Each methodology includes:
 * @property {string} id - Unique identifier for the methodology
 * @property {string} name - Human-readable name of the methodology
 * @property {string} description - Brief description of the methodology's approach
 * @property {string} nisabBasis - Nisab calculation approach (silver/dual_minimum/configurable)
 * @property {string} businessAssetTreatment - How business assets are handled (market_value/comprehensive/categorized/configurable)
 * @property {string} debtDeduction - Debt deduction approach (immediate/comprehensive/conservative/configurable)
 * @property {string[]} scholarlyBasis - Scholarly sources and jurisprudential foundations
 * @property {string[]} regions - Geographic regions where the methodology is commonly used
 * @property {number} zakatRate - Standard zakat rate percentage (typically 2.5)
 * @property {('lunar'|'solar')[]} calendarSupport - Supported calendar systems
 * @property {boolean} [customRules] - Whether the method supports custom rule configuration
 * @property {string[]} suitableFor - Target user groups and use cases
 * @property {string[]} pros - Advantages and benefits of using this methodology
 * @property {string[]} cons - Limitations and considerations
 * @property {string} explanation - Comprehensive explanation of the methodology's principles and application
 * 
 * This structure supports educational content display, methodology comparison,
 * regional recommendations, and informed user decision-making for zakat calculations.
 * 
 * @see {@link MethodologyInfo} for the TypeScript interface definition
 * @see {@link METHODOLOGY_EDUCATION} for additional educational content
 * @see {@link REGIONAL_METHODOLOGY_MAP} for regional recommendations
 */
export const ZAKAT_METHODS = {
  STANDARD: {
    id: 'standard',
    name: 'Standard Method (AAOIFI)',
    description: 'Internationally recognized dual nisab method',
    nisabBasis: 'dual_minimum',
    businessAssetTreatment: 'market_value',
    debtDeduction: 'immediate',
    scholarlyBasis: ['AAOIFI FAS 9', 'Contemporary consensus'],
    regions: ['International', 'Gulf States', 'Western countries'],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'],
    customRules: false,
    suitableFor: [
      'Muslims in diverse global locations',
      'Those seeking internationally recognized standards',
      'Users preferring simplified calculations',
      'Multi-national Islamic finance institutions'
    ],
    pros: [
      'Modern consensus approach',
      'Internationally recognized standards',
      'Simplified calculation process',
      'Good for diverse geographic regions',
      'Supported by contemporary Islamic finance institutions',
      'Flexible nisab calculation based on market conditions'
    ],
    cons: [
      'May not align with specific regional traditions',
      'Simplified approach may not capture all nuances',
      'Requires trust in contemporary scholarly consensus',
      'Less historical precedent than traditional schools'
    ],
    explanation: 'The Standard method represents a modern consensus approach developed for contemporary global Muslim communities. It incorporates guidelines from Islamic finance institutions like AAOIFI and uses a dual minimum nisab approach, selecting the lower threshold between gold and silver to ensure accessibility while maintaining religious compliance.'
  },
  HANAFI: {
    id: 'hanafi',
    name: 'Hanafi School Method',
    description: 'Silver-based nisab with comprehensive business inclusion',
    nisabBasis: 'silver',
    businessAssetTreatment: 'comprehensive',
    debtDeduction: 'comprehensive',
    scholarlyBasis: ['Al-Hidayah', 'Classical Hanafi texts'],
    regions: ['Turkey', 'Central Asia', 'Indian subcontinent'],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'],
    customRules: false,
    suitableFor: [
      'Muslims following Hanafi jurisprudence',
      'Residents of Turkey, Central Asia, and South Asia',
      'Business owners with diverse asset portfolios',
      'Those preferring comprehensive wealth assessment'
    ],
    pros: [
      'Lower nisab threshold ensures broader zakat eligibility',
      'Comprehensive business asset inclusion',
      'Flexible debt deduction approach',
      'Well-established scholarly precedent',
      'Thorough wealth assessment methodology',
      'Accommodates complex business structures'
    ],
    cons: [
      'May result in higher zakat amounts for some individuals',
      'Requires detailed business asset evaluation',
      'Complex debt assessment needed',
      'More time-intensive calculation process'
    ],
    explanation: 'The Hanafi method, based on the jurisprudence of Imam Abu Hanifa (699-767 CE), uses exclusively silver-based nisab thresholds and emphasizes comprehensive inclusion of business assets. This approach ensures broader zakat eligibility and thorough wealth assessment, making it particularly suitable for business owners and those with diverse asset portfolios.'
  },
  SHAFII: {
    id: 'shafii',
    name: 'Shafi\'i School Method',
    description: 'Detailed categorization with dual nisab',
    nisabBasis: 'dual_minimum',
    businessAssetTreatment: 'categorized',
    debtDeduction: 'conservative',
    scholarlyBasis: ['Al-Majmu\'', 'Shafi\'i jurisprudence'],
    regions: ['Southeast Asia', 'East Africa', 'Parts of Middle East'],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'],
    customRules: false,
    suitableFor: [
      'Muslims following Shafi\'i jurisprudence',
      'Residents of Southeast Asia and East Africa',
      'Those preferring detailed asset categorization',
      'Users seeking methodical and systematic approach'
    ],
    pros: [
      'Balanced nisab calculation approach',
      'Detailed and precise asset categorization',
      'Conservative debt treatment provides certainty',
      'Strong methodological framework',
      'Well-suited for diverse asset types',
      'Systematic approach reduces calculation errors'
    ],
    cons: [
      'More complex asset categorization required',
      'Conservative debt approach may limit deductions',
      'Requires good understanding of different asset types',
      'May be less accessible for simple portfolios'
    ],
    explanation: 'The Shafi\'i method, founded by Imam al-Shafi\'i (767-820 CE), emphasizes systematic methodology and detailed asset categorization. It uses a dual minimum nisab approach while requiring precise classification of business assets and conservative debt treatment, making it ideal for those seeking methodical and thorough zakat calculations.'
  },
  CUSTOM: {
    id: 'custom',
    name: 'Custom Method',
    description: 'User-defined calculation parameters',
    nisabBasis: 'configurable',
    businessAssetTreatment: 'configurable',
    debtDeduction: 'configurable',
    scholarlyBasis: ['User consultation recommended'],
    regions: ['User-specific'],
    zakatRate: 2.5,
    calendarSupport: ['lunar', 'solar'],
    customRules: true,
    suitableFor: [
      'Muslims with unique circumstances requiring specialized calculations',
      'Those following specific regional practices not covered by standard methods',
      'Users with access to qualified Islamic scholars for consultation',
      'Communities with established local zakat practices'
    ],
    pros: [
      'Maximum flexibility for unique situations',
      'Can accommodate specific regional practices',
      'Allows for scholarly consultation integration',
      'Adaptable to changing circumstances',
      'Supports specialized business models',
      'Enables compliance with local Islamic authorities'
    ],
    cons: [
      'Requires qualified scholarly guidance',
      'May lack standardization benefits',
      'Responsibility for correctness lies with user',
      'May be complex to implement properly',
      'Potential for inconsistent applications',
      'Requires ongoing scholarly oversight'
    ],
    explanation: 'The Custom method provides maximum flexibility for users with unique circumstances or specific regional requirements. It allows configuration of all calculation parameters based on scholarly consultation or established local practices. This method requires careful implementation with qualified Islamic scholarship to ensure religious compliance while meeting specific needs.'
  }
} as const;

// Calendar types
export const CALENDAR_TYPES = {
  LUNAR: {
    id: 'lunar',
    name: 'Lunar (Hijri)',
    description: 'Islamic lunar calendar',
  },
  SOLAR: {
    id: 'solar',
    name: 'Solar (Gregorian)',
    description: 'Gregorian solar calendar',
  },
} as const;

// Supported languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
] as const;

// API endpoints
export const API_ENDPOINTS = {
  BASE: '/api/v1',
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    DEMO_STATUS: '/auth/demo-status',
    DEMO_USERS: '/auth/demo-users',
  },
  USERS: {
    PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },
  ASSETS: {
    BASE: '/assets',
    CATEGORIES: '/assets/categories',
  },
  ZAKAT: {
    CALCULATE: '/zakat/calculate',
    HISTORY: '/zakat/history',
    PAYMENT: '/zakat/payment',
  },
  DATA: {
    EXPORT: '/data/export',
    IMPORT: '/data/import',
    BACKUP: '/data/backup',
  },
} as const;

// Error codes
export const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  USER_EXISTS: 'USER_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  RATE_LIMIT: 'RATE_LIMIT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
} as const;

// Validation constraints
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  ASSET_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  AMOUNT: {
    MIN_VALUE: 0,
    MAX_VALUE: 999999999999, // 999 billion
  },
} as const;

// Default values
export const DEFAULTS = {
  CURRENCY: 'USD',
  LANGUAGE: 'en',
  CALENDAR_TYPE: 'lunar',
  ZAKAT_METHOD: 'standard',
  PAGINATION_LIMIT: 20,
} as const;

// Date formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  DISPLAY: 'MMM DD, YYYY',
  HIJRI: 'DD MMM YYYY AH',
} as const;

/**
 * Educational content for zakat calculation methodologies.
 * Provides historical background, detailed explanations of approaches,
 * pros/cons analysis, and considerations for each methodology.
 */
export const METHODOLOGY_EDUCATION = {
  HANAFI: {
    historicalBackground: 'The Hanafi school, founded by Imam Abu Hanifa (699-767 CE), is one of the four major Sunni schools of Islamic jurisprudence. It emphasizes rational reasoning and is widely followed in Turkey, Central Asia, and the Indian subcontinent.',
    nisabApproach: 'Uses silver-based nisab exclusively, providing a lower threshold that ensures more people can fulfill their zakat obligations. This approach is based on the principle of making zakat more accessible.',
    businessAssetTreatment: 'Comprehensive inclusion of all business assets including inventory, accounts receivable, and working capital. This reflects the Hanafi emphasis on thorough wealth assessment.',
    debtTreatment: 'Allows for comprehensive debt deduction, including both immediate and future obligations, providing relief to those with significant financial commitments.',
    pros: [
      'Lower nisab threshold ensures broader zakat eligibility',
      'Comprehensive business asset inclusion',
      'Flexible debt deduction approach',
      'Well-established scholarly precedent'
    ],
    considerations: [
      'May result in higher zakat amounts for some individuals',
      'Requires detailed business asset evaluation',
      'Complex debt assessment needed'
    ]
  },
  SHAFII: {
    historicalBackground: 'The Shafi\'i school, founded by Imam al-Shafi\'i (767-820 CE), is known for its systematic methodology and detailed categorization. It is prevalent in Southeast Asia, East Africa, and parts of the Middle East.',
    nisabApproach: 'Uses the dual minimum approach, taking the lower of gold and silver nisab thresholds. This provides a balanced approach that considers market conditions of both precious metals.',
    businessAssetTreatment: 'Detailed categorization of business assets with specific rules for different types of commercial activities. Emphasizes precision in asset classification.',
    debtTreatment: 'Conservative approach to debt deduction, focusing on immediate and certain obligations while being cautious about speculative debts.',
    pros: [
      'Balanced nisab calculation approach',
      'Detailed and precise asset categorization',
      'Conservative debt treatment provides certainty',
      'Strong methodological framework'
    ],
    considerations: [
      'More complex asset categorization required',
      'Conservative debt approach may limit deductions',
      'Requires good understanding of different asset types'
    ]
  },
  STANDARD: {
    historicalBackground: 'The Standard method represents a modern consensus approach, incorporating guidelines from contemporary Islamic finance institutions like AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions).',
    nisabApproach: 'Uses the dual minimum approach, selecting the lower of gold and silver nisab. This provides flexibility based on current market conditions and ensures accessibility.',
    businessAssetTreatment: 'Market value-based assessment of business assets with standard accounting principles. Focuses on readily determinable values.',
    debtTreatment: 'Immediate debt deduction approach, focusing on current and certain obligations while maintaining simplicity in calculation.',
    pros: [
      'Modern consensus approach',
      'Internationally recognized standards',
      'Simplified calculation process',
      'Good for diverse geographic regions'
    ],
    considerations: [
      'May not align with specific regional traditions',
      'Simplified approach may not capture all nuances',
      'Requires trust in contemporary scholarly consensus'
    ]
  },
  CUSTOM: {
    historicalBackground: 'Custom methodology allows users to define their own calculation parameters based on personal consultation with qualified Islamic scholars or specific regional requirements.',
    nisabApproach: 'User-defined nisab threshold based on scholarly consultation or specific circumstances. Provides maximum flexibility for unique situations.',
    businessAssetTreatment: 'Configurable asset treatment based on individual needs and scholarly guidance. Allows for specialized business considerations.',
    debtTreatment: 'Flexible debt deduction rules that can be customized based on individual circumstances and scholarly advice.',
    pros: [
      'Maximum flexibility for unique situations',
      'Can accommodate specific regional practices',
      'Allows for scholarly consultation integration',
      'Adaptable to changing circumstances'
    ],
    considerations: [
      'Requires qualified scholarly guidance',
      'May lack standardization benefits',
      'Responsibility for correctness lies with user',
      'May be complex to implement properly'
    ]
  }
} as const;

/**
 * Regional methodology recommendations mapping.
 * Maps countries/regions to recommended zakat calculation methodologies
 * based on prevalent Islamic schools of thought and local practices.
 */
export const REGIONAL_METHODOLOGY_MAP = {
  // Middle East & Gulf
  'Saudi Arabia': ['standard', 'hanafi'],
  'United Arab Emirates': ['standard', 'hanafi'],
  'Qatar': ['standard', 'hanafi'],
  'Kuwait': ['standard', 'hanafi'],
  'Oman': ['standard', 'shafii'],
  'Bahrain': ['standard', 'hanafi'],
  'Iraq': ['hanafi', 'standard'],
  'Jordan': ['hanafi', 'standard'],
  'Lebanon': ['hanafi', 'shafii'],
  'Syria': ['hanafi', 'standard'],
  'Palestine': ['hanafi', 'shafii'],
  
  // North Africa
  'Egypt': ['hanafi', 'standard'],
  'Libya': ['hanafi', 'standard'],
  'Tunisia': ['hanafi', 'standard'],
  'Algeria': ['hanafi', 'standard'],
  'Morocco': ['standard', 'hanafi'],
  'Sudan': ['hanafi', 'standard'],
  
  // Southeast Asia
  'Indonesia': ['shafii', 'standard'],
  'Malaysia': ['shafii', 'standard'],
  'Singapore': ['shafii', 'standard'],
  'Thailand': ['shafii', 'standard'],
  'Philippines': ['shafii', 'standard'],
  'Brunei': ['shafii', 'standard'],
  'Cambodia': ['shafii', 'standard'],
  
  // South Asia
  'Pakistan': ['hanafi', 'standard'],
  'India': ['hanafi', 'standard'],
  'Bangladesh': ['hanafi', 'standard'],
  'Afghanistan': ['hanafi', 'standard'],
  'Maldives': ['shafii', 'standard'],
  'Sri Lanka': ['shafii', 'hanafi'],
  
  // Central Asia & Caucasus
  'Turkey': ['hanafi', 'standard'],
  'Kazakhstan': ['hanafi', 'standard'],
  'Uzbekistan': ['hanafi', 'standard'],
  'Turkmenistan': ['hanafi', 'standard'],
  'Kyrgyzstan': ['hanafi', 'standard'],
  'Tajikistan': ['hanafi', 'standard'],
  'Azerbaijan': ['hanafi', 'standard'],
  
  // East Africa
  'Somalia': ['shafii', 'standard'],
  'Ethiopia': ['shafii', 'standard'],
  'Kenya': ['shafii', 'standard'],
  'Tanzania': ['shafii', 'standard'],
  'Uganda': ['shafii', 'hanafi'],
  'Djibouti': ['shafii', 'standard'],
  
  // West Africa
  'Nigeria': ['standard', 'hanafi'],
  'Senegal': ['standard', 'hanafi'],
  'Mali': ['standard', 'hanafi'],
  'Burkina Faso': ['standard', 'hanafi'],
  'Niger': ['standard', 'hanafi'],
  'Guinea': ['standard', 'hanafi'],
  'Gambia': ['standard', 'hanafi'],
  
  // Western Countries (Diaspora)
  'United States': ['standard', 'hanafi', 'shafii'],
  'Canada': ['standard', 'hanafi', 'shafii'],
  'United Kingdom': ['standard', 'hanafi', 'shafii'],
  'France': ['standard', 'hanafi'],
  'Germany': ['standard', 'hanafi'],
  'Netherlands': ['standard', 'hanafi'],
  'Australia': ['standard', 'hanafi', 'shafii'],
  'New Zealand': ['standard', 'shafii']
} as const;
