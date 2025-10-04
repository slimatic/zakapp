/**
 * BackupService Utility
 * 
 * Comprehensive backup and rollback system for ZakApp data protection.
 * 
 * Constitutional Compliance:
 * - Privacy & Security First: Encrypted backups with secure storage
 * - User-Centric Design: Easy backup/restore with progress tracking
 * - Quality & Reliability: Verified backups with integrity checks
 * - Transparency & Trust: Clear backup status and audit trails
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import { AssetModel } from '../models/Asset';
import { UserModel } from '../models/User';
import { MethodologyModel } from '../models/Methodology';
import { ZakatCalculationModel } from '../models/ZakatCalculation';
import { EncryptionService } from '../services/EncryptionService';
import IntegrityChecker from './IntegrityChecker';

// Backup types and interfaces
interface BackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  description?: string;
  type: 'full' | 'incremental' | 'manual' | 'pre_migration';
  size: number;
  checksum: string;
  encrypted: boolean;
  entities: {
    users: number;
    assets: number;
    methodologies: number;
    calculations: number;
  };
  integrityCheck?: {
    passed: boolean;
    score: number;
    errors: number;
    warnings: number;
  };
}

interface BackupData {
  metadata: BackupMetadata;
  data: {
    users: any[];
    assets: any[];
    methodologies: any[];
    calculations: any[];
  };
}

interface RestoreResult {
  success: boolean;
  restoredRecords: number;
  errors: string[];
  warnings: string[];
  executionTime: number;
  backupRestored: string;
}

interface BackupOptions {
  encrypt?: boolean;
  includeIntegrityCheck?: boolean;
  description?: string;
  entities?: ('users' | 'assets' | 'methodologies' | 'calculations')[];
  outputPath?: string;
}

interface RestoreOptions {
  verifyIntegrity?: boolean;
  createBackupBeforeRestore?: boolean;
  skipValidation?: boolean;
  entities?: ('users' | 'assets' | 'methodologies' | 'calculations')[];
}

/**
 * BackupService
 * 
 * Manages data backup, restore, and rollback operations
 */
export class BackupService {
  private static readonly BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');
  private static readonly ROLLBACK_DIR = path.join(process.cwd(), 'data', 'rollbacks');
  private static readonly MAX_BACKUPS = 50; // Keep last 50 backups
  private static readonly MAX_ROLLBACKS = 10; // Keep last 10 rollback points
  private static encryptionService = new EncryptionService();

  /**
   * Initializes backup directories
   */
  static async initialize(): Promise<void> {
    await Promise.all([
      fs.mkdir(this.BACKUP_DIR, { recursive: true }),
      fs.mkdir(this.ROLLBACK_DIR, { recursive: true })
    ]);
  }

  /**
   * Creates a full backup of the database
   */
  static async createBackup(options: BackupOptions = {}): Promise<BackupMetadata> {
    await this.initialize();

    const defaultOptions: BackupOptions = {
      encrypt: true,
      includeIntegrityCheck: true,
      entities: ['users', 'assets', 'methodologies', 'calculations']
    };

    const backupOptions = { ...defaultOptions, ...options };
    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();

    try {
      // Collect data from specified entities
      const data: any = {};
      const entityCounts: any = {};

      if (backupOptions.entities?.includes('users')) {
        data.users = await UserModel.findAll();
        entityCounts.users = data.users.length;
      } else {
        data.users = [];
        entityCounts.users = 0;
      }

      if (backupOptions.entities?.includes('assets')) {
        data.assets = await AssetModel.findAll();
        entityCounts.assets = data.assets.length;
      } else {
        data.assets = [];
        entityCounts.assets = 0;
      }

      if (backupOptions.entities?.includes('methodologies')) {
        data.methodologies = await MethodologyModel.findAll();
        entityCounts.methodologies = data.methodologies.length;
      } else {
        data.methodologies = [];
        entityCounts.methodologies = 0;
      }

      if (backupOptions.entities?.includes('calculations')) {
        data.calculations = await ZakatCalculationModel.findAll();
        entityCounts.calculations = data.calculations.length;
      } else {
        data.calculations = [];
        entityCounts.calculations = 0;
      }

      // Perform integrity check if requested
      let integrityCheck;
      if (backupOptions.includeIntegrityCheck) {
        const integrityResult = await IntegrityChecker.performIntegrityCheck({
          entities: backupOptions.entities
        });
        integrityCheck = {
          passed: integrityResult.passed,
          score: integrityResult.score,
          errors: integrityResult.errors.length,
          warnings: integrityResult.warnings.length
        };
      }

      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        description: backupOptions.description || 'Automated database backup',
        type: 'full',
        size: 0, // Will be calculated after serialization
        checksum: '', // Will be calculated after serialization
        encrypted: backupOptions.encrypt || false,
        entities: entityCounts,
        integrityCheck
      };

      // Create backup data structure
      const backupData: BackupData = {
        metadata,
        data
      };

      // Serialize and optionally encrypt
      let serializedData = JSON.stringify(backupData, null, 2);
      
      if (backupOptions.encrypt) {
        serializedData = await this.encryptionService.encrypt(serializedData);
      }

      // Calculate size and checksum
      metadata.size = Buffer.byteLength(serializedData, 'utf8');
      metadata.checksum = crypto
        .createHash('sha256')
        .update(serializedData)
        .digest('hex');

      // Update backup data with final metadata
      backupData.metadata = metadata;
      
      // Re-serialize with updated metadata
      if (backupOptions.encrypt) {
        serializedData = await this.encryptionService.encrypt(JSON.stringify(backupData, null, 2));
      } else {
        serializedData = JSON.stringify(backupData, null, 2);
      }

      // Write backup file
      const filename = this.generateBackupFilename(backupId, timestamp, backupOptions.encrypt);
      const filePath = backupOptions.outputPath || path.join(this.BACKUP_DIR, filename);
      
      await fs.writeFile(filePath, serializedData);

      // Cleanup old backups
      await this.cleanupOldBackups();

      console.log(`[BackupService] Created backup: ${backupId} (${metadata.size} bytes)`);
      return metadata;
    } catch (error) {
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates an incremental backup (only changed data)
   */
  static async createIncrementalBackup(lastBackupTime: string, options: BackupOptions = {}): Promise<BackupMetadata> {
    // For simplicity, this implementation creates a full backup with timestamp filter
    // In a production environment, this would compare with the last backup
    const backupOptions = { ...options, description: `Incremental backup since ${lastBackupTime}` };
    const metadata = await this.createBackup(backupOptions);
    metadata.type = 'incremental';
    return metadata;
  }

  /**
   * Lists available backups
   */
  static async listBackups(): Promise<BackupMetadata[]> {
    await this.initialize();

    try {
      const files = await fs.readdir(this.BACKUP_DIR);
      const backupFiles = files.filter(file => 
        file.endsWith('.backup.json') || file.endsWith('.backup.enc')
      );

      const backups: BackupMetadata[] = [];

      for (const file of backupFiles) {
        try {
          const filePath = path.join(this.BACKUP_DIR, file);
          const metadata = await this.getBackupMetadata(filePath);
          if (metadata) {
            backups.push(metadata);
          }
        } catch (error) {
          console.warn(`[BackupService] Failed to read backup metadata: ${file}`);
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      throw new Error(`Failed to list backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets backup metadata without loading full backup
   */
  static async getBackupMetadata(backupPath: string): Promise<BackupMetadata | null> {
    try {
      let fileContent = await fs.readFile(backupPath, 'utf-8');
      
      // Check if encrypted
      if (backupPath.endsWith('.enc')) {
        fileContent = await this.encryptionService.decrypt(fileContent);
      }

      const backupData = JSON.parse(fileContent) as BackupData;
      return backupData.metadata;
    } catch (error) {
      console.warn(`[BackupService] Failed to read backup metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Validates a backup file
   */
  static async validateBackup(backupPath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check file exists
      await fs.access(backupPath);

      // Read and parse backup
      let fileContent = await fs.readFile(backupPath, 'utf-8');
      
      if (backupPath.endsWith('.enc')) {
        try {
          fileContent = await this.encryptionService.decrypt(fileContent);
        } catch (error) {
          errors.push(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return { valid: false, errors };
        }
      }

      const backupData = JSON.parse(fileContent) as BackupData;

      // Validate structure
      if (!backupData.metadata) {
        errors.push('Missing backup metadata');
      }

      if (!backupData.data) {
        errors.push('Missing backup data');
      }

      // Validate checksum
      if (backupData.metadata.checksum) {
        const calculatedChecksum = crypto
          .createHash('sha256')
          .update(fileContent)
          .digest('hex');
        
        if (calculatedChecksum !== backupData.metadata.checksum) {
          errors.push('Checksum validation failed - backup may be corrupted');
        }
      }

      // Validate required fields
      const requiredFields = ['id', 'timestamp', 'version', 'type'];
      for (const field of requiredFields) {
        if (!backupData.metadata[field as keyof BackupMetadata]) {
          errors.push(`Missing required metadata field: ${field}`);
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Backup validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }

  /**
   * Restores database from backup
   */
  static async restoreFromBackup(backupPath: string, options: RestoreOptions = {}): Promise<RestoreResult> {
    const startTime = Date.now();
    const result: RestoreResult = {
      success: false,
      restoredRecords: 0,
      errors: [],
      warnings: [],
      executionTime: 0,
      backupRestored: backupPath
    };

    try {
      // Validate backup if requested
      if (!options.skipValidation) {
        const validation = await this.validateBackup(backupPath);
        if (!validation.valid) {
          result.errors.push(...validation.errors);
          return result;
        }
      }

      // Create backup before restore if requested
      if (options.createBackupBeforeRestore) {
        try {
          await this.createRollbackPoint('pre_restore_backup');
          result.warnings.push('Created rollback point before restore');
        } catch (error) {
          result.warnings.push(`Failed to create rollback point: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Load backup data
      let fileContent = await fs.readFile(backupPath, 'utf-8');
      
      if (backupPath.endsWith('.enc')) {
        fileContent = await this.encryptionService.decrypt(fileContent);
      }

      const backupData = JSON.parse(fileContent) as BackupData;

      // Restore entities
      const defaultOptions: RestoreOptions = {
        verifyIntegrity: true,
        entities: ['users', 'assets', 'methodologies', 'calculations']
      };

      const restoreOptions = { ...defaultOptions, ...options };
      let totalRestored = 0;

      // Clear existing data for selected entities
      if (restoreOptions.entities?.includes('calculations')) {
        await ZakatCalculationModel.deleteAll();
      }
      if (restoreOptions.entities?.includes('assets')) {
        await AssetModel.deleteAll();
      }
      if (restoreOptions.entities?.includes('methodologies')) {
        await MethodologyModel.deleteAll();
      }
      if (restoreOptions.entities?.includes('users')) {
        await UserModel.deleteAll();
      }

      // Restore data in order (maintain referential integrity)
      if (restoreOptions.entities?.includes('users') && backupData.data.users) {
        for (const user of backupData.data.users) {
          try {
            await UserModel.create(user);
            totalRestored++;
          } catch (error) {
            result.errors.push(`Failed to restore user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (restoreOptions.entities?.includes('methodologies') && backupData.data.methodologies) {
        for (const methodology of backupData.data.methodologies) {
          try {
            await MethodologyModel.create(methodology);
            totalRestored++;
          } catch (error) {
            result.errors.push(`Failed to restore methodology ${methodology.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (restoreOptions.entities?.includes('assets') && backupData.data.assets) {
        for (const asset of backupData.data.assets) {
          try {
            await AssetModel.create(asset);
            totalRestored++;
          } catch (error) {
            result.errors.push(`Failed to restore asset ${asset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (restoreOptions.entities?.includes('calculations') && backupData.data.calculations) {
        for (const calculation of backupData.data.calculations) {
          try {
            await ZakatCalculationModel.create(calculation);
            totalRestored++;
          } catch (error) {
            result.errors.push(`Failed to restore calculation ${calculation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      result.restoredRecords = totalRestored;

      // Verify integrity if requested
      if (options.verifyIntegrity) {
        const integrityResult = await IntegrityChecker.performIntegrityCheck({
          entities: restoreOptions.entities
        });

        if (!integrityResult.passed) {
          result.warnings.push(`Integrity check failed after restore: ${integrityResult.errors.length} errors found`);
        } else {
          result.warnings.push('Integrity check passed after restore');
        }
      }

      result.success = result.errors.length === 0;
      result.executionTime = Date.now() - startTime;

      console.log(`[BackupService] Restore completed: ${totalRestored} records restored`);
      return result;
    } catch (error) {
      result.errors.push(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.executionTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Creates a rollback point
   */
  static async createRollbackPoint(description: string = 'Manual rollback point'): Promise<string> {
    const rollbackId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    
    const metadata = await this.createBackup({
      encrypt: true,
      includeIntegrityCheck: true,
      description: `Rollback point: ${description}`,
      outputPath: path.join(this.ROLLBACK_DIR, this.generateBackupFilename(rollbackId, timestamp, true))
    });

    await this.cleanupOldRollbacks();
    
    console.log(`[BackupService] Created rollback point: ${rollbackId}`);
    return rollbackId;
  }

  /**
   * Lists available rollback points
   */
  static async listRollbackPoints(): Promise<BackupMetadata[]> {
    await this.initialize();

    try {
      const files = await fs.readdir(this.ROLLBACK_DIR);
      const rollbackFiles = files.filter(file => 
        file.endsWith('.backup.json') || file.endsWith('.backup.enc')
      );

      const rollbacks: BackupMetadata[] = [];

      for (const file of rollbackFiles) {
        try {
          const filePath = path.join(this.ROLLBACK_DIR, file);
          const metadata = await this.getBackupMetadata(filePath);
          if (metadata) {
            rollbacks.push(metadata);
          }
        } catch (error) {
          console.warn(`[BackupService] Failed to read rollback metadata: ${file}`);
        }
      }

      return rollbacks.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      throw new Error(`Failed to list rollback points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executes rollback to a specific point
   */
  static async rollback(rollbackId: string): Promise<RestoreResult> {
    const rollbackFiles = await fs.readdir(this.ROLLBACK_DIR);
    const rollbackFile = rollbackFiles.find(file => file.includes(rollbackId));

    if (!rollbackFile) {
      throw new Error(`Rollback point not found: ${rollbackId}`);
    }

    const rollbackPath = path.join(this.ROLLBACK_DIR, rollbackFile);
    
    // Create a backup before rollback
    await this.createRollbackPoint('pre_rollback_backup');

    // Restore from rollback point
    const result = await this.restoreFromBackup(rollbackPath, {
      verifyIntegrity: true,
      createBackupBeforeRestore: false // Already created above
    });

    console.log(`[BackupService] Rollback completed: ${rollbackId}`);
    return result;
  }

  /**
   * Generates unique backup ID
   */
  private static generateBackupId(): string {
    return `backup_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Generates backup filename
   */
  private static generateBackupFilename(id: string, timestamp: string, encrypted: boolean): string {
    const date = new Date(timestamp).toISOString().split('T')[0];
    const extension = encrypted ? '.backup.enc' : '.backup.json';
    return `${id}_${date}${extension}`;
  }

  /**
   * Cleanup old backups (keep only MAX_BACKUPS)
   */
  private static async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.MAX_BACKUPS) {
        const toDelete = backups.slice(this.MAX_BACKUPS);
        
        for (const backup of toDelete) {
          const files = await fs.readdir(this.BACKUP_DIR);
          const backupFile = files.find(file => file.includes(backup.id));
          
          if (backupFile) {
            await fs.unlink(path.join(this.BACKUP_DIR, backupFile));
            console.log(`[BackupService] Cleaned up old backup: ${backup.id}`);
          }
        }
      }
    } catch (error) {
      console.warn(`[BackupService] Failed to cleanup old backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cleanup old rollback points (keep only MAX_ROLLBACKS)
   */
  private static async cleanupOldRollbacks(): Promise<void> {
    try {
      const rollbacks = await this.listRollbackPoints();
      
      if (rollbacks.length > this.MAX_ROLLBACKS) {
        const toDelete = rollbacks.slice(this.MAX_ROLLBACKS);
        
        for (const rollback of toDelete) {
          const files = await fs.readdir(this.ROLLBACK_DIR);
          const rollbackFile = files.find(file => file.includes(rollback.id));
          
          if (rollbackFile) {
            await fs.unlink(path.join(this.ROLLBACK_DIR, rollbackFile));
            console.log(`[BackupService] Cleaned up old rollback: ${rollback.id}`);
          }
        }
      }
    } catch (error) {
      console.warn(`[BackupService] Failed to cleanup old rollbacks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets backup statistics
   */
  static async getBackupStatistics(): Promise<{
    totalBackups: number;
    totalRollbacks: number;
    totalSize: number;
    oldestBackup?: string;
    newestBackup?: string;
    integrityStatus: 'healthy' | 'warnings' | 'errors';
  }> {
    const [backups, rollbacks] = await Promise.all([
      this.listBackups(),
      this.listRollbackPoints()
    ]);

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    
    let integrityStatus: 'healthy' | 'warnings' | 'errors' = 'healthy';
    for (const backup of backups.slice(0, 5)) { // Check last 5 backups
      if (backup.integrityCheck) {
        if (!backup.integrityCheck.passed) {
          integrityStatus = 'errors';
          break;
        } else if (backup.integrityCheck.warnings > 0) {
          integrityStatus = 'warnings';
        }
      }
    }

    return {
      totalBackups: backups.length,
      totalRollbacks: rollbacks.length,
      totalSize,
      oldestBackup: backups[backups.length - 1]?.timestamp,
      newestBackup: backups[0]?.timestamp,
      integrityStatus
    };
  }
}

export default BackupService;