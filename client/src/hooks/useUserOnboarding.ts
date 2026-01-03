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

import { useState, useEffect, useMemo } from 'react';
import { useAssetRepository } from './useAssetRepository';
import { useNisabRecordRepository } from './useNisabRecordRepository';
import { usePaymentRepository } from './usePaymentRepository';

/**
 * useUserOnboarding custom hook - Track user's onboarding progress
 * Local-First Version: Uses RxDB repositories instead of API
 * 
 * Steps:
 * 1. No assets → Step 1 (Add First Asset)
 * 2. Has assets, no active record → Step 2 (Create Nisab Record)
 * 3. Has active record → Step 3 (Track Zakat)
 */
export const useUserOnboarding = () => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const STORAGE_KEY = 'zakapp_onboarding_state';

  // Use local-first repositories
  const { assets } = useAssetRepository();
  const { records } = useNisabRecordRepository();
  const { payments } = usePaymentRepository();

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
    const hasAssets = assets.length > 0;
    const hasAnyRecord = records.length > 0;
    const hasPayments = payments.length > 0;

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
    const hasAssets = assets.length > 0;
    const hasAnyRecord = records.length > 0;
    const hasPayments = payments.length > 0;

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

    // Check if changed to avoid loop
    const currentStepsSorted = [...completedSteps].sort();
    if (JSON.stringify(stepsArray) !== JSON.stringify(currentStepsSorted)) {
      setCompletedSteps(stepsArray);

      // Persist to localStorage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completedSteps: stepsArray })
      );
    }
  }, [assets.length, records.length, payments.length, completedSteps]);

  /**
   * Manually mark a step as complete
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
