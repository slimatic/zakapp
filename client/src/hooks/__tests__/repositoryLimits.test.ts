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

/**
 * The limits used to be enforced differently in each of the four repositories:
 * assets counted only active rows, liabilities compared an in-memory list, and
 * payments and nisab records checked nothing at all. These pin the one rule they
 * now share, including the cases that were wrong before.
 */

import { describe, expect, it } from 'vitest';
import { getQuota, limitMessage, MAX_FOR } from '../useRepositoryLimits';

/**
 * Minimal stand-in for an RxDB collection's find().exec(). It honours the
 * selector, because the whole point of the rule is that only this user's rows
 * are counted — a fake that returns everything would pass a broken count.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectionOf = (docs: any[]) => ({
    find: (query?: any) => {
        const wanted = query?.selector?.userId?.$eq;
        return {
            exec: async () => (wanted === undefined ? docs : docs.filter((d) => d.userId === wanted))
        };
    }
});

const docsFor = (userId: string) => [{ userId }, { userId }, { userId: 'someone-else' }];

describe('getQuota', () => {
    it('reports remaining headroom from the stored count, not an in-memory list', async () => {
        const quota = await getQuota('assets', collectionOf(docsFor('u1')), { maxAssets: 20 }, 'u1');
        expect(quota.max).toBe(20);
        expect(quota.used).toBe(2);
        expect(quota.remaining).toBe(18);
    });

    it('counts only this user\'s rows', async () => {
        // The old liability check compared `liabilities.length`, which is the
        // whole loaded list, so another user's rows consumed the limit.
        const quota = await getQuota('liabilities', collectionOf(docsFor('u1')), { maxLiabilities: 2 }, 'u1');
        expect(quota.remaining).toBe(0);
    });

    it('never reports negative headroom when already over the limit', async () => {
        const quota = await getQuota('payments', collectionOf(docsFor('u1')), { maxPayments: 1 }, 'u1');
        expect(quota.remaining).toBe(0);
    });

    it('is unlimited when the category has no limit set', async () => {
        const quota = await getQuota('nisabRecords', collectionOf([]), {}, 'u1');
        expect(quota.max).toBeUndefined();
        expect(quota.remaining).toBe(Infinity);
    });

    it('is unlimited for a signed-out caller with no limit fields', async () => {
        const quota = await getQuota('assets', collectionOf([]), null, 'u1');
        expect(quota.remaining).toBe(Infinity);
    });

    it('reads a zero limit as full, not as unlimited', async () => {
        // `typeof max === 'number'` rather than a truthiness test: 0 is a limit.
        const quota = await getQuota('assets', collectionOf([]), { maxAssets: 0 }, 'u1');
        expect(quota.max).toBe(0);
        expect(quota.remaining).toBe(0);
    });
});

describe('MAX_FOR', () => {
    it('maps every category to its own user field', () => {
        const user = { maxAssets: 1, maxLiabilities: 2, maxPayments: 3, maxNisabRecords: 4 };
        expect(MAX_FOR.assets(user)).toBe(1);
        expect(MAX_FOR.liabilities(user)).toBe(2);
        expect(MAX_FOR.payments(user)).toBe(3);
        expect(MAX_FOR.nisabRecords(user)).toBe(4);
    });
});

describe('limitMessage', () => {
    it('names the category and the limit', () => {
        expect(limitMessage('assets', 20)).toContain('20 assets');
        expect(limitMessage('nisabRecords', 3)).toContain('3 annual records');
    });
});
