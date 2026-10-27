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

/**
 * useHawlStatus Hook (Local-First Edition)
 * 
 * Calculates Hawl status and Zakat liability in real-time using local RxDB data.
 * Replaces the previous API polling mechanism to support offline/local-first usage.
 */

import { useCallback, useMemo } from 'react';
import type { NisabYearRecordWithLiveTracking, LiveTrackingData } from '../types/nisabYearRecord';
import { useNisabRecordRepository } from './useNisabRecordRepository';
import { useAssetRepository } from './useAssetRepository';
import { useNisabThreshold } from './useNisabThreshold';
import { useUserSettingsRepository } from './useUserSettingsRepository';
import { useDisplayCurrency } from './useDisplayCurrency';
import { activeAssets } from '../core/calculations/activeAssets';
import {
  getAssetZakatableValue,
  type ZakatMethodology,
} from '../core/calculations/zakat';

export interface UseHawlStatusResult {
  // Data
  record: NisabYearRecordWithLiveTracking | undefined;
  liveHawlData: LiveTrackingData | undefined;

  // State
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | null;

  // Metrics
  daysRemaining: number | null;
  isHawlComplete: boolean;
  daysElapsed: number | null;
  progressPercent: number | null;

  // Actions
  refetch: () => void;
  dismiss: () => void;
}

export const useHawlStatus = (
  recordId?: string,
  _pollInterval: number = 5000,
  _enabled: boolean = true
): UseHawlStatusResult => {
  // 1. Get Data from Local Repositories
  const { records, isLoading: isRecordsLoading } = useNisabRecordRepository();
  const { assets, isLoading: isAssetsLoading } = useAssetRepository();
  const { settings } = useUserSettingsRepository();
  const display = useDisplayCurrency();

  // 2. Find Specific Record
  const record = useMemo(() => records.find(r => r.id === recordId), [records, recordId]);

  // The record's stored basis is what its own figures were computed on. Asking
  // for the GOLD default regardless left the tracker and the Dashboard
  // comparing one portfolio against two different thresholds.
  const nisabBasis: 'GOLD' | 'SILVER' =
    String(record?.nisabBasis ?? 'GOLD').toUpperCase() === 'SILVER' ? 'SILVER' : 'GOLD';

  // A record that stamps its methodology keeps it (imported and legacy records
  // carry one, sometimes as an empty string meaning "not recorded"); otherwise
  // the user's chosen school — the same source the Dashboard and the record
  // creator use.
  const methodology = String(
    record?.methodologyUsed || settings?.preferredMethodology || 'STANDARD'
  ).toUpperCase() as ZakatMethodology;

  const {
    nisabAmount,
    isLoading: isNisabLoading,
    refetch: refetchNisab,
  } = useNisabThreshold(display.currency, nisabBasis, display.nisabStandard);

  const isLoading = isRecordsLoading || isAssetsLoading || isNisabLoading;

  // 3. Calculate Live Stats (The Core Logic)
  const liveHawlData = useMemo((): LiveTrackingData | undefined => {
    if (!record) return undefined;

    // A. Live wealth, on the rules the stored record was computed with. Net
    // worth counts every active asset; the zakat base counts only what the
    // user's answer or the selected school makes zakatable, at its zakatable
    // value — the same eligibility and value rules the calculators apply.
    let totalAssets = 0;
    let zakatableAssets = 0;
    for (const asset of activeAssets(assets)) {
      totalAssets += Number(asset.value) || 0;
      zakatableAssets += getAssetZakatableValue(asset, methodology);
    }

    // B. Calculate Date Metrics (Lunar Hawl = 354 days)
    const startDate = new Date(record?.hawlStartDate || new Date());
    const now = new Date();

    // Calculate difference in days
    const diffTime = now.getTime() - startDate.getTime();
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const targetDays = 354;

    const daysRemaining = Math.max(0, targetDays - daysPassed);
    const progressPercent = Math.min(100, Math.max(0, (daysPassed / targetDays) * 100));

    // C. Nisab verdict. An absent or zero threshold is UNKNOWN, not a zero
    // bar every portfolio clears — withhold the verdict rather than invent a
    // "due" figure from it.
    const hasThreshold =
      typeof nisabAmount === 'number' && Number.isFinite(nisabAmount) && nisabAmount > 0;
    const isAboveNisab = hasThreshold ? zakatableAssets >= nisabAmount : undefined;
    const zakatDue = isAboveNisab ? zakatableAssets * 0.025 : 0;

    return {
      daysRemaining,
      hawlProgress: progressPercent,
      canFinalize: daysRemaining === 0,
      currentTotalWealth: totalAssets,
      currentZakatableWealth: zakatableAssets,
      zakatDue,
      isAboveNisab
    };
  }, [record, assets, nisabAmount, methodology]);

  // 4. Enrich Record with Live Data
  const enrichedRecord = useMemo(() => {
    if (!record || !liveHawlData) return undefined;
    return {
      ...record,
      liveTracking: liveHawlData
    } as unknown as NisabYearRecordWithLiveTracking;
  }, [record, liveHawlData]);

  // 5. Handlers
  const refetch = useCallback(() => {
    // In local mode, data is live. "Refetch" effectively checks Nisab prices.
    refetchNisab();
  }, [refetchNisab]);

  const dismiss = useCallback(() => {
    // No-op in local mode, but kept for interface compatibility
  }, []);

  return {
    record: enrichedRecord,
    liveHawlData,
    isLoading,
    isUpdating: false, // Local updates are instant
    error: null,
    daysRemaining: liveHawlData?.daysRemaining ?? null,
    isHawlComplete: liveHawlData?.canFinalize ?? false,
    daysElapsed: liveHawlData ? (354 - (liveHawlData.daysRemaining || 0)) : null,
    progressPercent: liveHawlData?.hawlProgress ?? null,
    refetch,
    dismiss,
  };
};

/**
 * Hook to check if Hawl is complete
 */
export function useIsHawlComplete(recordId: string | undefined): boolean {
  const { liveHawlData } = useHawlStatus(recordId);
  return liveHawlData?.canFinalize ?? false;
}

/**
 * Hook to get days remaining in current Hawl
 */
export function useDaysRemaining(recordId: string | undefined): number | null {
  const { liveHawlData } = useHawlStatus(recordId);
  return liveHawlData?.daysRemaining ?? null;
}
