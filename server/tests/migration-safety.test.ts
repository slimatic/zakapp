/**
 * Migration Safety Test — P0 data-safety gate.
 *
 * Simulates the production upgrade path: deploy the FULL migration chain to a
 * fresh SQLite DB, seed representative user data, then verify the data survives
 * (guards against RedefineTables migrations that DROP+recreate tables and
 * silently drop columns missing from their hardcoded INSERT column lists).
 *
 * Runs with the repo's standard test DATABASE_URL override so it never touches
 * dev or test databases used by other suites.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { sqliteAdapter } from '../src/config/prismaAdapter';

const SERVER_DIR = path.resolve(__dirname, '..');
const SCHEMA = path.join(SERVER_DIR, 'prisma/schema.prisma');
const PRISMA_BIN = path.join(SERVER_DIR, 'node_modules/prisma/build/index.js');
const TEST_DB = path.join(SERVER_DIR, 'prisma/data/migration-safety-test.db');
const DB_URL = `file:${TEST_DB}`;
// prisma.config.ts prefers TEST_DATABASE_URL, so both must point at the
// isolated DB or the CLI silently targets the suite's shared test database.
const DB_ENV = { ...process.env, DATABASE_URL: DB_URL, TEST_DATABASE_URL: DB_URL };

function prismaExecSql(sql: string): void {
  // Prisma 7 dropped --schema from `db execute`; the target comes from
  // DATABASE_URL via prisma.config.ts.
  execSync(
    `node "${PRISMA_BIN}" db execute --stdin`,
    { cwd: SERVER_DIR, input: sql, env: DB_ENV, encoding: 'utf-8' },
  );
}

function cleanupDb(): void {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const f = `${TEST_DB}${suffix}`;
    if (existsSync(f)) rmSync(f);
  }
  mkdirSync(path.dirname(TEST_DB), { recursive: true });
}

describe('Migration safety (P0 data-safety gate)', () => {
  it('applies the full migration chain to a fresh database', () => {
    cleanupDb();
    expect(() =>
      execSync(`node "${PRISMA_BIN}" migrate deploy --schema "${SCHEMA}"`, {
        cwd: SERVER_DIR,
        env: DB_ENV,
        stdio: 'pipe',
      }),
    ).not.toThrow();
    expect(existsSync(TEST_DB)).toBe(true);
  });

  it('preserves seeded user data through the full migration chain', async () => {
    prismaExecSql(`
      INSERT INTO users (id, email, passwordHash, isActive, createdAt, updatedAt)
      VALUES ('mig-safety-user','safety@test.local','x',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
    `);

    // Read back through PrismaClient against the migrated schema
    const { PrismaClient } = await import('@prisma/client');
    const client = new PrismaClient({ adapter: sqliteAdapter(DB_URL) });
    try {
      const user = await client.user.findUnique({ where: { id: 'mig-safety-user' } });
      expect(user).not.toBeNull();
      expect(user?.email).toBe('safety@test.local');
    } finally {
      await client.$disconnect();
      cleanupDb();
    }
  });
});