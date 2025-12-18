// Constants for the zakapp application

/**
 * Re-export comprehensive Islamic constants from dedicated module
 *
 * IMPORTANT: The canonical source for Islamic Zakat constants is now
 * in constants/islamicConstants.ts. This includes:
 * - NISAB_THRESHOLDS (with scholarly references)
 * - ZAKAT_RATES (with detailed explanations)
 * - HAWL_CONSTANTS (lunar calendar calculations)
 * - CALCULATION_METHODS (madhab-specific approaches)
 * - Helper functions for calculations
 *
 * The legacy constants below are maintained for backward compatibility
 * but new code should use the comprehensive islamicConstants module.
 */
export * from './constants/islamicConstants.js';

// Legacy Zakat calculation constants (DEPRECATED - use islamicConstants instead)
// @deprecated Use ZAKAT_RATES from islamicConstants.ts
// export const ZAKAT_RATES = {
//   STANDARD_RATE: 2.5, // 2.5% for most assets
//   AGRICULTURAL_RAIN_FED: 10, // 10% for rain-fed crops
//   AGRICULTURAL_IRRIGATED: 5, // 5% for irrigated crops
// } as const;

// Legacy Nisab thresholds (DEPRECATED - use islamicConstants instead)
// @deprecated Use NISAB_THRESHOLDS from islamicConstants.ts
// export const NISAB_THRESHOLDS = {
//   GOLD_GRAMS: 87.48, // ~3 ounces of gold
//   SILVER_GRAMS: 612.36, // ~21 ounces of silver
// } as const;

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
// @deprecated Use ASSET_CATEGORIES from islamicConstants.ts

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
    historicalBackground: 'The Hanafi school, founded by Imam Abu Hanifa (699-767 CE) in Kufa, Iraq, is the oldest and most widely followed Sunni school of Islamic jurisprudence. Known for its emphasis on rational reasoning (ra\'y) and analogy (qiyas), it is predominant in Turkey, Central Asia, the Indian subcontinent, and significant parts of the Arab world. Key sources include Al-Hidayah by al-Marghinani and Fath al-Qadir by Ibn al-Humam.',
    nisabApproach: 'Uses silver-based nisab exclusively (612.36 grams of silver), providing a lower threshold that ensures broader zakat eligibility. This approach is based on authenticated hadiths and the principle of facilitating zakat obligations for more Muslims, reflecting the school\'s emphasis on accessibility and social welfare.',
    businessAssetTreatment: 'Comprehensive inclusion of all business assets including inventory, accounts receivable, work-in-progress, and working capital. This thorough wealth assessment methodology reflects the Hanafi emphasis on complete financial transparency and is detailed in classical texts like Al-Hidayah.',
    debtTreatment: 'Allows for comprehensive debt deduction, including both immediate obligations and reasonable future commitments. This flexible approach provides relief to those with significant financial obligations while maintaining the integrity of zakat calculations, as outlined in Hanafi jurisprudential texts.',
    pros: [
      'Lower silver-based nisab threshold ensures broader zakat eligibility',
      'Comprehensive and transparent business asset inclusion methodology',
      'Flexible debt deduction approach accommodates modern financial complexities',
      'Well-established scholarly precedent spanning over 1,200 years',
      'Rational approach allows for adaptation to contemporary circumstances',
      'Widely accepted across diverse Muslim communities globally'
    ],
    considerations: [
      'Silver-based nisab may result in higher zakat amounts when silver prices are low',
      'Requires detailed business asset evaluation and documentation',
      'Complex debt assessment may need professional guidance',
      'Comprehensive approach may be time-intensive for complex portfolios',
      'Requires good understanding of classical jurisprudential principles'
    ]
  },
  SHAFII: {
    historicalBackground: 'The Shafi\'i school, founded by Imam Muhammad ibn Idris al-Shafi\'i (767-820 CE), is renowned for its systematic methodology and detailed legal categorization. It is the dominant school in Southeast Asia, East Africa, parts of the Middle East, and significant Muslim populations worldwide. Key sources include Al-Majmu\' Sharh al-Muhadhdhab by Imam al-Nawawi and Minhaj al-Talibin.',
    nisabApproach: 'Uses the dual minimum approach, taking the lower of gold nisab (87.48 grams) or silver nisab (612.36 grams). This balanced methodology considers market conditions of both precious metals and ensures accessibility while maintaining traditional nisab principles as established in classical Shafi\'i jurisprudence.',
    businessAssetTreatment: 'Employs detailed categorization of business assets with specific rules for different types of commercial activities. Emphasizes precision in asset classification according to their intended use and Islamic commercial law principles, as detailed in Al-Majmu\' and other authoritative Shafi\'i texts.',
    debtTreatment: 'Takes a conservative approach to debt deduction, focusing on immediate and certain obligations while exercising caution with speculative or uncertain debts. This methodology ensures accuracy and religious compliance as outlined in classical Shafi\'i jurisprudential works.',
    pros: [
      'Balanced dual-minimum nisab approach adapts to market conditions',
      'Systematic and precise asset categorization reduces calculation errors',
      'Conservative debt treatment provides certainty and religious confidence',
      'Strong methodological framework based on established legal principles',
      'Well-suited for diverse asset types and modern financial instruments',
      'Comprehensive scholarly documentation spanning centuries'
    ],
    considerations: [
      'More complex asset categorization requires detailed financial knowledge',
      'Conservative debt approach may limit some legitimate deductions',
      'Requires good understanding of different asset types and classifications',
      'Systematic approach may be less accessible for simple portfolios',
      'May require professional guidance for complex business structures'
    ]
  },
  STANDARD: {
    historicalBackground: 'The Standard method represents a contemporary consensus approach developed for global Muslim communities by organizations like AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions), IFSB (Islamic Financial Services Board), and other international Islamic finance bodies. It incorporates modern financial principles while maintaining religious compliance and scholarly validation.',
    nisabApproach: 'Uses the dual minimum approach, selecting the lower of gold nisab (87.48 grams) or silver nisab (612.36 grams). This methodology provides flexibility based on current market conditions while ensuring accessibility and follows the principle of choosing the threshold most beneficial to those seeking to fulfill their zakat obligations.',
    businessAssetTreatment: 'Employs market value-based assessment of business assets using standard international accounting principles adapted for Islamic finance. Focuses on readily determinable values while maintaining compatibility with modern business structures and regulatory requirements across different jurisdictions.',
    debtTreatment: 'Implements immediate debt deduction approach, focusing on current and certain obligations while maintaining calculation simplicity. This method balances accuracy with practical implementation for diverse global communities while ensuring compliance with contemporary Islamic finance standards.',
    pros: [
      'Modern consensus approach validated by leading Islamic finance institutions',
      'Internationally recognized standards facilitate cross-border consistency',
      'Simplified calculation process suitable for diverse user backgrounds',
      'Excellent compatibility with modern financial systems and regulations',
      'Supported by contemporary Islamic finance institutions globally',
      'Flexible dual nisab calculation adapts to market conditions'
    ],
    considerations: [
      'May not align perfectly with specific regional scholarly traditions',
      'Simplified approach may not capture all jurisprudential nuances',
      'Relies on contemporary scholarly consensus rather than classical texts',
      'Less historical precedent compared to traditional madhhab approaches',
      'May require ongoing validation as financial instruments evolve'
    ]
  },
  MALIKI: {
    historicalBackground: 'The Maliki school, founded by Imam Malik ibn Anas (711-795 CE), is one of the four major Sunni schools of Islamic jurisprudence. It emphasizes community benefit (maslaha) and practical application, and is predominant in North Africa, West Africa, and parts of the Arabian Peninsula.',
    nisabApproach: 'Uses a flexible dual approach that may adjust nisab thresholds based on regional economic conditions and community welfare considerations. This reflects the Maliki emphasis on practical application and community benefit.',
    businessAssetTreatment: 'Comprehensive treatment of commercial assets with particular emphasis on agricultural goods and trade merchandise. Includes detailed rules for seasonal businesses and agricultural cycles, reflecting the school\'s historical roots in agricultural societies.',
    debtTreatment: 'Community-based debt assessment that considers both individual circumstances and broader economic conditions. May allow for community-verified debt deductions and considers the debtor\'s overall community standing.',
    pros: [
      'Adapts to local economic conditions and community needs',
      'Strong framework for agricultural asset handling',
      'Community-centric approach promotes social welfare',
      'Flexible implementation based on regional requirements',
      'Comprehensive treatment of trade goods and commerce',
      'Historical precedent for practical jurisprudence'
    ],
    considerations: [
      'Requires regional economic data for proper implementation',
      'Complex adjustment mechanisms may be difficult to standardize',
      'Less standardized across different regions and communities',
      'May require community consensus for certain calculations',
      'Implementation complexity may vary by location'
    ]
  },
  HANBALI: {
    historicalBackground: 'The Hanbali school, founded by Imam Ahmad ibn Hanbal (780-855 CE), is known for its strict adherence to Quranic and Hadith texts. It is the official school of jurisprudence in Saudi Arabia and is followed in parts of the Gulf states, emphasizing traditional and conservative approaches.',
    nisabApproach: 'Prefers gold-based nisab calculations as the primary standard, based on strong textual precedents from Islamic sources. This conservative approach ensures consistency with traditional interpretations and provides stability in calculations.',
    businessAssetTreatment: 'Strict categorization of business assets based on classical Islamic commercial law. Emphasizes clear distinctions between different types of commercial activities and applies conservative valuation methods to ensure compliance with traditional interpretations.',
    debtTreatment: 'Conservative approach to debt deduction, focusing on immediate and certain obligations with clear documentation. Tends to be cautious about speculative or uncertain debts to ensure strict compliance with Islamic principles.',
    pros: [
      'Clear precedential basis rooted in Quran and authentic Hadith',
      'Consistent with traditional Islamic interpretations',
      'Simplified and stable gold-based calculation logic',
      'Conservative approach ensures religious compliance',
      'Well-established scholarly precedent and documentation',
      'Provides certainty and consistency in calculations'
    ],
    considerations: [
      'Gold-based nisab may exclude lower-income individuals in some contexts',
      'Less adaptive to modern financial instruments and structures',
      'Limited flexibility for contemporary business models',
      'May not suit all regional economic contexts',
      'Conservative debt treatment may limit legitimate deductions',
      'Requires careful interpretation for modern applications'
    ]
  },
  CUSTOM: {
    historicalBackground: 'Custom methodology allows users to define their own calculation parameters based on personal consultation with qualified Islamic scholars or specific regional requirements. This approach recognizes the diversity of Islamic jurisprudential opinions and local practices while maintaining the fundamental principles of zakat.',
    nisabApproach: 'User-defined nisab threshold based on scholarly consultation or specific circumstances. Provides maximum flexibility for unique situations while requiring proper Islamic jurisprudential guidance to ensure religious validity.',
    businessAssetTreatment: 'Configurable asset treatment based on individual needs and scholarly guidance. Allows for specialized business considerations that may not be covered by standard methodologies while maintaining Islamic compliance principles.',
    debtTreatment: 'Flexible debt deduction rules that can be customized based on individual circumstances and scholarly advice. Enables accommodation of unique financial situations while ensuring proper Islamic jurisprudential oversight.',
    pros: [
      'Maximum flexibility for unique situations and circumstances',
      'Can accommodate specific regional practices and interpretations',
      'Allows for direct scholarly consultation integration',
      'Adaptable to changing circumstances and modern contexts',
      'Supports specialized business models and structures',
      'Enables compliance with local Islamic authorities and customs'
    ],
    considerations: [
      'Requires qualified scholarly guidance for proper implementation',
      'May lack standardization benefits of established methods',
      'Full responsibility for correctness lies with user and advisor',
      'May be complex to implement properly without expert guidance',
      'Potential for inconsistent applications across different users',
      'Requires ongoing scholarly oversight and validation'
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
  'Saudi Arabia': ['hanbali', 'standard'],
  'United Arab Emirates': ['standard', 'hanafi'],
  'Qatar': ['hanbali', 'standard'],
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
  'Libya': ['maliki', 'hanafi'],
  'Tunisia': ['maliki', 'hanafi'],
  'Algeria': ['maliki', 'hanafi'],
  'Morocco': ['maliki', 'standard'],
  'Sudan': ['maliki', 'hanafi'],
  
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
  'Nigeria': ['maliki', 'standard'],
  'Senegal': ['maliki', 'standard'],
  'Mali': ['maliki', 'standard'],
  'Burkina Faso': ['maliki', 'standard'],
  'Niger': ['maliki', 'standard'],
  'Guinea': ['maliki', 'standard'],
  'Gambia': ['maliki', 'standard'],
  'Mauritania': ['maliki', 'standard'],
  'Chad': ['maliki', 'standard'],
  
  // Western Countries (Diaspora)
  'United States': ['standard', 'hanafi', 'shafii'],
  'Canada': ['standard', 'hanafi', 'shafii'],
  'United Kingdom': ['standard', 'hanafi', 'shafii'],
  'France': ['standard', 'maliki', 'hanafi'],
  'Germany': ['standard', 'hanafi'],
  'Netherlands': ['standard', 'hanafi'],
  'Australia': ['standard', 'hanafi', 'shafii'],
  'New Zealand': ['standard', 'shafii']
} as const;

/**
 * Scholarly sources and references for zakat methodologies.
 * Provides authoritative sources, classical texts, and contemporary validation
 * for each methodology's jurisprudential foundations.
 */
export const METHODOLOGY_SOURCES = {
  HANAFI: {
    classicalSources: [
      {
        title: 'Al-Hidayah',
        author: 'Burhan al-Din al-Marghinani',
        description: 'Primary source for Hanafi methodology and classical jurisprudence foundations',
        period: '12th century CE'
      },
      {
        title: 'Fath al-Qadir',
        author: 'Kamal al-Din Ibn al-Humam',
        description: 'Advanced Hanafi jurisprudence with detailed calculations and examples',
        period: '15th century CE'
      }
    ],
    contemporarySources: [
      {
        title: 'Contemporary Hanafi Fiqh Studies',
        organization: 'Darul Uloom institutions globally',
        description: 'Modern applications of Hanafi jurisprudence'
      }
    ],
    regions: ['Turkey', 'Central Asia', 'Indian subcontinent', 'Parts of Middle East']
  },
  SHAFII: {
    classicalSources: [
      {
        title: 'Al-Majmu\' Sharh al-Muhadhdhab',
        author: 'Imam al-Nawawi',
        description: 'Comprehensive Shafi\'i methodology with detailed asset categorization',
        period: '13th century CE'
      },
      {
        title: 'Minhaj al-Talibin',
        author: 'Imam al-Nawawi',
        description: 'Practical implementation guide for contemporary applications',
        period: '13th century CE'
      }
    ],
    contemporarySources: [
      {
        title: 'AAOIFI Shafi\'i Compliance Guidelines',
        organization: 'Accounting and Auditing Organization for Islamic Financial Institutions',
        description: 'Modern financial applications of Shafi\'i principles'
      }
    ],
    regions: ['Southeast Asia', 'East Africa', 'Parts of Middle East']
  },
  MALIKI: {
    classicalSources: [
      {
        title: 'Al-Mudawwana',
        author: 'Imam Malik ibn Anas',
        description: 'Foundational Maliki jurisprudence with regional adaptation principles',
        period: '8th century CE'
      },
      {
        title: 'Bidayat al-Mujtahid',
        author: 'Ibn Rushd (Averroes)',
        description: 'Comparative jurisprudence approach with cross-school analysis',
        period: '12th century CE'
      }
    ],
    contemporarySources: [
      {
        title: 'North African Fiqh Academies',
        organization: 'Regional Islamic scholarly institutions',
        description: 'Modern applications adapted to regional conditions'
      }
    ],
    regions: ['North Africa', 'West Africa', 'Parts of Arabian Peninsula']
  },
  HANBALI: {
    classicalSources: [
      {
        title: 'Al-Mughni',
        author: 'Ibn Qudamah al-Maqdisi',
        description: 'Comprehensive Hanbali methodology with conservative approaches',
        period: '12th-13th century CE'
      },
      {
        title: 'Works of Ibn Taymiyyah',
        author: 'Taqi al-Din Ibn Taymiyyah',
        description: 'Textual precedent emphasis and jurisprudential analysis',
        period: '13th-14th century CE'
      }
    ],
    contemporarySources: [
      {
        title: 'Saudi Fiqh Academy',
        organization: 'Islamic Fiqh Academy, Makkah',
        description: 'Official scholarly guidance for Hanbali applications'
      }
    ],
    regions: ['Saudi Arabia', 'Qatar', 'Parts of Gulf States']
  },
  STANDARD: {
    contemporarySources: [
      {
        title: 'AAOIFI Financial Accounting Standard 9 (FAS 9)',
        organization: 'Accounting and Auditing Organization for Islamic Financial Institutions',
        description: 'International standard for Zakat calculation and disclosure'
      },
      {
        title: 'IFSB Guidelines',
        organization: 'Islamic Financial Services Board',
        description: 'Regulatory guidance for Islamic financial institutions'
      },
      {
        title: 'Islamic Development Bank Research',
        organization: 'Islamic Development Bank',
        description: 'Contemporary research on zakat implementation'
      }
    ],
    regions: ['International', 'Global Muslim communities']
  }
} as const;

/**
 * Additional educational resources for zakat calculation methodologies.
 * Provides comprehensive learning materials, FAQs, and implementation guidance.
 */
export const METHODOLOGY_RESOURCES = {
  commonQuestions: [
    {
      question: 'Which methodology should I choose?',
      answer: 'The choice depends on your regional background, personal preference, and scholarly guidance. Consider your location, the complexity of your assets, and consultation with local Islamic scholars.'
    },
    {
      question: 'Can I switch between methodologies?',
      answer: 'While possible, it\'s recommended to maintain consistency in your chosen methodology for annual zakat calculations. Consult with qualified scholars before making changes.'
    },
    {
      question: 'How do modern financial instruments fit into classical methodologies?',
      answer: 'Contemporary scholars have developed guidance for modern assets. The Standard method often provides the most comprehensive framework for contemporary financial instruments.'
    }
  ],
  implementationTips: [
    'Maintain detailed records of your assets and their categorization',
    'Consider consulting with Islamic finance professionals for complex portfolios',
    'Review your chosen methodology annually with qualified scholars',
    'Keep documentation of scholarly consultations and methodology decisions'
  ],
  additionalReading: [
    'Contemporary Islamic Finance and Zakat Studies',
    'Regional Fiqh Academy Publications',
    'Islamic Development Bank Zakat Research',
    'University Islamic Studies Departments Publications'
  ]
} as const;

/**
 * Valid asset category types - simple array for validation
 * Single source of truth derived from AssetCategoryType
 * Use this for validation instead of hardcoding category lists
 */
export const VALID_ASSET_CATEGORY_VALUES = [
  'cash',
  'gold',
  'silver',
  'business',
  'property',
  'stocks',
  'crypto',
  'debts',
  'expenses',
] as const;

/**
 * Helper function to check if a value is a valid asset category
 */
export function isValidAssetCategory(value: unknown): boolean {
  return typeof value === 'string' && VALID_ASSET_CATEGORY_VALUES.includes(value as any);
}
