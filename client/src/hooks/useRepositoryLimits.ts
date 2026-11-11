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

import type { User } from '../types';

/**
 * The only shape this module needs from a collection, kept structural so the
 * quota rule can be exercised without standing up RxDB.
 */
export interface CountableCollection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    find: (...args: any[]) => { exec: () => Promise<any[]> };
}

/**
 * Per-category storage limits.
 *
 * Before this, the four categories enforced their limits differently: assets
 * checked in `addAsset`, liabilities compared the length of the in-memory list
 * (which is not the stored count), and payments and nisab records went through
 * `bulkAdd*` paths that performed no check at all. A restore therefore failed
 * the asset category while silently writing 124 payments against a limit of 25.
 *
 * The rule now lives in one place so the four cannot drift again.
 */

export interface Quota {
    /** How many rows of this category the account may hold, or undefined for no limit. */
    max: number | undefined;
    /** How many are stored right now. */
    used: number;
    /** How many more may be written. Infinity when there is no limit. */
    remaining: number;
}

/** The subset of the user object the limits are read from. */
interface LimitBearingUser {
    maxAssets?: number;
    maxLiabilities?: number;
    maxPayments?: number;
    maxNisabRecords?: number;
}

export const MAX_FOR = {
    assets: (u: LimitBearingUser | null | undefined) => u?.maxAssets,
    liabilities: (u: LimitBearingUser | null | undefined) => u?.maxLiabilities,
    payments: (u: LimitBearingUser | null | undefined) => u?.maxPayments,
    nisabRecords: (u: LimitBearingUser | null | undefined) => u?.maxNisabRecords
} as const;

export type LimitCategory = keyof typeof MAX_FOR;

/**
 * Count what is actually stored, rather than trusting an in-memory list. A list
 * that has not finished loading reads as 0 and lets a restore past the limit.
 */
export const currentCount = async (
    collection: CountableCollection,
    userId: string
): Promise<number> => {
    const docs = await collection
        .find({ selector: { userId: { $eq: userId } } })
        .exec();
    return docs.length;
};

/**
 * Resolve a category's quota. Callers decide what to do with it: a manual add
 * refuses when `remaining` is 0, an import takes `remaining` rows and reports
 * the rest.
 */
export const getQuota = async (
    category: LimitCategory,
    collection: CountableCollection,
    user: LimitBearingUser | null | undefined,
    userId: string
): Promise<Quota> => {
    const max = MAX_FOR[category](user);
    if (typeof max !== 'number') {
        return { max: undefined, used: 0, remaining: Infinity };
    }
    const used = await currentCount(collection, userId);
    return { max, used, remaining: Math.max(0, max - used) };
};

/** The message a manual add shows when the account is full. */
export const limitMessage = (category: LimitCategory, max: number): string => {
    const noun =
        category === 'assets' ? 'assets'
        : category === 'liabilities' ? 'liabilities'
        : category === 'payments' ? 'payments'
        : 'annual records';
    return `You have reached your limit of ${max} ${noun}. Remove one, or ask for a higher limit.`;
};

/**
 * Split an incoming batch into what the account can hold and what it cannot.
 *
 * The naive `incoming.slice(0, remaining)` is wrong in both directions:
 *   - a re-import of rows that ALREADY EXIST needs no new slot, yet a full
 *     account reported "0 imported, you are at your limit" for a no-op;
 *   - an update and a new row were treated alike, so a file with 10 existing
 *     and 10 new rows kept the updates only by luck of ordering.
 * An id already stored is an update and occupies no slot; only genuinely new
 * ids consume the remaining allowance.
 */
export const partitionByQuota = async <T extends { id?: string }>(
    category: LimitCategory,
    collection: CountableCollection,
    user: LimitBearingUser | null | undefined,
    userId: string,
    incoming: T[]
): Promise<{ accepted: T[]; skipped: number; max: number | undefined; used: number }> => {
    const quota = await getQuota(category, collection, user, userId);
    if (quota.remaining === Infinity || incoming.length === 0) {
        return { accepted: incoming, skipped: 0, max: quota.max, used: quota.used };
    }

    const ids = incoming.map((d) => d.id).filter((id): id is string => !!id);
    const stored = ids.length
        ? await collection.find({ selector: { id: { $in: ids } } }).exec()
        : [];
    const storedIds = new Set(stored.map((d: any) => d.get('id')));

    let slots = quota.remaining;
    const accepted = incoming.filter((doc) => {
        if (doc.id && storedIds.has(doc.id)) return true;
        if (slots > 0) {
            slots -= 1;
            return true;
        }
        return false;
    });

    return { accepted, skipped: incoming.length - accepted.length, max: quota.max, used: quota.used };
};
