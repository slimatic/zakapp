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
export type AssetCategoryType = 'cash' | 'gold' | 'silver' | 'business' | 'property' | 'stocks' | 'crypto';

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

export interface AssetCategory {
  id: string;
  name: string;
  description: string;
  zakatRate: number;
  subCategories: AssetSubCategory[];
}

export interface AssetSubCategory {
  id: string;
  name: string;
  zakatRate: number;
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
}

export interface ZakatCalculationRequest {
  calculationDate: string;
  calendarType: 'lunar' | 'solar';
  method: string;
  customNisab?: number;
  includeAssets: string[];
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