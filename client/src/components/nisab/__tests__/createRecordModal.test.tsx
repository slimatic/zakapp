/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CreateRecordModal } from '../CreateRecordModal';

// The modal's contract under test: the review-step preview is the figure the
// record will store — the same selected assets under the user's methodology,
// over the hawl year the user picked. Selection tables are UI chrome with
// their own surfaces — stubbed; the date picker is stubbed as a button that
// records the backdated hawl start a user could have picked.
vi.mock('../../tracking/AssetSelectionTable', () => ({
    AssetSelectionTable: () => <div data-testid="asset-table" />,
}));
vi.mock('../../tracking/LiabilitySelectionTable', () => ({
    LiabilitySelectionTable: () => <div data-testid="liability-table" />,
}));
vi.mock('../../common/DualCalendarDatePicker', () => ({
    DualCalendarDatePicker: ({ onChange }: { onChange: (date: Date) => void }) => (
        <button data-testid="set-start" onClick={() => onChange(new Date(Date.now() - 30 * 86400000))}>
            set hawl start
        </button>
    ),
}));
vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../hooks/useNisabThreshold', () => ({
    useNisabThreshold: () => ({ nisabAmount: 6000, nisabStandard: 'GOLD' }),
}));
vi.mock('../../../hooks/useDisplayCurrency', () => ({
    useDisplayCurrency: () => ({ nisabStandard: 'GOLD' }),
}));

afterEach(cleanup);

const renderModal = (overrides: Record<string, unknown> = {}) => {
    const props = {
        open: true,
        onClose: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue({}),
        allAssets: [] as unknown[],
        allLiabilities: [] as unknown[],
        methodology: 'STANDARD',
        userCurrency: 'USD',
        ...overrides,
    } as never;
    render(<CreateRecordModal {...props} />);
    fireEvent.click(screen.getByText(/Next Step/));
    fireEvent.click(screen.getByText(/Next Step/));
};

describe('CreateRecordModal — the previewed record matches the stored one', () => {
    it('computes the review preview under the USER methodology, not the built-in default', () => {
        // The engine registry (methodology.ts) omits business goods from
        // Shafi'i's zakatable list while the built-in default includes them.
        // The review step must show the record's number, so the 10,000 of
        // inventory leaves the preview — and with it the duty it carried.
        renderModal({
            methodology: 'SHAFII',
            allAssets: [{ id: 'a1', name: 'Inventory', type: 'BUSINESS_ASSETS', value: 10000, isActive: true }],
        });

        // The preview under the user's school: inventory is not zakatable, so
        // total assets appear once only (total), and the 2.5% duty it carried
        // is gone with it.
        expect(screen.getAllByText('$10,000.00').length).toBe(1);
        expect(screen.queryByText('$250.00')).toBeNull();
    });

    it('recomputes the review over the hawl year the user picked, not "now"', () => {
        const start = new Date(Date.now() - 30 * 86400000);
        // A debt falling due 340 days from now lands 370 days after the picked
        // start — beyond the recorded year's lunar window — so once the user
        // records that start, the review must stop deducting it.
        renderModal({
            allAssets: [{ id: 'a1', name: 'Cash', type: 'CASH', value: 1000, isActive: true }],
            allLiabilities: [{ id: 'l2', amount: 400, dueDate: new Date(start.getTime() + 370 * 86400000).toISOString(), isActive: true }],
        });
        expect(screen.getAllByText('$600.00').length).toBeGreaterThanOrEqual(1);

        fireEvent.click(screen.getByTestId('set-start'));

        // The picker's recorded start moved the year back 30 days; the review
        // shows the number the record will store: nothing deductible inside
        // the started year.
        expect(screen.getAllByText('$1,000.00').length).toBe(2);
    });
});
