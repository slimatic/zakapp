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
import { hawlDates } from '../core/calculations/hawl';

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

/** The parts of a record a refresh needs: identity, lock state, stored nisab. */
export interface RefreshRecordTarget {
  id: string;
  status?: string;
  nisabThresholdAtStart?: string | number | null;
  /** The school this record's stored figures were computed under. */
  methodologyUsed?: string;
}

/** The create-path nisab rule, shared with refresh (same rule, same operator). */
function zakatDueAboveThreshold(netZakatableWealth: number, threshold: number): number {
  return netZakatableWealth >= threshold ? netZakatableWealth * 0.025 : 0;
}

/** Parse a record's stored nisabThresholdAtStart; NaN when absent or malformed. */
function parseStoredThreshold(raw: string | number | null | undefined): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && raw.trim() !== '') return Number(raw);
  return NaN;
}

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
      // No threshold is UNKNOWN, not zero. `nisabAmount || 0` used to travel
      // straight into the comparison below, where `net >= 0` is always true —
      // so a record created before the price fetch landed charged 2.5% of
      // everything and stamped '0', which the refresh path then refuses to use.
      // Refuse here instead, as refresh already does.
      if (!Number.isFinite(threshold) || threshold <= 0) {
        toast.error('Nisab threshold is not available yet — wait for prices to load, then try again');
        return false;
      }
      const selectedAssets = normalizedAssets.filter(a => assetIds.includes(a.id));
      const selectedLiabilities = normalizedLiabilities.filter(l => liabilityIds.includes(l.id));

      const { totalWealth, netZakatableWealth } = calculateWealth(
        // Compute over the hawl year the user previewed (the modal's picker
        // date), the same inputs the review step shows — not a "now" that
        // slides the liability window and stores figures nobody approved.
        selectedAssets as never, selectedLiabilities as never, date, userMethodology as never
      );
      const zakatAmount = netZakatableWealth >= threshold ? netZakatableWealth * 0.025 : 0;

      const hawl = hawlDates(date);

      await addRecord({
        ...hawl,
        nisabBasis: basis,
        totalWealth,
        zakatableWealth: netZakatableWealth,
        zakatAmount,
        nisabThresholdAtStart: threshold.toString(),
        currency: userCurrency,
        // The school these figures were computed with. Without the stamp a
        // record has no memory of its own rule: the tracker and a later refresh
        // would both silently follow whatever school the user picks next.
        methodologyUsed: userMethodology,
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

  /** Refresh the record's wealth figures from the current (normalized) assets. */
  const refreshCalculations = useCallback(async (record: RefreshRecordTarget): Promise<void> => {
    try {
      // A finalized record is locked from edits (finalizeRecord's own wording) —
      // never rewrite its figures in place.
      if (record.status === 'FINALIZED') {
        toast.error('Record is finalized and locked from edits');
        return;
      }
      const threshold = parseStoredThreshold(record.nisabThresholdAtStart);
      // No stored threshold ⇒ the create-path comparison is unknowable. Refuse
      // loudly rather than writing figures that would silently misstate zakat.
      if (!Number.isFinite(threshold) || threshold <= 0) {
        console.error('Nisab record is missing its stored threshold:', record.id);
        toast.error('Nisab threshold not found for this record');
        return;
      }
      const { totalWealth, netZakatableWealth } = calculateWealth(
        normalizedAssets as never, normalizedLiabilities as never, new Date(),
        // A refresh continues the record's own rule. Recomputing under the
        // user's current school would rewrite the figures while the record
        // still says it was computed under another one.
        (record.methodologyUsed || userMethodology) as never
      );
      const zakatAmount = zakatDueAboveThreshold(netZakatableWealth, threshold);
      await updateRecord(record.id, {
        totalWealth,
        zakatableWealth: netZakatableWealth,
        zakatAmount,
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

    await updateRecord(recordId, hawlDates(start));
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