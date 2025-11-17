/**
 * Minimal type definitions for Nisab Year Record used across the client.
 * This file provides the fields required by UI components and is intentionally
 * permissive so it doesn't need to mirror the full server model.
 */
export interface LiveTrackingData {
  daysRemaining?: number | null;
  daysElapsed?: number | null;
  hawlProgress?: number | null; // 0-100
  canFinalize?: boolean;
}

export interface NisabYearRecord {
  id: string;
  status?: 'DRAFT' | 'FINALIZED' | 'UNLOCKED' | string;
  hawlStartDate?: string | null;
  hawlCompletionDate?: string | null;
  initialNisabThreshold?: number | null;
  nisabThresholdAtStart?: string | number | null;
  totalWealth?: string | number | null;
  zakatableWealth?: string | number | null;
  zakatAmount?: string | number | null;
  finalZakatAmount?: string | number | null;
  // Live tracking / computed data from server
  liveHawlData?: LiveTrackingData | null;
  liveTracking?: LiveTrackingData | null;
  // Allow extra properties from API without breaking the client typing
  [key: string]: any;
}

export interface NisabYearRecordWithLiveTracking extends NisabYearRecord {
  liveTracking: LiveTrackingData | null;
}

export default NisabYearRecord;
