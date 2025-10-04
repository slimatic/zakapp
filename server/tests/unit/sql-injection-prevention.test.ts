/**
 * SQL Injection Prevention Tests
 * 
 * Constitutional Principles:
 * - Privacy & Security First: Ensure SQL injection vulnerabilities are prevented
 * - Quality & Reliability: Robust testing of security measures
 * 
 * These tests validate that:
 * 1. No unsafe Prisma methods are used in the codebase
 * 2. All raw SQL queries use parameterized queries (template literals)
 * 3. Database cleanup uses safe Prisma methods
 */

import fs from 'fs';
import path from 'path';

describe('SQL Injection Prevention', () => {
  describe('Code Safety Checks', () => {
    it('should not use $executeRawUnsafe in actual code', () => {
      const srcDir = path.join(__dirname, '../../src');
      const files = getAllTypeScriptFiles(srcDir);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        // Check for actual usage, not comments
        const usagePattern = /prisma\.\$executeRawUnsafe\s*\(/;
        if (usagePattern.test(content)) {
          fail(`File ${file} uses $executeRawUnsafe which creates SQL injection risk`);
        }
      });
    });

    it('should not use $queryRawUnsafe in actual code', () => {
      const srcDir = path.join(__dirname, '../../src');
      const files = getAllTypeScriptFiles(srcDir);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        // Check for actual usage, not comments
        const usagePattern = /prisma\.\$queryRawUnsafe\s*\(/;
        if (usagePattern.test(content)) {
          fail(`File ${file} uses $queryRawUnsafe which creates SQL injection risk`);
        }
      });
    });

    it('should use template literals for all $executeRaw calls', () => {
      const srcDir = path.join(__dirname, '../../src');
      const files = getAllTypeScriptFiles(srcDir);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for actual $executeRaw usage (not in comments)
        const actualUsagePattern = /(?<!\/\/.*)\bprisma\.\$executeRaw\b/g;
        const matches = content.match(actualUsagePattern);
        
        if (matches && matches.length > 0) {
          // If $executeRaw is used, ensure it's with template literal
          const unsafePattern = /prisma\.\$executeRaw\s*\(/;
          if (unsafePattern.test(content)) {
            fail(`File ${file} contains unsafe $executeRaw call without template literal`);
          }
        }
      });
    });

    it('should use template literals for all $queryRaw calls', () => {
      const srcDir = path.join(__dirname, '../../src');
      const files = getAllTypeScriptFiles(srcDir);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for actual $queryRaw usage (not in comments)
        const actualUsagePattern = /(?<!\/\/.*)\bprisma\.\$queryRaw\b/g;
        const matches = content.match(actualUsagePattern);
        
        if (matches && matches.length > 0) {
          // If $queryRaw is used, ensure it's with template literal
          const unsafePattern = /prisma\.\$queryRaw\s*\(/;
          if (unsafePattern.test(content)) {
            fail(`File ${file} contains unsafe $queryRaw call without template literal`);
          }
        }
      });
    });

    it('should not use string concatenation in SQL queries', () => {
      const srcDir = path.join(__dirname, '../../src');
      const files = getAllTypeScriptFiles(srcDir);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for common SQL injection patterns
        const dangerousPatterns = [
          /DELETE\s+FROM\s+["`']?\$\{/i,
          /INSERT\s+INTO\s+["`']?\$\{/i,
          /UPDATE\s+["`']?\$\{.*SET/i,
          /SELECT\s+.*FROM\s+["`']?\$\{/i,
          /DROP\s+TABLE\s+["`']?\$\{/i,
        ];
        
        dangerousPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            fail(`File ${file} contains potential SQL injection pattern: ${pattern}`);
          }
        });
      });
    });
  });

  describe('Test Setup Safety', () => {
    it('should use Prisma DMMF for database cleanup in test setup', () => {
      const testSetupFile = path.join(__dirname, '../../prisma/test-setup.ts');
      
      if (fs.existsSync(testSetupFile)) {
        const content = fs.readFileSync(testSetupFile, 'utf-8');
        
        // Should use Prisma DMMF introspection
        expect(content).toContain('Prisma.dmmf');
        expect(content).toContain('deleteMany');
        
        // Check for actual SQL queries using sqlite_master (not comments)
        const sqliteMasterPattern = /\$queryRaw.*sqlite_master/i;
        expect(sqliteMasterPattern.test(content)).toBe(false);
        
        // Check for actual usage of unsafe methods (not comments)
        const unsafeUsagePattern = /prisma\.\$executeRawUnsafe\s*\(/;
        expect(unsafeUsagePattern.test(content)).toBe(false);
      }
    });

    it('should use safe methods in integration test setup', () => {
      const integrationSetupPath = path.join(__dirname, '../../../tests/integration/setup.ts');
      
      if (fs.existsSync(integrationSetupPath)) {
        const content = fs.readFileSync(integrationSetupPath, 'utf-8');
        
        // Should use Prisma DMMF introspection
        expect(content).toContain('Prisma.dmmf');
        expect(content).toContain('deleteMany');
        
        // Check for actual SQL queries using sqlite_master (not comments)
        const sqliteMasterPattern = /\$queryRaw.*sqlite_master/i;
        expect(sqliteMasterPattern.test(content)).toBe(false);
        
        // Check for actual usage of unsafe methods (not comments)
        const unsafeUsagePattern = /prisma\.\$executeRawUnsafe\s*\(/;
        expect(unsafeUsagePattern.test(content)).toBe(false);
      }
    });
  });

  describe('Database Configuration Safety', () => {
    it('should use Prisma DMMF for statistics collection', () => {
      const databaseConfigPath = path.join(__dirname, '../../src/config/database.ts');
      
      if (fs.existsSync(databaseConfigPath)) {
        const content = fs.readFileSync(databaseConfigPath, 'utf-8');
        
        // Should use Prisma DMMF for table introspection
        expect(content).toContain('Prisma.dmmf');
        
        // Check for actual SQL queries using sqlite_master (not comments)
        const sqliteMasterPattern = /\$queryRaw.*sqlite_master/i;
        expect(sqliteMasterPattern.test(content)).toBe(false);
        
        // Check for actual usage of unsafe methods (not comments)
        const unsafeExecutePattern = /prisma\.\$executeRawUnsafe\s*\(/;
        const unsafeQueryPattern = /prisma\.\$queryRawUnsafe\s*\(/;
        expect(unsafeExecutePattern.test(content)).toBe(false);
        expect(unsafeQueryPattern.test(content)).toBe(false);
      }
    });
  });
});

/**
 * Helper function to recursively get all TypeScript files in a directory
 */
function getAllTypeScriptFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and dist directories
      if (item !== 'node_modules' && item !== 'dist') {
        files.push(...getAllTypeScriptFiles(fullPath));
      }
    } else if (item.endsWith('.ts') && !item.endsWith('.test.ts') && !item.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  });
  
  return files;
}
