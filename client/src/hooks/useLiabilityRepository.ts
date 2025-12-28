import { useState, useEffect } from 'react';
import { useDb } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { map } from 'rxjs/operators';

import { Liability } from '../types';

export function useLiabilityRepository() {
    const db = useDb();
    const { user } = useAuth();
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) return;

        const sub = db.liabilities.find().$
            .pipe(
                map((docs: any[]) => docs.map((doc: any) => doc.toJSON()))
            )
            .subscribe({
                next: (data: Liability[]) => {
                    setLiabilities(data);
                    setIsLoading(false);
                },
                error: (err: any) => {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => sub.unsubscribe();
    }, [db]);

    const addLiability = async (liability: Partial<Liability>) => {
        if (!db) throw new Error('Database not initialized');
        if (!user || !user.id) throw new Error('User not authenticated');

        const newLiability = {
            ...liability,
            id: liability.id || crypto.randomUUID(),
            userId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: liability.isActive ?? true,
            currency: liability.currency || 'USD'
        };

        return db.liabilities.insert(newLiability);
    };

    const bulkAddLiabilities = async (liabilitiesToAdd: Partial<Liability>[]) => {
        if (!db) throw new Error('Database not initialized');
        const refinedLiabilities = liabilitiesToAdd.map(l => ({
            ...l,
            id: l.id || crypto.randomUUID(),
            userId: l.userId || user?.id || 'local-user',
            createdAt: l.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: l.isActive ?? true,
            currency: l.currency || 'USD'
        }));

        const result = await db.liabilities.bulkUpsert(refinedLiabilities);
        if (result.error && result.error.length > 0) {
            console.error('Liability Import Errors:', result.error);
            throw new Error(`${result.error.length} liabilities failed validation`);
        }
        return result;
    };

    const removeLiability = async (id: string) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.liabilities.findOne(id).exec();
        if (doc) {
            return doc.remove();
        }
    };

    const updateLiability = async (id: string, updates: Partial<Liability>) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.liabilities.findOne(id).exec();
        if (doc) {
            return doc.patch({
                ...updates,
                updatedAt: new Date().toISOString()
            });
        }
    };

    return { liabilities, isLoading, error, addLiability, bulkAddLiabilities, removeLiability, updateLiability };
}
