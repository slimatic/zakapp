import { defineConfig } from 'prisma/config';

// Prisma 7 moved the connection URL out of schema.prisma. Keep the same
// precedence the runtime uses (TEST_DATABASE_URL, then DATABASE_URL), with a
// local default so `prisma generate` works without any env (as CI runs it).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db',
  },
});
