/**
 * Data Migration Utilities Index
 * 
 * Exports all data migration, integrity checking, and backup utilities.
 * 
 * Constitutional Compliance:
 * - Privacy & Security First: All utilities handle encrypted data securely
 * - Quality & Reliability: Comprehensive data validation and backup systems
 * - Transparency & Trust: Clear audit trails and integrity reporting
 * - User-Centric Design: Progress tracking and user-friendly error messages
 */

// Core migration utilities
export { default as DataMigrationService } from './DataMigration';
export { default as IntegrityChecker } from './IntegrityChecker';
export { default as BackupService } from './BackupService';

// Helper function to perform complete data health check
export const performSystemHealthCheck = async () => {
  const { IntegrityChecker } = await import('./IntegrityChecker');
  const { BackupService } = await import('./BackupService');

  const [integrityResult, backupStats] = await Promise.all([
    IntegrityChecker.performIntegrityCheck(),
    BackupService.getBackupStatistics()
  ]);

  return {
    integrity: {
      passed: integrityResult.passed,
      score: integrityResult.score,
      health: integrityResult.summary.overallHealth,
      errors: integrityResult.errors.length,
      warnings: integrityResult.warnings.length
    },
    backups: {
      total: backupStats.totalBackups,
      totalSize: backupStats.totalSize,
      integrityStatus: backupStats.integrityStatus,
      newest: backupStats.newestBackup,
      oldest: backupStats.oldestBackup
    },
    timestamp: new Date().toISOString()
  };
};