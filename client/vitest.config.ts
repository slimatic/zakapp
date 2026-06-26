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
2|import { defineConfig } from 'vite';
3|import react from '@vitejs/plugin-react';
4|import path from 'path';
5|
6|export default defineConfig({
7|    plugins: [react()],
8|    resolve: {
9|        alias: {
10|            '@': path.resolve(__dirname, './src'),
11|        },
12|    },
13|    test: {
14|        globals: true,
15|        environment: 'jsdom',
16|        setupFiles: ['./src/setupTests.ts'],
17|        css: false,
18|        exclude: ['**/e2e/**', '**/node_modules/**'],
19|    },
20|});
21|