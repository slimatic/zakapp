export interface Asset {
  id: string;
  userId?: string;
  type: AssetType;
  name: string;
  value: number;
  currency: string;
  description?: string;
  metadata?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  acquisitionDate?: string;
  subCategory?: string;
  zakatEligible?: boolean;
  // New fields for Zakat Calculation
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
  calculationModifier?: number;
}

export enum AssetType {
  CASH = 'CASH',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  BUSINESS_ASSETS = 'BUSINESS_ASSETS',
  INVESTMENT_ACCOUNT = 'INVESTMENT_ACCOUNT',
  RETIREMENT = 'RETIREMENT',
  REAL_ESTATE = 'REAL_ESTATE',
  DEBTS_OWED_TO_YOU = 'DEBTS_OWED_TO_YOU',
  OTHER = 'OTHER'
}

export interface Liability {
  id: string;
  userId: string;
  name: string;
  type: string; // 'short_term' | 'long_term' | 'business_payable'
  amount: number;
  currency: string;
  description?: string;
  metadata?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  creditor?: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface ZakatCalculation {
  id: string;
  totalAssets: number;
  nisabThreshold: number;
  zakatDue: number;
  methodology: ZakatMethodology;
  currency: string;
  calculatedAt: string;
  assets: Asset[];
  nisabMethod: 'GOLD' | 'SILVER' | 'DUAL';
  isAboveNisab: boolean;
  zakatRate: number;
  assetBreakdown: AssetBreakdown[];
  reason?: string;
}

export interface ZakatMethodology {
  id: string;
  name: string;
  description: string;
  nisabMethod: 'GOLD' | 'SILVER' | 'DUAL';
  zakatRate: number;
}

export interface AssetBreakdown {
  type: AssetType;
  totalValue: number;
  count: number;
  zakatableAmount: number;
}

export interface NisabInfo {
  goldPrice: number;
  silverPrice: number;
  goldNisab: number;
  silverNisab: number;
  effectiveNisab: number;
  currency: string;
  lastUpdated: string;
}

export interface ZakatPayment {
  id: string;
  amount: number;
  date: string;
  recipient?: string;
  method?: string;
  notes?: string;
  createdAt: string;
}