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
