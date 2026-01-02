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

import { useState, useEffect } from 'react';
import { useDb } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { map, switchMap } from 'rxjs/operators';
import { cryptoService } from '../services/CryptoService';
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
                switchMap(async (docs: any[]) => {
                    return Promise.all(docs.map(async (doc: any) => {
                        const data = { ...doc.toJSON() };

                        // Decrypt strings
                        for (const field of ['name', 'description', 'creditor', 'notes', 'metadata']) {
                            if (data[field] && cryptoService.isEncrypted(data[field])) {
                                try {
                                    const p = cryptoService.unpackEncrypted(data[field]);
                                    if (p) data[field] = await cryptoService.decrypt(p.ciphertext, p.iv);
                                } catch (e) {
                                    console.warn(`LiabilityRepo: Failed to decrypt ${field}`, e);
                                }
                            }
                        }

                        // Decrypt amount (number | string)
                        if (data.amount && typeof data.amount === 'string' && cryptoService.isEncrypted(data.amount)) {
                            try {
                                const p = cryptoService.unpackEncrypted(data.amount);
                                if (p) {
                                    const decrypted = await cryptoService.decrypt(p.ciphertext, p.iv);
                                    const parsed = parseFloat(decrypted);
                                    data.amount = isNaN(parsed) ? 0 : parsed;
                                }
                            } catch (e) {
                                console.warn('LiabilityRepo: Failed to decrypt amount', e);
                                data.amount = 0;
                            }
                        }

                        return data;
                    }));
                })
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
