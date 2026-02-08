#!/usr/bin/env ts-node
/**
 * Database Backup Utility
 * 
 * Creates a timestamped backup of the SQLite database file.
 * Used by the auto-migration process and can be run manually for backups.
 * 
 * Usage:
 *   npm run backup:db                    # Backup to default location
 *   npm run backup:db -- --output /path  # Backup to custom location
 *   ts-node backup-database.ts           # Direct execution
 * 
 * Environment Variables:
 *   DATABASE_URL - Prisma database URL (default: file:./prisma/data/prod.db)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface BackupResult {
  success: boolean;
  backupPath?: string;
  originalSize?: number;
  backupSize?: number;
  checksum?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Extract file path from DATABASE_URL environment variable
 */
function getDatabasePath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/data/prod.db';
  
  // Handle Prisma file URL format: "file:./path/to/db.db"
  let dbPath = dbUrl.replace(/^file:/, '');
  
  // Resolve relative paths from server root
  if (!path.isAbsolute(dbPath)) {
    dbPath = path.resolve(__dirname, '..', dbPath);
  }
  
  return dbPath;
}

/**
 * Generate timestamp for backup filename (YYYYMMDD-HHMMSS)
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Calculate SHA-256 checksum of a file
 */
function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Verify file integrity by comparing checksums
 */
async function verifyBackup(originalPath: string, backupPath: string): Promise<boolean> {
  try {
    const originalChecksum = await calculateChecksum(originalPath);
    const backupChecksum = await calculateChecksum(backupPath);
    return originalChecksum === backupChecksum;
  } catch (error) {
    console.error('Checksum verification failed:', error);
    return false;
  }
}

/**
 * Create a backup of the database file
 * 
 * @param outputDir - Optional custom output directory (default: same as database)
 * @param prefix - Optional filename prefix (default: database name + .backup)
 * @returns BackupResult with status and details
 */
export async function backupDatabase(
  outputDir?: string,
  prefix?: string
): Promise<BackupResult> {
  const timestamp = getTimestamp();
  
  try {
    // Get database file path
    const dbPath = getDatabasePath();
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      return {
        success: false,
        error: `Database file not found: ${dbPath}`,
      };
    }
    
    // Get database stats
    const dbStats = fs.statSync(dbPath);
    const originalSize = dbStats.size;
    
    // Determine output directory
    const dbDir = path.dirname(dbPath);
    const targetDir = outputDir || dbDir;
    
    // Ensure output directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Generate backup filename
    const dbBasename = path.basename(dbPath, path.extname(dbPath));
    const dbExtension = path.extname(dbPath);
    const backupPrefix = prefix || `${dbBasename}.backup`;
    const backupFilename = `${backupPrefix}-${timestamp}${dbExtension}`;
    const backupPath = path.join(targetDir, backupFilename);
    
    // Perform backup (copy file)
    console.log(`[Backup] Starting backup of ${dbPath}`);
    console.log(`[Backup] Size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[Backup] Target: ${backupPath}`);
    
    fs.copyFileSync(dbPath, backupPath);
    
    // Verify backup
    const backupStats = fs.statSync(backupPath);
    const backupSize = backupStats.size;
    
    if (backupSize !== originalSize) {
      return {
        success: false,
        error: `Backup size mismatch: original=${originalSize}, backup=${backupSize}`,
      };
    }
    
    // Calculate checksum for verification
    console.log(`[Backup] Verifying backup integrity...`);
    const checksumValid = await verifyBackup(dbPath, backupPath);
    
    if (!checksumValid) {
      // Delete invalid backup
      fs.unlinkSync(backupPath);
      return {
        success: false,
        error: 'Backup integrity check failed (checksum mismatch)',
      };
    }
    
    const checksum = await calculateChecksum(backupPath);
    
    console.log(`[Backup] ✅ Backup created successfully`);
    console.log(`[Backup] Path: ${backupPath}`);
    console.log(`[Backup] Size: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[Backup] SHA-256: ${checksum.substring(0, 16)}...`);
    
    return {
      success: true,
      backupPath,
      originalSize,
      backupSize,
      checksum,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Backup] ❌ Backup failed: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Clean up old backups, keeping only the most recent N backups
 * 
 * @param keepCount - Number of recent backups to keep (default: 5)
 */
export async function cleanupOldBackups(keepCount: number = 5): Promise<void> {
  try {
    const dbPath = getDatabasePath();
    const dbDir = path.dirname(dbPath);
    const dbBasename = path.basename(dbPath, path.extname(dbPath));
    const dbExtension = path.extname(dbPath);
    
    // Find all backup files
    const files = fs.readdirSync(dbDir);
    const backupFiles = files
      .filter((f) => f.startsWith(`${dbBasename}.backup-`) && f.endsWith(dbExtension))
      .map((f) => ({
        name: f,
        path: path.join(dbDir, f),
        mtime: fs.statSync(path.join(dbDir, f)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Sort by newest first
    
    // Keep only the most recent N backups
    const toDelete = backupFiles.slice(keepCount);
    
    if (toDelete.length > 0) {
      console.log(`[Cleanup] Removing ${toDelete.length} old backup(s)`);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        console.log(`[Cleanup] Deleted: ${file.name}`);
      }
    } else {
      console.log(`[Cleanup] No old backups to remove (keeping ${backupFiles.length}/${keepCount})`);
    }
  } catch (error) {
    console.error('[Cleanup] Failed to clean up old backups:', error);
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    
    // Parse command-line arguments
    let outputDir: string | undefined;
    let cleanup = false;
    let keepCount = 5;
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--output' && args[i + 1]) {
        outputDir = args[i + 1];
        i++;
      } else if (args[i] === '--cleanup') {
        cleanup = true;
      } else if (args[i] === '--keep' && args[i + 1]) {
        keepCount = parseInt(args[i + 1], 10);
        i++;
      } else if (args[i] === '--help') {
        console.log(`
Database Backup Utility

Usage:
  npm run backup:db [options]
  ts-node scripts/backup-database.ts [options]

Options:
  --output <dir>   Custom output directory for backup
  --cleanup        Remove old backups (keeps 5 most recent)
  --keep <count>   Number of backups to keep when cleaning up (default: 5)
  --help           Show this help message

Examples:
  npm run backup:db
  npm run backup:db -- --output /tmp/backups
  npm run backup:db -- --cleanup --keep 3
  ts-node scripts/backup-database.ts --cleanup

Environment:
  DATABASE_URL     Prisma database URL (default: file:./prisma/data/prod.db)
        `);
        process.exit(0);
      }
    }
    
    // Perform backup
    const result = await backupDatabase(outputDir);
    
    if (!result.success) {
      console.error(`\n❌ Backup failed: ${result.error}`);
      process.exit(1);
    }
    
    // Cleanup if requested
    if (cleanup) {
      console.log('');
      await cleanupOldBackups(keepCount);
    }
    
    console.log('\n✅ Backup operation completed successfully');
    process.exit(0);
  })();
}
