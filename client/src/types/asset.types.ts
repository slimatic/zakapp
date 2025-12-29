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
  retirementDetails?: {
    withdrawalPenalty: number; // Percentage (0-1)
    taxRate: number; // Percentage (0-1)
  };
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
  retirementDetails?: {
    withdrawalPenalty: number;
    taxRate: number;
  };
}
