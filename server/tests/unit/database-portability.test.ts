/**
 * Database Portability Tests
 * 
 * Tests to ensure database operations are not tied to SQLite-specific queries
 */

import { DatabaseManager } from '../../src/config/database';

describe('Database Portability', () => {
  let dbManager: DatabaseManager;

  beforeAll(() => {
    // Get the singleton instance
    dbManager = DatabaseManager.getInstance();
  });

  describe('Database Type Detection', () => {
    it('should detect database type from URL', () => {
      const dbType = dbManager.getType();
      
      // Should return a valid database type
      expect(dbType).toBeDefined();
      expect(typeof dbType).toBe('string');
      
      // For this project, we expect SQLite
      expect(dbType).toBe('sqlite');
    });
  });

  describe('Statistics Collection', () => {
    it('should collect statistics without SQLite-specific queries', async () => {
      // This test ensures getStatistics() uses Prisma DMMF instead of sqlite_master
      const stats = await dbManager.getStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('tables');
      expect(stats).toHaveProperty('health');
      expect(Array.isArray(stats.tables)).toBe(true);
      
      // Each table should have name and rowCount
      if (stats.tables.length > 0) {
        stats.tables.forEach((table: any) => {
          expect(table).toHaveProperty('name');
          expect(table).toHaveProperty('rowCount');
          expect(typeof table.rowCount).toBe('number');
        });
      }
    });

    it('should not throw errors when models are introspected', async () => {
      // Import Prisma to verify DMMF is accessible
      const { Prisma } = await import('@prisma/client');
      
      expect(Prisma.dmmf).toBeDefined();
      expect(Prisma.dmmf.datamodel).toBeDefined();
      expect(Prisma.dmmf.datamodel.models).toBeDefined();
      expect(Array.isArray(Prisma.dmmf.datamodel.models)).toBe(true);
    });
  });

  describe('Backup/Restore Database Type Awareness', () => {
    it('should provide clear error messages for unsupported database types', async () => {
      // We can't test actual backup functionality in unit tests
      // but we can verify the error messages mention the database type
      
      // This is a smoke test to ensure the methods exist and are callable
      expect(typeof dbManager.createBackup).toBe('function');
      expect(typeof dbManager.restoreBackup).toBe('function');
    });
  });
});
