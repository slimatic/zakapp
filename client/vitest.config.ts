/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

/**
 * Client test configuration.
 *
 * NOTE: there used to be a second file, `vitest.config.mts`, with different
 * settings. Vitest prefers `.mts` over `.ts`, but that file omitted the e2e
 * exclusion below, so the Playwright specs were collected and the suite failed to
 * start on `@playwright/test`. It has been removed; this is now the only config.
 * If a second config is ever added, make sure it excludes the e2e directory too.
 *
 * (Careful when editing this comment: a glob containing a slash-star inside a
 * block comment ends the comment early. That is what broke this file once.)
 */
export default defineConfig({
  plugins: [
    react(),
    // Resolves the aliases declared in tsconfig.json (`@/*`, `@components/*`, …).
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:4173/',
      },
    },
    setupFiles: ['./src/setupTests.ts'],
    // Component styles are not asserted anywhere, so parsing CSS only costs time.
    css: false,
    exclude: ['**/e2e/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      // `include` defines the coverage universe, so untested files count too.
      // (Vitest 4 removed the old `all: true` flag; in earlier versions that
      // was what made unimported files appear.) Without listing sources here,
      // coverage flatters itself: tests for covered files raise the number
      // while untouched files stay invisible.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/setupTests.ts',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/tests/**',
        'src/**/*.stories.{ts,tsx}',
      ],
      // Thresholds sit just below the MEASURED baseline (21.64% statements,
      // 20.46% branches, 17.74% functions, 22.07% lines). They are a ratchet:
      // they exist to catch a REGRESSION, not to describe a goal. Raise them as
      // the Wave 1 coverage work lands — never lower, or the gate is meaningless.
      //
      // NOTE: this number looked like 43.76% before `include` was added. It was
      // not. Without `include`, only files a test happened to import were
      // measured, which flatters the figure and hides every untested file.
      thresholds: {
        statements: 21,
        branches: 20,
        functions: 17,
        lines: 22,
      },
    },
  },
});
