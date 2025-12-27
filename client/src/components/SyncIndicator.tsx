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
            const res = await fetch(url + '/_all_dbs');
            const ms = Date.now() - start;
            if (res.ok) {
                const dbs = await res.json();
                alert(`✅ CONNECTION SUCCESS\nTime: ${ms}ms\nURL: ${url}\nDBs Found: ${dbs.length}\n\nPending: ${status.pending?.join(', ') || 'None'}`);
            } else {
                alert(`⚠️ CONNECTION ERROR\nStatus: ${res.status}\nURL: ${url}`);
            }
        } catch (err: any) {
            alert(`❌ CONNECTION FAILED\nURL: ${url}\nError: ${err.message}\n\nEnsure CouchDB is running and accessible.`);
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
