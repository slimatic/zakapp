# ZakApp v0.12.0 - Offline Caching Strategy

## Overview

ZakApp v0.12.0 implements a comprehensive offline-first architecture using Workbox (via `vite-plugin-pwa`) to cache static assets and enable offline functionality after the first load.

## Implementation Details

### Service Worker Configuration

The service worker is automatically generated and registered by `vite-plugin-pwa` with the following configuration in `client/vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    navigateFallback: '/offline.html',
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
      // Google Fonts files — cache-first
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
      // Fonts — cache-first
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
})
```

### Caching Strategies

1. **Precache (App Shell)**: Static assets are precached during service worker installation:
   - HTML files (index.html, offline.html)
   - JavaScript bundles
   - CSS files
   - Images and icons
   - Fonts

2. **Runtime Caching**:
   - **API Calls** (`/api/`): Network-first with 7-day cache, 10-second network timeout
   - **Google Fonts CSS**: Stale-while-revalidate with 1-year cache
   - **Google Fonts Files**: Cache-first with 1-year cache
   - **Images**: Stale-while-revalidate with 30-day cache, 100 entries max
   - **Self-hosted Fonts**: Cache-first with 1-year cache

3. **Navigation Fallback**: When offline, navigation requests fall back to `/offline.html` (except `/api/`, `/_/`, `/health`)

### Files Modified

- `client/src/index.tsx` - Removed duplicate service worker registration (now auto-injected by vite-plugin-pwa)
- `client/vite.config.ts` - Workbox configuration (already present)

### Generated Files (after build)

- `dist/sw.js` - Service worker script
- `dist/workbox-*.js` - Workbox runtime library
- `dist/manifest.json` - Web app manifest
- `dist/manifest.webmanifest` - Alternative manifest format

## Testing Offline Functionality

### Manual Smoke Test

1. **Build the application**:
   ```bash
   cd client
   npm run build
   ```

2. **Serve the production build**:
   ```bash
   npx serve -s dist -l 3000
   ```

3. **First load (online)**:
   - Open http://localhost:3000 in browser
   - Wait for the app to fully load
   - Service worker installs and precaches assets

4. **Test offline mode**:
   - Open DevTools → Network tab
   - Check "Offline" checkbox
   - Reload the page (Ctrl+Shift+R)
   - App should load from cache
   - Navigate between pages - all should work

5. **Verify offline page**:
   - Clear browser cache
   - Go offline in DevTools
   - Try to navigate to a new route
   - Should see the offline fallback page

### Lighthouse PWA Audit

1. **Run Lighthouse**:
   ```bash
   cd client
   npm run lighthouse:pwa
   ```

2. **Or use Chrome DevTools**:
   - Open http://localhost:3000
   - DevTools → Lighthouse
   - Select "Progressive Web App" category
   - Run audit

3. **Expected Results**:
   - ✅ Works offline
   - ✅ Installable (manifest + service worker)
   - ✅ Service worker registered
   - ✅ Fast and reliable

### Automated Tests

Run PWA-related tests:
```bash
cd client
npm test -- --run pwa
```

Test files:
- `client/src/tests/pwa/service-worker.test.ts` - Service worker lifecycle tests
- `client/src/tests/pwa/offline.test.tsx` - Offline functionality tests
- `client/src/tests/pwa/installation.test.tsx` - Install prompt tests

## Background Sync

ZakApp includes background sync for queued requests when offline:

- **File**: `client/src/utils/backgroundSync.ts`
- **Mechanism**: Failed requests are queued in IndexedDB
- **Sync trigger**: Automatically syncs when connection restored
- **Retry logic**: Configurable max attempts with exponential backoff

## Offline Capabilities

When offline, users can:
- ✅ View previously loaded assets
- ✅ Use the Zakat calculator
- ✅ Review calculation history
- ✅ View educational content
- ✅ Access cached dashboard data

Features requiring internet:
- ❌ Create new assets (queued for sync)
- ❌ Submit payments (queued for sync)
- ❌ Sync data across devices
- ❌ Push notifications

## Troubleshooting

### Service Worker Not Registering

1. Check browser console for errors
2. Verify HTTPS (required except on localhost)
3. Clear browser cache and storage
4. Check DevTools → Application → Service Workers

### Offline Mode Not Working

1. Ensure service worker is active (DevTools → Application → Service Workers)
2. Verify cache storage (DevTools → Application → Cache Storage)
3. Check if assets are precached
4. Try hard refresh (Ctrl+Shift+R) to install latest SW

### Update Issues

If new content doesn't load:
1. Service worker updates automatically on next navigation
2. Force update: DevTools → Application → Service Workers → "Update"
3. Or use the in-app update notification banner

## Browser Support

- ✅ Chrome 80+ (Desktop & Android)
- ✅ Firefox 85+
- ✅ Safari 12.1+ (iOS 12.2+)
- ✅ Edge 80+
- ⚠️ Safari PWA features limited compared to Chrome

## Performance Impact

- **Initial load**: Slightly slower due to service worker installation
- **Subsequent loads**: Significantly faster (cache-first strategy)
- **Offline**: Full functionality for cached content
- **Bundle size**: Workbox runtime adds ~23KB (gzipped)

## Future Improvements

- [ ] Add periodic background sync
- [ ] Implement cache versioning strategy
- [ ] Add user controls for cache management
- [ ] Optimize image caching with responsive images
- [ ] Add offline analytics tracking

## References

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web.dev PWA](https://web.dev/progressive-web-apps/)