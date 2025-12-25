import { useState, useEffect } from 'react';
import { useDb } from '../db'; // The RxDB init file
import { Asset } from '../types';
import { map } from 'rxjs/operators';

export function useAssetRepository() {
    const db = useDb();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) return;

        // Subscribe to asset query
        const sub = db.assets.find().$
            .pipe(
                map((docs: any[]) => docs.map((doc: any) => doc.toJSON()))
            )
            .subscribe({
                next: (data: Asset[]) => {
                    setAssets(data);
                    setIsLoading(false);
                },
                error: (err: any) => {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => sub.unsubscribe();
    }, [db]);

    const addAsset = async (asset: Partial<Asset>) => {
        if (!db) throw new Error('Database not initialized');
        // Ensure ID exists
        const newAsset = {
            ...asset,
            id: asset.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return db.assets.insert(newAsset);
    };

    const removeAsset = async (id: string) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.assets.findOne(id).exec();
        if (doc) {
            return doc.remove();
        }
    };

    return { assets, isLoading, error, addAsset, removeAsset };
}
