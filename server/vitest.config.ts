/// <reference types="vitest" />
import { resolve } from 'path';
// import swc from 'unplugin-swc';
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
    include: ['**/*.{test,spec}.ts', '../tests/**/*.test.ts'],
    exclude: ['test/setupEnv.ts', '**/node_modules/**', '**/dist/**'],
    setupFiles: ['./test/setupEnv.ts'],
    globalSetup: ['./test/globalSetup.ts'],
    pool: 'forks', // Use forks for better isolation in node environment
    testTimeout: 60000, // Increase timeout for slower test environments
    hookTimeout: 60000, // Increase hook timeout for database operations
    server: {
      deps: {
        inline: ['@prisma/client']
      }
    }
  },
  // plugins: [
  //   swc.vite(),
  // ],
});
