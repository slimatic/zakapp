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
export interface ZakatCalculation {
  calculationId: string;
  calculationDate: string;
  calendarType: 'lunar' | 'solar';
  method: string;
  nisab: NisabInfo;
  assets: ZakatAsset[];
  totals: ZakatTotals;
  meetsNisab: boolean;
  status: 'pending' | 'partial' | 'paid';
  createdAt: string;
}

export interface NisabInfo {
  goldNisab: number;
  silverNisab: number;
  effectiveNisab: number;
  nisabBasis?: string;
  calculationMethod?: string;
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
export interface MethodologyInfo {
  id: string;
  name: string;
  description: string;
  nisabBasis: string;
  businessAssetTreatment: string;
  debtDeduction: string;
  scholarlyBasis: string[];
  regions: string[];
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
