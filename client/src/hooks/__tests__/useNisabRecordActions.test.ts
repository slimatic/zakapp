/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNisabRecordActions } from '../useNisabRecordActions';

// Pure hook test: stub the repository callbacks and verify each action's
// contract — repository calls, payload shaping, toast routing, and the
// injected page-level side-effect callbacks.

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

import toast from 'react-hot-toast';

const baseOptions = () => ({
    addRecord: vi.fn().mockResolvedValue({}),
    updateRecord: vi.fn().mockResolvedValue({}),
    removeRecord: vi.fn().mockResolvedValue({}),
    normalizedAssets: [{ id: 'a1', value: 1000 }] as never,
    normalizedLiabilities: [{ id: 'l1', amount: 100 }] as never,
    userCurrency: 'USD',
    userMethodology: 'HANAFI',
    onCreated: vi.fn(),
    onDeleted: vi.fn(),
    onDateSaved: vi.fn(),
});

const payload = {
    assetIds: ['a1'],
    liabilityIds: ['l1'],
    basis: 'GOLD' as const,
    date: new Date('2026-09-01T00:00:00.000Z'),
    nisabAmount: 6000,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useNisabRecordActions (#341 slice 4)', () => {
    it('createRecord adds a DRAFT record shaped from the payload', async () => {
        const opts = baseOptions();
        const { result } = renderHook(() => useNisabRecordActions(opts));

        const ok = await act(() => result.current.createRecord(payload));
        expect(ok).toBe(true);
        expect(opts.addRecord).toHaveBeenCalledTimes(1);
        const arg = opts.addRecord.mock.calls[0][0];
        expect(arg.status).toBe('DRAFT');
        expect(arg.currency).toBe('USD');
        expect(arg.nisabBasis).toBe('GOLD');
        expect(arg.nisabThresholdAtStart).toBe('6000');
        expect(new Date(arg.hawlCompletionDate).getTime() - new Date(arg.hawlStartDate).getTime())
            .toBe(354 * 24 * 60 * 60 * 1000);
        expect(opts.onCreated).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith('Nisab Year Record created');
    });

    it('createRecord returns false and toasts error on repository failure', async () => {
        const opts = baseOptions();
        opts.addRecord = vi.fn().mockRejectedValue(new Error('db locked'));
        const { result } = renderHook(() => useNisabRecordActions(opts));
        const ok = await act(() => result.current.createRecord(payload));
        expect(ok).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('db locked');
        expect(opts.onCreated).not.toHaveBeenCalled();
    });

    it('createRecord gives zero zakat below the nisab threshold', async () => {
        const opts = baseOptions();
        opts.normalizedAssets = [{ id: 'a1', value: 100 }] as never; // below 6000
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.createRecord(payload));
        expect(opts.addRecord.mock.calls[0][0].zakatAmount).toBe(0);
    });

    it('refreshCalculations recalculates and updates the record', async () => {
        const opts = baseOptions();
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.refreshCalculations('r1'));
        expect(opts.updateRecord).toHaveBeenCalledWith('r1', expect.objectContaining({
            zakatAmount: expect.any(Number),
        }));
        expect(toast.success).toHaveBeenCalledWith('Assets refreshed and calculations updated');
    });

    it('finalizeRecord confirms, then updates status to FINALIZED', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const opts = baseOptions();
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.finalizeRecord({ id: 'r1' }));
        expect(opts.updateRecord).toHaveBeenCalledWith('r1', { status: 'FINALIZED' });
        confirmSpy.mockRestore();
    });

    it('finalizeRecord does nothing when the user cancels', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const opts = baseOptions();
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.finalizeRecord({ id: 'r1' }));
        expect(opts.updateRecord).not.toHaveBeenCalled();
        confirmSpy.mockRestore();
    });

    it('deleteRecord confirms, removes, and fires onDeleted with the id', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const opts = baseOptions();
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.deleteRecord({ id: 'r9' }));
        expect(opts.removeRecord).toHaveBeenCalledWith('r9');
        expect(opts.onDeleted).toHaveBeenCalledWith('r9');
        confirmSpy.mockRestore();
    });

    it('saveStartDate persists start + 354-day completion + hijri year, and fires onDateSaved', async () => {
        const opts = baseOptions();
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.saveStartDate('r1', '2026-09-01T00:00:00.000Z'));
        const patch = opts.updateRecord.mock.calls[0][1];
        expect(new Date(patch.hawlCompletionDate).getTime() - new Date(patch.hawlStartDate).getTime())
            .toBe(354 * 24 * 60 * 60 * 1000);
        expect(patch.hijriYear).toBeTypeOf('number');
        expect(opts.onDateSaved).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith('Date updated');
    });

    it('saveStartDate is a no-op without a date', async () => {
        const opts = baseOptions();
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.saveStartDate('r1', ''));
        expect(opts.updateRecord).not.toHaveBeenCalled();
    });
});