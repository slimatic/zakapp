/**
 * Frontend asset types and modifier support
 * Re-exports shared types and adds frontend-specific utilities
 */

import type { Asset } from './index';

export interface CreateAssetDto {
  name: string;
  category: string;
  value: number;
  currency?: string;
  acquisitionDate?: string | Date;
  metadata?: string;
  notes?: string;
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}

export type UpdateAssetDto = Partial<CreateAssetDto>;

export type CalculationModifier = number; // e.g., 0.0 (restricted), 0.3 (passive), 1.0 (full)

export { PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '../constants/sharedFallback';

export interface AssetWithZakatInfo extends Asset {
  zakatableAmount?: number;
  zakatOwed?: number;
  modifierApplied?: 'passive' | 'restricted' | 'full';
}

export interface AssetFormState {
  category: string;
  name: string;
  value: number;
  currency: string;
  acquisitionDate: Date;
  notes?: string;
  isPassiveInvestment: boolean;
  isRestrictedAccount: boolean;
}
