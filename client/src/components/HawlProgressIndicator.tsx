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
 * HawlProgressIndicator Component (T060)
 * 
 * Displays countdown to Hawl completion with progress bar
 * Features:
 * - Progress bar (days elapsed / 354)
 * - Hijri + Gregorian dates
 * - "Live" badge for DRAFT records
 * - Days remaining countdown
 */

import React, { useMemo } from 'react';
import { useHawlStatus } from '../hooks/useHawlStatus';
import type { NisabYearRecordWithLiveTracking } from '@zakapp/shared';

export interface HawlProgressIndicatorProps {
  /**
   * The Nisab Year Record to track
   */
  record: NisabYearRecordWithLiveTracking;

  /**
   * Optional custom className
   */
  className?: string;

  /**
   * Optional callback on completion
   */
  onHawlComplete?: () => void;

  /**
   * Optional: custom progress bar color
   */
  progressColor?: 'green' | 'blue' | 'amber' | 'red';
}

/**
 * Component to display Hawl progress with countdown
 * 
 * Shows:
 * - Progress bar (visual representation of 354 days)
 * - Days remaining until Hawl completes
 * - Start date (Hijri) and completion date (Gregorian)
 * - "Live" badge for actively tracking records
 * - Color changes based on progress (amber->green->complete)
 * 
 * @example
 * <HawlProgressIndicator
 *   record={nisabYearRecord}
 *   onHawlComplete={() => alert('Hawl complete!')}
 * />
 */
export const HawlProgressIndicator: React.FC<HawlProgressIndicatorProps> = ({
  record,
  className = '',
  onHawlComplete,
  progressColor = 'blue',
}) => {
  const { liveHawlData, isUpdating } = useHawlStatus(record.id, 5000);

  // Calculate display values
  const {
    daysRemaining,
    daysElapsed,
    progressPercent,
    completionDate,
    startDate,
  } = useMemo(() => {
    const data = liveHawlData || {};
    const remaining = (data as any)?.daysRemaining ?? 0;
    const elapsed = (data as any)?.daysElapsed ?? 0;
    const percent = (data as any)?.hawlProgress ?? 0;

    return {
      daysRemaining: remaining,
      daysElapsed: elapsed,
      progressPercent: percent,
      completionDate: record.hawlCompletionDate ? new Date(record.hawlCompletionDate) : null,
      startDate: record.hawlStartDate ? new Date(record.hawlStartDate) : null,
    };
  }, [liveHawlData, record]);

  // Format date
  const formatDate = (date: Date | null, format: 'short' | 'long' = 'short'): string => {
    if (!date) return 'N/A';
    if (format === 'short') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Determine progress bar color
  const getProgressColor = (): string => {
    if (record.status !== 'DRAFT') return 'bg-gray-300';
    if (progressPercent >= 100) return 'bg-green-500';
    if (progressPercent >= 75) return 'bg-amber-500';
    if (progressPercent >= 50) return 'bg-blue-500';
    return 'bg-blue-400';
  };

  // Handle completion callback
  React.useEffect(() => {
    if (liveHawlData?.canFinalize && onHawlComplete) {
      onHawlComplete();
    }
  }, [liveHawlData?.canFinalize, onHawlComplete]);

  if (record.status !== 'DRAFT') {
    return (
      <div className={`hawl-progress-indicator hawl-status-${(record.status || 'unknown').toLowerCase()} ${className}`}>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Hawl Status: {record.status || 'Unknown'}
              </h3>
              {record.hawlCompletionDate && (
                <p className="mt-1 text-xs text-gray-600">
                  Completed: {formatDate(new Date(record.hawlCompletionDate))}
                </p>
              )}
            </div>
            {record.status === 'FINALIZED' && (
              <div className="rounded-full bg-green-100 px-3 py-1">
                <span className="text-xs font-medium text-green-700">Finalized</span>
              </div>
            )}
            {record.status === 'UNLOCKED' && (
              <div className="rounded-full bg-amber-100 px-3 py-1">
                <span className="text-xs font-medium text-amber-700">Unlocked</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hawl-progress-indicator hawl-status-draft ${className}`}>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        {/* Header with Live badge */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Hawl Progress</h3>
          <div className="flex items-center gap-2">
            {isUpdating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
                Updating...
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              <span className="inline-block h-2 w-2 rounded-full bg-green-600"></span>
              Live
            </span>
          </div>
        </div>

        {/* Days remaining */}
        <div className="mb-4 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-white p-3">
            <div className="text-2xl font-bold text-blue-600">{daysRemaining}</div>
            <div className="text-xs text-gray-600">Days Remaining</div>
          </div>
          <div className="rounded-lg bg-white p-3">
            <div className="text-2xl font-bold text-gray-700">{daysElapsed}</div>
            <div className="text-xs text-gray-600">Days Elapsed</div>
          </div>
          <div className="rounded-lg bg-white p-3">
            <div className="text-2xl font-bold text-gray-700">{progressPercent.toFixed(0)}%</div>
            <div className="text-xs text-gray-600">Progress</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>Start</span>
            <span>Day 354 (Complete)</span>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 border-t border-blue-200 pt-3">
          <div>
            <div className="text-xs font-medium text-gray-600">Start Date</div>
            <div className="text-sm text-gray-900">{formatDate(startDate)}</div>
            <div className="text-xs text-gray-500">(Gregorian)</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600">Completion Date</div>
            <div className="text-sm text-gray-900">{formatDate(completionDate)}</div>
            <div className="text-xs text-gray-500">(Estimated)</div>
          </div>
        </div>

        {/* Hawl complete status */}
        {liveHawlData?.canFinalize && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-700">
              ✓ Hawl period complete! Ready to finalize.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default HawlProgressIndicator;
