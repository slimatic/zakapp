// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

// User Types
export interface User {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  currency: string;
  language: string;
  zakatMethod: string;
  calendarType: 'lunar' | 'solar';
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

// Asset Types
export type AssetCategoryType =
  | 'cash'
  | 'gold'
  | 'silver'
  | 'business'
  | 'property'
  | 'stocks'
  | 'crypto'
  | 'debts'
  | 'expenses';

// Base asset interface
export interface Asset {
  assetId: string;
  name: string;
  category: AssetCategoryType;
  subCategory: string;
  value: number;
  currency: string;
  description?: string;
  zakatEligible: boolean;
  createdAt: string;
  updatedAt: string;
}

// Specific asset type interfaces for better type safety
export interface CashAsset extends Asset {
  category: 'cash';
  subCategory:
    | 'savings'
    | 'checking'
    | 'cash_on_hand'
    | 'certificates_of_deposit'
    | 'money_market';
  interestRate?: number;
  maturityDate?: string;
}

export interface GoldAsset extends Asset {
  category: 'gold';
  subCategory: 'jewelry' | 'coins' | 'bars' | 'ornaments';
  weight?: number; // in grams
  purity?: number; // in karats (e.g., 24, 22, 18)
}

export interface SilverAsset extends Asset {
  category: 'silver';
  subCategory: 'jewelry' | 'coins' | 'bars' | 'ornaments' | 'utensils';
  weight?: number; // in grams
  purity?: number; // percentage (e.g., 92.5 for sterling silver)
}

export interface BusinessAsset extends Asset {
  category: 'business';
  subCategory:
    | 'inventory'
    | 'trade_goods'
    | 'raw_materials'
    | 'finished_goods'
    | 'work_in_progress';
  businessType?: string;
  holdingPeriod?: number; // in months
}

export interface PropertyAsset extends Asset {
  category: 'property';
  subCategory:
    | 'residential_investment'
    | 'commercial'
    | 'land'
    | 'agricultural'
    | 'industrial';
  propertyType?: string;
  location?: string;
  rentalIncome?: number; // monthly
}

export interface StocksAsset extends Asset {
  category: 'stocks';
  subCategory:
    | 'individual_stocks'
    | 'mutual_funds'
    | 'etfs'
    | 'bonds'
    | 'index_funds'
    | 'retirement_401k'
    | 'retirement_ira'
    | 'retirement_other';
  ticker?: string;
  shares?: number;
  dividendYield?: number;
  // Retirement-specific fields
  employerMatch?: number;
  vestingSchedule?: string;
  iraType?: 'traditional' | 'roth';
  contributionLimit?: number;
  accountType?: string;
}

export interface CryptoAsset extends Asset {
  category: 'crypto';
  subCategory:
    | 'bitcoin'
    | 'ethereum'
    | 'altcoins'
    | 'stablecoins'
    | 'defi_tokens';
  coinSymbol?: string;
  quantity?: number;
  stakingRewards?: number;
}

export interface DebtAsset extends Asset {
  category: 'debts';
  subCategory:
    | 'accounts_receivable'
    | 'personal_loans_given'
    | 'business_loans_given'
    | 'promissory_notes';
  debtor?: string;
  dueDate?: string;
  interestRate?: number;
  repaymentSchedule?: 'lump_sum' | 'installments' | 'on_demand';
}

export interface ExpensesAsset extends Asset {
  category: 'expenses';
  subCategory:
    | 'debts_owed'
    | 'essential_needs'
    | 'family_obligations'
    | 'business_liabilities';
  creditor?: string;
  dueDate?: string;
  interestRate?: number;
  expenseType?: string;
  frequency?: 'monthly' | 'yearly' | 'one_time';
  dependentCount?: number;
  supportType?: string;
  businessType?: string;
  liabilityType?: string;
}

// Union type for all specific asset types
export type SpecificAsset =
  | CashAsset
  | GoldAsset
  | SilverAsset
  | BusinessAsset
  | PropertyAsset
  | StocksAsset
  | CryptoAsset
  | DebtAsset
  | ExpensesAsset;

export interface AssetCategory {
  id: string;
  name: string;
  description: string;
  zakatRate: number;
  subCategories: AssetSubCategory[];
  defaultZakatEligible: boolean;
  nisabApplicable: boolean;
}

export interface AssetSubCategory {
  id: string;
  name: string;
  description: string;
  zakatRate: number;
  zakatEligible: boolean;
  specificFields?: string[]; // Optional fields specific to this subcategory
}

/**
 * Enhanced Zakat calculation interface with comprehensive methodology support.
 * Includes detailed breakdown, calendar calculations, and regional adjustments.
 * Maintains backward compatibility while providing extensive transparency.
 * This is the primary result interface returned by zakat calculation services.
 * 
 * @interface ZakatCalculation
 * @since Phase 1
 */
export interface ZakatCalculation {
  /** Unique identifier for this calculation instance */
  calculationId: string;
  
  /** Date when the calculation was performed */
  calculationDate: string;
  
  /** Calendar system used for the calculation */
  calendarType: 'lunar' | 'solar';
  
  /** Methodology identifier used for this calculation */
  method: string;
  
  /** Enhanced method details (optional for backward compatibility) */
  methodInfo?: {
    /** Display name of the methodology */
    name: string;
    /** Brief description of the methodology */
    description: string;
    /** Nisab basis used by this methodology */
    nisabBasis: string;
  };
  
  /** Nisab threshold information used in calculation */
  nisab: NisabInfo;
  
  /** Individual assets included in the calculation */
  assets: ZakatAsset[];
  
  /** Summary totals of the calculation */
  totals: ZakatTotals;
  
  /** Whether the total assets meet the nisab threshold */
  meetsNisab: boolean;
  
  /** Payment status of the calculated zakat */
  status: 'pending' | 'partial' | 'paid';
  
  /** Timestamp when this calculation record was created */
  createdAt: string;
  
  /** Enhanced breakdown with detailed methodology information */
  breakdown?: CalculationBreakdown;
  
  /** Calendar-specific information for lunar/solar calculations */
  calendarInfo?: CalendarCalculation;
  
  /** Regional adjustments if applicable */
  regionalAdjustment?: RegionalAdjustment;
  
  /** Educational and scholarly sources supporting the calculation */
  sources?: string[];
  
  /** Authority or system that validated this calculation */
  validatedBy?: string;
}

/**
 * Asset calculation details for breakdown transparency.
 * Provides detailed information about how each individual asset
 * contributes to the overall zakat calculation.
 * 
 * @interface AssetCalculation
 * @since Phase 1
 */
export interface AssetCalculation {
  /** Unique identifier of the asset */
  assetId: string;
  
  /** Display name of the asset */
  name: string;
  
  /** Asset category (cash, gold, silver, business, etc.) */
  category: string;
  
  /** Total value of the asset in user's currency */
  value: number;
  
  /** Portion of asset value that is subject to zakat */
  zakatableAmount: number;
  
  /** Actual zakat amount due on this specific asset */
  zakatDue: number;
  
  /** Methodology-specific rules applied to this asset */
  methodSpecificRules: string[];
}

/**
 * Deduction rules applied in zakat calculation.
 * Represents various types of deductions (debts, expenses, etc.)
 * that are subtracted from total assets based on the chosen methodology.
 * 
 * @interface DeductionRule
 * @since Phase 1
 */
export interface DeductionRule {
  /** Type of deduction (debt, expense, liability, etc.) */
  type: string;
  
  /** Human-readable description of the deduction */
  description: string;
  
  /** Amount deducted in user's currency */
  amount: number;
  
  /** List of asset categories this deduction applies to */
  applicableAssets: string[];
}

/**
 * Enhanced calculation breakdown interface providing detailed transparency
 * into zakat calculation methodology and steps.
 * Supports both new detailed format and legacy step-based format for backward compatibility.
 * 
 * @interface CalculationBreakdown
 * @since Phase 1
 */
export interface CalculationBreakdown {
  /** Method ID used for calculation (required for transparency and consistency with documentation) */
  method: string;
  
  /** Detailed nisab calculation breakdown showing gold, silver, and effective thresholds */
  nisabCalculation?: {
    /** Gold-based nisab threshold in user's currency */
    goldNisab: number;
    /** Silver-based nisab threshold in user's currency */
    silverNisab: number;
    /** Effective nisab used for calculation (typically the lower of gold/silver) */
    effectiveNisab: number;
    /** Basis used for nisab calculation (e.g., 'dual_minimum', 'silver', 'gold') */
    basis: string;
  };
  
  /** Detailed calculations for each individual asset */
  assetCalculations?: AssetCalculation[];
  
  /** Rules applied for deductions (debts, expenses, etc.) */
  deductionRules?: DeductionRule[];
  
  /** Summary of final calculation results */
  finalCalculation?: {
    /** Total value of all included assets */
    totalAssets: number;
    /** Total amount of deductions applied */
    totalDeductions: number;
    /** Net zakatable amount after deductions */
    zakatableAmount: number;
    /** Final zakat amount due (typically 2.5% of zakatable amount) */
    zakatDue: number;
  };
  
  /** Educational and scholarly sources supporting the calculation methodology */
  sources?: string[];
  
  /** Legacy step-based breakdown format for backward compatibility */
  steps?: {
    /** Step identifier/name */
    step: string;
    /** Human-readable description of the calculation step */
    description: string;
    /** Numerical result of this calculation step */
    value: number;
  }[];
  
  /** Legacy methodology information for existing implementations */
  methodology?: {
    /** Display name of the methodology */
    name: string;
    /** Brief description of the methodology approach */
    description: string;
    /** Nisab calculation basis used */
    nisabBasis: string;
  };
}

/**
 * Nisab threshold information used in zakat calculations.
 * Contains the various threshold values and calculation method details.
 * 
 * @interface NisabInfo
 * @since Phase 1
 */
export interface NisabInfo {
  /** Nisab threshold based on gold prices */
  goldNisab: number;
  
  /** Nisab threshold based on silver prices */
  silverNisab: number;
  
  /** Effective nisab threshold used for calculation */
  effectiveNisab: number;
  
  /** Method used to determine the effective nisab */
  nisabBasis: string;
  
  /** Calculation methodology applied */
  calculationMethod: string;
}

/**
 * Individual asset information in zakat calculation context.
 * Represents how each asset contributes to the total zakat calculation.
 * 
 * @interface ZakatAsset
 * @since Phase 1
 */
export interface ZakatAsset {
  /** Unique identifier of the asset */
  assetId: string;
  
  /** Display name of the asset */
  name: string;
  
  /** Asset category */
  category: string;
  
  /** Total value of the asset */
  value: number;
  
  /** Portion subject to zakat after methodology rules */
  zakatableAmount: number;
  
  /** Actual zakat due on this asset */
  zakatDue: number;
}

/**
 * Summary totals for zakat calculation.
 * Provides aggregate values across all included assets.
 * 
 * @interface ZakatTotals
 * @since Phase 1
 */
export interface ZakatTotals {
  /** Total value of all included assets */
  totalAssets: number;
  
  /** Total zakatable amount after applying methodology rules */
  totalZakatableAssets: number;
  
  /** Total zakat amount due */
  totalZakatDue: number;
  
  /** Total expenses/deductions applied (optional) */
  totalExpenses?: number;
  
  /** Net zakatable assets after all deductions (optional) */
  netZakatableAssets?: number;
}

/**
 * Request parameters for zakat calculation.
 * Contains all the input parameters needed to perform a zakat calculation
 * using a specific methodology and asset selection.
 * 
 * @interface ZakatCalculationRequest
 * @since Phase 1
 */
export interface ZakatCalculationRequest {
  /** Date for which to calculate zakat */
  calculationDate: string;
  
  /** Calendar system to use for calculation */
  calendarType: 'lunar' | 'solar';
  
  /** Methodology identifier to use for calculation */
  method: string;
  
  /** Custom nisab override (optional) */
  customNisab?: number;
  
  /** Array of asset IDs to include in calculation */
  includeAssets: string[];
}

/**
 * Comprehensive methodology information interface for zakat calculation methods.
 * Supports multiple Islamic jurisprudence schools and modern standardized approaches.
 * This interface defines all the metadata needed to understand and apply different
 * zakat calculation methodologies.
 * 
 * @interface MethodologyInfo
 * @since Phase 1
 */
export interface MethodologyInfo {
  /** Unique identifier for the methodology (e.g., 'hanafi', 'shafii', 'standard') */
  id: string;
  
  /** Display name of the methodology */
  name: string;
  
  /** Detailed description of the methodology approach */
  description: string;
  
  /** Nisab calculation basis (e.g., 'silver', 'dual_minimum', 'gold') */
  nisabBasis: string;
  
  /** How business assets are treated (e.g., 'comprehensive', 'categorized', 'market_value') */
  businessAssetTreatment: string;
  
  /** Debt deduction approach (e.g., 'comprehensive', 'conservative', 'immediate') */
  debtDeduction: string;
  
  /** Array of scholarly sources and jurisprudential basis */
  scholarlyBasis: string[];
  
  /** Geographic regions where this methodology is commonly used */
  regions: string[];
  
  /** Standard zakat rate percentage (typically 2.5) */
  zakatRate: number;
  
  /** Calendar systems supported by this methodology */
  calendarSupport: ('lunar' | 'solar')[];
  
  /** Whether the methodology includes custom rules beyond standard calculations */
  customRules?: boolean;
  
  /** Types of users or situations this methodology is most suitable for */
  suitableFor: string[];
  
  /** Advantages and benefits of using this methodology */
  pros: string[];
  
  /** Potential drawbacks or considerations when using this methodology */
  cons: string[];
  
  /** Comprehensive explanation of the methodology's principles and approach */
  explanation: string;
}

/**
 * Educational content interface for zakat methodologies.
 * Provides comprehensive information for user education and decision-making.
 * This interface contains detailed explanatory content to help users understand
 * the principles and implications of different calculation methodologies.
 * 
 * @interface MethodologyEducationContent
 * @since Phase 1
 */

// Type alias for backward compatibility
export type ZakatMethodology = MethodologyInfo;

export interface MethodologyEducationContent {
  /** Historical background and scholarly foundation of the methodology */
  historicalBackground: string;
  
  /** Explanation of how nisab thresholds are calculated and applied */
  nisabApproach: string;
  
  /** Description of how business assets are evaluated and included */
  businessAssetTreatment: string;
  
  /** Explanation of debt treatment and deduction principles */
  debtTreatment: string;
  
  /** List of advantages and positive aspects of the methodology */
  pros: string[];
  
  /** Important considerations, limitations, or potential drawbacks */
  considerations: string[];
}

/**
 * Islamic (Hijri) calendar date representation.
 * Used for lunar calendar calculations and Islamic date conversions.
 * 
 * @interface HijriDate
 * @since Phase 1
 */
export interface HijriDate {
  /** Hijri year */
  year: number;
  
  /** Hijri month (1-12) */
  month: number;
  
  /** Day of the month (1-29/30) */
  day: number;
  
  /** Arabic name of the month */
  monthName: string;
}

/**
 * Calendar calculation information for lunar/solar conversions.
 * Provides details about date conversions and adjustments between
 * Gregorian and Islamic (Hijri) calendar systems.
 * 
 * @interface CalendarCalculation
 * @since Phase 1
 */
export interface CalendarCalculation {
  /** Gregorian (solar) date used in calculation */
  gregorianDate: Date;
  
  /** Corresponding Hijri (lunar) date */
  hijriDate: HijriDate;
  
  /** Calendar system used for the calculation period */
  calculationPeriod: 'lunar' | 'solar';
  
  /** Adjustment factor applied for calendar conversion */
  adjustmentFactor: number;
}

/**
 * Regional economic adjustment factors.
 * Contains location-specific adjustments for economic conditions
 * that may affect zakat calculations.
 * 
 * @interface RegionalAdjustment
 * @since Phase 1
 */
export interface RegionalAdjustment {
  /** Geographic region identifier */
  region: string;
  
  /** Economic adjustment factor */
  economicFactor: number;
  
  /** Local inflation rate */
  inflationRate: number;
  
  /** Cost of living index for the region */
  costOfLivingIndex: number;
  
  /** When the adjustment data was last updated */
  lastUpdated: Date;
}

/**
 * Methodology comparison result for side-by-side evaluation.
 * Used to compare different calculation methodologies using the same asset data.
 * 
 * @interface MethodologyComparison
 * @since Phase 1
 */
export interface MethodologyComparison {
  /** Methodology identifier being compared */
  methodId: string;
  
  /** Full methodology information */
  methodology: MethodologyInfo;
  
  /** Sample calculation results using this methodology */
  sampleCalculation: {
    /** Total asset value used in sample */
    totalAssets: number;
    
    /** Zakat due calculated by this method */
    zakatDue: number;
    
    /** Effective nisab threshold used */
    effectiveNisab: number;
  };
  
  /** Key differences from other methodologies */
  differences: string[];
}

// Payment Types
export interface ZakatPayment {
  paymentId: string;
  calculationId: string;
  amount: number;
  date: string;
  recipient: string;
  notes?: string;
  createdAt: string;
}

/**
 * Methodology recommendation with confidence scoring.
 * Used by recommendation systems to suggest appropriate methodologies
 * based on user profile and circumstances.
 * 
 * @interface MethodologyRecommendation
 * @since Phase 1
 */
export interface MethodologyRecommendation {
  /** Methodology identifier */
  methodId: string;
  
  /** Confidence score (0-1) for this recommendation */
  confidence: number;
  
  /** Reasons why this methodology is recommended */
  reasons: string[];
  
  /** Overall suitability score for the user */
  suitabilityScore: number;
}

/**
 * Alternative calculation result for methodology comparison.
 * Shows how the same assets would be calculated using different methodologies.
 * 
 * @interface AlternativeCalculation
 * @since Phase 1
 */
export interface AlternativeCalculation {
  /** Alternative methodology identifier */
  methodId: string;
  
  /** Display name of the alternative methodology */
  methodName: string;
  
  /** Zakat amount calculated using alternative method */
  zakatDue: number;
  
  /** Effective nisab used by alternative method */
  effectiveNisab: number;
  
  /** Key differences from primary calculation */
  differences: string[];
}

/**
 * Comprehensive calculation result with alternatives and metadata.
 * The complete response from zakat calculation services including
 * main result, methodology details, and alternative comparisons.
 * 
 * @interface ZakatCalculationResult
 * @since Phase 1
 */
export interface ZakatCalculationResult {
  /** Primary calculation result */
  result: ZakatCalculation;
  
  /** Detailed methodology information */
  methodology: MethodologyInfo;
  
  /** Calculation breakdown for transparency */
  breakdown: CalculationBreakdown;
  
  /** Assumptions made during calculation */
  assumptions: string[];
  
  /** Educational and scholarly sources */
  sources: string[];
  
  /** Alternative calculations for comparison */
  alternatives: AlternativeCalculation[];
}

/**
 * Scholarly sources for calculation validation and reference.
 * Represents Islamic jurisprudential sources that support specific
 * calculation methodologies and rulings.
 * 
 * @interface ScholarlySources
 * @since Phase 1
 */
export interface ScholarlySources {
  /** Title of the scholarly work or reference */
  title: string;
  
  /** Author or scholar name */
  author: string;
  
  /** Publication or book name (optional) */
  publication?: string;
  
  /** Publication year (optional) */
  year?: number;
  
  /** Specific section or chapter reference (optional) */
  relevantSection?: string;
  
  /** URL or link to the source (optional) */
  url?: string;
}

// Data Export/Import Types
export interface UserDataExport {
  exportDate: string;
  userData: {
    profile: User;
    assets: Asset[];
    zakatCalculations: ZakatCalculation[];
    payments: ZakatPayment[];
  };
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[] | any;
}

// Pagination Types
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
