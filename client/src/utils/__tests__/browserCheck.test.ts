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

import { checkBrowserCapabilities } from '../browserCheck';

describe('checkBrowserCapabilities', () => {
    // Mock navigator and window properties
    const originalNavigator = global.navigator;
    const originalWindow = global.window;
    const originalLocalStorage = global.window.localStorage;
    const originalIndexedDB = global.window.indexedDB;
    const originalCrypto = global.window.crypto;

    beforeEach(() => {
        // Reset to original before each test
        // @ts-ignore
        delete global.navigator;
        // @ts-ignore
        global.navigator = { ...originalNavigator, onLine: true, serviceWorker: {} };

        // @ts-ignore
        delete global.window;
        // @ts-ignore
        global.window = {
            ...originalWindow,
            localStorage: {
                setItem: jest.fn(),
                removeItem: jest.fn(),
            } as any,
            indexedDB: {} as any,
            crypto: { subtle: {} as any } as any,
            location: {
                hostname: 'localhost',
                protocol: 'http:',
            } as any
        };
    });

    afterAll(() => {
        // Restore original globals
        // @ts-ignore
        global.navigator = originalNavigator;
        // @ts-ignore
        global.window = originalWindow;
    });

    it('should return all checks as supported when everything is available', async () => {
        const results = await checkBrowserCapabilities();

        expect(results).toHaveLength(6);
        expect(results.find(r => r.feature === 'LocalStorage')?.supported).toBe(true);
        expect(results.find(r => r.feature === 'IndexedDB')?.supported).toBe(true);
        expect(results.find(r => r.feature === 'Web Crypto API')?.supported).toBe(true);
        expect(results.find(r => r.feature === 'Service Worker')?.supported).toBe(true);
        expect(results.find(r => r.feature === 'Internet Connection')?.supported).toBe(true);
        expect(results.find(r => r.feature === 'Secure Connection (HTTPS)')?.supported).toBe(true);
    });

    it('should detect missing localStorage', async () => {
        // @ts-ignore
        global.window.localStorage.setItem = jest.fn(() => { throw new Error('QuotaExceeded'); });

        const results = await checkBrowserCapabilities();
        expect(results.find(r => r.feature === 'LocalStorage')?.supported).toBe(false);
    });

    it('should detect missing IndexedDB', async () => {
        // @ts-ignore
        delete global.window.indexedDB;
        // @ts-ignore
        global.window.mozIndexedDB = undefined;
        // @ts-ignore
        global.window.webkitIndexedDB = undefined;
        // @ts-ignore
        global.window.msIndexedDB = undefined;

        const results = await checkBrowserCapabilities();
        expect(results.find(r => r.feature === 'IndexedDB')?.supported).toBe(false);
    });

    it('should detect offline status', async () => {
        // @ts-ignore
        global.navigator.onLine = false;

        const results = await checkBrowserCapabilities();
        expect(results.find(r => r.feature === 'Internet Connection')?.supported).toBe(false);
    });

    it('should detect insecure connection on non-localhost', async () => {
        // @ts-ignore
        global.window.location.hostname = 'example.com';
        // @ts-ignore
        global.window.location.protocol = 'http:';

        const results = await checkBrowserCapabilities();
        expect(results.find(r => r.feature === 'Secure Connection (HTTPS)')?.supported).toBe(false);
    });
});
