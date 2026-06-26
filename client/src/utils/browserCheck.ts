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

export interface BrowserCheckResult {
    feature: string;
    supported: boolean;
    details?: string;
    required: boolean;
}

export const checkBrowserCapabilities = async (): Promise<BrowserCheckResult[]> => {
    const results: BrowserCheckResult[] = [];

    // Check localStorage
    try {
        const storage = window.localStorage;
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        results.push({ feature: 'LocalStorage', supported: true, required: true, details: 'Required for storing user data locally.' });
    } catch (e) {
        results.push({ feature: 'LocalStorage', supported: false, required: true, details: 'LocalStorage is disabled or full. Enable cookies/storage in browser settings.' });
    }

    // Check IndexedDB
    const indexedDB = window.indexedDB || (window as any).mozIndexedDB || (window as any).webkitIndexedDB || (window as any).msIndexedDB;
    results.push({
        feature: 'IndexedDB',
        supported: !!indexedDB,
        required: true,
        details: indexedDB ? 'Supported' : 'Required for offline database capabilities.'
    });

    // Check Web Crypto API
    const crypto = window.crypto || (window as any).msCrypto;
    const hasSubtle = !!(crypto && crypto.subtle);
    results.push({
        feature: 'Web Crypto API',
        supported: hasSubtle,
        required: true,
        details: hasSubtle ? 'Supported' : 'Required for Zero-Knowledge encryption.'
    });

    // Check Service Worker
    results.push({
        feature: 'Service Worker',
        supported: 'serviceWorker' in navigator,
        required: false,
        details: 'serviceWorker' in navigator ? 'Supported' : 'Required for offline access (PWA).'
    });

    // Check Online Status
    results.push({
        feature: 'Internet Connection',
        supported: navigator.onLine,
        required: false,
        details: navigator.onLine ? 'Online' : 'You are currently offline. Sync will be paused.'
    });

    // Check HTTPS (unless localhost)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';
    results.push({
        feature: 'Secure Connection (HTTPS)',
        supported: isHttps || isLocal,
        required: true,
        details: (isHttps || isLocal) ? 'Secure' : 'Encryption requires HTTPS or localhost.'
    });

    return results;
};
