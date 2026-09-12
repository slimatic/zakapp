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
import { PrivacyProvider } from '../../../contexts/PrivacyContext';
import { RecordListPanel } from '../RecordListPanel';

// RecordListPanel wraps NisabRecordCard, which needs useAuth + repositories.
// Stub the card and assert the panel's OWN contract: tabs, loading/empty
// states, and callback wiring.

vi.mock('../NisabRecordCard', () => ({
    NisabRecordCard: (props: { record: { id: string; hijriYear?: number }; isSelected: boolean; onSelect: () => void; onFinalize: (e: unknown) => void }) => (
        <div data-testid={`record-card-${props.record.id}`} data-selected={props.isSelected}>
            <span>{props.record.hijriYear} H</span>
            <button data-testid={`select-${props.record.id}`} onClick={props.onSelect}>select</button>
            <button data-testid={`finalize-${props.record.id}`} onClick={props.onFinalize}>finalize</button>
        </div>
    ),
}));

const record = { id: 'r1', hijriYear: 1448, status: 'DRAFT' };

const baseProps = {
    records: [record],
    isLoading: false,
    activeStatusFilter: 'all' as const,
    onStatusFilterChange: vi.fn(),
    selectedRecordId: null as string | null,
    onSelectRecord: vi.fn(),
    onClearSelection: vi.fn(),
    editingStartDateRecordId: null as string | null,
    newStartDate: '',
    onFinalize: vi.fn(),
    onUnlock: vi.fn(),
    onDelete: vi.fn(),
    onEditDate: vi.fn(),
    onSaveDate: vi.fn(),
    onCancelDate: vi.fn(),
    onDateChange: vi.fn(),
    onGeneratePdf: vi.fn(),
    onCreateRecord: vi.fn(),
    formatCurrency: (n: number) => `$${n}`,
    currency: 'USD',
};

const renderPanel = (overrides: Record<string, unknown> = {}) =>
    render(
        <PrivacyProvider>
            <RecordListPanel {...baseProps} {...overrides} />
        </PrivacyProvider>
    );

afterEach(cleanup);

describe('RecordListPanel (#341 slice 3)', () => {
    it('renders all four status tabs with their labels', () => {
        renderPanel();
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Finalized' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Unlocked for Editing' })).toBeInTheDocument();
    });

    it('marks the active tab and fires the filter callback', () => {
        renderPanel();
        const activeTab = screen.getByRole('button', { name: 'All' });
        expect(activeTab.className).toContain('border-blue-600');
        fireEvent.click(screen.getByRole('button', { name: 'Finalized' }));
        expect(baseProps.onStatusFilterChange).toHaveBeenCalledWith('FINALIZED');
    });

    it('shows the loading spinner while isLoading', () => {
        renderPanel({ isLoading: true, records: [] });
        expect(screen.queryByRole('button', { name: /Create your first record/ })).not.toBeInTheDocument();
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows the empty state with a create CTA when no records', () => {
        renderPanel({ records: [] });
        expect(screen.getByText(/No.*records yet/)).toBeInTheDocument();
        fireEvent.click(screen.getByText(/Create your first record/));
        expect(baseProps.onCreateRecord).toHaveBeenCalledTimes(1);
    });

    it('renders record cards and wires select/finalize through', () => {
        renderPanel({ selectedRecordId: 'r1' });
        const card = screen.getByTestId('record-card-r1');
        expect(card).toBeInTheDocument();
        expect(card.getAttribute('data-selected')).toBe('true');
        fireEvent.click(screen.getByTestId('select-r1'));
        expect(baseProps.onSelectRecord).toHaveBeenCalledWith('r1');
        fireEvent.click(screen.getByTestId('finalize-r1'));
        expect(baseProps.onFinalize).toHaveBeenCalledWith(record);
    });

    it('shows the mobile back button only when a record is selected', () => {
        const { unmount } = renderPanel({ selectedRecordId: null });
        expect(screen.queryByText('← Back to list')).not.toBeInTheDocument();
        unmount();
        renderPanel({ selectedRecordId: 'r1' });
        expect(screen.getByText('← Back to list')).toBeInTheDocument();
    });
});