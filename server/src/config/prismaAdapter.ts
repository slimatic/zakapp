import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Prisma 7 no longer reads the datasource URL from schema.prisma, and a
 * PrismaClient cannot connect to SQLite without a driver adapter. Resolve the
 * URL the same way the app always has: TEST_DATABASE_URL wins during tests,
 * then DATABASE_URL, then the local dev default.
 */
/**
 * better-sqlite3 takes a FILENAME, not a URL: everything after `?` becomes part
 * of the file name, so `file:prod.db?connection_limit=1` opens a second, empty
 * database beside the real one. Production did exactly that on 1.2.0 and every
 * query failed on missing tables. Strip the query before anything opens it.
 */
export const sqliteFileUrl = (resolved: string): string =>
  resolved.startsWith('file:') ? resolved.split('?')[0] : resolved;

export function sqliteAdapter(url?: string) {
  const resolved = url ?? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./dev.db';

  const fileUrl = sqliteFileUrl(resolved);

  // Prisma 6 created a missing directory for the sqlite file; better-sqlite3
  // (and the Prisma 7 CLI) does not. Keep the old behaviour so a fresh DB path
  // or a restored backup never fails to open.
  if (resolved.startsWith('file:')) {
    const file = resolved.slice('file:'.length).split('?')[0];
    if (file && file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  }

  // better-sqlite3's default busy timeout is short; the suite runs dozens of
  // workers against one file, and a busy database must wait rather than fail
  // a write. Same value the sqlite driver used to get from the connection pool.
  return new PrismaBetterSqlite3({ url: fileUrl, timeout: 30_000 });
}
