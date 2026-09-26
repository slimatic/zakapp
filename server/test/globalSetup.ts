import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Vitest globalSetup: bring the test database up to date from the migration
 * history before tests run.
 *
 * WHY THERE IS NO `db push` FALLBACK ANY MORE
 *
 * This used to try `migrate deploy` and, on any failure, silently substitute
 * `prisma db push`. A P3009 (a failed migration record left in the database)
 * therefore never failed CI — the tests simply ran against a schema `db push`
 * invented, not the one the migration history produces. A migration that cannot
 * apply against a real database would pass CI and fail in production, which is
 * the one failure mode worth catching early.
 *
 * Instead: start from a fresh database, apply the history, and fail loudly if it
 * will not apply. That verifies what production does (a clean `migrate deploy`)
 * and removes the stale-record condition entirely.
 */
export default async function globalSetup() {
  console.log('[globalSetup] Preparing test database from the migration history...');

  const explicitTestDb = process.env.TEST_DATABASE_URL;
  const testDb = explicitTestDb || process.env.DATABASE_URL || 'file:./test/test.db';

  const env = { ...process.env, DATABASE_URL: testDb, TEST_DATABASE_URL: testDb };

  // Drop a stale SQLite test database before migrating.
  //
  // Guarded two ways, because getting this wrong destroys data:
  //  - only when TEST_DATABASE_URL is set EXPLICITLY. When it is absent this
  //    falls back to DATABASE_URL, which is a developer's working database —
  //    the same fallback AGENTS.md warns about for the opposite reason.
  //  - only for a `file:` URL. A networked database is never deleted here.
  if (explicitTestDb && explicitTestDb.startsWith('file:')) {
    const rel = explicitTestDb.replace('file:', '').split('?')[0];
    // Prisma resolves a relative file: URL against the SCHEMA directory
    // (`server/prisma/`), not the process cwd. Resolving against cwd here would
    // delete nothing and quietly leave the stale record in place.
    const dbFile = path.isAbsolute(rel) ? rel : path.resolve(__dirname, '../prisma', rel);

    for (const suffix of ['', '-wal', '-shm']) {
      const f = `${dbFile}${suffix}`;
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.log(`[globalSetup] Removed stale test database file: ${f}`);
      }
    }
  } else if (!explicitTestDb) {
    console.warn(
      '[globalSetup] TEST_DATABASE_URL is not set; falling back to DATABASE_URL. If that ' +
        "is a running dev server's database, tests will contend with it (see AGENTS.md)."
    );
  }

  // No try/catch, and no fallback: a migration that will not apply must fail the
  // run rather than be papered over.
  execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
    stdio: 'inherit',
    env
  });
  console.log('[globalSetup] Migrations applied cleanly from the migration history.');

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

        // Set a statement timeout to allow longer-running queries in test environments.
        // This helps with complex queries and reduces false timeout errors.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).$queryRawUnsafe('PRAGMA statement_timeout=60000;');
        console.log('[globalSetup] Set SQLite statement timeout to 60000ms');
      } finally {
        await prisma.$disconnect();
        // restore previous env
        if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
        else delete process.env.DATABASE_URL;
      }
    } catch (pragmaErr) {
      // Non-fatal — continue tests even if enabling WAL fails
      console.warn('[globalSetup] Could not enable WAL mode (Prisma or PRAGMA unsupported):', (pragmaErr as Error)?.message || pragmaErr);
    }
  } catch (err) {
    // Non-fatal — continue tests even if enabling WAL fails
    console.warn('[globalSetup] Skipping WAL setup due to error', err);
  }
}
