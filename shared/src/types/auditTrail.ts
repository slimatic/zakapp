/**
 * Audit Trail Types
 * 
 * Defines TypeScript interfaces for immutable audit logging
 * Every unlock, edit, and refinalization event is recorded here
 */

/**
 * Audit event types
 */
export type AuditEventType =
  | 'CREATED' // Record created (auto-generated on Nisab achievement)
  | 'NISAB_ACHIEVED' // Wealth reached Nisab threshold
  | 'HAWL_INTERRUPTED' // Wealth dropped below Nisab during Hawl
  | 'UNLOCKED' // Record unlocked for editing
  | 'EDITED' // Fields modified while UNLOCKED
  | 'REFINALIZED' // Record re-finalized after unlock
  | 'FINALIZED'; // Record finalized at Hawl completion

/**
 * Audit Trail Entry - Immutable record of all changes to NisabYearRecord
 * 
 * Key properties:
 * - All fields except id are immutable (append-only)
 * - Sensitive data (reasons, changes) are encrypted
 * - Provides complete audit history for compliance
 */
export interface AuditTrailEntry {
  id: string;
  nisabYearRecordId: string; // Link to the record being audited
  userId: string; // User who performed the action
  eventType: AuditEventType;
  timestamp: Date | string;

  // Event-specific data (encrypted in database)
  unlockReason?: string; // Reason for UNLOCKED event (min 10 chars)
  changesSummary?: string; // Encrypted JSON: Which fields changed
  beforeState?: string; // Encrypted JSON: Values before change
  afterState?: string; // Encrypted JSON: Values after change
  interruptionDetails?: string; // Encrypted JSON: Details for HAWL_INTERRUPTED

  // Security tracking (optional)
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create Audit Trail Entry DTO
 */
export interface CreateAuditTrailEntryDto {
  nisabYearRecordId: string;
  eventType: AuditEventType;
  unlockReason?: string;
  changesSummary?: Record<string, any>;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  interruptionDetails?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Trail Response
 */
export interface AuditTrailResponse {
  success: boolean;
  data?: AuditTrailEntry[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Audit Trail Filter Criteria
 */
export interface AuditTrailFilters {
  recordId?: string;
  userId?: string;
  eventType?: AuditEventType;
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
  offset?: number;
}

/**
 * Detailed change tracking for EDITED events
 */
export interface ChangeRecord {
  field: string; // Field name (e.g., "totalWealth", "userNotes")
  oldValue: any; // Previous value (encrypted in DB)
  newValue: any; // New value (encrypted in DB)
  changedAt: Date | string;
}

/**
 * Unlock event details
 */
export interface UnlockEventDetails {
  reason: string; // Min 10 characters, reasons for unlocking
  timestamp: Date | string;
  changes?: ChangeRecord[]; // What was changed after unlock
}

/**
 * Finalization event details
 */
export interface FinalizationEventDetails {
  timestamp: Date | string;
  hawlComplete: boolean;
  daysOverMaturity?: number; // If finalized after hawlCompletionDate
  acknowledgePremature?: boolean; // If finalized before hawlCompletionDate
}

/**
 * Hawl interruption details
 */
export interface HawlInterruptionDetails {
  previousWealth: number;
  currentWealth: number;
  nisabThreshold: number;
  reason: string; // Why wealth dropped (user explanation or auto-detected)
  timestamp: Date | string;
}

/**
 * Formatted audit trail entry for display
 */
export interface FormattedAuditTrailEntry extends AuditTrailEntry {
  formattedTimestamp: string; // Relative time (e.g., "2 days ago")
  formattedEvent: string; // Human-readable event type
  summary: string; // One-line summary of the event
}
