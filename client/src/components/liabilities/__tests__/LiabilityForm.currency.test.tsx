/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * Regression tests for #310 round 6 — LiabilityForm defaultCurrency prop.
 * Before: new liabilities hardcoded 'USD'.
 * After: `defaultCurrency` prop drives the initial value.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LiabilityForm } from '../LiabilityForm';
import { Liability } from '../../../types';

// Stub the repo so we can test the form in isolation
vi.mock('../../../hooks/useLiabilityRepository', () => ({
    useLiabilityRepository: () => ({
        addLiability: vi.fn(),
        updateLiability: vi.fn(),
        removeLiability: vi.fn(),
    }),
}));

describe('LiabilityForm (#310 round 6)', () => {
    it('defaults to USD when no defaultCurrency prop is passed', () => {
        render(
            <LiabilityForm
                onSuccess={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        // The currency select is the second select element in the form
        const selects = document.querySelectorAll('select');
        const currencySelect = selects[1] as HTMLSelectElement;
        expect(currencySelect.value).toBe('USD');
    });

    it('uses defaultCurrency="IDR" when prop is passed', () => {
        render(
            <LiabilityForm
                onSuccess={vi.fn()}
                onCancel={vi.fn()}
                defaultCurrency="IDR"
            />
        );
        const selects = document.querySelectorAll('select');
        const currencySelect = selects[1] as HTMLSelectElement;
        expect(currencySelect.value).toBe('IDR');
    });

    it('preserves existing liability currency when editing', () => {
        const existing: Liability = {
            id: 'l1',
            userId: 'user1',
            name: 'Car Loan',
            type: 'LONG_TERM',
            amount: 5000,
            currency: 'EUR',
            dueDate: new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        render(
            <LiabilityForm
                liability={existing}
                onSuccess={vi.fn()}
                onCancel={vi.fn()}
                defaultCurrency="IDR"
            />
        );
        const selects = document.querySelectorAll('select');
        const currencySelect = selects[1] as HTMLSelectElement;
        // Existing currency takes precedence over defaultCurrency
        expect(currencySelect.value).toBe('EUR');
    });
});
