/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
  settings?: {
    preferredCalendar?: 'gregorian' | 'hijri';
    hijriAdjustment?: number;
    currency?: string;
  };
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