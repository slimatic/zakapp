/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * useNisabRecordActions — record mutation handlers extracted from
 * NisabYearRecordsPage (#341 slice 4). Encapsulates create / refresh /
 * finalize / unlock / delete / edit-date against the local RxDB
 * repository, with toast feedback. Navigation and UI state that belong to
 * the page (closing modals, clearing selection) are expressed as
 * injected callbacks so the hook stays page-agnostic.
 */

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { calculateWealth } from '../core/calculations/wealthCalculator';
import { gregorianToHijri } from '../utils/calendarConverter';

export interface CreateRecordPayload {
  assetIds: string[];
  liabilityIds: string[];
  basis: 'GOLD' | 'SILVER';
  date: Date;
  nisabAmount: number;
}

/** Normalized (display-currency) asset/liability rows for calculation. */
export type WealthRow = Record<string, unknown> & { id: string };

export interface UseNisabRecordActionsOptions {
  addRecord: (record: Record<string, unknown>) => Promise<unknown>;
  updateRecord: (id: string, patch: Record<string, unknown>) => Promise<unknown>;
  removeRecord: (id: string) => Promise<unknown>;
  /** Normalized assets/liabilities in the display currency (#310 round 4). */
  normalizedAssets: WealthRow[];
  normalizedLiabilities: WealthRow[];
  userCurrency: string;
  userMethodology: string;
  /** Page-level side effects invoked after successful mutations. */
  onCreated?: () => void;
  onDeleted?: (recordId: string) => void;
  onDateSaved?: () => void;
}

const HAWL_MS = 354 * 24 * 60 * 60 * 1000;

export function useNisabRecordActions(options: UseNisabRecordActionsOptions) {
  const {
    addRecord,
    updateRecord,
    removeRecord,
    normalizedAssets,
    normalizedLiabilities,
    userCurrency,
    userMethodology,
    onCreated,
    onDeleted,
    onDateSaved,
  } = options;

  /** Create a record from the modal payload. Returns true on success. */
  const createRecord = useCallback(async (payload: CreateRecordPayload): Promise<boolean> => {
    const { assetIds, liabilityIds, basis, date, nisabAmount: threshold } = payload;
    try {
      const selectedAssets = normalizedAssets.filter(a => assetIds.includes(a.id));
      const selectedLiabilities = normalizedLiabilities.filter(l => liabilityIds.includes(l.id));

      const { totalWealth, netZakatableWealth } = calculateWealth(
        selectedAssets as never, selectedLiabilities as never, new Date(), userMethodology as never
      );
      const zakatAmount = netZakatableWealth >= threshold ? netZakatableWealth * 0.025 : 0;

      const completionDate = new Date(date.getTime() + HAWL_MS);
      const startHijri = gregorianToHijri(date);

      await addRecord({
        hawlStartDate: date.toISOString(),
        hawlCompletionDate: completionDate.toISOString(),
        hijriYear: startHijri.hy,
        nisabBasis: basis,
        totalWealth,
        zakatableWealth: netZakatableWealth,
        zakatAmount,
        nisabThresholdAtStart: threshold.toString(),
        currency: userCurrency,
        status: 'DRAFT',
      });

      toast.success('Nisab Year Record created');
      onCreated?.();
      return true;
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to create record';
      toast.error(msg);
      return false;
    }
  }, [normalizedAssets, normalizedLiabilities, userMethodology, userCurrency, addRecord, onCreated]);

  /** Recalculate a record's wealth from the current (normalized) assets. */
  const refreshCalculations = useCallback(async (recordId: string): Promise<void> => {
    try {
      const { totalWealth, netZakatableWealth } = calculateWealth(
        normalizedAssets as never, normalizedLiabilities as never, new Date(), userMethodology as never
      );
      await updateRecord(recordId, {
        totalWealth,
        zakatableWealth: netZakatableWealth,
        zakatAmount: netZakatableWealth * 0.025,
      });
      toast.success('Assets refreshed and calculations updated');
    } catch (error) {
      console.error('Failed to refresh assets:', error);
      toast.error('Failed to update calculations');
    }
  }, [normalizedAssets, normalizedLiabilities, userMethodology, updateRecord]);

  const finalizeRecord = useCallback(async (record: { id: string }): Promise<void> => {
    if (window.confirm('Are you sure you want to finalize this record? This will lock it from edits.')) {
      await updateRecord(record.id, { status: 'FINALIZED' });
      toast.success('Record finalized');
    }
  }, [updateRecord]);

  const unlockRecord = useCallback(async (record: { id: string }): Promise<void> => {
    await updateRecord(record.id, { status: 'UNLOCKED' });
    toast.success('Record unlocked');
  }, [updateRecord]);

  const deleteRecord = useCallback(async (record: { id: string }): Promise<void> => {
    if (window.confirm('Delete this record? This cannot be undone.')) {
      await removeRecord(record.id);
      onDeleted?.(record.id);
      toast.success('Record deleted');
    }
  }, [removeRecord, onDeleted]);

  /** Persist a new hawl start date (ISO string) for a record. */
  const saveStartDate = useCallback(async (recordId: string, startDateIso: string): Promise<void> => {
    if (!startDateIso) return;
    const start = new Date(startDateIso);
    const completion = new Date(start.getTime() + HAWL_MS);
    const startHijri = gregorianToHijri(start);

    await updateRecord(recordId, {
      hawlStartDate: start.toISOString(),
      hawlCompletionDate: completion.toISOString(),
      hijriYear: startHijri.hy,
    });
    onDateSaved?.();
    toast.success('Date updated');
  }, [updateRecord, onDateSaved]);

  return {
    createRecord,
    refreshCalculations,
    finalizeRecord,
    unlockRecord,
    deleteRecord,
    saveStartDate,
  };
}