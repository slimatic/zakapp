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
    testTimeout: 60000,
    hookTimeout: 60000,
    server: {
      deps: {
        inline: ['@prisma/client'],
      },
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
      // NO THRESHOLDS ON THIS BRANCH, deliberately.
      //
      // The coverage gate was introduced on main in #457 and is not part of the
      // 0.16.x maintenance line — this branch predates it, and adding a gate to a
      // patch release would turn an unrelated future test change into a blocked
      // release. Patch releases carry fixes, not policy.
      //
      // For reference, main's current gate is 38/29/48/38, ratcheted upward from
      // the measured baseline as tests land. Never ratchet downward, or the gate
      // stops meaning anything.
      //
      // This branch's own measured baseline after the 0.16.8 currency fix is
      // 38.48% statements / 29.79% branches / 48.11% functions / 38.47% lines —
      // recorded here for reference only, not enforced.
    },
  },
});
