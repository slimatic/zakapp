/**
 * useHawlStatus Hook (T058)
 * 
 * Polls for live Hawl tracking updates and calculates real-time metrics
 * Features:
 * - 5-second polling interval for live updates
 * - Calculates daysRemaining, isHawlComplete
 * - Debounce rapid updates (300ms)
 * - "Updating..." indicator during refresh
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { NisabYearRecordWithLiveTracking, LiveTrackingData } from '@zakapp/shared';

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

/**
 * Hook to track Hawl status with live updates
 * 
 * @param recordId - Nisab Year Record ID to track
 * @param enabled - Enable polling (default: true for DRAFT records)
 * @param pollInterval - Polling interval in ms (default: 5000ms)
 * @returns Hawl status and metrics
 * 
 * @example
 * const { record, liveHawlData, daysRemaining, isHawlComplete, isUpdating } = useHawlStatus(recordId);
 * 
 * if (isUpdating) return <div>Updating...</div>;
 * if (daysRemaining === null) return null;
 * 
 * return (
 *   <div>
 *     Days remaining: {daysRemaining}
 *     Progress: {progressPercent}%
 *     Complete: {isHawlComplete ? 'Yes' : 'No'}
 *   </div>
 * );
 */
export const useHawlStatus = (
  recordId?: string,
  pollInterval: number = 5000,
  enabled: boolean = true
): UseHawlStatusResult => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch record with live Hawl data
  const {
    data: record,
    isLoading,
    error,
    refetch: refetchRecord,
  } = useQuery({
    queryKey: ['nisab-year-record', recordId],
    queryFn: async () => {
      if (!recordId) return undefined;

      // Set updating state
      setIsUpdating(true);

      // Debounce rapid updates (300ms)
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      try {
        const response = await apiService.getNisabYearRecord(recordId);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch record');
        }
        return response.data as NisabYearRecordWithLiveTracking;
      } finally {
        // Clear updating state after debounce
        const timer = setTimeout(() => {
          setIsUpdating(false);
        }, 300);
        setDebounceTimer(timer);
      }
    },
    enabled: enabled && !!recordId,
    refetchInterval: recordId ? pollInterval : false, // Poll only if we have a recordId
    staleTime: 2000, // Consider data stale after 2 seconds
    gcTime: 5 * 60 * 1000, // Keep cache for 5 minutes before garbage collection
    retry: 1,
    retryDelay: 1000,
  });

  // Calculate metrics from live Hawl data
  const liveHawlData = record?.liveTracking;
  
  const daysRemaining = liveHawlData?.daysRemaining ?? null;
  const isHawlComplete = liveHawlData?.canFinalize ?? false;
  const daysElapsed = daysRemaining !== null ? 354 - daysRemaining : null;
  const progressPercent = liveHawlData?.hawlProgress ?? null;

  // Handle cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Refetch handler
  const refetch = useCallback(() => {
    refetchRecord();
  }, [refetchRecord]);

  // Dismiss handler (optional - for UI feedback)
  const dismiss = useCallback(() => {
    setIsUpdating(false);
  }, []);

  return {
    record,
    liveHawlData,
    isLoading,
    isUpdating,
    error: error as Error | null,
    daysRemaining,
    isHawlComplete,
    daysElapsed,
    progressPercent,
    refetch,
    dismiss,
  };
};

/**
 * Hook to check if Hawl is complete
 * Simplified version for checking completion status
 */
export function useIsHawlComplete(recordId: string | undefined): boolean {
  const { liveHawlData } = useHawlStatus(recordId);
  return liveHawlData?.canFinalize ?? false;
}

/**
 * Hook to get days remaining in current Hawl
 * Simplified version for days remaining countdown
 */
export function useDaysRemaining(recordId: string | undefined): number | null {
  const { liveHawlData } = useHawlStatus(recordId);
  return liveHawlData?.daysRemaining ?? null;
}
