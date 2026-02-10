import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

/**
 * Jest globalSetup: ensures the test database schema is up-to-date by running
 * Prisma migrations (or db push) against TEST_DATABASE_URL before tests run.
 */
export default async function globalSetup() {
  console.log('[globalSetup] Starting Prisma migration for test DB...');

  const testDb = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'file:./test/test.db';

  const env = { ...process.env, DATABASE_URL: testDb, TEST_DATABASE_URL: testDb };

  try {
    // Apply migrations to the test DB. Prefer `migrate deploy` for CI fidelity,
    // but fallback to `db push` if migrate fails (e.g., in dev without a migration history).
    try {
      execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
        stdio: 'inherit',
        env
      });
      console.log('[globalSetup] Prisma migrate deploy completed.');
    } catch (migrateErr) {
      console.warn('[globalSetup] `prisma migrate deploy` failed - falling back to `prisma db push`.', migrateErr);
      execSync('npx prisma db push --schema=./prisma/schema.prisma', { stdio: 'inherit', env });
      console.log('[globalSetup] Prisma db push completed.');
    }

    console.log('[globalSetup] Database schema is ready for tests.');
    try {
      // If using a SQLite file URL (file:./test/test.db), enable WAL mode to reduce
      // writer contention during concurrent test runs. This is a best-effort step —
      // if the sqlite3 binary is not available we silently continue.
      let dbFile = testDb;
      if (dbFile.startsWith('file:')) dbFile = dbFile.replace('file:', '');
      // Remove any query params (e.g. file:./test/test.db?cache=shared)
      dbFile = dbFile.split('?')[0];

      console.log(`[globalSetup] Enabling SQLite WAL mode for test DB: ${dbFile}`);
      try {
        // Prefer to set WAL mode using Prisma (no external sqlite3 binary required).
        // Prisma will execute the pragma against the same datasource URL used for tests.
        // Temporarily set DATABASE_URL so PrismaClient connects to the test DB.
        const prevDbUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = testDb;
        const prisma = new PrismaClient();
        try {
          // Use a raw query to set WAL mode. SQLite returns the selected journal mode
          // so use $queryRawUnsafe which allows a returned result. We ignore the result.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (prisma as any).$queryRawUnsafe('PRAGMA journal_mode=WAL;');
          console.log('[globalSetup] Enabled WAL mode for test DB via Prisma (or no-op)');

          // Set a busy timeout to handle SQLite contention during parallel test runs.
          // Default SQLite busy timeout is very low; 5000ms gives enough headroom.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (prisma as any).$queryRawUnsafe('PRAGMA busy_timeout=5000;');
          console.log('[globalSetup] Set SQLite busy timeout to 5000ms');
        } finally {
          await prisma.$disconnect();
          // restore previous env
          if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
          else delete process.env.DATABASE_URL;
        }
      } catch (pragmaErr) {
        // Non-fatal — continue tests even if enabling WAL fails
        console.warn('[globalSetup] Could not enable WAL mode (Prisma or PRAGMA unsupported):', pragmaErr?.message || pragmaErr);
      }
    } catch (err) {
      // Non-fatal — continue tests even if enabling WAL fails
      console.warn('[globalSetup] Skipping WAL setup due to error', err);
    }
  } catch (err) {
    console.error('[globalSetup] Failed to prepare test database schema', err);
    throw err;
  }
}
