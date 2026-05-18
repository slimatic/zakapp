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
    }
  },
});
