/**
 * Frontend asset types and modifier support
 * Re-exports shared types and adds frontend-specific utilities
 */

export {
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  CalculationModifier,
  PASSIVE_INVESTMENT_TYPES,
  RESTRICTED_ACCOUNT_TYPES,
} from '@zakapp/shared';

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
