import React, { useEffect, useState } from 'react';
import { syncService } from '../services/SyncService';
import { CheckCircle, RefreshCcw, AlertCircle } from 'lucide-react';

export const SyncIndicator: React.FC = () => {
    const [status, setStatus] = useState<{ active: boolean; errors: any[]; lastSync: Date | null }>({
        active: false,
        errors: [],
        lastSync: null
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

    if (status.active) {
        return (
            <div className="flex items-center gap-2 text-blue-600 text-sm px-3 py-1 bg-blue-50 rounded-full animate-pulse">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-green-600 text-sm px-3 py-1 bg-green-50 rounded-full transition-colors duration-500">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Synced</span>
        </div>
    );
};
