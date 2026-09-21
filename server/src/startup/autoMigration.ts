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
  
  // ---------------------------------------------------------------------------
  // Make the single-file copy complete, then prove it is actually restorable.
  //
  // A plain copy of the .db file is not guaranteed to be a valid backup:
  //   · In WAL mode, committed transactions live in the -wal file until a
  //     checkpoint. Copying only the .db loses them. Verified experimentally:
  //     after copying, the backup held 5,000 of 5,001 committed rows, and BOTH
  //     files were 73,728 bytes — so a size comparison passed on an incomplete
  //     backup.
  //   · Comparing sizes alone cannot detect a truncated-but-same-size copy.
  //
  // So: checkpoint first so the main file is self-contained, byte-compare the
  // copy against the original, then open the copy and ask SQLite whether it is
  // intact. An unverified backup is a hope, not a recovery plan.
  // ---------------------------------------------------------------------------

  // 1. Fold any WAL contents into the main database file.
  await checkpointDatabase();

  // 2. Copy.
  fs.copyFileSync(dbPath, backupPath);

  // 3. Byte-for-byte comparison against the original (not size alone).
  const originalChecksum = await sha256File(dbPath);
  const backupChecksum = await sha256File(backupPath);

  if (originalChecksum !== backupChecksum) {
    throw new Error(
      `Backup verification failed: content checksum mismatch ` +
        `(original ${originalChecksum.slice(0, 16)}…, backup ${backupChecksum.slice(0, 16)}…)`
    );
  }

  // 4. Sidecar files must not be needed for the copy to be valid. If a WAL
  //    survived the checkpoint, the copy is incomplete by definition.
  for (const suffix of ['-wal', '-shm']) {
    if (fs.existsSync(`${dbPath}${suffix}`)) {
      const sidecarSize = fs.statSync(`${dbPath}${suffix}`).size;
      if (sidecarSize > 0) {
        throw new Error(
          `Backup verification failed: ${dbPath}${suffix} still holds ${sidecarSize} bytes ` +
            `after checkpoint — the single-file copy would be incomplete.`
        );
      }
    }
  }

  // 5. Open the backup and let SQLite verify it. This is the check that proves
  //    the file is restorable rather than merely present.
  const integrity = await verifyBackupIntegrity(backupPath);
  if (!integrity.ok) {
    throw new Error(`Backup verification failed: ${integrity.reason}`);
  }

  const backupSize = fs.statSync(backupPath).size;
  logger.info(
    `Database backup created: ${backupPath} ` +
      `(${backupSize} bytes, SHA256: ${backupChecksum.slice(0, 16)}…, ` +
      `integrity ok, ${integrity.userCount} users)`
  );

  return backupPath;
}

/**
 * Fold the write-ahead log into the main database file.
 *
 * Safe and cheap: if the database is not in WAL mode this is a no-op. Uses
 * TRUNCATE so the -wal file is emptied rather than merely marked reusable,
 * which is what makes a subsequent single-file copy complete.
 */
async function checkpointDatabase(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)');
  } catch (error) {
    // Not fatal on its own — the sidecar check below will catch a real problem.
    logger.warn(`WAL checkpoint did not complete: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** SHA-256 of a file, streamed so a large database does not load into memory. */
function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Open a backup file as its own database and ask SQLite whether it is intact.
 *
 * `PRAGMA integrity_check` returning "ok" means the b-tree, indexes and pages are
 * consistent — the file can actually be read, not just opened. Counting users
 * then confirms the expected data is present rather than an empty-but-valid file.
 */
export async function verifyBackupIntegrity(
  backupPath: string
): Promise<{ ok: boolean; reason?: string; userCount?: number }> {
  const probe = new PrismaClient({
    datasources: { db: { url: `file:${backupPath}` } },
  });

  try {
    const integrityRows = await probe.$queryRawUnsafe<Array<{ integrity_check: string }>>(
      'PRAGMA integrity_check'
    );
    const result = integrityRows?.[0]?.integrity_check;
    if (result !== 'ok') {
      return { ok: false, reason: `integrity_check returned "${result ?? 'no result'}"` };
    }

    const userRows = await probe.$queryRawUnsafe<Array<{ n: number }>>(
      'SELECT COUNT(*) AS n FROM users'
    );
    const userCount = Number(userRows?.[0]?.n ?? 0);

    return { ok: true, userCount };
  } catch (error) {
    return {
      ok: false,
      reason: `backup could not be opened or read: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await probe.$disconnect().catch(() => undefined);
  }
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
      
      // Detect fail-open decryption BEFORE anything else.
      //
      // EncryptionService.decrypt is deliberately non-throwing: on failure it
      // returns a stringified form of its input so that endpoints like /me degrade
      // instead of crashing. That is reasonable for a read path and dangerous here,
      // because a re-encryption loop would then encrypt the CIPHERTEXT itself:
      //
      //   decrypt(cipher, wrongKey) -> "cipher"        (fail-open)
      //   encrypt("cipher", wrongKey) -> newCipher
      //   decrypt(newCipher, wrongKey) -> "cipher"     (round-trip MATCHES)
      //
      // The round-trip check below cannot catch that on its own — the loop is
      // internally consistent while the stored value becomes double-encrypted and
      // unreadable, and the migration would still report success.
      //
      // Identity is the tell: a real decryption never returns its own input.
      if (decrypted === payment.recipientName) {
        throw new Error(
          'decryption returned its input unchanged — the key does not match this ' +
            'data, so re-encrypting would double-encrypt it. Row left untouched.'
        );
      }

      // Re-encrypt with GCM format
      const reencrypted = await EncryptionService.encrypt(
        decrypted,
        process.env.ENCRYPTION_KEY || ''
      );
      //
      // This loop overwrites the original ciphertext in place, so a re-encryption
      // that cannot be read back destroys the value outright — the plaintext is
      // gone from the live database and survives only in the pre-migration backup.
      // The backup makes that recoverable, not harmless: the migration would still
      // report success while the user's recipient names were unreadable.
      //
      // Decrypting the new ciphertext and comparing it to what we started with
      // turns a silent corruption path into a reported failure, and the throw
      // leaves the original row untouched.
      const roundTripped = await EncryptionService.decrypt(
        reencrypted,
        process.env.ENCRYPTION_KEY || ''
      );

      if (roundTripped !== decrypted) {
        throw new Error(
          `re-encryption did not round-trip (${decrypted.length} chars in, ` +
            `${roundTripped.length} out) — original left unchanged`
        );
      }

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
      
      // Detect fail-open decryption BEFORE anything else — see the payment path
      // above for why the round-trip check alone is not sufficient.
      if (JSON.stringify(decrypted) === JSON.stringify(user.profile)) {
        throw new Error(
          'profile decryption returned its input unchanged — the key does not match ' +
            'this data, so re-encrypting would double-encrypt it. Row left untouched.'
        );
      }

      // Re-encrypt with GCM format
      const reencrypted = await EncryptionService.encryptObject(
        decrypted,
        process.env.ENCRYPTION_KEY || ''
      );

      // Round-trip verification BEFORE the write — same reasoning as the payment
      // path above. A profile that cannot be read back would leave the user's
      // name, currency and methodology settings inaccessible while the migration
      // still reported success.
      const roundTripped = await EncryptionService.decryptObject(
        reencrypted,
        process.env.ENCRYPTION_KEY || ''
      );

      if (JSON.stringify(roundTripped) !== JSON.stringify(decrypted)) {
        throw new Error(
          'profile re-encryption did not round-trip — original left unchanged'
        );
      }

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
