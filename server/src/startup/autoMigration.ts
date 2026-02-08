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

import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../services/EncryptionService';
import { Logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const logger = new Logger('AutoMigration');
const prisma = new PrismaClient();

interface MigrationResult {
  success: boolean;
  backupPath?: string;
  paymentRecordsMigrated: number;
  userProfilesMigrated: number;
  errors: string[];
  skipped: boolean;
  reason?: string;
}

/**
 * Detect if an encrypted string is in CBC format (2 parts) or GCM format (3 parts)
 */
function isCbcFormat(encrypted: string): boolean {
  if (!encrypted || typeof encrypted !== 'string') return false;
  
  const raw = encrypted.trim();
  
  // Check if it's a colon-separated format
  const parts = raw.split(':');
  if (parts.length === 2) {
    // CBC format: iv:encrypted (2 parts, no auth tag)
    return true;
  }
  
  // Check if it's an object format (legacy CBC)
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.iv && parsed.encryptedData) {
      return true;
    }
  } catch (e) {
    // Not JSON
  }
  
  return false;
}

/**
 * Create a database backup before migration
 */
async function createBackup(): Promise<string> {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/data/prod.db';
  let dbPath = dbUrl.replace(/^file:/, '');
  
  // Resolve relative paths from server root
  if (!path.isAbsolute(dbPath)) {
    dbPath = path.resolve(__dirname, '../..', dbPath);
  }
  
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found: ${dbPath}`);
  }
  
  // Generate timestamp
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('');
  
  const backupPath = `${dbPath}.backup-migration-${timestamp}`;
  
  // Copy database file
  fs.copyFileSync(dbPath, backupPath);
  
  // Verify backup
  const originalSize = fs.statSync(dbPath).size;
  const backupSize = fs.statSync(backupPath).size;
  
  if (originalSize !== backupSize) {
    throw new Error('Backup verification failed: size mismatch');
  }
  
  // Generate checksum for verification
  const hash = crypto.createHash('sha256');
  const backupData = fs.readFileSync(backupPath);
  hash.update(backupData);
  const checksum = hash.digest('hex');
  
  logger.info(`Database backup created: ${backupPath} (${backupSize} bytes, SHA256: ${checksum.slice(0, 16)}...)`);
  
  return backupPath;
}

/**
 * Migrate payment records from CBC to GCM
 */
async function migratePaymentRecords(): Promise<{ migrated: number; errors: string[] }> {
  const payments = await prisma.paymentRecord.findMany({
    select: { id: true, recipientName: true, amount: true }
  });
  
  let migrated = 0;
  const errors: string[] = [];
  
  logger.info(`Checking ${payments.length} payment records for migration...`);
  
  for (const payment of payments) {
    if (!payment.recipientName) continue;
    
    try {
      // Check if it's CBC format
      if (!isCbcFormat(payment.recipientName)) {
        continue; // Already GCM or not encrypted
      }
      
      // Decrypt with current key (supports both CBC and GCM)
      const decrypted = await EncryptionService.decrypt(
        payment.recipientName,
        process.env.ENCRYPTION_KEY || ''
      );
      
      // Re-encrypt with GCM format
      const reencrypted = await EncryptionService.encrypt(
        decrypted,
        process.env.ENCRYPTION_KEY || ''
      );
      
      // Update database
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: { recipientName: reencrypted }
      });
      
      migrated++;
      
      if (migrated % 10 === 0) {
        logger.info(`Migrated ${migrated} payment records...`);
      }
    } catch (error) {
      const errorMsg = `Failed to migrate payment ${payment.id}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  return { migrated, errors };
}

/**
 * Migrate user profiles from CBC to GCM
 */
async function migrateUserProfiles(): Promise<{ migrated: number; errors: string[] }> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, profile: true }
  });
  
  let migrated = 0;
  const errors: string[] = [];
  
  logger.info(`Checking ${users.length} user profiles for migration...`);
  
  for (const user of users) {
    if (!user.profile) continue;
    
    try {
      const profileStr = typeof user.profile === 'string' ? user.profile : JSON.stringify(user.profile);
      
      // Check if it's CBC format
      if (!isCbcFormat(profileStr)) {
        continue; // Already GCM or not encrypted
      }
      
      // Decrypt with current key (supports both CBC and GCM)
      const decrypted = await EncryptionService.decryptObject(
        user.profile as any,
        process.env.ENCRYPTION_KEY || ''
      );
      
      // Re-encrypt with GCM format
      const reencrypted = await EncryptionService.encryptObject(
        decrypted,
        process.env.ENCRYPTION_KEY || ''
      );
      
      // Update database
      await prisma.user.update({
        where: { id: user.id },
        data: { profile: reencrypted }
      });
      
      migrated++;
      
      if (migrated % 10 === 0) {
        logger.info(`Migrated ${migrated} user profiles...`);
      }
    } catch (error) {
      const errorMsg = `Failed to migrate user profile ${user.id}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  return { migrated, errors };
}

/**
 * Check if migration is needed by scanning for CBC-formatted encrypted data
 */
async function checkMigrationNeeded(): Promise<boolean> {
  // Check a sample of payment records
  const samplePayments = await prisma.paymentRecord.findMany({
    take: 100,
    select: { recipientName: true }
  });
  
  for (const payment of samplePayments) {
    if (payment.recipientName && isCbcFormat(payment.recipientName)) {
      return true;
    }
  }
  
  // Check a sample of user profiles
  const sampleUsers = await prisma.user.findMany({
    take: 100,
    select: { profile: true }
  });
  
  for (const user of sampleUsers) {
    if (user.profile) {
      const profileStr = typeof user.profile === 'string' ? user.profile : JSON.stringify(user.profile);
      if (isCbcFormat(profileStr)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Run automatic encryption migration on startup
 * Migrates all CBC-encrypted data to GCM format
 */
export async function runAutoMigration(): Promise<MigrationResult> {
  const startTime = Date.now();
  
  logger.info('=== Encryption Migration Check ===');
  
  try {
    // Check if migration is needed
    logger.info('Scanning for CBC-formatted encrypted data...');
    const migrationNeeded = await checkMigrationNeeded();
    
    if (!migrationNeeded) {
      logger.info('✓ No CBC-formatted encrypted data found. Migration not required.');
      return {
        success: true,
        skipped: true,
        reason: 'No CBC-formatted data found',
        paymentRecordsMigrated: 0,
        userProfilesMigrated: 0,
        errors: []
      };
    }
    
    logger.warn('⚠ CBC-formatted encrypted data detected. Starting migration...');
    
    // Create backup before migration
    logger.info('Creating database backup...');
    const backupPath = await createBackup();
    logger.info(`✓ Backup created: ${backupPath}`);
    
    // Migrate payment records
    logger.info('Migrating payment records...');
    const paymentResult = await migratePaymentRecords();
    logger.info(`✓ Migrated ${paymentResult.migrated} payment records`);
    
    // Migrate user profiles
    logger.info('Migrating user profiles...');
    const userResult = await migrateUserProfiles();
    logger.info(`✓ Migrated ${userResult.migrated} user profiles`);
    
    // Combine errors
    const allErrors = [...paymentResult.errors, ...userResult.errors];
    
    if (allErrors.length > 0) {
      logger.warn(`⚠ Migration completed with ${allErrors.length} errors`);
      allErrors.forEach(err => logger.error(`  - ${err}`));
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`=== Migration Complete (${duration}s) ===`);
    
    return {
      success: true,
      skipped: false,
      backupPath,
      paymentRecordsMigrated: paymentResult.migrated,
      userProfilesMigrated: userResult.migrated,
      errors: allErrors
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Migration failed after ${duration}s: ${errorMsg}`);
    
    return {
      success: false,
      skipped: false,
      paymentRecordsMigrated: 0,
      userProfilesMigrated: 0,
      errors: [errorMsg]
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Initialize auto-migration on server startup
 * Call this before app.listen()
 */
export async function initAutoMigration(): Promise<void> {
  // Skip migration in test environment
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping auto-migration in test environment');
    return;
  }
  
  try {
    const result = await runAutoMigration();
    
    if (!result.success) {
      logger.error('⚠ Auto-migration failed. Server will continue but encrypted data may be in mixed format.');
      logger.error('Please check logs and run manual migration if needed.');
    }
  } catch (error) {
    logger.error(`Auto-migration initialization error: ${error instanceof Error ? error.message : String(error)}`);
    logger.error('Server will continue but encrypted data may not be migrated.');
  }
}
