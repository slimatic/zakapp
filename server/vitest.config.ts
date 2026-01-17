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
      '@zakapp/shared': resolve(__dirname, '../shared/src/index.ts')
    },
    include: ['**/*.{test,spec}.ts'],
    exclude: ['test/setupEnv.ts', '**/node_modules/**', '**/dist/**'],
    setupFiles: ['./test/setupEnv.ts'],
    pool: 'forks', // Use forks for better isolation in node environment
  },
  // plugins: [
  //   swc.vite(),
  // ],
});
