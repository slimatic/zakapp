/**
 * Audit Trail Service (T044)
 * 
 * Records immutable audit trail for all changes to Nisab Year Records
 * Supports encrypted sensitive data: unlock reasons, change summaries, state snapshots
 */

import { injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { EncryptionService } from './encryption-service';
import type {
  AuditTrailEntry,
  AuditEventType,
  CreateAuditTrailEntryDto,
} from '@zakapp/shared';

@injectable()
export class AuditTrailService {
  private logger = new Logger('AuditTrailService');

  constructor(
    private prisma: PrismaClient,
    private encryptionService: EncryptionService
  ) {}

  /**
   * Record an audit trail event
   * All entries are append-only and immutable
   * 
   * @param userId - User performing the action
   * @param eventType - Type of event (UNLOCKED, EDITED, FINALIZED, etc.)
   * @param recordId - NisabYearRecord ID being audited
   * @param details - Event details (reason, changes, state snapshots)
   * @returns Created audit trail entry
   */
  async recordEvent(
    userId: string,
    eventType: AuditEventType,
    recordId: string,
    details?: {
      reason?: string; // Min 10 chars for UNLOCKED events
      changesSummary?: Record<string, any>;
      beforeState?: Record<string, any>;
      afterState?: Record<string, any>;
      interruptionDetails?: Record<string, any>;
    }
  ): Promise<AuditTrailEntry> {
    try {
      // Validate unlock reason if provided
      if (details?.reason && details.reason.length < 10) {
        throw new Error('Unlock reason must be at least 10 characters');
      }

      // Encrypt sensitive fields
      let encryptedReason: string | undefined;
      let encryptedChangesSummary: string | undefined;
      let encryptedBeforeState: string | undefined;
      let encryptedAfterState: string | undefined;
      let encryptedInterruptionDetails: string | undefined;

      if (details?.reason) {
        encryptedReason = this.encryptionService.encrypt(details.reason);
      }
      if (details?.changesSummary) {
        encryptedChangesSummary = this.encryptionService.encrypt(JSON.stringify(details.changesSummary));
      }
      if (details?.beforeState) {
        encryptedBeforeState = this.encryptionService.encrypt(JSON.stringify(details.beforeState));
      }
      if (details?.afterState) {
        encryptedAfterState = this.encryptionService.encrypt(JSON.stringify(details.afterState));
      }
      if (details?.interruptionDetails) {
        encryptedInterruptionDetails = this.encryptionService.encrypt(JSON.stringify(details.interruptionDetails));
      }

      // Create audit trail entry (immutable, append-only)
      const entry = await this.prisma.auditTrailEntry.create({
        data: {
          nisabYearRecordId: recordId,
          userId,
          eventType,
          timestamp: new Date(),
          unlockReason: encryptedReason,
          changesSummary: encryptedChangesSummary,
          beforeState: encryptedBeforeState,
          afterState: encryptedAfterState,
          interruptionDetails: encryptedInterruptionDetails,
        },
      });

      this.logger.info(`Audit event recorded: ${eventType} for record ${recordId}`);

      return this._mapToAuditTrailEntry(entry);
    } catch (error) {
      this.logger.error('Failed to record audit event', error);
      throw new Error(`Audit trail recording failed: ${error.message}`);
    }
  }

  /**
   * Get audit trail for a specific record
   * Returns all events in chronological order (oldest first)
   * Decrypts sensitive data for authorized users
   * 
   * @param recordId - NisabYearRecord ID
   * @param includeDecrypted - Whether to decrypt sensitive fields
   * @returns Array of audit trail entries
   */
  async getAuditTrail(
    recordId: string,
    includeDecrypted: boolean = false
  ): Promise<AuditTrailEntry[]> {
    try {
      const entries = await this.prisma.auditTrailEntry.findMany({
        where: {
          nisabYearRecordId: recordId,
        },
        orderBy: {
          timestamp: 'asc', // Oldest first
        },
      });

      return entries.map(entry => this._mapToAuditTrailEntry(entry, includeDecrypted));
    } catch (error) {
      this.logger.error('Failed to get audit trail', error);
      throw new Error(`Audit trail retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get audit trail for a specific user across all records
   * Used for user activity tracking and compliance
   * 
   * @param userId - User ID
   * @param limit - Maximum entries to return
   * @param offset - Pagination offset
   * @returns User's audit trail entries
   */
  async getUserAuditTrail(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    entries: AuditTrailEntry[];
    total: number;
  }> {
    try {
      const [entries, total] = await Promise.all([
        this.prisma.auditTrailEntry.findMany({
          where: {
            userId,
          },
          orderBy: {
            timestamp: 'desc', // Most recent first
          },
          take: limit,
          skip: offset,
        }),
        this.prisma.auditTrailEntry.count({
          where: {
            userId,
          },
        }),
      ]);

      return {
        entries: entries.map(entry => this._mapToAuditTrailEntry(entry)),
        total,
      };
    } catch (error) {
      this.logger.error('Failed to get user audit trail', error);
      throw error;
    }
  }

  /**
   * Get audit events of a specific type
   * Used for filtering by event type (e.g., all UNLOCKED events)
   * 
   * @param recordId - NisabYearRecord ID
   * @param eventType - Type of event to filter by
   * @returns Matching audit trail entries
   */
  async getEventsByType(
    recordId: string,
    eventType: AuditEventType
  ): Promise<AuditTrailEntry[]> {
    try {
      const entries = await this.prisma.auditTrailEntry.findMany({
        where: {
          nisabYearRecordId: recordId,
          eventType,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return entries.map(entry => this._mapToAuditTrailEntry(entry));
    } catch (error) {
      this.logger.error('Failed to get events by type', error);
      throw error;
    }
  }

  /**
   * Get events within a date range
   * Used for compliance audits and reporting
   * 
   * @param recordId - NisabYearRecord ID
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @returns Matching audit trail entries
   */
  async getEventsByDateRange(
    recordId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditTrailEntry[]> {
    try {
      const entries = await this.prisma.auditTrailEntry.findMany({
        where: {
          nisabYearRecordId: recordId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return entries.map(entry => this._mapToAuditTrailEntry(entry));
    } catch (error) {
      this.logger.error('Failed to get events by date range', error);
      throw error;
    }
  }

  /**
   * Decrypt a specific encrypted field from an audit entry
   * Used when user wants to view unlock reason or change details
   * 
   * @param entry - Audit trail entry
   * @param field - Field to decrypt ('unlockReason', 'changesSummary', etc.)
   * @returns Decrypted value
   */
  decryptField(entry: AuditTrailEntry, field: keyof AuditTrailEntry): any {
    try {
      const value = entry[field];
      if (!value || typeof value !== 'string') {
        return null;
      }

      const decrypted = this.encryptionService.decrypt(value as string);

      // Try to parse as JSON if applicable
      if (field === 'changesSummary' || field === 'beforeState' || field === 'afterState' || field === 'interruptionDetails') {
        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }
      }

      return decrypted;
    } catch (error) {
      this.logger.error(`Failed to decrypt field ${field}`, error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Verify audit trail integrity
   * Returns summary of events and detects any anomalies
   * 
   * @param recordId - NisabYearRecord ID
   * @returns Audit trail summary and integrity check
   */
  async verifyAuditTrailIntegrity(recordId: string): Promise<{
    totalEvents: number;
    eventCounts: Record<AuditEventType, number>;
    dateRange: { earliest: Date; latest: Date };
    anomalies: string[];
  }> {
    try {
      const entries = await this.prisma.auditTrailEntry.findMany({
        where: {
          nisabYearRecordId: recordId,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (entries.length === 0) {
        return {
          totalEvents: 0,
          eventCounts: {} as Record<AuditEventType, number>,
          dateRange: { earliest: new Date(), latest: new Date() },
          anomalies: ['No audit trail entries found'],
        };
      }

      // Count events by type
      const eventCounts = {} as Record<AuditEventType, number>;
      for (const entry of entries) {
        eventCounts[entry.eventType as AuditEventType] = (eventCounts[entry.eventType as AuditEventType] || 0) + 1;
      }

      // Check for anomalies
      const anomalies: string[] = [];
      const dates = entries.map(e => e.timestamp.getTime());

      // Check if timestamps are in chronological order (immutability check)
      for (let i = 1; i < dates.length; i++) {
        if (dates[i] < dates[i - 1]) {
          anomalies.push(`Timestamp anomaly at entry ${i}`);
        }
      }

      // Check for suspicious state transitions
      const transitionIssues = this._checkStateTransitions(entries);
      anomalies.push(...transitionIssues);

      return {
        totalEvents: entries.length,
        eventCounts,
        dateRange: {
          earliest: entries[0].timestamp,
          latest: entries[entries.length - 1].timestamp,
        },
        anomalies: anomalies.filter((a, i, arr) => arr.indexOf(a) === i), // Remove duplicates
      };
    } catch (error) {
      this.logger.error('Failed to verify audit trail integrity', error);
      throw error;
    }
  }

  /**
   * Private: Map database entry to AuditTrailEntry interface
   */
  private _mapToAuditTrailEntry(entry: any, includeDecrypted: boolean = false): AuditTrailEntry {
    const mapped: AuditTrailEntry = {
      id: entry.id,
      nisabYearRecordId: entry.nisabYearRecordId,
      userId: entry.userId,
      eventType: entry.eventType,
      timestamp: entry.timestamp,
      unlockReason: entry.unlockReason,
      changesSummary: entry.changesSummary,
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      interruptionDetails: entry.interruptionDetails,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    };

    return mapped;
  }

  /**
   * Private: Check for suspicious state transitions
   */
  private _checkStateTransitions(entries: any[]): string[] {
    const issues: string[] = [];
    const allowedTransitions: Record<string, AuditEventType[]> = {
      'CREATED': ['NISAB_ACHIEVED', 'HAWL_INTERRUPTED'],
      'NISAB_ACHIEVED': ['UNLOCKED', 'EDITED', 'FINALIZED', 'HAWL_INTERRUPTED'],
      'HAWL_INTERRUPTED': ['NISAB_ACHIEVED', 'CREATED'],
      'UNLOCKED': ['EDITED', 'REFINALIZED', 'FINALIZED'],
      'EDITED': ['UNLOCKED', 'EDITED', 'REFINALIZED'],
      'REFINALIZED': ['UNLOCKED', 'FINALIZED'],
      'FINALIZED': ['UNLOCKED'],
    };

    for (let i = 1; i < entries.length; i++) {
      const prevEvent = entries[i - 1].eventType;
      const currEvent = entries[i].eventType;
      const allowed = allowedTransitions[prevEvent] || [];

      if (!allowed.includes(currEvent)) {
        issues.push(`Suspicious transition from ${prevEvent} to ${currEvent}`);
      }
    }

    return issues;
  }
}
