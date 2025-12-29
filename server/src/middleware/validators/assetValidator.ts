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

import { z } from 'zod';
import { PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '@zakapp/shared';

/**
 * Validation schema for creating a new asset
 * Enforces modifier rules: passive only for eligible types, restricted for retirement accounts
 * Prevents simultaneous passive + restricted flags
 */
// Core asset shape (no refinements) so update schema can use .partial() safely
const baseAssetShape = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  value: z.number().min(0, 'Value must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  acquisitionDate: z.coerce.date({ invalid_type_error: 'Invalid acquisition date' }),
  metadata: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  isPassiveInvestment: z.boolean().default(false),
  isRestrictedAccount: z.boolean().default(false),
});

// Create schema with refinements applied (kept separate from shape)
export const createAssetSchema = baseAssetShape
  .refine(
    (data) => {
      // Passive only valid for eligible types
      if (data.isPassiveInvestment && !PASSIVE_INVESTMENT_TYPES.includes(data.category as any)) {
        return false;
      }
      return true;
    },
    {
      message: 'Passive investment flag can only be set for Stock, ETF, Mutual Fund, or Roth IRA',
      path: ['isPassiveInvestment'],
    }
  )
  .refine(
    (data) => {
      // Restricted only valid for retirement account types
      if (data.isRestrictedAccount && !RESTRICTED_ACCOUNT_TYPES.includes(data.category as any)) {
        return false;
      }
      return true;
    },
    {
      message: 'Restricted account flag can only be set for 401k, Traditional IRA, Pension, or Roth IRA',
      path: ['isRestrictedAccount'],
    }
  )
  .refine(
    (data) => {
      // Cannot be both passive and restricted
      if (data.isPassiveInvestment && data.isRestrictedAccount) {
        return false;
      }
      return true;
    },
    {
      message: 'Asset cannot be both passive investment and restricted account',
      path: ['isPassiveInvestment'],
    }
  );

/**
 * Validation schema for creating/updating an asset
 */
export const updateAssetSchema = baseAssetShape.partial();

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
