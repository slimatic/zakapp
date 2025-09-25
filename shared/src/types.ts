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

// Zakat Calculation Types
/**
 * Enhanced Zakat calculation interface with comprehensive methodology support.
 * Includes detailed breakdown, calendar calculations, and regional adjustments.
 * Maintains backward compatibility while providing extensive transparency.
 */
export interface ZakatCalculation {
  calculationId: string;
  calculationDate: string;
  calendarType: 'lunar' | 'solar';
  method: string;
  // Enhanced method details (optional for backward compatibility)
  methodInfo?: {
    name: string;
    description: string;
    nisabBasis: string;
  };
  nisab: NisabInfo;
  assets: ZakatAsset[];
  totals: ZakatTotals;
  meetsNisab: boolean;
  status: 'pending' | 'partial' | 'paid';
  createdAt: string;
  // Enhanced breakdown with detailed methodology information
  breakdown?: CalculationBreakdown;
  // Calendar-specific information
  calendarInfo?: CalendarCalculation;
  // Regional adjustments if applicable
  regionalAdjustment?: RegionalAdjustment;
  // Sources and validation information
  sources?: string[];
  validatedBy?: string;
}

// Asset calculation details for breakdown transparency
export interface AssetCalculation {
  assetId: string;
  name: string;
  category: string;
  value: number;
  zakatableAmount: number;
  zakatDue: number;
  methodSpecificRules: string[];
}

// Deduction rules applied in calculation
export interface DeductionRule {
  type: string;
  description: string;
  amount: number;
  applicableAssets: string[];
}

/**
 * Enhanced calculation breakdown interface providing detailed transparency
 * into zakat calculation methodology and steps.
 * Supports both new detailed format and legacy step-based format for backward compatibility.
 */
export interface CalculationBreakdown {
  // Method ID (required for transparency and consistency with documentation)
  method: string;
  // Enhanced fields for detailed breakdown transparency
  nisabCalculation?: {
    goldNisab: number;
    silverNisab: number;
    effectiveNisab: number;
    basis: string;
  };
  assetCalculations?: AssetCalculation[];
  deductionRules?: DeductionRule[];
  finalCalculation?: {
    totalAssets: number;
    totalDeductions: number;
    zakatableAmount: number;
    zakatDue: number;
  };
  sources?: string[];
  // Maintain backward compatibility with existing step-based breakdown
  steps?: {
    step: string;
    description: string;
    value: number;
  }[];
  // Legacy methodology information (for existing implementations)
  methodology?: {
    name: string;
    description: string;
    nisabBasis: string;
  };
}

export interface NisabInfo {
  goldNisab: number;
  silverNisab: number;
  effectiveNisab: number;
  nisabBasis: string;
  calculationMethod: string;
}

export interface ZakatAsset {
  assetId: string;
  name: string;
  category: string;
  value: number;
  zakatableAmount: number;
  zakatDue: number;
}

export interface ZakatTotals {
  totalAssets: number;
  totalZakatableAssets: number;
  totalZakatDue: number;
  totalExpenses?: number;
  netZakatableAssets?: number;
}

export interface ZakatCalculationRequest {
  calculationDate: string;
  calendarType: 'lunar' | 'solar';
  method: string;
  customNisab?: number;
  includeAssets: string[];
}

// Methodology Information Interface
/**
 * Comprehensive methodology information interface for zakat calculation methods.
 * Supports multiple Islamic jurisprudence schools and modern standardized approaches.
 */
export interface MethodologyInfo {
  id: string;
  name: string;
  description: string;
  nisabBasis: string;
  businessAssetTreatment: string;
  debtDeduction: string;
  scholarlyBasis: string[];
  regions: string[];
  // Additional fields for enhanced methodology support
  zakatRate: number;
  calendarSupport: ('lunar' | 'solar')[];
  customRules?: boolean;
  suitableFor: string[];
  pros: string[];
  cons: string[];
  explanation: string;
}

/**
 * Educational content interface for zakat methodologies.
 * Provides comprehensive information for user education and decision-making.
 */
export interface MethodologyEducationContent {
  historicalBackground: string;
  nisabApproach: string;
  businessAssetTreatment: string;
  debtTreatment: string;
  pros: string[];
  considerations: string[];
}

// Calendar system types for lunar/solar calculations
export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
}

export interface CalendarCalculation {
  gregorianDate: Date;
  hijriDate: HijriDate;
  calculationPeriod: 'lunar' | 'solar';
  adjustmentFactor: number;
}

// Regional adjustment types for economic factors
export interface RegionalAdjustment {
  region: string;
  economicFactor: number;
  inflationRate: number;
  costOfLivingIndex: number;
  lastUpdated: Date;
}

// Methodology comparison and selection types
export interface MethodologyComparison {
  methodId: string;
  methodology: MethodologyInfo;
  sampleCalculation: {
    totalAssets: number;
    zakatDue: number;
    effectiveNisab: number;
  };
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

// Methodology selection and recommendation types
export interface MethodologyRecommendation {
  methodId: string;
  confidence: number;
  reasons: string[];
  suitabilityScore: number;
}

// Alternative calculation result for comparison
export interface AlternativeCalculation {
  methodId: string;
  methodName: string;
  zakatDue: number;
  effectiveNisab: number;
  differences: string[];
}

// Comprehensive calculation result with alternatives
export interface ZakatCalculationResult {
  result: ZakatCalculation;
  methodology: MethodologyInfo;
  breakdown: CalculationBreakdown;
  assumptions: string[];
  sources: string[];
  alternatives: AlternativeCalculation[];
}

// Scholarly sources for calculation validation
export interface ScholarlySources {
  title: string;
  author: string;
  publication?: string;
  year?: number;
  relevantSection?: string;
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
