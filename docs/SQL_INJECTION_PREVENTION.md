# SQL Injection Prevention Guide

## Overview

This document outlines the security measures in place to prevent SQL injection vulnerabilities in ZakApp. Following these guidelines is **mandatory** for all database operations.

## Constitutional Principle

**Privacy & Security First**: All sensitive data must be protected, and SQL injection vulnerabilities must be prevented at all costs.

## Why This Matters

SQL injection is one of the most critical security vulnerabilities (OWASP Top 10). It allows attackers to:
- Access unauthorized data
- Modify or delete data
- Execute administrative operations on the database
- Compromise the entire system

## Safe Practices ✅

### 1. Use Prisma's Type-Safe Methods (PREFERRED)

The safest approach is to use Prisma's generated methods whenever possible:

```typescript
// ✅ SAFE: Using Prisma's generated methods
await prisma.user.findMany();
await prisma.asset.create({ data: { ... } });
await prisma.liability.deleteMany({ where: { userId } });
await prisma.zakatCalculation.count();
```

**Benefits:**
- Type-safe at compile time
- Automatically parameterized
- No SQL injection risk
- Works across all databases

### 2. Use Template Literals for Raw SQL

When raw SQL is absolutely necessary, use `$executeRaw` or `$queryRaw` with **template literals** (backticks):

```typescript
// ✅ SAFE: Using template literals (parameterized automatically)
await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
await prisma.$queryRaw`SELECT COUNT(*) FROM users WHERE active = ${isActive}`;
```

**Benefits:**
- Prisma automatically parameterizes values
- SQL injection protection built-in
- Works with dynamic values safely

### 3. Use Prisma DMMF for Introspection

For database schema introspection, use Prisma's Data Model Meta Format (DMMF):

```typescript
// ✅ SAFE: Using Prisma DMMF
import { Prisma } from '@prisma/client';

const models = Prisma.dmmf?.datamodel?.models || [];

for (const model of models) {
  const modelName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
  const prismaModel = (prisma as any)[modelName];
  
  if (prismaModel && typeof prismaModel.count === 'function') {
    const count = await prismaModel.count();
  }
}
```

**Benefits:**
- Database-agnostic
- No raw SQL needed
- Type-safe and maintainable

## Unsafe Practices ❌

### 1. NEVER Use $executeRawUnsafe or $queryRawUnsafe

```typescript
// ❌ DANGEROUS: SQL injection vulnerability!
const tableName = req.body.table; // User input
await prisma.$executeRawUnsafe(`DELETE FROM ${tableName}`);

// ❌ DANGEROUS: Even with "sanitization"
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${userId}`);
```

**Why dangerous:**
- No automatic parameterization
- Easy to introduce vulnerabilities
- Bypasses Prisma's safety features

### 2. NEVER Use String Concatenation/Interpolation

```typescript
// ❌ DANGEROUS: String interpolation
const query = `DELETE FROM ${tableName}`;
await prisma.$executeRawUnsafe(query);

// ❌ DANGEROUS: String concatenation
const sql = "SELECT * FROM users WHERE name = '" + userName + "'";
await prisma.$queryRawUnsafe(sql);
```

**Why dangerous:**
- Allows SQL injection through string manipulation
- No input validation or escaping
- Trivial to exploit

### 3. NEVER Use Database-Specific Queries

```typescript
// ❌ BAD: SQLite-specific (not portable, potential injection risk)
const tables = await prisma.$queryRaw`
  SELECT name FROM sqlite_master WHERE type='table'
`;
for (const table of tables) {
  await prisma.$executeRawUnsafe(`DELETE FROM ${table.name}`);
}

// ❌ BAD: PostgreSQL-specific
await prisma.$queryRaw`SELECT * FROM information_schema.tables`;
```

**Why bad:**
- Database-specific (not portable)
- Often requires dynamic table names (injection risk)
- Harder to maintain and test

## Enforcement Mechanisms

### 1. ESLint Rules

ESLint is configured to block unsafe methods:

```javascript
// .eslintrc.js
'no-restricted-syntax': [
  'error',
  {
    selector: 'MemberExpression[property.name="$executeRawUnsafe"]',
    message: 'Using $executeRawUnsafe creates SQL injection risk. Use $executeRaw with template literals instead.',
  },
  {
    selector: 'MemberExpression[property.name="$queryRawUnsafe"]',
    message: 'Using $queryRawUnsafe creates SQL injection risk. Use $queryRaw with template literals instead.',
  },
]
```

### 2. Automated Tests

Tests run on every commit to check for unsafe patterns:
- `sql-injection-prevention.test.ts` scans all source files
- Blocks commits containing unsafe methods
- Validates test setup uses safe patterns

### 3. Code Review

All database-related code must be reviewed for:
- Use of safe Prisma methods
- Proper parameterization
- No string concatenation in SQL
- Database portability

## Migration Examples

### Before: Unsafe Table Cleanup

```typescript
// ❌ BEFORE: SQL injection vulnerability
const tables = await prisma.$queryRaw`
  SELECT name FROM sqlite_master WHERE type='table'
`;

for (const { name } of tables) {
  await prisma.$executeRawUnsafe(`DELETE FROM ${name}`);
}
```

### After: Safe Table Cleanup

```typescript
// ✅ AFTER: Using Prisma DMMF (safe and portable)
const { Prisma } = await import('@prisma/client');
const models = Prisma.dmmf?.datamodel?.models || [];

const modelNames = models
  .map(model => model.name.charAt(0).toLowerCase() + model.name.slice(1))
  .reverse(); // Reverse to handle foreign key constraints

for (const modelName of modelNames) {
  const prismaModel = (prisma as any)[modelName];
  if (prismaModel && typeof prismaModel.deleteMany === 'function') {
    await prismaModel.deleteMany({});
  }
}
```

## Exception Process

If you believe you **must** use raw SQL:

1. **Document why** Prisma methods can't be used
2. **Use template literals** (never `Unsafe` methods)
3. **Add database type detection** and handle multiple databases
4. **Add comprehensive tests** for the specific use case
5. **Get security review** from at least one other developer

Example of acceptable raw SQL:

```typescript
// ✅ ACCEPTABLE: Database-specific feature with proper handling
try {
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
} catch (error) {
  // Ignore if not SQLite (other databases have FK enabled by default)
  console.log('Foreign key enforcement setup skipped');
}
```

## Testing Your Code

Before committing, run:

```bash
# Lint check (includes SQL injection rules)
npm run lint

# Run security tests
npm test -- sql-injection-prevention.test.ts

# Full test suite
npm test
```

## References

- [Prisma Raw Database Access](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Database Portability Guide](../DATABASE_PORTABILITY_GUIDE.md)
- [Project Security Audit](../OPTION_3_SECURITY_AUDIT.md)

## Summary Checklist

When writing database code, ensure:

- [ ] Use Prisma's generated methods when possible
- [ ] Use `$executeRaw`/`$queryRaw` with template literals if raw SQL needed
- [ ] Never use `$executeRawUnsafe` or `$queryRawUnsafe`
- [ ] Never concatenate strings to build SQL queries
- [ ] Use Prisma DMMF for schema introspection
- [ ] Write tests for database operations
- [ ] Run linter before committing
- [ ] Get security review for complex database operations

---

**Remember: One SQL injection vulnerability can compromise the entire application. When in doubt, ask for a security review!**
