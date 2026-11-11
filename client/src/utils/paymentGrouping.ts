/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Decimal } from 'decimal.js';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import { looksEncrypted } from './encryption';

export interface RecipientTotal {
    /** The spelling shown to the user (first one seen for that recipient). */
    name: string;
    count: number;
    total: Decimal;
    /** ISO date of the most recent payment, or '' when none is readable. */
    last: string;
}

/**
 * Totals per recipient, for the question a donor actually asks: "how much have
 * I given this masjid / this family?"
 *
 * Grouping is display-only. Names are compared trimmed and case-folded so
 * "Masjid Al-Noor" and "masjid al noor" are one recipient; the stored values are
 * never rewritten. Rows whose name is still ciphertext are collected under one
 * "Unreadable" row rather than being silently dropped or split per blob.
 */
export const groupPaymentsByRecipient = (payments: PaymentRecord[]): RecipientTotal[] => {
    const byName = new Map<string, RecipientTotal>();

    for (const payment of payments) {
        const raw = (payment.recipientName || 'Unknown').trim().replace(/\s+/g, ' ');
        const name = looksEncrypted(raw) ? 'Unreadable' : raw;
        const key = name.toLowerCase();
        const entry = byName.get(key) || { name, count: 0, total: new Decimal(0), last: '' };

        const date = typeof payment.paymentDate === 'string'
            ? payment.paymentDate
            : (payment.paymentDate as Date | undefined)?.toISOString?.() || '';

        entry.count += 1;
        entry.total = entry.total.plus(new Decimal(payment.amount || 0));
        if (date > entry.last) entry.last = date;
        byName.set(key, entry);
    }

    return [...byName.values()].sort((a, b) => b.total.comparedTo(a.total));
};
