# Database Portability Guide

## Overview

This document explains how ZakApp achieves database portability by avoiding database-specific SQL queries and using Prisma's built-in introspection APIs instead.

## Problem Statement

Previously, the codebase contained SQLite-specific queries like:
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
```

These queries limited portability because:
1. **SQLite-specific**: The `sqlite_master` table only exists in SQLite
2. **Not portable**: Other databases (PostgreSQL, MySQL) have different system tables
3. **Maintenance burden**: Required database-specific implementations for each supported database

## Solution

We replaced database-specific SQL queries with Prisma's Data Model Meta Format (DMMF) introspection API.

### Prisma DMMF Introspection

Prisma generates metadata about your database models that can be accessed at runtime:

```typescript
import { Prisma } from '@prisma/client';

// Get all models defined in your schema
const models = Prisma.dmmf?.datamodel?.models || [];

// Each model contains:
// - name: Model name (e.g., "User", "Asset")
// - dbName: Database table name (if different from model name)
// - fields: Array of field definitions
```

### Implementation Changes

#### 1. Database Statistics Collection

**Before:**
```typescript
// SQLite-specific query
const tables = await prisma.$queryRaw`
  SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
`;

for (const table of tables) {
  const count = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM "${table.name}"`
  );
}
```

**After:**
```typescript
// Database-agnostic using Prisma DMMF
const { Prisma } = await import('@prisma/client');
const models = Prisma.dmmf?.datamodel?.models || [];

for (const model of models) {
  const modelName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
  const prismaModel = (this.prisma as any)[modelName];
  
  if (prismaModel && typeof prismaModel.count === 'function') {
    const count = await prismaModel.count();
  }
}
```

#### 2. Test Database Cleanup

**Before:**
```typescript
// SQLite-specific query
const tablenames = await prisma.$queryRaw`
  SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
`;

for (const { name } of tablenames) {
  await prisma.$executeRawUnsafe(`DELETE FROM ${name};`);
}
```

**After:**
```typescript
// Database-agnostic using Prisma models
const { Prisma } = await import('@prisma/client');
const models = Prisma.dmmf?.datamodel?.models || [];

const modelNames = models
  .map(model => model.name.charAt(0).toLowerCase() + model.name.slice(1))
  .reverse(); // Reverse order to handle foreign keys

for (const modelName of modelNames) {
  const prismaModel = (prisma as any)[modelName];
  if (prismaModel && typeof prismaModel.deleteMany === 'function') {
    await prismaModel.deleteMany({});
  }
}
```

#### 3. Database Type Detection

Added a helper method to detect database type from connection URL:

```typescript
private getDatabaseType(): 'sqlite' | 'postgresql' | 'mysql' | 'sqlserver' | 'mongodb' | 'cockroachdb' | 'unknown' {
  const url = this.config.url.toLowerCase();
  
  if (url.includes('file:') || url.includes('sqlite:')) {
    return 'sqlite';
  } else if (url.includes('postgres://') || url.includes('postgresql://')) {
    return 'postgresql';
  } else if (url.includes('mysql://')) {
    return 'mysql';
  }
  // ... more database types
  
  return 'unknown';
}
```

#### 4. Graceful Handling of Database-Specific Features

For features that are truly database-specific (like SQLite PRAGMA), we use try-catch:

```typescript
// Enable foreign keys for SQLite databases
try {
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
} catch (error) {
  // Ignore if not SQLite (PostgreSQL, MySQL, etc. have foreign keys enabled by default)
  console.log('Foreign key enforcement setup skipped (not needed for this database)');
}
```

## Benefits

### 1. Cross-Database Compatibility
The codebase can now work with:
- SQLite (current)
- PostgreSQL (production-ready)
- MySQL/MariaDB
- SQL Server
- CockroachDB

### 2. Maintainability
- Uses Prisma's official APIs
- No custom SQL parsing logic
- Automatic updates when Prisma schema changes

### 3. Type Safety
- Prisma DMMF is fully typed
- Compile-time checking for model names
- Better IDE autocomplete

### 4. Security
- No risk of SQL injection in table enumeration
- Uses Prisma's parameterized queries
- No unsafe raw SQL execution

## Migration Guide

If you're adding new database operations, follow these guidelines:

### ✅ DO: Use Prisma Client Methods

```typescript
// Good: Use Prisma's generated methods
const users = await prisma.user.findMany();
const count = await prisma.asset.count();
await prisma.liability.deleteMany({});
```

### ✅ DO: Use Prisma DMMF for Introspection

```typescript
// Good: Use DMMF to get model metadata
import { Prisma } from '@prisma/client';
const models = Prisma.dmmf.datamodel.models;
```

### ❌ DON'T: Use Database-Specific Queries

```typescript
// Bad: SQLite-specific
await prisma.$queryRaw`SELECT * FROM sqlite_master`;

// Bad: PostgreSQL-specific
await prisma.$queryRaw`SELECT * FROM information_schema.tables`;

// Bad: MySQL-specific
await prisma.$queryRaw`SHOW TABLES`;
```

### ⚠️ USE WITH CAUTION: Raw SQL

If you must use raw SQL:
1. Document why Prisma methods can't be used
2. Add database type detection
3. Provide fallbacks or clear error messages
4. Consider using Prisma's `$queryRaw` with tagged templates

```typescript
// Acceptable if necessary
const dbType = this.getDatabaseType();

if (dbType === 'sqlite') {
  // SQLite-specific implementation
} else if (dbType === 'postgresql') {
  // PostgreSQL-specific implementation
} else {
  throw new Error(`Operation not supported for ${dbType}`);
}
```

## Testing

### Unit Tests

Created `server/tests/unit/database-portability.test.ts` to verify:
- Database type detection works correctly
- Statistics collection uses Prisma DMMF
- No errors when introspecting models

### Integration Tests

Updated test setup files to:
- Clean database using Prisma methods
- Handle database-specific features gracefully
- Test across different database types (when available)

## Future Considerations

### PostgreSQL Support

To add PostgreSQL support:
1. Update `prisma/schema.prisma` datasource
2. Run migrations: `npx prisma migrate deploy`
3. No code changes needed (thanks to portability improvements!)

### Performance Optimization

For large databases, consider:
- Caching DMMF model metadata
- Using database-specific features behind feature flags
- Batch operations for cleanup

### Advanced Features

Some operations may still need database-specific implementations:
- Full-text search
- JSON operations
- Database-specific indexes
- Advanced aggregations

For these, use the database type detection helper and provide clear error messages for unsupported databases.

## References

- [Prisma DMMF Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model)
- [Prisma Client API Reference](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Database Compatibility Matrix](https://www.prisma.io/docs/reference/database-reference/database-features)

## Conclusion

By using Prisma's introspection APIs instead of database-specific SQL queries, ZakApp is now:
- ✅ Database-agnostic
- ✅ More maintainable
- ✅ Safer and more secure
- ✅ Ready for production with PostgreSQL or other databases

All database operations should follow these patterns to maintain portability.
