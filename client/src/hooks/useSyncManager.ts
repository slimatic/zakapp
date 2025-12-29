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

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDb } from '../db';
import { syncService } from '../services/SyncService';

/**
 * Hook that manages sync lifecycle based on authentication state.
 * Sync only starts when BOTH:
 * 1. User is authenticated (has userId)
 * 2. Local database is ready
 * 
 * This enables per-user CouchDB database isolation.
 */
export function useSyncManager() {
    const { user, isAuthenticated } = useAuth();
    const db = useDb();
    const syncStartedRef = useRef(false);

    useEffect(() => {
        // Only start sync if authenticated with userId AND db is ready
        if (isAuthenticated && user?.id && db && !syncStartedRef.current) {
            console.log(`🔄 SyncManager: Starting sync for user ${user.id}`);
            syncService.startSync(db, user.id);
            syncStartedRef.current = true;
        }

        // Cleanup when user logs out or db changes
        return () => {
            if (syncStartedRef.current) {
                console.log('🛑 SyncManager: Stopping sync');
                syncService.stopSync();
                syncStartedRef.current = false;
            }
        };
    }, [isAuthenticated, user?.id, db]);

    return { isSyncing: syncStartedRef.current };
}
