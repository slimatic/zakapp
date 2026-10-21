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
vi.mock('../useNisabRecordRepository', () => ({
    useNisabRecordRepository: () => ({
        records: [{ id: 'r1', hawlStartDate: '2026-01-01T00:00:00.000Z' }] as never,
        isLoading: false
    })
}));

vi.mock('../useAssetRepository', () => ({
    useAssetRepository: () => ({
        assets: [
            {
                id: 'a1',
                name: 'Active cash',
                type: 'CASH',
                value: 1000,
                currency: 'USD',
                isActive: true,
                createdAt: '',
                updatedAt: '',
                zakatEligible: true
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
                zakatEligible: true
            }
        ] as never as Asset[],
        isLoading: false
    })
}));

vi.mock('../useNisabThreshold', () => ({
    useNisabThreshold: () => ({ nisabAmount: 100, isLoading: false, refetch: vi.fn() })
}));

import { useHawlStatus } from '../useHawlStatus';

describe('useHawlStatus live totals', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('live totals exclude inactive assets', () => {
        const { result } = renderHook(() => useHawlStatus('r1'));

        expect(result.current.liveHawlData?.currentTotalWealth).toBe(1000);
        expect(result.current.liveHawlData?.currentZakatableWealth).toBe(1000);
        expect(result.current.liveHawlData?.zakatDue).toBe(25);
    });
});
