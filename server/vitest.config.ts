/// <reference types="vitest" />
/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
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
    include: ['**/*.{test,spec}.ts', '../tests/**/*.test.ts'],
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
