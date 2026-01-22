import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the parent directory (project root).
  const envDir = path.resolve(process.cwd(), '..');
  const env = loadEnv(mode, envDir, '');

  // Parse ALLOWED_HOSTS from environment (comma-separated)
  const envAllowedHosts = (env.ALLOWED_HOSTS || env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);

  // Default hosts
  const defaultHosts = ['localhost'];

  // Merge unique hosts
  const allowedHosts = Array.from(new Set([...defaultHosts, ...envAllowedHosts]));

  // Get git commit hash (if available)
  let commitHash = process.env.GIT_COMMIT_HASH || 'unknown';
  if (commitHash === 'unknown') {
    try {
      const { execSync } = require('child_process');
      commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
      console.warn('Could not get git commit hash');
    }
  }

  const pkg = require('./package.json');

  return {
    envDir,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __COMMIT_HASH__: JSON.stringify(commitHash),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'ZakApp - Islamic Zakat Calculator',
          short_name: 'ZakApp',
          description: 'Privacy-first Zakat calculator and asset manager.',
          theme_color: '#10b981',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
              },
            },
            {
              urlPattern: /\.(?:png|gif|jpg|jpeg|svg)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@headlessui/react', '@radix-ui/react-dialog'],
          },
        },
      },
    },
    server: {
      host: true, // Listen on all local IPs (0.0.0.0)
      port: parseInt(env.VITE_PORT || env.PORT || '3000'),
      allowedHosts: allowedHosts,
      proxy: {
        '/api': {
          target: 'http://backend:3001',
          changeOrigin: true,
          secure: false,
        },
      },
      watch: {
        usePolling: true, // Recommended for Docker on some systems
      },
    },
  };
});