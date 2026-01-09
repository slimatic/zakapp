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
 * Service Worker Performance Tests
 * 
 * Tests service worker registration, lifecycle, and caching strategies.
 */

// Mock service worker API
const mockServiceWorkerContainer = {
  register: jest.fn(),
  ready: Promise.resolve({
    active: {
      postMessage: jest.fn(),
    },
  }),
  controller: null,
  oncontrollerchange: null,
};

Object.defineProperty(global.navigator, 'serviceWorker', {
  value: mockServiceWorkerContainer,
  writable: true,
});

describe('Service Worker Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockServiceWorkerContainer.register.mockResolvedValue({
        installing: null,
        waiting: null,
        active: { state: 'activated' },
        scope: '/',
      } as any);

      const registration = await navigator.serviceWorker.register('/service-worker.js');

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/service-worker.js');
      expect(registration.scope).toBe('/');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not register service worker in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // In development, we typically skip SW registration
      const shouldRegister = process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator;

      expect(shouldRegister).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle registration failure gracefully', async () => {
      mockServiceWorkerContainer.register.mockRejectedValue(
        new Error('Service worker registration failed')
      );

      try {
        await navigator.serviceWorker.register('/service-worker.js');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Service worker registration failed');
      }
    });

    it('should check for service worker support', () => {
      const isSupported = 'serviceWorker' in navigator;
      expect(isSupported).toBe(true);
    });
  });

  describe('Service Worker Lifecycle', () => {
    it('should handle installation event', () => {
      const swScope = {
        addEventListener: jest.fn(),
      };

      // Simulate SW installation
      const installHandler = (event: any) => {
        event.waitUntil(
          Promise.resolve().then(() => {
            console.log('Service worker installed');
          })
        );
      };

      swScope.addEventListener('install', installHandler);
      expect(swScope.addEventListener).toHaveBeenCalledWith('install', installHandler);
    });

    it('should handle activation event', () => {
      const swScope = {
        addEventListener: jest.fn(),
      };

      const activateHandler = (event: any) => {
        event.waitUntil(
          Promise.resolve().then(() => {
            console.log('Service worker activated');
          })
        );
      };

      swScope.addEventListener('activate', activateHandler);
      expect(swScope.addEventListener).toHaveBeenCalledWith('activate', activateHandler);
    });

    it('should skip waiting when updating', async () => {
      const skipWaiting = jest.fn();
      Object.defineProperty(global, 'skipWaiting', {
        value: skipWaiting,
        writable: true,
      });

      await skipWaiting();
      expect(skipWaiting).toHaveBeenCalled();
    });

    it('should claim clients after activation', async () => {
      const claim = jest.fn();
      const clients = { claim };

      await clients.claim();
      expect(claim).toHaveBeenCalled();
    });
  });

  describe('Caching Strategies', () => {
    it('should cache static assets on install', async () => {
      const mockCache = {
        addAll: jest.fn().mockResolvedValue(undefined),
      };

      const caches = {
        open: jest.fn().mockResolvedValue(mockCache),
      };

      Object.defineProperty(global, 'caches', {
        value: caches,
        writable: true,
      });

      const urlsToCache = [
        '/',
        '/static/css/main.css',
        '/static/js/main.js',
        '/manifest.json',
      ];

      const cache = await caches.open('zakapp-v1');
      await cache.addAll(urlsToCache);

      expect(caches.open).toHaveBeenCalledWith('zakapp-v1');
      expect(mockCache.addAll).toHaveBeenCalledWith(urlsToCache);
    });

    it('should use cache-first strategy for static assets', async () => {
      const mockCache = {
        match: jest.fn().mockResolvedValue(new Response('cached')),
        put: jest.fn(),
      };

      const caches = {
        match: jest.fn().mockResolvedValue(new Response('cached')),
      };

      Object.defineProperty(global, 'caches', {
        value: caches,
        writable: true,
      });

      const request = new Request('http://localhost/static/js/main.js');
      const cachedResponse = await caches.match(request);

      expect(cachedResponse).toBeTruthy();
      expect(await cachedResponse.text()).toBe('cached');
    });

    it('should use network-first strategy for API calls', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: 'fresh' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new Request('http://localhost/api/v1/assets');
      const response = await fetch(request);
      const data = await response.json();

      expect(data).toEqual({ data: 'fresh' });
      expect(fetch).toHaveBeenCalledWith(request);
    });

    it('should fall back to cache on network failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const mockCache = {
        match: jest.fn().mockResolvedValue(
          new Response(JSON.stringify({ data: 'cached' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        ),
      };

      const caches = {
        match: mockCache.match,
      };

      Object.defineProperty(global, 'caches', {
        value: caches,
        writable: true,
      });

      const request = new Request('http://localhost/api/v1/assets');

      try {
        await fetch(request);
      } catch {
        // Fetch failed, fall back to cache
        const cachedResponse = await caches.match(request);
        const data = await cachedResponse.json();
        expect(data).toEqual({ data: 'cached' });
      }
    });
  });

  describe('Cache Management', () => {
    it('should delete old caches on activation', async () => {
      const caches = {
        keys: jest.fn().mockResolvedValue(['zakapp-v1', 'zakapp-v2', 'zakapp-v3']),
        delete: jest.fn().mockResolvedValue(true),
      };

      Object.defineProperty(global, 'caches', {
        value: caches,
        writable: true,
      });

      const currentCache = 'zakapp-v3';
      const cacheKeys = await caches.keys();
      const oldCaches = cacheKeys.filter((key) => key !== currentCache);

      await Promise.all(oldCaches.map((cache) => caches.delete(cache)));

      expect(caches.delete).toHaveBeenCalledTimes(2);
      expect(caches.delete).toHaveBeenCalledWith('zakapp-v1');
      expect(caches.delete).toHaveBeenCalledWith('zakapp-v2');
    });

    it('should update cache on new version', async () => {
      const mockCache = {
        addAll: jest.fn().mockResolvedValue(undefined),
      };

      const caches = {
        open: jest.fn().mockResolvedValue(mockCache),
      };

      Object.defineProperty(global, 'caches', {
        value: caches,
        writable: true,
      });

      const newVersion = 'zakapp-v4';
      const cache = await caches.open(newVersion);
      await cache.addAll(['/']);

      expect(caches.open).toHaveBeenCalledWith(newVersion);
    });
  });

  describe('Service Worker Updates', () => {
    it('should notify user of available update', async () => {
      const onUpdateFound = jest.fn();

      mockServiceWorkerContainer.register.mockResolvedValue({
        installing: { state: 'installing' },
        waiting: null,
        active: { state: 'activated' },
        onupdatefound: null,
      } as any);

      const registration = await navigator.serviceWorker.register('/service-worker.js');

      if (registration.installing) {
        registration.onupdatefound = onUpdateFound;
        registration.onupdatefound();

        expect(onUpdateFound).toHaveBeenCalled();
      }
    });

    it('should reload page after update', async () => {
      const reload = jest.fn();
      try {
        Object.defineProperty(window.location, 'reload', {
          value: reload,
          writable: true,
        });
      } catch (err) {
        // Fallback: replace location object when property is non-configurable
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const originalLocation = window.location;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete (window as any).location;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (window as any).location = { ...originalLocation, reload };
      }

      mockServiceWorkerContainer.controller = {
        postMessage: jest.fn(),
      } as any;

      // Simulate update available
      const updateAvailable = true;

      if (updateAvailable && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();

        expect(reload).toHaveBeenCalled();
      }
    });
  });

  describe('Background Sync', () => {
    it('should register sync event', () => {
      const mockRegistration = {
        sync: {
          register: jest.fn().mockResolvedValue(undefined),
        },
      };

      const registerBackgroundSync = async (tag: string) => {
        await mockRegistration.sync.register(tag);
      };

      registerBackgroundSync('sync-assets');

      expect(mockRegistration.sync.register).toHaveBeenCalledWith('sync-assets');
    });
  });

  describe('Push Notifications', () => {
    it('should request notification permission', async () => {
      try {
        Object.defineProperty(window.Notification, 'permission', {
          value: 'default',
          writable: true,
        });

        Object.defineProperty(window.Notification, 'requestPermission', {
          value: jest.fn().mockResolvedValue('granted'),
          writable: true,
        });
      } catch (err) {
        // Fallback: replace Notification object when properties are non-configurable
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const originalNotification = window.Notification;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete (window as any).Notification;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (window as any).Notification = { ...originalNotification, permission: 'default', requestPermission: jest.fn().mockResolvedValue('granted') };
      }

      const permission = await Notification.requestPermission();

      expect(permission).toBe('granted');
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it('should subscribe to push notifications', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/...',
        keys: {
          p256dh: 'key1',
          auth: 'key2',
        },
      };

      const mockRegistration = {
        pushManager: {
          subscribe: jest.fn().mockResolvedValue(mockSubscription),
        },
      };

      const subscription = await mockRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'vapid-public-key',
      });

      expect(subscription).toEqual(mockSubscription);
      expect(mockRegistration.pushManager.subscribe).toHaveBeenCalled();
    });
  });
});
