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

import React, { useEffect, useState } from 'react';
import { syncService } from '../services/SyncService';
import { CheckCircle, RefreshCcw, AlertCircle } from 'lucide-react';

export const SyncIndicator: React.FC = () => {
    const [status, setStatus] = useState<{ active: boolean; pending: string[]; errors: any[]; lastSync: Date | null; userId: string | null }>({
        active: false,
        pending: [],
        errors: [],
        lastSync: null,
        userId: null
    });

    useEffect(() => {
        const sub = syncService.syncStatus$.subscribe(setStatus);
        return () => sub.unsubscribe();
    }, []);

    if (status.errors.length > 0) {
        return (
            <div className="flex items-center gap-2 text-red-500 text-sm px-3 py-1 bg-red-50 rounded-full" title="Sync Error">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Sync Error</span>
            </div>
        );
    }

    const runDiagnostic = async () => {
        const config = (window as any).APP_CONFIG;
        const url = config?.COUCHDB_URL || 'http://localhost:5984';
        try {
            const start = Date.now();
            // Ping the CouchDB root instead of /_all_dbs
            const res = await fetch(url + '/');
            const ms = Date.now() - start;
            if (res.ok) {
                const info = await res.json();
                alert(`✅ CONNECTION SUCCESS\nTime: ${ms}ms\nURL: ${url}\nCouchDB Version: ${info.version}\n\nSync Status: ${status.active ? 'Active' : 'Idle'}\nPending: ${status.pending?.length || 0}`);
            } else {
                alert(`⚠️ CONNECTION ERROR\nStatus: ${res.status}\nURL: ${url}\n(Note: Some endpoints are restricted to admins)`);
            }
        } catch (err: any) {
            alert(`❌ CONNECTION FAILED\nURL: ${url}\nError: ${err.message}\n\nEnsure CouchDB is running and accessible or check CORS settings.`);
        }
    };

    if (status.active) {
        return (
            <button
                onClick={runDiagnostic}
                className="flex items-center gap-2 text-blue-600 text-sm px-3 py-1 bg-blue-50 rounded-full animate-pulse group relative cursor-help hover:bg-blue-100 transition-colors"
                title="Click to run connection test"
            >
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                    Waiting for: {status.pending?.length ? status.pending.join(', ') : 'Server Response'}
                    <br />
                    (Click to Test Connection)
                </div>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 text-green-600 text-sm px-3 py-1 bg-green-50 rounded-full transition-colors duration-500">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Synced</span>
        </div>
    );
};
