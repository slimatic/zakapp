import { Request, Response, NextFunction } from 'express';

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

    if (!isPartial || data.type !== undefined) {
      if (!data.type || typeof data.type !== 'string') {
        errors.push('Type is required and must be a string');
      } else if (!['cash', 'gold', 'silver', 'crypto', 'business', 'investment'].includes(data.type)) {
        errors.push('Type must be one of: cash, gold, silver, crypto, business, investment');
      } else {
        validatedData.type = data.type;
      }
    }

    if (!isPartial || data.value !== undefined) {
      if (data.value === undefined || typeof data.value !== 'number' || data.value < 0) {
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
    
    // Validate asset type
    const validTypes = ['cash', 'gold', 'silver', 'crypto', 'business', 'investment'];
    if (type && !validTypes.includes(type)) {
      errors.push('Invalid asset type. Must be one of: ' + validTypes.join(', '));
    }
    
    // Validate value
    if (value !== undefined && (typeof value !== 'number' || value < 0)) {
      errors.push('Asset value must be a non-negative number');
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