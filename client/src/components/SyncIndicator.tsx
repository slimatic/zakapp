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

import toast from 'react-hot-toast';
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
            <div className="flex items-center gap-2 text-danger text-sm px-3 py-1 bg-danger-soft rounded-full" title="Sync Error">
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
                toast.success(`Connected in ${ms}ms - CouchDB ${info.version}`);
            } else {
                toast.error(`CouchDB returned ${res.status}. Some endpoints are admin-only.`);
            }
        } catch (err: any) {
            toast.error(`Cannot reach CouchDB at ${url}: ${err.message}`);
        }
    };

    if (status.active) {
        return (
            <button
                onClick={runDiagnostic}
                className="flex items-center gap-2 text-secondary text-sm px-3 py-1 bg-accent rounded-full animate-pulse group relative cursor-help hover:bg-accent transition-colors"
                title="Click to run connection test"
            >
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
                <div className="absolute top-full mt-2 inline-start-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs p-2 rounded shadow-card opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                    Waiting for: {status.pending?.length ? status.pending.join(', ') : 'Server Response'}
                    <br />
                    (Click to Test Connection)
                </div>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 text-success text-sm px-3 py-1 bg-success-soft rounded-full transition-colors duration-500">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Synced</span>
        </div>
    );
};
