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
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'offline.html',
          'config.js',
          'logo.svg',
          'sw.js',
        ],
        manifest: {
          id: '/',
          name: 'ZakApp - Islamic Zakat Calculator',
          short_name: 'ZakApp',
          description: 'Privacy-first Zakat calculator and asset manager.',
          theme_color: '#10b981',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['finance', 'lifestyle', 'productivity'],
          screenshots: [
            {
              src: 'screenshot-wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
            },
            {
              src: 'screenshot-mobile.png',
              sizes: '375x812',
              type: 'image/png',
              form_factor: 'narrow',
            },
          ],
          lang: 'en',
          dir: 'ltr',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          // Issue #310 (round 4, PWA): the app shell (index.html) is precached,
          // so navigations must fall back to IT — never to offline.html. With
          // offline.html here, any transient index fetch failure served the
          // offline page for normal in-app navigation and "Try Again" could
          // never recover (the precached offline page kept being returned).
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/_\//, /^\/health/],
          cleanupOutdatedCaches: true,
          sourcemap: true,
          runtimeCaching: [
            // API network-first with 7-day cache
            {
              urlPattern: /^https:\/\/.+\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'zakapp-api',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
                networkTimeoutSeconds: 10,
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Google Fonts CSS — stale-while-revalidate
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-css',
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
            // Google Fonts files — cache-first (rarely change)
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Images with 30-day stale-while-revalidate
            {
              urlPattern: /\.(?:png|gif|jpg|jpeg|svg|webp|avif)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'zakapp-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            // Self-hosted fonts — cache-first (versioned via hashes)
            {
              urlPattern: /\.woff2?$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'zakapp-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
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
    // Local smoke-test preview: proxies /api to a reachable backend so the
    // built client on :4173 can authenticate (vite preview has no proxy by default).
    //
    // The Origin header is overridden because the production backend's CORS
    // allowlist is prod-only. That override must NOT apply when the target is a
    // local dev backend: in NODE_ENV=development the server allows localhost and
    // LAN origins and REJECTS everything else, and a rejected origin surfaces as
    // a 500 ("Not allowed by CORS") rather than a 403 — so a local run against a
    // dev backend fails on every request with an opaque internal error.
    //
    // With VITE_PROXY_TARGET pointing at a local backend we therefore send no
    // Origin at all, which the server treats as a non-browser client and allows.
    preview: {
      port: 4173,
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://192.168.86.242:3001',
          changeOrigin: true,
          secure: false,
          ...(process.env.VITE_PROXY_TARGET
            ? {}
            : { headers: { Origin: 'https://app.zakapp.org' } }),
        },
        // CouchDB MUST be proxied too. APP_CONFIG advertises COUCHDB_URL=/couchdb,
        // and without this rule vite serves the SPA's own index.html for that path
        // - a 200 text/html response that looks like success. RxDB then parses HTML
        // as a CouchDB reply and the sync never completes, so login hangs forever on
        // "Decrypting vault..." with no error in the console. Same-origin proxy also
        // sidesteps CORS, which the :5984 backend does not allow from this origin.
        '/couchdb': {
          target: process.env.VITE_COUCHDB_TARGET || 'http://192.168.86.242:5984',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/couchdb/, ''),
        },
      },
    },
  };
});