export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  value: number;
  currency: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export enum AssetType {
  CASH = 'CASH',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  BUSINESS_ASSETS = 'BUSINESS_ASSETS',
  INVESTMENT_ACCOUNT = 'INVESTMENT_ACCOUNT',
  REAL_ESTATE = 'REAL_ESTATE',
  DEBTS_OWED_TO_YOU = 'DEBTS_OWED_TO_YOU',
  OTHER = 'OTHER'
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
  methodology: string;
  currency: string;
  calculatedAt: string;
  assets: Asset[];
}