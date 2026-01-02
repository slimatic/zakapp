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

import { useState } from 'react';
import { useDb } from '../db';
import toast from 'react-hot-toast';
import { syncService } from '../services/SyncService';

export function useDataCleanup() {
    const db = useDb();
    const [isClearing, setIsClearing] = useState(false);

    const clearAllData = async () => {
        if (!db) {
            toast.error('Database not initialized');
            return;
        }

        setIsClearing(true);
        const toastId = toast.loading('Clearing financial data...');

        try {
            // We wipe financial data but preserve the User (auth) and potentially Settings if desired.
            // User requested "clean up the data, not the account". 
            // Usually this means Assets, Liabilities, Payments, Zakat Records, Calculations.

            const collections = [
                db.assets,
                db.liabilities,
                db.payment_records,
                db.nisab_year_records,
                db.zakat_calculations
            ];

            // 1. Delete Locally
            await Promise.all(collections.map(col => col.find().remove()));

            toast.loading('Pushing deletion to server...', { id: toastId });

            // 2. Ensure Remote Deletion (Wait for Sync)
            // This is critical effectively to "Remote Purge"
            await syncService.awaitSync();

            toast.success('All financial data has been cleared from this device and synced.', { id: toastId });

            // Optional: Trigger a window reload or router push to refresh state visualizers
            // window.location.reload(); 
        } catch (error: any) {
            console.error('Data cleanup failed:', error);
            toast.error('Failed to clear data: ' + error.message, { id: toastId });
        } finally {
            setIsClearing(false);
        }
    };

    return { clearAllData, isClearing };
}
