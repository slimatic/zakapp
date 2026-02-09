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

import { Request, Response, NextFunction } from 'express';
import { VALID_ASSET_CATEGORY_VALUES } from '@zakapp/shared';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

/**
 * Simple validation utility without external dependencies
 * Basic input validation for API endpoints
 */
export class SimpleValidation {

  /**
   * Validates asset data and returns validation result
   */
  static validateAsset(data: any, isPartial = false): ValidationResult {
    const errors: string[] = [];
    const validatedData: any = {};

    if (!isPartial || data.category !== undefined) {
      if (!data.category || typeof data.category !== 'string') {
        errors.push('Category is required and must be a string');
      } else if (!VALID_ASSET_CATEGORY_VALUES.includes(data.category.toLowerCase() as any)) {
        errors.push(`Category must be one of: ${VALID_ASSET_CATEGORY_VALUES.join(', ')}`);
      } else {
        validatedData.category = data.category;
      }
    }

    if (!isPartial || data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
      } else if (data.name.length > 100) {
        errors.push('Name must be maximum 100 characters');
      } else {
        validatedData.name = data.name.trim();
      }
    }

    if (!isPartial || data.value !== undefined) {
      if (data.value === undefined || typeof data.value !== 'number') {
        errors.push('Value is required and must be a number');
      } else if (data.value < 0) {
        errors.push('Value is required and must be a non-negative number');
      } else {
        validatedData.value = data.value;
      }
    }

    if (!isPartial || data.currency !== undefined) {
      if (!data.currency || typeof data.currency !== 'string') {
        errors.push('Currency is required and must be a string');
      } else if (!/^[A-Z]{3}$/.test(data.currency)) {
        errors.push('Currency must be a valid ISO 4217 currency code (3 uppercase letters)');
      } else {
        validatedData.currency = data.currency;
      }
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string' || data.description.length > 500) {
        errors.push('Description must be a string with maximum 500 characters');
      } else {
        validatedData.description = data.description;
      }
    }

    if (!isPartial || data.acquisitionDate !== undefined) {
      if (data.acquisitionDate !== undefined) {
        const date = new Date(data.acquisitionDate);
        if (isNaN(date.getTime())) {
          errors.push('Acquisition date must be a valid date');
        } else {
          // Compare dates ignoring time-of-day so that 'today' is allowed
          const inputDate = new Date(date);
          inputDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (inputDate.getTime() > today.getTime()) {
            errors.push('Acquisition date cannot be in the future');
          } else {
            validatedData.acquisitionDate = data.acquisitionDate;
          }
        }
      }
    }

    if (data.notes !== undefined) {
      if (typeof data.notes !== 'string' || data.notes.length > 1000) {
        errors.push('Notes must be a string with maximum 1000 characters');
      } else {
        validatedData.notes = data.notes;
      }
    }

    if (data.isPassiveInvestment !== undefined) {
      if (typeof data.isPassiveInvestment !== 'boolean') {
        errors.push('isPassiveInvestment must be a boolean');
      } else {
        validatedData.isPassiveInvestment = data.isPassiveInvestment;
      }
    }

    if (data.isRestrictedAccount !== undefined) {
      if (typeof data.isRestrictedAccount !== 'boolean') {
        errors.push('isRestrictedAccount must be a boolean');
      } else {
        validatedData.isRestrictedAccount = data.isRestrictedAccount;
      }
    }

    if (data.zakatEligible !== undefined) {
      if (typeof data.zakatEligible !== 'boolean') {
        errors.push('zakatEligible must be a boolean');
      } else {
        validatedData.zakatEligible = data.zakatEligible;
      }
    }

    if (data.isZakatable !== undefined) {
        if (typeof data.isZakatable !== 'boolean') {
          errors.push('isZakatable must be a boolean');
        } else {
          validatedData.zakatEligible = data.isZakatable;
        }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: validatedData
    };
  }

  /**
   * Validate asset creation request
   */
  static validateAssetCreation(req: Request, res: Response, next: NextFunction) {
    const { type, value, currency, description } = req.body;
    const errors: string[] = [];

    // Validate required fields
    if (!type) errors.push('Asset type is required');
    if (value === undefined || value === null) errors.push('Asset value is required');
    if (!currency) errors.push('Currency is required');

    // Validate asset type using shared constant
    if (type && !VALID_ASSET_CATEGORY_VALUES.includes(type.toLowerCase() as any)) {
      errors.push(`Invalid asset type. Must be one of: ${VALID_ASSET_CATEGORY_VALUES.join(', ')}`);
    }

    // Validate value
    if (value !== undefined && (typeof value !== 'number')) {
      errors.push('Asset value must be a number');
    }

    // Validate currency
    if (currency && !/^[A-Z]{3}$/.test(currency)) {
      errors.push('Currency must be a valid 3-letter ISO code');
    }

    // Validate description length
    if (description && typeof description === 'string' && description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: errors
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    }

    next();
  }

  /**
   * Validate Zakat calculation request
   */
  static validateZakatCalculation(req: Request, res: Response, next: NextFunction) {
    const { methodology, assets, nisabSource } = req.body;
    const errors: string[] = [];

    // Validate methodology
    const validMethodologies = ['standard', 'hanafi', 'shafii', 'maliki', 'hanbali'];
    if (!methodology) {
      errors.push('Methodology is required');
    } else if (!validMethodologies.includes(methodology)) {
      errors.push('Invalid methodology. Must be one of: ' + validMethodologies.join(', '));
    }

    // Validate assets array
    if (!Array.isArray(assets)) {
      errors.push('Assets must be an array');
    } else if (assets.length === 0) {
      errors.push('At least one asset is required');
    } else {
      assets.forEach((asset, index) => {
        if (!asset.id) errors.push(`Asset ${index + 1}: ID is required`);
        if (!asset.type) errors.push(`Asset ${index + 1}: Type is required`);
        if (!asset.encryptedValue) errors.push(`Asset ${index + 1}: Encrypted value is required`);
        if (!asset.currency || !/^[A-Z]{3}$/.test(asset.currency)) {
          errors.push(`Asset ${index + 1}: Valid currency code is required`);
        }
      });
    }

    // Validate nisab source
    if (nisabSource && !['gold', 'silver'].includes(nisabSource)) {
      errors.push('Nisab source must be either "gold" or "silver"');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: errors
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    }

    next();
  }
}