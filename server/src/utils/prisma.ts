// Central Prisma client factory used across the server in test and production
// Uses runtime require to avoid TS compile-time issues in environments where
// `npx prisma generate` cannot be executed (e.g., restricted CI containers).
// The client will respect TEST_DATABASE_URL when present for deterministic tests.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (opts?: any) => any };

const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db';

export const prisma = new PrismaClient({ datasources: { db: { url } } });

export function getPrismaClient(options?: any) {
  return new PrismaClient({ ...options, datasources: { db: { url } } });
}
