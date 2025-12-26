import { useState, useEffect } from 'react';
import { useDb } from '../db';
import { map } from 'rxjs/operators';
// Payment Record matches the shared type but lives locally in RxDB
import { PaymentRecord } from '@zakapp/shared/types/tracking';

/**
 * Hook for managing Payment Records in the local RxDB database.
 * Replaces the API-based usePayments hook for Offline-First functionality.
 */
export function usePaymentRepository() {
    const db = useDb();
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
                map((docs: any[]) => docs.map((doc: any) => doc.toJSON()))
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

        const newPayment = {
            ...payment,
            id: payment.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Ensure required fields have valid defaults if missing
            status: payment.status || 'recorded',
            currency: payment.currency || 'USD',
            exchangeRate: payment.exchangeRate || 1.0,
            userId: payment.userId || 'local-user' // temporary default until auth context is wired
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
