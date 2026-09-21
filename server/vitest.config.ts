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
      // Set just below the measured baseline (37.95% statements, 29.00% branches,
      // 47.57% functions, 37.93% lines) so a REGRESSION fails the build without
      // failing on today's state. Ratchet these upward as Wave 1 lands — never
      // downward, or the gate stops meaning anything.
      thresholds: {
        statements: 37,
        branches: 29,
        functions: 47,
        lines: 37,
      },
    }
  },
});
