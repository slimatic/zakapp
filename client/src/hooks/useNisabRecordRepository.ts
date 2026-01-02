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
import { map } from 'rxjs/operators';
import { NisabYearRecord } from '../types/nisabYearRecord';
import { cryptoService } from '../services/CryptoService';

/**
 * Hook for managing Nisab Year Records in the local database.
 * Provides real-time subscriptions and CRUD operations.
 */
export function useNisabRecordRepository() {
    const db = useDb();
    const { user } = useAuth();
    const [records, setRecords] = useState<NisabYearRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);



    useEffect(() => {
        if (!db) return;

        // Subscribe to records query
        const sub = db.nisab_year_records.find({
            sort: [{ hawlStartDate: 'desc' }]
        }).$
            .pipe(
                map((docs: any[]) => docs.map((doc: any) => {
                    const data = doc.toJSON();

                    // Decrypt numeric fields
                    ['totalWealth', 'totalLiabilities', 'zakatableWealth', 'zakatAmount'].forEach(field => {
                        if (typeof data[field] === 'string' && cryptoService.isEncrypted(data[field])) {
                            try {
                                const packed = cryptoService.unpackEncrypted(data[field]);
                                if (packed) {
                                    const decrypted = cryptoService.decrypt(packed.ciphertext, packed.iv);
                                    if (decrypted) data[field] = Number(decrypted);
                                }
                            } catch (e) {
                                console.warn(`Failed to decrypt ${field}`, e);
                            }
                        }
                    });

                    // Decrypt string/JSON fields
                    ['assetBreakdown', 'calculationDetails', 'userNotes'].forEach(field => {
                        if (typeof data[field] === 'string' && cryptoService.isEncrypted(data[field])) {
                            try {
                                const packed = cryptoService.unpackEncrypted(data[field]);
                                if (packed) {
                                    const decrypted = cryptoService.decrypt(packed.ciphertext, packed.iv);
                                    if (decrypted) data[field] = decrypted;
                                }
                            } catch (e) {
                                console.warn(`Failed to decrypt ${field}`, e);
                            }
                        }
                    });

                    return data;
                }))
            )
            .subscribe({
                next: (data: NisabYearRecord[]) => {
                    setRecords(data);
                    setIsLoading(false);
                },
                error: (err: any) => {
                    console.error('NisabRepo: Subscription error', err);
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => sub.unsubscribe();
    }, [db]);

    /**
     * Get the currently active record (DRAFT status), if any.
     */
    const activeRecord = records.find(r => r.status === 'DRAFT') || null;

    const addRecord = async (record: Partial<NisabYearRecord>) => {
        if (!db) throw new Error('Database not initialized');
        if (!user || !user.id) throw new Error('User not authenticated');

        const newRecord = {
            ...record,
            id: record.id || crypto.randomUUID(),
            userId: user.id, // Inject authenticated user ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return db.nisab_year_records.insert(newRecord);
    };

    const removeRecord = async (id: string) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.nisab_year_records.findOne(id).exec();
        if (doc) {
            return doc.remove();
        }
    };

    const updateRecord = async (id: string, updates: Partial<NisabYearRecord>) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.nisab_year_records.findOne(id).exec();
        if (doc) {
            return doc.patch({
                ...updates,
                updatedAt: new Date().toISOString()
            });
        }
    };

    const bulkAddRecords = async (recordsToAdd: Partial<NisabYearRecord>[]) => {
        if (!db) throw new Error('Database not initialized');
        const refinedRecords = recordsToAdd.map(r => ({
            ...r,
            id: r.id || crypto.randomUUID(),
            userId: r.userId || 'local-user'
        }));
        const result = await db.nisab_year_records.bulkUpsert(refinedRecords);
        if (result.error && result.error.length > 0) {
            console.error('Record Import Errors:', result.error);
            throw new Error(`${result.error.length} records failed validation: ${(result.error[0] as any).message}`);
        }
        return result;
    };

    return {
        records,
        activeRecord,
        isLoading,
        error,
        addRecord,
        removeRecord,
        updateRecord,
        bulkAddRecords
    };
}
