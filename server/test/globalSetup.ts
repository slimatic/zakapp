import { execSync } from 'child_process';

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
  } catch (err) {
    console.error('[globalSetup] Failed to prepare test database schema', err);
    throw err;
  }
}
