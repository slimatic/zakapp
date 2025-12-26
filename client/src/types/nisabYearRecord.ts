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
  currentTotalWealth?: number;
  currentZakatableWealth?: number;
  zakatDue?: number;
  isAboveNisab?: boolean;
}

export interface NisabYearRecord {
  id: string;
  status?: 'DRAFT' | 'FINALIZED' | 'UNLOCKED' | string;
  name?: string | null;
  gregorianYear?: number | string | null;
  hijriYear?: number | string | null;
  calculationYear?: number | string | null;
  calculationDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
