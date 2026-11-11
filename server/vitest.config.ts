/// <reference types="vitest" />
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': resolve(__dirname, './src'),
      '@zakapp/shared': resolve(__dirname, '../shared/src/index.ts'),
      '@prisma/client': resolve(__dirname, './node_modules/@prisma/client'),
    },
    include: ['**/*.{test,spec}.ts'],
    exclude: ['test/setupEnv.ts', '**/node_modules/**', '**/dist/**'],
    setupFiles: ['./test/setupEnv.ts'],
    globalSetup: ['./test/globalSetup.ts'],
    pool: 'forks',
    // All 82 files share one SQLite file (DATABASE_URL=file:./test/test.db), so
    // parallel files contend on the same writes: intermittent SQLITE_BUSY
    // surfaced as an empty-message rejection, and the wall-clock perf budget
    // measured under load. Serialize files; per-file DB isolation is the
    // alternative if this gets too slow.
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
    server: {
      deps: {
        inline: ['@prisma/client']
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/**/*.d.ts',
        'src/types/**',
      ],
      // Set just below the measured baseline so a REGRESSION fails the build
      // without failing on today's state. Ratchet these upward as Wave 1 lands —
      // never downward, or the gate stops meaning anything.
      //
      // vitest 5's v8 reporter counts function expressions the v4 reporter did
      // not: on the same code the client's statement ratio moved 21.64 -> 36.86,
      // and here functions moved 48.38 -> 45.67 while statements (42.75),
      // branches (34.51) and lines (42.74) all ROSE. The functions floor is
      // therefore re-baselined to the new definition, not lowered to pass.
      thresholds: {
        statements: 38,
        branches: 30,
        functions: 45,
        lines: 38,
      },
    }
  },
});
