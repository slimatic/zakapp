/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useDisplayCurrency } from '../useDisplayCurrency';

// The hook composes three sources; stub each and verify the resolution
// order and the masking contract instead of rendering real providers.

const mockSettingsRepo = vi.fn();
const mockUseAuth = vi.fn();
const mockMask = vi.fn((v: string) => v);

vi.mock('../useUserSettingsRepository', () => ({
    useUserSettingsRepository: () => mockSettingsRepo(),
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('../../contexts/PrivacyContext', () => ({
    useMaskedCurrency: () => mockMask,
}));

describe('useDisplayCurrency (#341 consolidation)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMask.mockImplementation((v: string) => v);
    });
    afterEach(cleanup);

    it('resolves baseCurrency from local RxDB settings first', () => {
        mockSettingsRepo.mockReturnValue({ settings: { baseCurrency: 'IDR' } });
        mockUseAuth.mockReturnValue({ user: { settings: { currency: 'USD' } } });
        const { result } = renderHook(() => useDisplayCurrency());
        expect(result.current.currency).toBe('IDR');
    });

    it('falls through to auth settings when local settings absent', () => {
        mockSettingsRepo.mockReturnValue({ settings: null });
        mockUseAuth.mockReturnValue({ user: { settings: { currency: 'GBP' } } });
        const { result } = renderHook(() => useDisplayCurrency());
        expect(result.current.currency).toBe('GBP');
    });

    it('falls through to legacy preferences.currency', () => {
        mockSettingsRepo.mockReturnValue({ settings: null });
        mockUseAuth.mockReturnValue({ user: { preferences: { currency: 'EUR' } } });
        const { result } = renderHook(() => useDisplayCurrency());
        expect(result.current.currency).toBe('EUR');
    });

    it('defaults to USD when nothing is set', () => {
        mockSettingsRepo.mockReturnValue({ settings: null });
        mockUseAuth.mockReturnValue({ user: null });
        const { result } = renderHook(() => useDisplayCurrency());
        expect(result.current.currency).toBe('USD');
    });

    it('formats with Intl and applies the privacy mask', () => {
        mockSettingsRepo.mockReturnValue({ settings: { baseCurrency: 'USD' } });
        mockUseAuth.mockReturnValue({ user: null });
        // Simulate privacy mode: mask replaces digits
        mockMask.mockImplementation((v: string) => v.replace(/\d/g, '•'));

        const { result } = renderHook(() => useDisplayCurrency());
        const out = result.current.formatCurrency(1234.5);
        // The mask must receive the formatted string and its return wins:
        expect(mockMask).toHaveBeenCalledWith('$1,234.5');
        expect(out).toBe('$•,•••.•');
        expect(out).not.toContain('1');
    });

    it('can format in an explicit currency different from the display currency', () => {
        mockSettingsRepo.mockReturnValue({ settings: { baseCurrency: 'USD' } });
        mockUseAuth.mockReturnValue({ user: null });
        const { result } = renderHook(() => useDisplayCurrency());
        result.current.formatCurrency(15750000, 'IDR');
        // Node's ICU renders IDR as 'IDR 15,750,000' (code, not symbol)
        expect(mockMask).toHaveBeenCalledWith(expect.stringContaining('IDR'));
    });
});

describe('useDisplayCurrency render contract', () => {
    it('updates when local settings change', async () => {
        let settings: { baseCurrency: string } | null = { baseCurrency: 'USD' };
        mockSettingsRepo.mockImplementation(() => ({ settings }));
        mockUseAuth.mockReturnValue({ user: null });

        const { result, rerender } = renderHook(() => useDisplayCurrency());
        expect(result.current.currency).toBe('USD');

        settings = { baseCurrency: 'IDR' };
        rerender();
        expect(result.current.currency).toBe('IDR');
    });
});