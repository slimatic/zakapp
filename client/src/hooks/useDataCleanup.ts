import { useState } from 'react';
import { useDb } from '../db';
import toast from 'react-hot-toast';

export function useDataCleanup() {
    const db = useDb();
    const [isClearing, setIsClearing] = useState(false);

    const clearAllData = async () => {
        if (!db) {
            toast.error('Database not initialized');
            return;
        }

        setIsClearing(true);
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

            // Execute in parallel
            await Promise.all(collections.map(col => col.find().remove()));

            toast.success('All financial data has been cleared from this device.');

            // Optional: Trigger a window reload or router push to refresh state visualizers
            // window.location.reload(); 
        } catch (error: any) {
            console.error('Data cleanup failed:', error);
            toast.error('Failed to clear data: ' + error.message);
        } finally {
            setIsClearing(false);
        }
    };

    return { clearAllData, isClearing };
}
