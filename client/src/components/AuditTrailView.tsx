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
 * AuditTrailView Component (T064)
 * 
 * Timeline visualization of audit trail events
 * Features:
 * - Event type badges (UNLOCKED, EDITED, REFINALIZED)
 * - Timestamp display (relative + absolute)
 * - Unlock reason display (decrypted)
 * - Collapsible details
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

export interface AuditTrailViewProps {
  /**
   * Record ID to view audit trail for
   */
  recordId: string;

  /**
   * Optional custom className
   */
  className?: string;

  /**
   * Max number of events to show (default: all)
   */
  maxEvents?: number;

  /**
   * Show/hide full timestamps
   */
  showAbsoluteTime?: boolean;
}

/**
 * Component to display audit trail timeline
 * 
 * Shows:
 * - Timeline of all audit events
 * - Event types with badges
 * - Relative timestamps (e.g., "2 hours ago")
 * - Absolute timestamps on hover
 * - Unlock reasons and change summaries
 * - User who made the change
 * 
 * @example
 * <AuditTrailView
 *   recordId={record.id}
 *   showAbsoluteTime={true}
 *   maxEvents={10}
 * />
 */
export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  recordId,
  className = '',
  maxEvents,
  showAbsoluteTime = true,
}) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Fetch audit trail
  const { data: auditData, isLoading, error } = useQuery({
    queryKey: ['audit-trail', recordId],
    queryFn: async () => {
      const response = await apiService.getNisabYearRecordAuditTrail(recordId);
      if (!response.success) {
        throw new Error('Failed to fetch audit trail');
      }
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Process events
  const events = useMemo(() => {
    let items = auditData?.entries || [];
    if (maxEvents) {
      items = items.slice(0, maxEvents);
    }
    return items;
  }, [auditData, maxEvents]);

  // Format time
  const formatTime = (date: string | Date): string => {
    const eventDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - eventDate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return eventDate.toLocaleDateString();
  };

  // Format absolute timestamp
  const formatAbsoluteTime = (date: string | Date): string => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get event badge
  const getEventBadge = (eventType: string): { color: string; icon: string; label: string } => {
    const badges: Record<string, { color: string; icon: string; label: string }> = {
      'CREATED': { color: 'blue', icon: '✨', label: 'Created' },
      'NISAB_ACHIEVED': { color: 'green', icon: '💚', label: 'Nisab Achieved' },
      'HAWL_INTERRUPTED': { color: 'amber', icon: '⚠️', label: 'Hawl Interrupted' },
      'EDITED': { color: 'purple', icon: '✏️', label: 'Edited' },
      'FINALIZED': { color: 'green', icon: '✓', label: 'Finalized' },
      'REFINALIZED': { color: 'green', icon: '🔄', label: 'Re-Finalized' },
      'UNLOCKED': { color: 'amber', icon: '🔓', label: 'Unlocked' },
    };
    return badges[eventType] || { color: 'gray', icon: '•', label: eventType };
  };

  // Toggle expansion
  const toggleExpanded = (eventId: string): void => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  if (isLoading) {
    return (
      <div className={`audit-trail-view ${className}`}>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`audit-trail-view ${className}`}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load audit trail: {error.message}
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={`audit-trail-view ${className}`}>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
          No audit trail events yet
        </div>
      </div>
    );
  }

  return (
    <div className={`audit-trail-view ${className}`}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
          <p className="mt-1 text-sm text-gray-600">
            {events.length} event{events.length !== 1 ? 's' : ''} recorded
          </p>
        </div>

        {/* Timeline */}
        <div className="divide-y divide-gray-200">
          {events.map((event: any, idx: number) => {
            const badge = getEventBadge(event.eventType);
            const isExpanded = expandedEvents.has(event.id);
            const hasDetails = event.unlockReason || event.changesSummary;

            return (
              <div key={event.id} className="px-6 py-4">
                <div className="flex gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${
                        badge.color === 'green'
                          ? 'bg-green-100'
                          : badge.color === 'blue'
                          ? 'bg-blue-100'
                          : badge.color === 'amber'
                          ? 'bg-amber-100'
                          : badge.color === 'purple'
                          ? 'bg-purple-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {badge.icon}
                    </div>
                    {idx < events.length - 1 && (
                      <div className="mt-2 h-8 w-0.5 bg-gray-200"></div>
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="inline-flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            badge.color === 'green'
                              ? 'bg-green-100 text-green-700'
                              : badge.color === 'blue'
                              ? 'bg-blue-100 text-blue-700'
                              : badge.color === 'amber'
                              ? 'bg-amber-100 text-amber-700'
                              : badge.color === 'purple'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                          <span title={showAbsoluteTime ? formatAbsoluteTime(event.timestamp) : ''}>
                            {formatTime(event.timestamp)}
                          </span>
                          {event.userId && (
                            <span className="text-gray-500">by {event.userId.substring(0, 8)}</span>
                          )}
                        </div>
                      </div>

                      {/* Expand button */}
                      {hasDetails && (
                        <button
                          onClick={() => toggleExpanded(event.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && hasDetails && (
                      <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3 text-xs">
                        {event.unlockReason && (
                          <div>
                            <span className="font-medium text-gray-700">Reason:</span>
                            <p className="mt-1 text-gray-600 break-words">
                              {event.unlockReason}
                            </p>
                          </div>
                        )}
                        {event.changesSummary && (
                          <div>
                            <span className="font-medium text-gray-700">Changes:</span>
                            <pre className="mt-1 overflow-x-auto bg-white p-2 text-gray-600 text-[0.7rem]">
                              {JSON.stringify(JSON.parse(event.changesSummary), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integrity info */}
        {auditData?.integrity && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <p className="text-xs text-gray-600">
              {auditData.integrity.totalEvents} events • 
              Last: {auditData.integrity.dateRange?.latest ? formatAbsoluteTime(auditData.integrity.dateRange.latest) : 'N/A'}
            </p>
            {auditData.integrity.anomalies?.length > 0 && (
              <p className="mt-2 text-xs text-amber-600">
                ⚠️ {auditData.integrity.anomalies.length} anomalies detected
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailView;
