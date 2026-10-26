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

    it('createRecord stores the figures over the hawl year the user picked, not "now"', async () => {
        const opts = baseOptions();
        // The hawl year begins 30 days ago. A debt falling due 340 days from
        // now lands 370 days after that start — beyond the recorded year's
        // lunar window — so the stored record must not deduct it. An anchored
        // "now" would slide the window 30 days further out and deduct it,
        // storing a figure the review step never showed.
        const start = new Date(Date.now() - 30 * 86400000);
        opts.normalizedLiabilities = [{
            id: 'l2', amount: 400,
            dueDate: new Date(start.getTime() + 370 * 86400000).toISOString(),
        }] as never;
        opts.normalizedAssets = [{ id: 'a1', value: 1000, type: 'CASH' }] as never;
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.createRecord({ ...payload, date: start, liabilityIds: ['l2'] }));
        const arg = opts.addRecord.mock.calls[0][0];
        // 1,000 zakatable with nothing deductible inside the started hawl year.
        expect(arg.zakatableWealth).toBe(1000);
    });

    it('refreshCalculations recalculates and updates the record from the stored nisab basis', async () => {
        const opts = baseOptions();
        opts.normalizedAssets = [{ id: 'a1', value: 10000, type: 'CASH' }] as never;
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.refreshCalculations({
            id: 'r1', nisabThresholdAtStart: '6000',
        } as never));
        expect(opts.updateRecord).toHaveBeenCalledTimes(1);
        const patch = opts.updateRecord.mock.calls[0][1];
        expect(patch.totalWealth).toBe(10000);
        expect(patch.zakatableWealth).toBe(10000);
        expect(patch.zakatAmount).toBe(250);
        expect(toast.success).toHaveBeenCalledWith('Assets refreshed and calculations updated');
    });

    it('refreshCalculations gives zero zakat below the stored nisab threshold — the create-path rule', async () => {
        const opts = baseOptions();
        opts.normalizedAssets = [{ id: 'a1', value: 1000, type: 'CASH' }] as never;
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.refreshCalculations({
            id: 'r1', nisabThresholdAtStart: '6000',
        } as never));
        expect(opts.updateRecord).toHaveBeenCalledTimes(1);
        const patch = opts.updateRecord.mock.calls[0][1];
        // The create path (nisabAmount >= threshold) must hold on refresh too:
        // 1,000 zakatable below a 6,000 threshold owes nothing.
        expect(patch.zakatAmount).toBe(0);
    });

    it('refreshCalculations refuses a FINALIZED record', async () => {
        const opts = baseOptions();
        opts.normalizedAssets = [{ id: 'a1', value: 10000, type: 'CASH' }] as never;
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.refreshCalculations({
            id: 'r-fin', status: 'FINALIZED', nisabThresholdAtStart: '6000',
        } as never));
        expect(opts.updateRecord).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
    });

    it('refreshCalculations still updates a normally stored record when above the threshold', async () => {
        const opts = baseOptions();
        opts.normalizedAssets = [{ id: 'a1', value: 10000, type: 'CASH' }] as never;
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.refreshCalculations({
            id: 'r1', nisabThresholdAtStart: 6000, // numeric stored form (seeded records)
        } as never));
        expect(opts.updateRecord).toHaveBeenCalledTimes(1);
        expect(opts.updateRecord.mock.calls[0][1].zakatAmount).toBe(250);
    });

    it('refreshCalculations refuses a record without a stored nisab threshold', async () => {
        const opts = baseOptions();
        opts.normalizedAssets = [{ id: 'a1', value: 10000, type: 'CASH' }] as never;
        const { result } = renderHook(() => useNisabRecordActions(opts));
        await act(() => result.current.refreshCalculations({ id: 'r1' } as never));
        expect(opts.updateRecord).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalled();
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