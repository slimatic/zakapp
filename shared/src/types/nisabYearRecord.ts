/**
 * Nisab Year Record Types
 * 
 * Defines TypeScript interfaces for Nisab Year Record workflow (Feature 008)
 * These types represent the complete Hawl (lunar year) tracking for Zakat calculations
 */

import type { AuditTrailEntry } from './auditTrail';

/**
 * Status of a Nisab Year Record
 * - DRAFT: Record in progress, not yet finalized
 * - FINALIZED: Record locked after Hawl completion
 * - UNLOCKED: Finalized record temporarily unlocked for edits
 */
export type RecordStatus = 'DRAFT' | 'FINALIZED' | 'UNLOCKED';

/**
 * Nisab calculation basis
 * - gold: Nisab threshold based on 87.48g gold
 * - silver: Nisab threshold based on 612.36g silver
 */
export type NisabBasis = 'GOLD' | 'SILVER';

/**
 * Nisab Year Record - Represents one complete Hawl period for Zakat calculation
 * 
 * This entity tracks:
 * 1. The starting point when user's wealth reaches Nisab threshold
 * 2. The 354-day Hawl (lunar year) period
 * 3. All wealth calculations and transactions during that period
 * 4. Final Zakat calculation and payment tracking
 * 5. Audit trail of all modifications
 */
export interface NisabYearRecord {
  id: string;
  userId: string;

  // Hawl Tracking Fields
  hawlStartDate: Date | string;
  hawlStartDateHijri: string; // Format: "YYYY-MM-DD" in Hijri calendar
  hawlCompletionDate: Date | string;
  hawlCompletionDateHijri: string; // Format: "YYYY-MM-DD" in Hijri calendar
  nisabThresholdAtStart: string; // Encrypted: Amount locked at Hawl start
  nisabBasis: NisabBasis; // Whether calculated on gold or silver

  // Wealth Calculation
  totalWealth: string; // Encrypted: Sum of all zakatable assets
  totalLiabilities: string; // Encrypted: Liabilities to deduct
  zakatableWealth: string; // Encrypted: totalWealth - totalLiabilities
  zakatAmount: string; // Encrypted: 2.5% of zakatableWealth

  // Calculation Details
  methodologyUsed: string; // Zakat calculation method (Standard, Hanafi, Shafi'i, etc.)
  assetBreakdown?: string; // Encrypted JSON: Breakdown by asset category
  calculationDetails?: string; // Encrypted JSON: Detailed calculation steps

  // Status Management
  status: RecordStatus;
  finalizedAt?: Date | string; // When record was finalized
  userNotes?: string; // Encrypted: User's personal notes

  // Dates (Gregorian)
  calculationDate: Date | string;
  gregorianYear: number;
  gregorianMonth: number;
  gregorianDay: number;

  // Dates (Hijri)
  hijriYear: number;
  hijriMonth: number;
  hijriDay: number;

  // Metadata
  isPrimary: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Create NisabYearRecord DTO
 * Used when creating a new Nisab year record (typically auto-created on Nisab achievement)
 */
export interface CreateNisabYearRecordDto {
  // Hawl dates (required)
  hawlStartDate: Date | string;
  hawlStartDateHijri: string;
  hawlCompletionDate: Date | string;
  hawlCompletionDateHijri: string;
  nisabBasis: NisabBasis;

  // Wealth calculation (optional on creation, can be updated later)
  totalWealth?: number;
  totalLiabilities?: number;
  zakatableWealth?: number;
  zakatAmount?: number;

  // Optional fields
  nisabThresholdAtStart?: number;
  methodologyUsed?: string;
  assetBreakdown?: Record<string, any>;
  calculationDetails?: Record<string, any>;
  userNotes?: string;

  // Asset selection (optional, for manual record creation)
  selectedAssetIds?: string[];
}

/**
 * Update NisabYearRecord DTO
 * Used for updating record fields (allowed in DRAFT and UNLOCKED statuses)
 */
export interface UpdateNisabYearRecordDto {
  // Wealth recalculation (optional)
  totalWealth?: number;
  totalLiabilities?: number;
  zakatableWealth?: number;
  zakatAmount?: number;

  // Status management (optional)
  status?: RecordStatus;

  // Other updates
  methodologyUsed?: string;
  assetBreakdown?: Record<string, any>;
  calculationDetails?: Record<string, any>;
  userNotes?: string;
}

/**
 * Finalize Record DTO
 * Used when finalizing a record at end of Hawl
 */
export interface FinalizeRecordDto {
  recordId: string;
  acknowledgePremature?: boolean; // Allow finalization before Hawl complete
  overrideNote?: string; // Reason for early finalization
}

/**
 * Unlock Record DTO
 * Used when unlocking a finalized record for edits
 */
export interface UnlockRecordDto {
  recordId: string;
  unlockReason: string; // Min 10 characters, will be encrypted and audited
}

/**
 * Live Tracking Data
 * Real-time calculated data for DRAFT records (not persisted)
 * Includes computed fields like days remaining, current wealth, etc.
 */
export interface LiveTrackingData {
  currentTotalWealth: number; // Current sum of all assets (live calculated)
  nisabThreshold: number; // Current Nisab threshold
  daysRemaining: number; // Days until hawlCompletionDate
  hawlProgress: number; // Percentage (0-100)
  isHawlComplete: boolean; // Whether hawlCompletionDate has passed
  canFinalize: boolean; // Whether record can be finalized
  lastUpdated: Date | string;
}

/**
 * Extended NisabYearRecord with live tracking
 * Returned by API for DRAFT records to include real-time data
 */
export interface NisabYearRecordWithLiveTracking extends NisabYearRecord {
  liveTracking: LiveTrackingData;
  auditTrail?: AuditTrailEntry[];
}

export interface NisabYearRecordResponse {
  success: boolean;
  data?: NisabYearRecord | NisabYearRecordWithLiveTracking;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface NisabYearRecordsListResponse {
  success: boolean;
  data?: {
    records: (NisabYearRecord | NisabYearRecordWithLiveTracking)[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Filter criteria for listing records
 */
export interface NisabYearRecordFilters {
  status?: RecordStatus | 'ALL';
  year?: number;
  nisabBasis?: NisabBasis;
  pageSize?: number;
  page?: number;
}

/**
 * Response for batch operations
 */
export interface BatchNisabResponse {
  success: boolean;
  updated: number;
  failed: number;
  errors?: Array<{
    recordId: string;
    error: string;
  }>;
}
