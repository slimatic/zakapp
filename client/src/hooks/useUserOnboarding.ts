import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

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
   * Fetch user's assets (using existing React Query setup)
   * This assumes the assets query is already set up in the app
   */
  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      // This will use the existing assets API endpoint
      const response = await fetch('/api/assets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Fetch user's Nisab Year Records
   */
  const { data: recordsData } = useQuery({
    queryKey: ['nisab-records'],
    queryFn: async () => {
      const response = await fetch('/api/nisab-records', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch records');
      return response.json();
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
    const hasActiveRecord = recordsData?.records?.some(
      (record: any) => record.status === 'active'
    );

    if (!hasAssets) {
      return 1; // Step 1: Add assets
    }

    if (!hasActiveRecord) {
      return 2; // Step 2: Create Nisab record
    }

    return 3; // Step 3: Track Zakat (completed onboarding)
  };

  /**
   * Auto-update completed steps based on current data
   */
  useEffect(() => {
    const hasAssets = assetsData?.assets && assetsData.assets.length > 0;
    const hasActiveRecord = recordsData?.records?.some(
      (record: any) => record.status === 'active'
    );

    const newCompletedSteps: number[] = [];

    if (hasAssets) {
      newCompletedSteps.push(1);
    }

    if (hasActiveRecord) {
      newCompletedSteps.push(1, 2);
    }

    // Only update if changed
    if (JSON.stringify(newCompletedSteps) !== JSON.stringify(completedSteps)) {
      setCompletedSteps(newCompletedSteps);
      
      // Persist to localStorage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completedSteps: newCompletedSteps })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsData, recordsData]);

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
