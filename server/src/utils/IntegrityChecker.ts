/**
 * IntegrityChecker Utility
 * 
 * Comprehensive data integrity validation system for ZakApp database.
 * 
 * Constitutional Compliance:
 * - Privacy & Security First: Validates data encryption integrity
 * - Islamic Compliance: Ensures Islamic calculation accuracy and methodology integrity
 * - Quality & Reliability: Comprehensive data validation and error detection
 * - Transparency & Trust: Clear integrity reporting and audit trails
 */

import crypto from 'crypto';
import { z } from 'zod';
import { AssetModel } from '../models/Asset';
import { UserModel } from '../models/User';
import { MethodologyModel } from '../models/Methodology';
import { ZakatCalculationModel } from '../models/ZakatCalculation';
import { EncryptionService } from '../services/EncryptionService';

// Integrity check result types
interface IntegrityCheckResult {
  passed: boolean;
  score: number; // 0-100
  errors: IntegrityError[];
  warnings: IntegrityWarning[];
  summary: IntegritySummary;
  timestamp: string;
  executionTime: number;
}

interface IntegrityError {
  type: 'encryption' | 'reference' | 'calculation' | 'format' | 'constraint';
  severity: 'critical' | 'high' | 'medium' | 'low';
  entity: string;
  field: string;
  message: string;
  recordId?: string;
  suggestedFix?: string;
}

interface IntegrityWarning {
  type: 'performance' | 'data_quality' | 'consistency' | 'outdated';
  entity: string;
  field?: string;
  message: string;
  recordId?: string;
  impact: 'high' | 'medium' | 'low';
}

interface IntegritySummary {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  warningRecords: number;
  encryptionIntegrity: number; // 0-100
  referentialIntegrity: number; // 0-100
  calculationAccuracy: number; // 0-100
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

interface CheckOptions {
  includeEncryption?: boolean;
  includeCalculations?: boolean;
  includeReferences?: boolean;
  includeIslamic?: boolean;
  fixableOnly?: boolean;
  entities?: ('users' | 'assets' | 'methodologies' | 'calculations')[];
}

/**
 * IntegrityChecker Service
 * 
 * Validates database integrity across all entities with comprehensive checks
 */
export class IntegrityChecker {
  private static encryptionService = new EncryptionService();
  private static readonly VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SAR', 'AED', 'QAR', 'KWD'];
  private static readonly VALID_ASSET_CATEGORIES = ['cash', 'gold', 'silver', 'crypto', 'business', 'investment', 'real_estate'];
  private static readonly VALID_METHODOLOGIES = ['standard', 'hanafi', 'shafii', 'hanbali', 'maliki'];

  /**
   * Performs comprehensive integrity check
   */
  static async performIntegrityCheck(options: CheckOptions = {}): Promise<IntegrityCheckResult> {
    const startTime = Date.now();
    const errors: IntegrityError[] = [];
    const warnings: IntegrityWarning[] = [];
    
    const defaultOptions: CheckOptions = {
      includeEncryption: true,
      includeCalculations: true,
      includeReferences: true,
      includeIslamic: true,
      fixableOnly: false,
      entities: ['users', 'assets', 'methodologies', 'calculations']
    };

    const checkOptions = { ...defaultOptions, ...options };

    try {
      // Collect all data
      const [users, assets, methodologies, calculations] = await Promise.all([
        checkOptions.entities?.includes('users') ? UserModel.findAll() : [],
        checkOptions.entities?.includes('assets') ? AssetModel.findAll() : [],
        checkOptions.entities?.includes('methodologies') ? MethodologyModel.findAll() : [],
        checkOptions.entities?.includes('calculations') ? ZakatCalculationModel.findAll() : []
      ]);

      // Run integrity checks
      const checkResults = await Promise.all([
        this.checkUsers(users, checkOptions),
        this.checkAssets(assets, checkOptions),
        this.checkMethodologies(methodologies, checkOptions),
        this.checkCalculations(calculations, checkOptions),
        checkOptions.includeReferences ? this.checkReferentialIntegrity(users, assets, methodologies, calculations) : { errors: [], warnings: [] }
      ]);

      // Aggregate results
      checkResults.forEach(result => {
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      });

      // Calculate integrity metrics
      const totalRecords = users.length + assets.length + methodologies.length + calculations.length;
      const errorRecords = new Set(errors.map(e => e.recordId)).size;
      const warningRecords = new Set(warnings.map(w => w.recordId)).size;
      const validRecords = totalRecords - errorRecords;

      const encryptionIntegrity = await this.calculateEncryptionIntegrity(assets);
      const referentialIntegrity = this.calculateReferentialIntegrity(errors, totalRecords);
      const calculationAccuracy = await this.calculateCalculationAccuracy(calculations);

      const score = Math.round(
        (encryptionIntegrity * 0.3) +
        (referentialIntegrity * 0.3) +
        (calculationAccuracy * 0.4)
      );

      const overallHealth = this.determineOverallHealth(score, errors);

      const summary: IntegritySummary = {
        totalRecords,
        validRecords,
        errorRecords,
        warningRecords,
        encryptionIntegrity,
        referentialIntegrity,
        calculationAccuracy,
        overallHealth
      };

      return {
        passed: errors.length === 0,
        score,
        errors,
        warnings,
        summary,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        errors: [{
          type: 'constraint',
          severity: 'critical',
          entity: 'system',
          field: 'integrity_check',
          message: `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        warnings: [],
        summary: {
          totalRecords: 0,
          validRecords: 0,
          errorRecords: 0,
          warningRecords: 0,
          encryptionIntegrity: 0,
          referentialIntegrity: 0,
          calculationAccuracy: 0,
          overallHealth: 'critical'
        },
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validates user data integrity
   */
  private static async checkUsers(users: any[], options: CheckOptions): Promise<{ errors: IntegrityError[]; warnings: IntegrityWarning[] }> {
    const errors: IntegrityError[] = [];
    const warnings: IntegrityWarning[] = [];

    for (const user of users) {
      // Email validation
      if (!user.email || !this.isValidEmail(user.email)) {
        errors.push({
          type: 'format',
          severity: 'high',
          entity: 'user',
          field: 'email',
          message: 'Invalid email format',
          recordId: user.id,
          suggestedFix: 'Update email to valid format'
        });
      }

      // Username validation
      if (!user.username || user.username.length < 3) {
        errors.push({
          type: 'constraint',
          severity: 'medium',
          entity: 'user',
          field: 'username',
          message: 'Username too short (minimum 3 characters)',
          recordId: user.id,
          suggestedFix: 'Update username to meet minimum length requirement'
        });
      }

      // Password validation
      if (!user.hashedPassword || user.hashedPassword.length < 10) {
        errors.push({
          type: 'encryption',
          severity: 'critical',
          entity: 'user',
          field: 'hashedPassword',
          message: 'Invalid password hash',
          recordId: user.id,
          suggestedFix: 'Reset user password with proper hashing'
        });
      }

      // Preferences validation
      if (user.preferences) {
        if (user.preferences.currency && !this.VALID_CURRENCIES.includes(user.preferences.currency)) {
          warnings.push({
            type: 'data_quality',
            entity: 'user',
            field: 'preferences.currency',
            message: `Unsupported currency: ${user.preferences.currency}`,
            recordId: user.id,
            impact: 'medium'
          });
        }

        if (user.preferences.methodology && !this.VALID_METHODOLOGIES.includes(user.preferences.methodology)) {
          warnings.push({
            type: 'data_quality',
            entity: 'user',
            field: 'preferences.methodology',
            message: `Unknown methodology: ${user.preferences.methodology}`,
            recordId: user.id,
            impact: 'high'
          });
        }
      }

      // Account verification warnings
      if (!user.isVerified) {
        warnings.push({
          type: 'data_quality',
          entity: 'user',
          field: 'isVerified',
          message: 'User account not verified',
          recordId: user.id,
          impact: 'low'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates asset data integrity
   */
  private static async checkAssets(assets: any[], options: CheckOptions): Promise<{ errors: IntegrityError[]; warnings: IntegrityWarning[] }> {
    const errors: IntegrityError[] = [];
    const warnings: IntegrityWarning[] = [];

    for (const asset of assets) {
      // Required field validation
      if (!asset.name || asset.name.trim().length === 0) {
        errors.push({
          type: 'constraint',
          severity: 'high',
          entity: 'asset',
          field: 'name',
          message: 'Asset name is required',
          recordId: asset.id,
          suggestedFix: 'Add descriptive name for asset'
        });
      }

      // Category validation
      if (!asset.category || !this.VALID_ASSET_CATEGORIES.includes(asset.category)) {
        errors.push({
          type: 'constraint',
          severity: 'high',
          entity: 'asset',
          field: 'category',
          message: `Invalid asset category: ${asset.category}`,
          recordId: asset.id,
          suggestedFix: 'Set to valid asset category'
        });
      }

      // Value validation
      if (typeof asset.value !== 'number' || asset.value < 0) {
        errors.push({
          type: 'constraint',
          severity: 'critical',
          entity: 'asset',
          field: 'value',
          message: 'Asset value must be a positive number',
          recordId: asset.id,
          suggestedFix: 'Correct asset value to positive number'
        });
      }

      // Currency validation
      if (!asset.currency || !this.VALID_CURRENCIES.includes(asset.currency)) {
        errors.push({
          type: 'constraint',
          severity: 'medium',
          entity: 'asset',
          field: 'currency',
          message: `Unsupported currency: ${asset.currency}`,
          recordId: asset.id,
          suggestedFix: 'Set to supported currency'
        });
      }

      // Encryption validation
      if (options.includeEncryption && asset.encryptedData) {
        try {
          const decrypted = await this.encryptionService.decrypt(asset.encryptedData);
          if (!decrypted || decrypted.trim().length === 0) {
            errors.push({
              type: 'encryption',
              severity: 'critical',
              entity: 'asset',
              field: 'encryptedData',
              message: 'Encrypted data corruption detected',
              recordId: asset.id,
              suggestedFix: 'Re-encrypt asset data'
            });
          }
        } catch (error) {
          errors.push({
            type: 'encryption',
            severity: 'critical',
            entity: 'asset',
            field: 'encryptedData',
            message: 'Failed to decrypt asset data',
            recordId: asset.id,
            suggestedFix: 'Re-encrypt asset data with current key'
          });
        }
      }

      // Value consistency check
      if (asset.value > 1000000000) { // $1 billion threshold
        warnings.push({
          type: 'data_quality',
          entity: 'asset',
          field: 'value',
          message: 'Unusually high asset value detected',
          recordId: asset.id,
          impact: 'medium'
        });
      }

      // Inactive asset warning
      if (!asset.isActive) {
        warnings.push({
          type: 'data_quality',
          entity: 'asset',
          field: 'isActive',
          message: 'Asset marked as inactive',
          recordId: asset.id,
          impact: 'low'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates methodology data integrity
   */
  private static async checkMethodologies(methodologies: any[], options: CheckOptions): Promise<{ errors: IntegrityError[]; warnings: IntegrityWarning[] }> {
    const errors: IntegrityError[] = [];
    const warnings: IntegrityWarning[] = [];

    for (const methodology of methodologies) {
      // Required field validation
      if (!methodology.name || methodology.name.trim().length === 0) {
        errors.push({
          type: 'constraint',
          severity: 'high',
          entity: 'methodology',
          field: 'name',
          message: 'Methodology name is required',
          recordId: methodology.id,
          suggestedFix: 'Add descriptive name for methodology'
        });
      }

      // Zakat rate validation (should be 2.5% for most assets)
      if (typeof methodology.zakatRate !== 'number' || methodology.zakatRate < 0 || methodology.zakatRate > 100) {
        errors.push({
          type: 'constraint',
          severity: 'critical',
          entity: 'methodology',
          field: 'zakatRate',
          message: 'Invalid zakat rate (must be 0-100%)',
          recordId: methodology.id,
          suggestedFix: 'Set valid zakat rate percentage'
        });
      }

      // Islamic compliance check
      if (options.includeIslamic) {
        if (methodology.zakatRate !== 2.5 && methodology.zakatRate !== 5 && methodology.zakatRate !== 10) {
          warnings.push({
            type: 'consistency',
            entity: 'methodology',
            field: 'zakatRate',
            message: `Non-standard zakat rate: ${methodology.zakatRate}% (standard rates: 2.5%, 5%, 10%)`,
            recordId: methodology.id,
            impact: 'medium'
          });
        }
      }

      // Nisab source validation
      if (!methodology.nisabSource || !['gold', 'silver'].includes(methodology.nisabSource)) {
        errors.push({
          type: 'constraint',
          severity: 'high',
          entity: 'methodology',
          field: 'nisabSource',
          message: 'Invalid nisab source (must be "gold" or "silver")',
          recordId: methodology.id,
          suggestedFix: 'Set nisab source to "gold" or "silver"'
        });
      }

      // Calendar type validation
      if (!methodology.calendarType || !['lunar', 'solar'].includes(methodology.calendarType)) {
        errors.push({
          type: 'constraint',
          severity: 'medium',
          entity: 'methodology',
          field: 'calendarType',
          message: 'Invalid calendar type (must be "lunar" or "solar")',
          recordId: methodology.id,
          suggestedFix: 'Set calendar type to "lunar" or "solar"'
        });
      }

      // Scholarly references validation
      if (!methodology.scholarlyReferences || !Array.isArray(methodology.scholarlyReferences) || methodology.scholarlyReferences.length === 0) {
        warnings.push({
          type: 'data_quality',
          entity: 'methodology',
          field: 'scholarlyReferences',
          message: 'Missing scholarly references for methodology',
          recordId: methodology.id,
          impact: 'high'
        });
      }

      // Regions validation
      if (!methodology.regions || !Array.isArray(methodology.regions) || methodology.regions.length === 0) {
        warnings.push({
          type: 'data_quality',
          entity: 'methodology',
          field: 'regions',
          message: 'No regions specified for methodology',
          recordId: methodology.id,
          impact: 'medium'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates calculation data integrity
   */
  private static async checkCalculations(calculations: any[], options: CheckOptions): Promise<{ errors: IntegrityError[]; warnings: IntegrityWarning[] }> {
    const errors: IntegrityError[] = [];
    const warnings: IntegrityWarning[] = [];

    for (const calculation of calculations) {
      // Required field validation
      if (typeof calculation.totalAssets !== 'number' || calculation.totalAssets < 0) {
        errors.push({
          type: 'constraint',
          severity: 'critical',
          entity: 'calculation',
          field: 'totalAssets',
          message: 'Invalid total assets value',
          recordId: calculation.id,
          suggestedFix: 'Recalculate with valid asset values'
        });
      }

      if (typeof calculation.totalZakat !== 'number' || calculation.totalZakat < 0) {
        errors.push({
          type: 'constraint',
          severity: 'critical',
          entity: 'calculation',
          field: 'totalZakat',
          message: 'Invalid total zakat value',
          recordId: calculation.id,
          suggestedFix: 'Recalculate zakat amount'
        });
      }

      // Calculation accuracy check
      if (options.includeCalculations && calculation.totalAssets > 0 && calculation.totalZakat > 0) {
        const expectedZakat = calculation.totalAssets * 0.025; // Assuming 2.5% rate
        const calculationDifference = Math.abs(calculation.totalZakat - expectedZakat) / expectedZakat;
        
        if (calculationDifference > 0.1) { // More than 10% difference
          warnings.push({
            type: 'consistency',
            entity: 'calculation',
            field: 'totalZakat',
            message: `Zakat calculation may be incorrect (expected ~${expectedZakat.toFixed(2)}, got ${calculation.totalZakat})`,
            recordId: calculation.id,
            impact: 'high'
          });
        }
      }

      // Nisab threshold validation
      if (typeof calculation.nisabThreshold !== 'number' || calculation.nisabThreshold <= 0) {
        errors.push({
          type: 'constraint',
          severity: 'high',
          entity: 'calculation',
          field: 'nisabThreshold',
          message: 'Invalid nisab threshold',
          recordId: calculation.id,
          suggestedFix: 'Set valid nisab threshold based on current prices'
        });
      }

      // Date validation
      if (!calculation.calculationDate || isNaN(Date.parse(calculation.calculationDate))) {
        errors.push({
          type: 'format',
          severity: 'medium',
          entity: 'calculation',
          field: 'calculationDate',
          message: 'Invalid calculation date format',
          recordId: calculation.id,
          suggestedFix: 'Set valid ISO date string'
        });
      }

      // Old calculation warning
      if (calculation.calculationDate) {
        const calculationAge = Date.now() - new Date(calculation.calculationDate).getTime();
        const oneYear = 365 * 24 * 60 * 60 * 1000; // milliseconds in a year

        if (calculationAge > oneYear) {
          warnings.push({
            type: 'outdated',
            entity: 'calculation',
            field: 'calculationDate',
            message: 'Calculation is over one year old',
            recordId: calculation.id,
            impact: 'medium'
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates referential integrity between entities
   */
  private static async checkReferentialIntegrity(users: any[], assets: any[], methodologies: any[], calculations: any[]): Promise<{ errors: IntegrityError[]; warnings: IntegrityWarning[] }> {
    const errors: IntegrityError[] = [];
    const warnings: IntegrityWarning[] = [];

    const userIds = new Set(users.map(u => u.id));
    const methodologyIds = new Set(methodologies.map(m => m.id));

    // Check asset-user references
    for (const asset of assets) {
      if (!userIds.has(asset.userId)) {
        errors.push({
          type: 'reference',
          severity: 'critical',
          entity: 'asset',
          field: 'userId',
          message: `Asset references non-existent user: ${asset.userId}`,
          recordId: asset.id,
          suggestedFix: 'Remove asset or fix user reference'
        });
      }
    }

    // Check calculation-user references
    for (const calculation of calculations) {
      if (!userIds.has(calculation.userId)) {
        errors.push({
          type: 'reference',
          severity: 'critical',
          entity: 'calculation',
          field: 'userId',
          message: `Calculation references non-existent user: ${calculation.userId}`,
          recordId: calculation.id,
          suggestedFix: 'Remove calculation or fix user reference'
        });
      }

      if (!methodologyIds.has(calculation.methodologyId)) {
        errors.push({
          type: 'reference',
          severity: 'critical',
          entity: 'calculation',
          field: 'methodologyId',
          message: `Calculation references non-existent methodology: ${calculation.methodologyId}`,
          recordId: calculation.id,
          suggestedFix: 'Remove calculation or fix methodology reference'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Calculates encryption integrity percentage
   */
  private static async calculateEncryptionIntegrity(assets: any[]): Promise<number> {
    if (assets.length === 0) return 100;

    let validEncryption = 0;
    for (const asset of assets) {
      if (asset.encryptedData) {
        try {
          await this.encryptionService.decrypt(asset.encryptedData);
          validEncryption++;
        } catch {
          // Encryption failed, don't increment
        }
      } else {
        validEncryption++; // Assets without encryption are considered valid
      }
    }

    return Math.round((validEncryption / assets.length) * 100);
  }

  /**
   * Calculates referential integrity percentage
   */
  private static calculateReferentialIntegrity(errors: IntegrityError[], totalRecords: number): Promise<number> {
    if (totalRecords === 0) return Promise.resolve(100);
    
    const referenceErrors = errors.filter(e => e.type === 'reference').length;
    const integrity = Math.max(0, 100 - (referenceErrors / totalRecords) * 100);
    return Promise.resolve(Math.round(integrity));
  }

  /**
   * Calculates calculation accuracy percentage
   */
  private static async calculateCalculationAccuracy(calculations: any[]): Promise<number> {
    if (calculations.length === 0) return 100;

    let accurateCalculations = 0;
    for (const calculation of calculations) {
      if (calculation.totalAssets > 0 && calculation.totalZakat > 0) {
        const expectedZakat = calculation.totalAssets * 0.025;
        const accuracy = 1 - Math.abs(calculation.totalZakat - expectedZakat) / expectedZakat;
        if (accuracy > 0.9) { // 90% accuracy threshold
          accurateCalculations++;
        }
      } else {
        accurateCalculations++; // Empty calculations are considered accurate
      }
    }

    return Math.round((accurateCalculations / calculations.length) * 100);
  }

  /**
   * Determines overall health based on score and errors
   */
  private static determineOverallHealth(score: number, errors: IntegrityError[]): IntegritySummary['overallHealth'] {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    
    if (criticalErrors > 0) return 'critical';
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Validates email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generates integrity report checksum
   */
  static generateReportChecksum(result: IntegrityCheckResult): string {
    const reportData = {
      timestamp: result.timestamp,
      score: result.score,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      totalRecords: result.summary.totalRecords
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(reportData))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Validates report checksum
   */
  static validateReportChecksum(result: IntegrityCheckResult, expectedChecksum: string): boolean {
    const actualChecksum = this.generateReportChecksum(result);
    return actualChecksum === expectedChecksum;
  }
}

export default IntegrityChecker;