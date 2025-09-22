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

// Asset categories with their details and subcategories
export const ASSET_CATEGORIES = {
  CASH: {
    id: 'cash',
    name: 'Cash & Bank Accounts',
    description: 'Liquid cash, savings, and checking accounts',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    subCategories: [
      { id: 'savings', name: 'Savings Account', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'checking', name: 'Checking Account', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'cash_hand', name: 'Cash on Hand', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'money_market', name: 'Money Market Account', zakatRate: ZAKAT_RATES.STANDARD_RATE },
    ],
  },
  GOLD: {
    id: 'gold',
    name: 'Gold',
    description: 'Gold jewelry, coins, and bars',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    subCategories: [
      { id: 'jewelry', name: 'Gold Jewelry', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'coins', name: 'Gold Coins', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'bars', name: 'Gold Bars/Bullion', zakatRate: ZAKAT_RATES.STANDARD_RATE },
    ],
  },
  SILVER: {
    id: 'silver',
    name: 'Silver',
    description: 'Silver jewelry, coins, and bars',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    subCategories: [
      { id: 'jewelry', name: 'Silver Jewelry', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'coins', name: 'Silver Coins', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'bars', name: 'Silver Bars/Bullion', zakatRate: ZAKAT_RATES.STANDARD_RATE },
    ],
  },
  BUSINESS: {
    id: 'business',
    name: 'Business Assets',
    description: 'Business inventory, trade goods, and commercial assets',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    subCategories: [
      { id: 'inventory', name: 'Business Inventory', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'trade_goods', name: 'Trade Goods', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'accounts_receivable', name: 'Accounts Receivable', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'business_cash', name: 'Business Cash', zakatRate: ZAKAT_RATES.STANDARD_RATE },
    ],
  },
  PROPERTY: {
    id: 'property',
    name: 'Investment Property',
    description: 'Real estate held for investment purposes',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    subCategories: [
      { id: 'rental', name: 'Rental Property', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'commercial', name: 'Commercial Property', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'land', name: 'Investment Land', zakatRate: ZAKAT_RATES.STANDARD_RATE },
    ],
  },
  STOCKS: {
    id: 'stocks',
    name: 'Stocks & Securities',
    description: 'Shares, bonds, and other securities',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    subCategories: [
      { id: 'stocks', name: 'Individual Stocks', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'mutual_funds', name: 'Mutual Funds', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'bonds', name: 'Bonds', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'etf', name: 'ETFs', zakatRate: ZAKAT_RATES.STANDARD_RATE },
    ],
  },
  CRYPTO: {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Digital currencies and crypto assets',
    zakatRate: ZAKAT_RATES.STANDARD_RATE,
    zakatEligible: true,
    subCategories: [
      { id: 'bitcoin', name: 'Bitcoin', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'ethereum', name: 'Ethereum', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'altcoins', name: 'Other Cryptocurrencies', zakatRate: ZAKAT_RATES.STANDARD_RATE },
      { id: 'stablecoins', name: 'Stablecoins', zakatRate: ZAKAT_RATES.STANDARD_RATE },
    ],
  },
  DEBT: {
    id: 'debt',
    name: 'Debts & Liabilities',
    description: 'Outstanding debts and liabilities that reduce zakat obligation',
    zakatRate: 0, // Debts reduce zakat obligation rather than incur it
    zakatEligible: false,
    subCategories: [
      { id: 'personal_loans', name: 'Personal Loans', zakatRate: 0 },
      { id: 'credit_cards', name: 'Credit Card Debt', zakatRate: 0 },
      { id: 'mortgages', name: 'Mortgage Debt', zakatRate: 0 },
      { id: 'business_loans', name: 'Business Loans', zakatRate: 0 },
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
