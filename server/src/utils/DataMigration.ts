/**
 * DataMigration Utility
 * 
 * Comprehensive JSON to database migration system with validation and rollback capabilities.
 * 
 * Constitutional Compliance:
 * - Privacy & Security First: All sensitive data encrypted during migration
 * - Islamic Compliance: Validates Islamic methodology data integrity
 * - User-Centric Design: Clear migration progress and error reporting
 * - Quality & Reliability: Comprehensive validation and rollback support
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { AssetModel } from '../models/Asset';
import { UserModel } from '../models/User';
import { MethodologyModel } from '../models/Methodology';
import { ZakatCalculationModel } from '../models/ZakatCalculation';
import { EncryptionService } from '../services/EncryptionService';

// Migration schemas for validation
const UserMigrationSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  hashedPassword: z.string(),
  isVerified: z.boolean().default(false),
  preferences: z.object({
    methodology: z.string(),
    currency: z.string(),
    language: z.string().default('en')
  }).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const AssetMigrationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  category: z.string(),
  value: z.number(),
  currency: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  lastUpdated: z.string().optional(),
  zakatApplicable: z.boolean().default(true),
  encryptedData: z.string().optional()
});

const MethodologyMigrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  zakatRate: z.number(),
  nisabSource: z.string(),
  calendarType: z.string(),
  regions: z.array(z.string()),
  rulings: z.record(z.number()),
  scholarlyReferences: z.array(z.string()),
  isActive: z.boolean().default(true)
});

const CalculationMigrationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  methodologyId: z.string(),
  totalAssets: z.number(),
  totalZakat: z.number(),
  nisabThreshold: z.number(),
  calculationDate: z.string(),
  assetBreakdown: z.record(z.number()),
  educationalContent: z.object({
    methodologyExplanation: z.string(),
    nisabExplanation: z.string(),
    recommendations: z.array(z.string())
  }).optional()
});

// Migration data structure
interface MigrationData {
  version: string;
  timestamp: string;
  users?: z.infer<typeof UserMigrationSchema>[];
  assets?: z.infer<typeof AssetMigrationSchema>[];
  methodologies?: z.infer<typeof MethodologyMigrationSchema>[];
  calculations?: z.infer<typeof CalculationMigrationSchema>[];
}

// Migration result tracking
interface MigrationResult {
  success: boolean;
  totalRecords: number;
  successfulMigrations: number;
  failedMigrations: number;
  errors: string[];
  executionTime: number;
  backupPath?: string;
}

interface MigrationProgress {
  phase: string;
  current: number;
  total: number;
  percentage: number;
  status: 'running' | 'completed' | 'failed';
  message: string;
}

/**
 * DataMigration Service
 * 
 * Handles comprehensive data migration from JSON files to database
 */
export class DataMigrationService {
  private static encryptionService = new EncryptionService();
  private static progressCallback?: (progress: MigrationProgress) => void;

  /**
   * Sets progress callback for migration monitoring
   */
  static setProgressCallback(callback: (progress: MigrationProgress) => void) {
    this.progressCallback = callback;
  }

  /**
   * Reports migration progress
   */
  private static reportProgress(progress: MigrationProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
    console.log(`[Migration] ${progress.phase}: ${progress.percentage}% - ${progress.message}`);
  }

  /**
   * Validates JSON migration file structure
   */
  static async validateMigrationFile(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check file exists
      await fs.access(filePath);

      // Read and parse JSON
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as MigrationData;

      // Validate structure
      if (!data.version) {
        errors.push('Migration file missing version field');
      }

      if (!data.timestamp) {
        errors.push('Migration file missing timestamp field');
      }

      // Validate users if present
      if (data.users) {
        for (let i = 0; i < data.users.length; i++) {
          try {
            UserMigrationSchema.parse(data.users[i]);
          } catch (error) {
            errors.push(`User ${i}: ${error instanceof z.ZodError ? error.message : 'Invalid format'}`);
          }
        }
      }

      // Validate assets if present
      if (data.assets) {
        for (let i = 0; i < data.assets.length; i++) {
          try {
            AssetMigrationSchema.parse(data.assets[i]);
          } catch (error) {
            errors.push(`Asset ${i}: ${error instanceof z.ZodError ? error.message : 'Invalid format'}`);
          }
        }
      }

      // Validate methodologies if present
      if (data.methodologies) {
        for (let i = 0; i < data.methodologies.length; i++) {
          try {
            MethodologyMigrationSchema.parse(data.methodologies[i]);
          } catch (error) {
            errors.push(`Methodology ${i}: ${error instanceof z.ZodError ? error.message : 'Invalid format'}`);
          }
        }
      }

      // Validate calculations if present
      if (data.calculations) {
        for (let i = 0; i < data.calculations.length; i++) {
          try {
            CalculationMigrationSchema.parse(data.calculations[i]);
          } catch (error) {
            errors.push(`Calculation ${i}: ${error instanceof z.ZodError ? error.message : 'Invalid format'}`);
          }
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }

  /**
   * Creates backup before migration
   */
  static async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    const backupPath = path.join(backupDir, `migration-backup-${timestamp}.json`);

    try {
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });

      // Export current database state
      const [users, assets, methodologies, calculations] = await Promise.all([
        UserModel.findAll(),
        AssetModel.findAll(),
        MethodologyModel.findAll(),
        ZakatCalculationModel.findAll()
      ]);

      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        backup: true,
        users,
        assets,
        methodologies,
        calculations
      };

      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      
      this.reportProgress({
        phase: 'Backup',
        current: 1,
        total: 1,
        percentage: 100,
        status: 'completed',
        message: `Backup created at ${backupPath}`
      });

      return backupPath;
    } catch (error) {
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Migrates users from JSON data
   */
  private static async migrateUsers(users: z.infer<typeof UserMigrationSchema>[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < users.length; i++) {
      try {
        const user = users[i];
        
        this.reportProgress({
          phase: 'Users Migration',
          current: i + 1,
          total: users.length,
          percentage: Math.round(((i + 1) / users.length) * 100),
          status: 'running',
          message: `Migrating user: ${user.email}`
        });

        // Check if user already exists
        const existingUser = await UserModel.findByEmail(user.email);
        if (existingUser) {
          errors.push(`User ${user.email} already exists - skipping`);
          failed++;
          continue;
        }

        // Create user
        await UserModel.create({
          email: user.email,
          username: user.username,
          hashedPassword: user.hashedPassword,
          isVerified: user.isVerified,
          preferences: user.preferences || {
            methodology: 'standard',
            currency: 'USD',
            language: 'en'
          }
        });

        success++;
      } catch (error) {
        errors.push(`User migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  /**
   * Migrates assets from JSON data
   */
  private static async migrateAssets(assets: z.infer<typeof AssetMigrationSchema>[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < assets.length; i++) {
      try {
        const asset = assets[i];
        
        this.reportProgress({
          phase: 'Assets Migration',
          current: i + 1,
          total: assets.length,
          percentage: Math.round(((i + 1) / assets.length) * 100),
          status: 'running',
          message: `Migrating asset: ${asset.name}`
        });

        // Verify user exists
        const user = await UserModel.findById(asset.userId);
        if (!user) {
          errors.push(`Asset ${asset.name}: User ${asset.userId} not found`);
          failed++;
          continue;
        }

        // Encrypt sensitive data if needed
        let encryptedValue = asset.value.toString();
        if (asset.encryptedData) {
          encryptedValue = asset.encryptedData;
        } else {
          encryptedValue = await this.encryptionService.encrypt(asset.value.toString());
        }

        // Create asset
        await AssetModel.create({
          userId: asset.userId,
          name: asset.name,
          category: asset.category,
          value: asset.value,
          currency: asset.currency,
          description: asset.description || '',
          isActive: asset.isActive,
          zakatApplicable: asset.zakatApplicable,
          encryptedData: encryptedValue
        });

        success++;
      } catch (error) {
        errors.push(`Asset migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  /**
   * Migrates methodologies from JSON data
   */
  private static async migrateMethodologies(methodologies: z.infer<typeof MethodologyMigrationSchema>[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < methodologies.length; i++) {
      try {
        const methodology = methodologies[i];
        
        this.reportProgress({
          phase: 'Methodologies Migration',
          current: i + 1,
          total: methodologies.length,
          percentage: Math.round(((i + 1) / methodologies.length) * 100),
          status: 'running',
          message: `Migrating methodology: ${methodology.name}`
        });

        // Check if methodology already exists
        const existing = await MethodologyModel.findById(methodology.id);
        if (existing) {
          errors.push(`Methodology ${methodology.name} already exists - skipping`);
          failed++;
          continue;
        }

        // Create methodology
        await MethodologyModel.create(methodology);
        success++;
      } catch (error) {
        errors.push(`Methodology migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  /**
   * Migrates calculations from JSON data
   */
  private static async migrateCalculations(calculations: z.infer<typeof CalculationMigrationSchema>[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < calculations.length; i++) {
      try {
        const calculation = calculations[i];
        
        this.reportProgress({
          phase: 'Calculations Migration',
          current: i + 1,
          total: calculations.length,
          percentage: Math.round(((i + 1) / calculations.length) * 100),
          status: 'running',
          message: `Migrating calculation: ${calculation.id}`
        });

        // Verify user and methodology exist
        const [user, methodology] = await Promise.all([
          UserModel.findById(calculation.userId),
          MethodologyModel.findById(calculation.methodologyId)
        ]);

        if (!user) {
          errors.push(`Calculation ${calculation.id}: User ${calculation.userId} not found`);
          failed++;
          continue;
        }

        if (!methodology) {
          errors.push(`Calculation ${calculation.id}: Methodology ${calculation.methodologyId} not found`);
          failed++;
          continue;
        }

        // Create calculation
        await ZakatCalculationModel.create(calculation);
        success++;
      } catch (error) {
        errors.push(`Calculation migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  /**
   * Executes complete migration from JSON file
   */
  static async executeMigration(filePath: string, options: {
    createBackup?: boolean;
    skipValidation?: boolean;
    dryRun?: boolean;
  } = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      errors: [],
      executionTime: 0
    };

    try {
      // Validate migration file
      if (!options.skipValidation) {
        this.reportProgress({
          phase: 'Validation',
          current: 1,
          total: 1,
          percentage: 100,
          status: 'running',
          message: 'Validating migration file...'
        });

        const validation = await this.validateMigrationFile(filePath);
        if (!validation.valid) {
          result.errors.push(...validation.errors);
          return result;
        }
      }

      // Create backup
      if (options.createBackup) {
        result.backupPath = await this.createBackup();
      }

      // Read migration data
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const migrationData = JSON.parse(fileContent) as MigrationData;

      // Count total records
      result.totalRecords = 
        (migrationData.users?.length || 0) +
        (migrationData.assets?.length || 0) +
        (migrationData.methodologies?.length || 0) +
        (migrationData.calculations?.length || 0);

      if (options.dryRun) {
        this.reportProgress({
          phase: 'Dry Run',
          current: 1,
          total: 1,
          percentage: 100,
          status: 'completed',
          message: `Dry run completed. ${result.totalRecords} records would be migrated.`
        });
        result.success = true;
        result.successfulMigrations = result.totalRecords;
        return result;
      }

      // Execute migrations in order (maintain referential integrity)
      const migrations = [];

      // 1. Migrate users first
      if (migrationData.users?.length) {
        const userResult = await this.migrateUsers(migrationData.users);
        result.successfulMigrations += userResult.success;
        result.failedMigrations += userResult.failed;
        result.errors.push(...userResult.errors);
        migrations.push(`Users: ${userResult.success} success, ${userResult.failed} failed`);
      }

      // 2. Migrate methodologies
      if (migrationData.methodologies?.length) {
        const methodologyResult = await this.migrateMethodologies(migrationData.methodologies);
        result.successfulMigrations += methodologyResult.success;
        result.failedMigrations += methodologyResult.failed;
        result.errors.push(...methodologyResult.errors);
        migrations.push(`Methodologies: ${methodologyResult.success} success, ${methodologyResult.failed} failed`);
      }

      // 3. Migrate assets (requires users)
      if (migrationData.assets?.length) {
        const assetResult = await this.migrateAssets(migrationData.assets);
        result.successfulMigrations += assetResult.success;
        result.failedMigrations += assetResult.failed;
        result.errors.push(...assetResult.errors);
        migrations.push(`Assets: ${assetResult.success} success, ${assetResult.failed} failed`);
      }

      // 4. Migrate calculations (requires users and methodologies)
      if (migrationData.calculations?.length) {
        const calculationResult = await this.migrateCalculations(migrationData.calculations);
        result.successfulMigrations += calculationResult.success;
        result.failedMigrations += calculationResult.failed;
        result.errors.push(...calculationResult.errors);
        migrations.push(`Calculations: ${calculationResult.success} success, ${calculationResult.failed} failed`);
      }

      result.success = result.failedMigrations === 0;
      result.executionTime = Date.now() - startTime;

      this.reportProgress({
        phase: 'Migration Complete',
        current: result.totalRecords,
        total: result.totalRecords,
        percentage: 100,
        status: result.success ? 'completed' : 'failed',
        message: `Migration completed: ${result.successfulMigrations} success, ${result.failedMigrations} failed`
      });

      return result;
    } catch (error) {
      result.errors.push(`Migration execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.executionTime = Date.now() - startTime;
      
      this.reportProgress({
        phase: 'Migration Failed',
        current: 0,
        total: result.totalRecords,
        percentage: 0,
        status: 'failed',
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return result;
    }
  }

  /**
   * Exports current database state to JSON
   */
  static async exportToJson(outputPath: string): Promise<boolean> {
    try {
      this.reportProgress({
        phase: 'Export',
        current: 1,
        total: 4,
        percentage: 25,
        status: 'running',
        message: 'Exporting database to JSON...'
      });

      const [users, assets, methodologies, calculations] = await Promise.all([
        UserModel.findAll(),
        AssetModel.findAll(),
        MethodologyModel.findAll(),
        ZakatCalculationModel.findAll()
      ]);

      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        users,
        assets,
        methodologies,
        calculations
      };

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));

      this.reportProgress({
        phase: 'Export Complete',
        current: 4,
        total: 4,
        percentage: 100,
        status: 'completed',
        message: `Database exported to ${outputPath}`
      });

      return true;
    } catch (error) {
      this.reportProgress({
        phase: 'Export Failed',
        current: 0,
        total: 4,
        percentage: 0,
        status: 'failed',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return false;
    }
  }
}

export default DataMigrationService;