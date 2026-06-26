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

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly REACT_APP_API_BASE_URL: string;
    readonly VITE_ALLOWED_HOSTS: string;
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly VITE_FEEDBACK_ENABLED: string;
    readonly VITE_FEEDBACK_WEBHOOK_URL: string;
    readonly VITE_COUCHDB_URL: string;
    readonly VITE_COUCHDB_USER: string;
    readonly VITE_COUCHDB_PASSWORD: string;
    readonly VITE_FEEDBACK_EMAIL: string;
    readonly VITE_ENABLE_DONATIONS: string;
    readonly VITE_ENABLE_QUERY_DEVTOOLS: string;
    // Add other env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly hot?: {
        readonly data: any;
        accept(): void;
        accept(cb: (mod: any) => void): void;
        accept(dep: string, cb: (mod: any) => void): void;
        accept(deps: readonly string[], cb: (mods: any[]) => void): void;
        dispose(cb: (data: any) => void): void;
        decline(): void;
        invalidate(): void;
        on(event: string, cb: (...args: any[]) => void): void;
    };
}
