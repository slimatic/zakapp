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

1|import path from 'path';
2|import { defineConfig, loadEnv } from 'vite';
3|import react from '@vitejs/plugin-react';
4|import { VitePWA } from 'vite-plugin-pwa';
5|import { visualizer } from 'rollup-plugin-visualizer';
6|
7|export default defineConfig(({ mode }) => {
8|  // Load env file based on `mode` in the parent directory (project root).
9|  const envDir = path.resolve(process.cwd(), '..');
10|  const env = loadEnv(mode, envDir, '');
11|
12|  // Parse ALLOWED_HOSTS from environment (comma-separated)
13|  const envAllowedHosts = (env.ALLOWED_HOSTS || env.VITE_ALLOWED_HOSTS || '')
14|    .split(',')
15|    .map(h => h.trim())
16|    .filter(Boolean);
17|
18|  // Default hosts
19|  const defaultHosts = ['localhost'];
20|
21|  // Merge unique hosts
22|  const allowedHosts = Array.from(new Set([...defaultHosts, ...envAllowedHosts]));
23|
24|  // Get git commit hash (if available)
25|  let commitHash = process.env.GIT_COMMIT_HASH || 'unknown';
26|  if (commitHash === 'unknown') {
27|    try {
28|      const { execSync } = require('child_process');
29|      commitHash = execSync('git rev-parse --short HEAD').toString().trim();
30|    } catch (e) {
31|      console.warn('Could not get git commit hash');
32|    }
33|  }
34|
35|  const pkg = require('./package.json');
36|
37|  return {
38|    envDir,
39|    define: {
40|      __APP_VERSION__: JSON.stringify(pkg.version),
41|      __COMMIT_HASH__: JSON.stringify(commitHash),
42|      'process.env.NODE_ENV': JSON.stringify(mode),
43|    },
44|    plugins: [
45|      react(),
46|      VitePWA({
47|        registerType: 'autoUpdate',
48|        manifest: {
49|          name: 'ZakApp - Islamic Zakat Calculator',
50|          short_name: 'ZakApp',
51|          description: 'Privacy-first Zakat calculator and asset manager.',
52|          theme_color: '#10b981',
53|          background_color: '#ffffff',
54|          display: 'standalone',
55|          start_url: '/',
56|          icons: [
57|            {
58|              src: 'pwa-192x192.png',
59|              sizes: '192x192',
60|              type: 'image/png',
61|            },
62|            {
63|              src: 'pwa-512x512.png',
64|              sizes: '512x512',
65|              type: 'image/png',
66|            },
67|          ],
68|        },
69|        workbox: {
70|          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
71|          runtimeCaching: [
72|            {
73|              urlPattern: /^https:\/\/api\./,
74|              handler: 'NetworkFirst',
75|              options: {
76|                cacheName: 'api-cache',
77|                expiration: {
78|                  maxEntries: 10,
79|                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
80|                },
81|              },
82|            },
83|            {
84|              urlPattern: /\.(?:png|gif|jpg|jpeg|svg)$/,
85|              handler: 'StaleWhileRevalidate',
86|              options: {
87|                cacheName: 'images',
88|                expiration: {
89|                  maxEntries: 50,
90|                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
91|                },
92|              },
93|            },
94|          ],
95|        },
96|      }),
97|      visualizer({
98|        filename: 'dist/stats.html',
99|        open: false,
100|        gzipSize: true,
101|        brotliSize: true,
102|      }),
103|    ],
104|    build: {
105|      rollupOptions: {
106|        output: {
107|          manualChunks: {
108|            vendor: ['react', 'react-dom'],
109|            router: ['react-router-dom'],
110|            ui: ['@headlessui/react', '@radix-ui/react-dialog'],
111|          },
112|        },
113|      },
114|    },
115|    server: {
116|      host: true, // Listen on all local IPs (0.0.0.0)
117|      port: parseInt(env.VITE_PORT || env.PORT || '3000'),
118|      allowedHosts: allowedHosts,
119|      proxy: {
120|        '/api': {
121|          target: 'http://backend:3001',
122|          changeOrigin: true,
123|          secure: false,
124|        },
125|      },
126|      watch: {
127|        usePolling: true, // Recommended for Docker on some systems
128|      },
129|    },
130|  };
131|});