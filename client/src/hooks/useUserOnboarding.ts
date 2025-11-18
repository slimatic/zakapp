import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

/**
 * useUserOnboarding custom hook - Track user's onboarding progress
 * 
 * Features:
 * - Determines current onboarding step based on user data
 * - Tracks completed steps
 * - Persists state to localStorage
 * - Uses React Query for asset and record data
 * 
 * Steps:
 * 1. No assets → Step 1 (Add First Asset)
 * 2. Has assets, no active record → Step 2 (Create Nisab Record)
 * 3. Has active record → Step 3 (Track Zakat)
 * 
 * @returns Onboarding state and utilities
 */
export const useUserOnboarding = () => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const STORAGE_KEY = 'zakapp_onboarding_state';

  /**
   * Fetch user's assets (using apiService)
   */
  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await apiService.getAssets();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Fetch user's Nisab Year Records (using apiService)
   * Use same query key as Dashboard to share cache
   */
  const { data: recordsData } = useQuery({
    queryKey: ['nisab-records'],
    queryFn: async () => {
      // Fetch ALL records (no status filter) to check if user has any
      const response = await apiService.getNisabYearRecords();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Fetch user's payments to determine Step 3 completion
   * Note: This endpoint may not exist yet, so we handle errors gracefully
   */
  const { data: paymentsData } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      try {
        const response = await apiService.getPayments();
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist or fails, return empty
        return { payments: [] };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Load completed steps from localStorage on mount
   */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSteps(parsed.completedSteps || []);
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
      }
    }
  }, []);

  /**
   * Determine current step based on user data
   */
  const getCurrentStep = (): 1 | 2 | 3 => {
    const hasAssets = assetsData?.assets && assetsData.assets.length > 0;
    const hasAnyRecord = recordsData?.records && recordsData.records.length > 0;
    const hasPayments = paymentsData?.payments && paymentsData.payments.length > 0;

    if (!hasAssets) {
      return 1; // Step 1: Add assets
    }

    if (!hasAnyRecord) {
      return 2; // Step 2: Create Nisab record
    }

    if (!hasPayments) {
      return 3; // Step 3: Record payment
    }

    return 3; // All steps complete (stay on step 3)
  };

  /**
   * Auto-update completed steps based on current data
   */
  useEffect(() => {
    const hasAssets = assetsData?.assets && assetsData.assets.length > 0;
    const hasAnyRecord = recordsData?.records && recordsData.records.length > 0;
    const hasPayments = paymentsData?.payments && paymentsData.payments.length > 0;

    // Debug logging
    console.log('[useUserOnboarding] Data check:', {
      assetsData,
      recordsData,
      paymentsData,
      hasAssets,
      hasAnyRecord,
      hasPayments
    });

    // Build completed steps array without duplicates
    const newCompletedSteps: Set<number> = new Set();

    if (hasAssets) {
      newCompletedSteps.add(1);
    }

    if (hasAnyRecord) {
      newCompletedSteps.add(1); // Asset is prerequisite
      newCompletedSteps.add(2);
    }

    if (hasPayments) {
      newCompletedSteps.add(1); // Asset is prerequisite
      newCompletedSteps.add(2); // Record is prerequisite
      newCompletedSteps.add(3);
    }

    const stepsArray = Array.from(newCompletedSteps).sort();
    console.log('[useUserOnboarding] Completed steps:', stepsArray);

    // Only update if changed
    if (JSON.stringify(stepsArray) !== JSON.stringify(completedSteps.sort())) {
      setCompletedSteps(stepsArray);
      
      // Persist to localStorage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completedSteps: stepsArray })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsData, recordsData, paymentsData]);

  /**
   * Manually mark a step as complete
   * (Optional - primarily for manual overrides)
   */
  const markComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      const updated = [...completedSteps, step].sort();
      setCompletedSteps(updated);
      
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completedSteps: updated })
      );
    }
  };

  /**
   * Reset onboarding state
   */
  const resetOnboarding = () => {
    setCompletedSteps([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    currentStep: getCurrentStep(),
    completedSteps,
    markComplete,
    resetOnboarding,
    isComplete: completedSteps.includes(3),
  };
};
