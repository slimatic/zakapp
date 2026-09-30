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
import { switchMap } from 'rxjs/operators';
import { cryptoService } from '../services/CryptoService';
import { PaymentEncryptionService } from '../services/PaymentEncryptionService';
// Payment Record matches the shared type but lives locally in RxDB
import { PaymentRecord } from '@zakapp/shared/types/tracking';
import { getQuota, limitMessage } from './useRepositoryLimits';

/**
 * Hook for managing Payment Records in the local RxDB database.
 * Replaces the API-based usePayments hook for Offline-First functionality.
 */
export function usePaymentRepository(options: { snapshotId?: string } = {}) {
    const db = useDb();
    const { user } = useAuth();
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) return;

        // Build selector based on options
        const selector: any = {};
        if (options.snapshotId) {
            selector.snapshotId = { $eq: options.snapshotId };
        }

        // Subscribe to payments query
        // Sort by paymentDate descending (newest first)
        const sub = db.payment_records.find({
            selector,
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

        const quota = await getQuota('payments', db.payment_records, user, user.id);
        if (quota.remaining <= 0 && quota.max !== undefined) {
            throw new Error(limitMessage('payments', quota.max));
        }

        const newPayment = {
            ...payment,
            id: payment.id || crypto.randomUUID(),
            // Preserve a supplied createdAt (backup restore); see useAssetRepository.
            createdAt: payment.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Ensure required fields have valid defaults if missing
            status: payment.status || 'recorded',
            currency: payment.currency || 'USD',
            exchangeRate: payment.exchangeRate || 1.0,
            userId: user.id // Inject authenticated user ID
        };

        // Encrypt sensitive fields BEFORE inserting into RxDB
        const encryptedPayment = await PaymentEncryptionService.encryptPaymentData(newPayment);

        return db.payment_records.insert(encryptedPayment);
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
     * Batch insert for migration/import.
     *
     * Takes only what the account has room for and reports the rest as skipped,
     * rather than either ignoring the limit (which let a restore write 124
     * payments against a limit of 25) or refusing the whole file (which made a
     * restore fail outright). The caller surfaces the count so the user knows
     * their file was not fully read and can import again after freeing space.
     */
    const bulkAddPayments = async (paymentsToAdd: Partial<PaymentRecord>[]) => {
        if (!db) throw new Error('Database not initialized');
        if (!user || !user.id) throw new Error('User not authenticated');

        const quota = await getQuota('payments', db.payment_records, user, user.id);
        const [accepted, skipped] = quota.remaining === Infinity
            ? [paymentsToAdd, []]
            : [paymentsToAdd.slice(0, quota.remaining), paymentsToAdd.slice(quota.remaining)];

        const refinedPayments = accepted.map(p => ({
            ...p,
            id: p.id || crypto.randomUUID(),
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: p.status || 'recorded',
            currency: p.currency || 'USD',
            userId: p.userId || 'local-user'
        }));

        // Encrypt all payments before bulk insert
        const encryptedPayments = await Promise.all(
            refinedPayments.map(p => PaymentEncryptionService.encryptPaymentData(p))
        );

        const result = await db.payment_records.bulkUpsert(encryptedPayments);
        if (result.error && result.error.length > 0) {
            console.error('Payment Import Errors:', result.error);
            const firstError = result.error[0];
            // RxDB errors can be nested. Try to extract the most useful message.
            const errorMsg = (firstError as any).message || JSON.stringify(firstError);
            throw new Error(`${result.error.length} payments failed validation: ${errorMsg}`);
        }
        return { saved: accepted.length, skipped: skipped.length, result };
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
