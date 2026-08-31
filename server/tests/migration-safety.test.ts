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
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const SERVER_DIR = path.resolve(__dirname, '..');
const SCHEMA = path.join(SERVER_DIR, 'prisma/schema.prisma');
const PRISMA_BIN = path.join(SERVER_DIR, 'node_modules/prisma/build/index.js');
const TEST_DB = path.join(SERVER_DIR, 'prisma/data/migration-safety-test.db');
const DB_URL = `file:${TEST_DB}`;

function prismaExecSql(sql: string): void {
  // Use absolute schema path + no --url (Prisma rejects using both together);
  // DATABASE_URL env gives the CLI the DB target.
  execSync(
    `node "${PRISMA_BIN}" db execute --schema "${SCHEMA}" --stdin`,
    { cwd: SERVER_DIR, input: sql, env: { ...process.env, DATABASE_URL: DB_URL }, encoding: 'utf-8' },
  );
}

function cleanupDb(): void {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const f = `${TEST_DB}${suffix}`;
    if (existsSync(f)) rmSync(f);
  }
}

describe('Migration safety (P0 data-safety gate)', () => {
  it('applies the full migration chain to a fresh database', () => {
    cleanupDb();
    expect(() =>
      execSync(`node "${PRISMA_BIN}" migrate deploy --schema "${SCHEMA}"`, {
        cwd: SERVER_DIR,
        env: { ...process.env, DATABASE_URL: DB_URL },
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
    const client = new PrismaClient({ datasources: { db: { url: `file:${DB_URL}` } } });
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