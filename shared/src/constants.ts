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

// Zakat calculation methods
export const ZAKAT_METHODS = {
  STANDARD: {
    id: 'standard',
    name: 'Standard Method',
    description: 'Most commonly used calculation method',
  },
  HANAFI: {
    id: 'hanafi',
    name: 'Hanafi Method',
    description: 'Calculation according to Hanafi school',
  },
  CUSTOM: {
    id: 'custom',
    name: 'Custom Method',
    description: 'Custom calculation with user-defined parameters',
  },
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
