/**
 * Copyright (c) 2024 ZakApp Contributors
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

/**
 * Web Push handlers (#383), loaded into the generated service worker.
 *
 * This file is NOT a service worker on its own. VitePWA runs workbox in
 * `generateSW` mode, which writes its own `sw.js` (precache manifest, the
 * navigateFallback app-shell rule, and the tuned runtimeCaching for API,
 * images and fonts). That generated worker is the real one — so it must not be
 * replaced.
 *
 * Instead this file is pulled in by the generated worker via
 * `workbox.importScripts` in `client/vite.config.ts`, so it runs in the same
 * global scope and can register its own listeners.
 *
 * Plain ES5-compatible JS on purpose: files in `public/` are copied verbatim
 * into the build, never transpiled, so TypeScript syntax here would ship as a
 * syntax error inside the service worker.
 *
 * Deliberately does NOT call `precacheAndRoute`: the generated worker already
 * does that. Two precache calls in one scope would register the same manifest
 * twice.
 */

// --- Show a notification when the server pushes one ---
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let title = 'ZakApp';
  const options = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: { url: '/' },
  };

  try {
    const json = event.data.json();
    if (json.title) title = json.title;
    if (json.body) options.body = json.body;
    if (json.icon) options.icon = json.icon;
    if (json.badge) options.badge = json.badge;
    if (json.data && json.data.url) options.data = json.data;
  } catch {
    // Server sent plain text rather than JSON.
    options.body = event.data.text();
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// --- Clicking it focuses an open tab, or opens one, on the target route ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              if ('navigate' in client) return client.navigate(url);
            });
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
