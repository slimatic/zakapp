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

1|/// <reference types="vitest" />
2|import { resolve } from 'path';
3|// import swc from 'unplugin-swc';
4|import { defineConfig } from 'vitest/config';
5|
6|export default defineConfig({
7|  test: {
8|    globals: true,
9|    environment: 'node',
10|    alias: {
11|      '@': resolve(__dirname, './src'),
12|      '@zakapp/shared': resolve(__dirname, '../shared/src/index.ts'),
13|      '@prisma/client': resolve(__dirname, './node_modules/@prisma/client'),
14|    },
15|    include: ['**/*.{test,spec}.ts', '../tests/**/*.test.ts'],
16|    exclude: ['test/setupEnv.ts', '**/node_modules/**', '**/dist/**'],
17|    setupFiles: ['./test/setupEnv.ts'],
18|    globalSetup: ['./test/globalSetup.ts'],
19|    pool: 'forks', // Use forks for better isolation in node environment
20|    testTimeout: 60000, // Increase timeout for slower test environments
21|    hookTimeout: 60000, // Increase hook timeout for database operations
22|    server: {
23|      deps: {
24|        inline: ['@prisma/client']
25|      }
26|    }
27|  },
28|  // plugins: [
29|  //   swc.vite(),
30|  // ],
31|});
32|