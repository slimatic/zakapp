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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Asset } from '../../types';

// Synthetic values only — never real record data.
const h = vi.hoisted(() => ({
    records: [] as Array<Record<string, unknown>>,
    assets: [] as Array<Record<string, unknown>>,
    liabilities: [] as Array<Record<string, unknown>>,
    settings: null as Record<string, unknown> | null,
    nisab: {} as Partial<Record<'GOLD' | 'SILVER', number>>,
    thresholdCalls: [] as Array<Array<string | undefined>>,
}));

vi.mock('../useNisabRecordRepository', () => ({
    useNisabRecordRepository: () => ({ records: h.records, isLoading: false }),
}));

vi.mock('../useAssetRepository', () => ({
    useAssetRepository: () => ({ assets: h.assets, isLoading: false }),
}));
vi.mock('../useLiabilityRepository', () => ({
    useLiabilityRepository: () => ({ liabilities: h.liabilities, isLoading: false }),
}));
vi.mock('../useUserSettingsRepository', () => ({
    useUserSettingsRepository: () => ({ settings: h.settings, isLoading: false }),
}));

vi.mock('../useDisplayCurrency', () => ({
    useDisplayCurrency: () => ({
        currency: 'USD',
        nisabStandard: 'tola',
        formatCurrency: (n: number) => String(n),
    }),
}));

vi.mock('../useNisabThreshold', () => ({
    useNisabThreshold: (
        currency?: string,
        basis?: 'GOLD' | 'SILVER',
        standard?: string
    ) => {
        h.thresholdCalls.push([currency, basis, standard]);
        return {
            nisabAmount: h.nisab[basis ?? 'GOLD'],
            isLoading: false,
            refetch: vi.fn(),
        };
    },
}));

import { useHawlStatus } from '../useHawlStatus';

const asset = (over: Partial<Asset>): Asset =>
    ({
        id: 'a',
        name: 'Asset',
        type: 'CASH',
        value: 0,
        currency: 'USD',
        isActive: true,
        createdAt: '',
        updatedAt: '',
        ...over,
    }) as Asset;

const lastThresholdCall = () => h.thresholdCalls[h.thresholdCalls.length - 1];

describe('useHawlStatus live totals', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        h.records = [{ id: 'r1', hawlStartDate: '2026-01-01T00:00:00.000Z' }];
        h.assets = [
            {
                id: 'a1',
                name: 'Active cash',
                type: 'CASH',
                value: 1000,
                currency: 'USD',
                isActive: true,
                createdAt: '',
                updatedAt: '',
                zakatEligible: true,
            },
            {
                id: 'a2',
                name: 'Closed account',
                type: 'CASH',
                value: 5000,
                currency: 'USD',
                isActive: false,
                createdAt: '',
                updatedAt: '',
                zakatEligible: true,
            },
        ];
        h.settings = { preferredMethodology: 'standard' };
        h.nisab = { GOLD: 100, SILVER: 700 };
        h.thresholdCalls = [];
    });

    it('live totals exclude inactive assets', () => {
        const { result } = renderHook(() => useHawlStatus('r1'));

        expect(result.current.liveHawlData?.currentTotalWealth).toBe(1000);
        expect(result.current.liveHawlData?.currentZakatableWealth).toBe(1000);
        expect(result.current.liveHawlData?.zakatDue).toBe(25);
    });

    it('counts only zakatable asset types, using the shared eligibility rule', () => {
        h.assets = [
            asset({ id: 'cash', value: 1000, zakatEligible: true }),
            // Never asked; no school makes a home zakatable.
            asset({ id: 'home', name: 'Home', type: 'REAL_ESTATE', value: 100000 }),
        ];
        h.nisab = { GOLD: 500 };

        const { result } = renderHook(() => useHawlStatus('r1'));

        // Net worth keeps the home; the zakat base does not.
        expect(result.current.liveHawlData?.currentTotalWealth).toBe(101000);
        expect(result.current.liveHawlData?.currentZakatableWealth).toBe(1000);
        expect(result.current.liveHawlData?.zakatDue).toBe(25);
    });

    it("reads the threshold on the record's stored nisab basis", () => {
        h.records = [
            {
                id: 'r1',
                hawlStartDate: '2026-01-01T00:00:00.000Z',
                // The schema documents the stored form as lowercase.
                nisabBasis: 'silver',
            },
        ];
        h.assets = [asset({ id: 'cash', value: 1000, zakatEligible: true })];
        h.nisab = { GOLD: 7000, SILVER: 700 };

        const { result } = renderHook(() => useHawlStatus('r1'));

        expect(result.current.liveHawlData?.isAboveNisab).toBe(true);
        expect(result.current.liveHawlData?.zakatDue).toBe(25);
        expect(lastThresholdCall()).toEqual(['USD', 'SILVER', 'tola']);
    });

    it("uses the record's stored methodology where it carries one", () => {
        h.records = [
            {
                id: 'r1',
                hawlStartDate: '2026-01-01T00:00:00.000Z',
                nisabBasis: 'GOLD',
                methodologyUsed: 'SHAFII',
            },
        ];
        // The user's current preference differs; the record's own school wins.
        h.settings = { preferredMethodology: 'hanafi' };
        // No explicit answer: the school decides, and Shafi'i exempts jewelry.
        h.assets = [asset({ id: 'ring', name: 'Gold ring', type: 'GOLD', value: 1000 })];
        h.nisab = { GOLD: 100 };

        const { result } = renderHook(() => useHawlStatus('r1'));

        expect(result.current.liveHawlData?.currentTotalWealth).toBe(1000);
        expect(result.current.liveHawlData?.currentZakatableWealth).toBe(0);
        expect(result.current.liveHawlData?.isAboveNisab).toBe(false);
        expect(result.current.liveHawlData?.zakatDue).toBe(0);
    });

    it('withholds the nisab verdict while the threshold is unknown', () => {
        h.assets = [asset({ id: 'cash', value: 1000, zakatEligible: true })];
        // Both thresholds unavailable (price fetch still in flight).
        h.nisab = {};

        const { result } = renderHook(() => useHawlStatus('r1'));

        expect(result.current.liveHawlData?.isAboveNisab).toBeUndefined();
        expect(result.current.liveHawlData?.zakatDue).toBe(0);
    });
});

describe('useHawlStatus deducts liabilities on the shared rule', () => {
    const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

    beforeEach(() => {
        vi.clearAllMocks();
        h.records = [{ id: 'r1', hawlStartDate: '2026-01-01T00:00:00.000Z' }];
        h.assets = [{ id: 'cash', name: 'Cash', type: 'CASH', value: 1000, currency: 'USD', isActive: true, createdAt: '', updatedAt: '', zakatEligible: true }];
        h.settings = { preferredMethodology: 'standard' };
        h.nisab = { GOLD: 100, SILVER: 700 };
        h.thresholdCalls = [];
        h.liabilities = [];
    });

    it('charges on wealth net of a debt due within the lunar year', () => {
        h.liabilities = [
            { id: 'l1', name: 'Card', type: 'credit_card', amount: 400, dueDate: days(30), isActive: true },
        ];

        const { result } = renderHook(() => useHawlStatus('r1'));

        // (1,000 - 400) x 2.5% = 15.
        expect(result.current.liveHawlData?.currentZakatableWealth).toBe(600);
        expect(result.current.liveHawlData?.zakatDue).toBe(15);
        expect(result.current.liveHawlData?.isAboveNisab).toBe(true);
    });

    it('deducts a user-confirmed portion of a far-future balance', () => {
        h.liabilities = [
            { id: 'l1', name: 'Mortgage', type: 'mortgage', amount: 200000, dueDate: days(3 * 365), deductibleAmount: 400, isActive: true },
        ];

        const { result } = renderHook(() => useHawlStatus('r1'));

        expect(result.current.liveHawlData?.currentZakatableWealth).toBe(600);
        expect(result.current.liveHawlData?.zakatDue).toBe(15);
    });

    it('deducts nothing for a far-future balance with no confirmed portion', () => {
        h.liabilities = [
            { id: 'l1', name: 'Mortgage', type: 'mortgage', amount: 200000, dueDate: days(3 * 365), isActive: true },
        ];

        const { result } = renderHook(() => useHawlStatus('r1'));

        expect(result.current.liveHawlData?.currentZakatableWealth).toBe(1000);
        expect(result.current.liveHawlData?.zakatDue).toBe(25);
    });

    it('counts a closed liability nowhere', () => {
        h.liabilities = [
            { id: 'l1', name: 'Paid off', type: 'loan', amount: 400, dueDate: days(10), isActive: false },
        ];

        const { result } = renderHook(() => useHawlStatus('r1'));

        expect(result.current.liveHawlData?.currentZakatableWealth).toBe(1000);
        expect(result.current.liveHawlData?.zakatDue).toBe(25);
    });

    it('drops the verdict when debts take the portfolio below nisab', () => {
        h.assets = [{ id: 'cash', name: 'Cash', type: 'CASH', value: 1000, currency: 'USD', isActive: true, createdAt: '', updatedAt: '', zakatEligible: true }];
        h.nisab = { GOLD: 700 };
        h.liabilities = [
            { id: 'l1', name: 'Card', type: 'credit_card', amount: 400, dueDate: days(30), isActive: true },
        ];

        const { result } = renderHook(() => useHawlStatus('r1'));

        // 600 net against a 700 threshold: not due, and no figure invented.
        expect(result.current.liveHawlData?.isAboveNisab).toBe(false);
        expect(result.current.liveHawlData?.zakatDue).toBe(0);
    });
});
