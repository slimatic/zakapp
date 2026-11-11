import path from 'node:path';

/**
 * One rule for the test database path, shared by globalSetup (which migrates it)
 * and setupEnv (which points every test client at it).
 *
 * A relative `file:` URL is resolved against the process cwd — that is what the
 * better-sqlite3 adapter does when it opens the path. The Prisma CLI would have
 * resolved the same URL against the schema directory instead, so the URL is
 * made absolute before either side sees it.
 */
export function resolveTestDbUrl(): string {
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'file:./test/test.db';
  if (!url.startsWith('file:')) return url;

  const [rawPath, ...query] = url.slice('file:'.length).split('?');
  if (rawPath === ':memory:') return url;

  const abs = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  return `file:${abs}${query.length ? '?' + query.join('?') : ''}`;
}
