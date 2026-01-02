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
// Payment Record matches the shared type but lives locally in RxDB
import { PaymentRecord } from '@zakapp/shared/types/tracking';

/**
 * Hook for managing Payment Records in the local RxDB database.
 * Replaces the API-based usePayments hook for Offline-First functionality.
 */
export function usePaymentRepository() {
    const db = useDb();
    const { user } = useAuth();
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) return;

        // Subscribe to payments query
        // Sort by paymentDate descending (newest first)
        const sub = db.payment_records.find({
            sort: [{ paymentDate: 'desc' }]
        }).$
            .pipe(
                switchMap(async (docs: any[]) => {
                    return Promise.all(docs.map(async (doc: any) => {
                        const data = { ...doc.toJSON() };

                        // Decrypt strings
                        for (const field of ['recipientName', 'notes', 'receiptReference']) {
                            if (data[field] && cryptoService.isEncrypted(data[field])) {
                                try {
                                    const p = cryptoService.unpackEncrypted(data[field]);
                                    if (p) data[field] = await cryptoService.decrypt(p.ciphertext, p.iv);
                                } catch (e) {
                                    console.warn(`PaymentRepo: Failed to decrypt ${field}`, e);
                                }
                            }
                        }

                        // Decrypt amount
                        if (data.amount && typeof data.amount === 'string' && cryptoService.isEncrypted(data.amount)) {
                            try {
                                const p = cryptoService.unpackEncrypted(data.amount);
                                if (p) {
                                    const decrypted = await cryptoService.decrypt(p.ciphertext, p.iv);
                                    const parsed = parseFloat(decrypted);
                                    data.amount = isNaN(parsed) ? 0 : parsed;
                                }
                            } catch (e) {
                                console.warn('PaymentRepo: Failed to decrypt amount', e);
                                data.amount = 0;
                            }
                        }

                        return data;
                    }));
                })
            )
            .subscribe({
                next: (data: PaymentRecord[]) => {
                    setPayments(data);
                    setIsLoading(false);
                },
                error: (err: any) => {
                    console.error('PaymentRepo: Subscription error', err);
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => sub.unsubscribe();
    }, [db]);

    const addPayment = async (payment: Partial<PaymentRecord>) => {
        if (!db) throw new Error('Database not initialized');
        if (!user || !user.id) throw new Error('User not authenticated');

        const newPayment = {
            ...payment,
            id: payment.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Ensure required fields have valid defaults if missing
            status: payment.status || 'recorded',
            currency: payment.currency || 'USD',
            exchangeRate: payment.exchangeRate || 1.0,
            userId: user.id // Inject authenticated user ID
        };

        return db.payment_records.insert(newPayment);
    };

    const removePayment = async (id: string) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.payment_records.findOne(id).exec();
        if (doc) {
            return doc.remove();
        }
    };

    const updatePayment = async (id: string, updates: Partial<PaymentRecord>) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.payment_records.findOne(id).exec();
        if (doc) {
            return doc.patch({
                ...updates,
                updatedAt: new Date().toISOString()
            });
        }
    };

    /**
     * Batch insert for migration/import
     */
    const bulkAddPayments = async (paymentsToAdd: Partial<PaymentRecord>[]) => {
        if (!db) throw new Error('Database not initialized');

        const refinedPayments = paymentsToAdd.map(p => ({
            ...p,
            id: p.id || crypto.randomUUID(),
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: p.status || 'recorded',
            currency: p.currency || 'USD',
            userId: p.userId || 'local-user'
        }));

        const result = await db.payment_records.bulkUpsert(refinedPayments);
        if (result.error && result.error.length > 0) {
            console.error('Payment Import Errors:', result.error);
            const firstError = result.error[0];
            // RxDB errors can be nested. Try to extract the most useful message.
            const errorMsg = (firstError as any).message || JSON.stringify(firstError);
            throw new Error(`${result.error.length} payments failed validation: ${errorMsg}`);
        }
        return result;
    };

    return {
        payments,
        isLoading,
        error,
        addPayment,
        removePayment,
        updatePayment,
        bulkAddPayments
    };
}
