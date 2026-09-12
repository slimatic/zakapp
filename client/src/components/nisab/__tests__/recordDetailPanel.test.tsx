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
import { RecordDetailPanel } from '../RecordDetailPanel';

// RecordDetailPanel composes ZakatDisplayCard, RecordRulingsPanel,
// HawlProgressIndicator, NisabComparisonWidget and PaymentHistoryCard.
// This suite asserts the panel's OWN contract: prop pass-through and the
// refresh callback. Children with dedicated suites are stubbed.

// HawlProgressIndicator/NisabComparisonWidget/ZakatDisplayCard use useAuth
// internally — stub them to keep this a pure panel-contract test.
vi.mock('../../HawlProgressIndicator', () => ({
    HawlProgressIndicator: () => <div data-testid="hawl-progress" />,
}));
vi.mock('../../NisabComparisonWidget', () => ({
    NisabComparisonWidget: () => <div data-testid="comparison-widget" />,
}));
vi.mock('../../tracking/ZakatDisplayCard', () => ({
    ZakatDisplayCard: ({ record }: { record: { hijriYear?: number } }) => (
        <div data-testid="zakat-display">{record.hijriYear} H</div>
    ),
}));

vi.mock('../RecordRulingsPanel', () => ({
    RecordRulingsPanel: () => <div data-testid="rulings-panel" />,
}));

vi.mock('../PaymentHistoryCard', () => ({
    PaymentHistoryCard: (props: { canRecordPayment: boolean; onRecordPayment: () => void; totalObligation: number }) => (
        <div data-testid="payment-history">
            <span>obligation:{props.totalObligation}</span>
            {props.canRecordPayment && (
                <button data-testid="record-payment-btn" onClick={props.onRecordPayment}>
                    + Record Payment
                </button>
            )}
        </div>
    ),
}));

const baseProps = {
    record: { id: 'r1', status: 'DRAFT', hijriYear: 1448 },
    assets: [
        { id: 'a1', name: 'Cash', type: 'CASH', zakatEligible: true, isActive: true },
    ],
    methodologyName: 'HANAFI',
    totalObligation: 1000,
    totalPaid: 400,
    remainingBalance: 600,
    isFullyPaid: false,
    payments: [],
    canRecordPayment: true,
    onRecordPayment: vi.fn(),
    onRefreshCalculations: vi.fn(),
    formatCurrency: (n: number) => `$${n}`,
};

const renderPanel = (overrides: Partial<Record<string, unknown>> = {}) =>
    render(
        <PrivacyProvider>
            <RecordDetailPanel {...baseProps} {...overrides} />
        </PrivacyProvider>
    );

afterEach(cleanup);

describe('RecordDetailPanel (#341 slice 2)', () => {
    it('renders all five child sections', () => {
        renderPanel();
        expect(screen.getByTestId('rulings-panel')).toBeInTheDocument();
        expect(screen.getByTestId('payment-history')).toBeInTheDocument();
        expect(screen.getByTestId('hawl-progress')).toBeInTheDocument();
        expect(screen.getByTestId('comparison-widget')).toBeInTheDocument();
        expect(screen.getByTestId('zakat-display')).toBeInTheDocument();
    });

    it('passes canRecordPayment through — button hidden when fully paid', () => {
        const { unmount } = renderPanel({ isFullyPaid: true, canRecordPayment: false });
        expect(screen.queryByTestId('record-payment-btn')).not.toBeInTheDocument();
        unmount();
        renderPanel({ isFullyPaid: false, canRecordPayment: true });
        expect(screen.getByTestId('record-payment-btn')).toBeInTheDocument();
    });

    it('forwards the payment callback', () => {
        renderPanel();
        fireEvent.click(screen.getByTestId('record-payment-btn'));
        expect(baseProps.onRecordPayment).toHaveBeenCalledTimes(1);
    });

    it('forwards the refresh callback', () => {
        renderPanel();
        fireEvent.click(screen.getByText(/Refresh Calculations/));
        expect(baseProps.onRefreshCalculations).toHaveBeenCalledTimes(1);
    });
});