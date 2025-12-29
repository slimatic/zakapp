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
 * SnapshotCard Component - T059 (Updated for Nisab Year Records)
 * Displays a Nisab Year Record with status badge and quick actions
 */

import React from 'react';
import { clsx } from 'clsx';
import type { NisabYearRecord } from '../../types/nisabYearRecord';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';
import { formatDualCalendar } from '../../utils/calendarConverter';

interface SnapshotCardProps {
  snapshot: NisabYearRecord;
  onView?: () => void;
  onEdit?: () => void;
  onFinalize?: () => void;
  onDelete?: () => void;
  onCompare?: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  compact?: boolean;
}

export const SnapshotCard: React.FC<SnapshotCardProps> = ({
  snapshot,
  onView,
  onEdit,
  onFinalize,
  onDelete,
  onCompare,
  isSelected = false,
  onSelect,
  compact = false
}) => {
  const isDraft = snapshot.status === 'draft';

  const statusConfig = {
    draft: {
      label: 'Draft',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      dotColor: 'bg-yellow-400'
    },
    finalized: {
      label: 'Finalized',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      dotColor: 'bg-green-400'
    },
    active: {
      label: 'Active',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      dotColor: 'bg-blue-400'
    }
  } as const;

  const statusKey = (snapshot.status || 'draft') as 'draft' | 'finalized' | 'active';
  const status = statusConfig[statusKey];

  const totalWealth = typeof snapshot.totalWealth === 'string' ? parseFloat(snapshot.totalWealth) : snapshot.totalWealth || 0;
  const zakatAmount = typeof snapshot.zakatAmount === 'string' ? parseFloat(snapshot.zakatAmount) : snapshot.zakatAmount || 0;
  const zakatableWealth = typeof snapshot.zakatableWealth === 'string' ? parseFloat(snapshot.zakatableWealth) : snapshot.zakatableWealth || 0;
  const nisabThreshold = typeof snapshot.nisabThresholdAtStart === 'string' ? parseFloat(snapshot.nisabThresholdAtStart) : snapshot.nisabThresholdAtStart || 0;

  const zakatPercentage = totalWealth > 0 
    ? ((zakatAmount / totalWealth) * 100).toFixed(2)
    : '0.00';

  const aboveNisab = zakatableWealth >= nisabThreshold;

  return (
    <div className={clsx(
      'bg-white rounded-lg shadow-md border transition-all duration-200 hover:shadow-lg',
      isSelected && 'ring-2 ring-green-500 border-green-300',
      compact ? 'p-4' : 'p-6'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
          )}
          
          <div>
            <h3 className={clsx(
              'font-semibold text-gray-900',
              compact ? 'text-lg' : 'text-xl'
            )}>
              {snapshot.calculationYear || snapshot.gregorianYear || 'N/A'} ({snapshot.hijriYear || 'N/A'} AH)
            </h3>
          </div>
        </div>

        {/* Status Badge */}
        <div className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          status.bgColor,
          status.textColor
        )}>
          <div className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', status.dotColor)} />
          {status.label}
        </div>
      </div>

      {/* Date Information */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Calculation Date:</span>{' '}
          {snapshot.calculationDate ? formatDualCalendar(new Date(snapshot.calculationDate)) : 'N/A'}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Methodology:</span> {snapshot.methodologyUsed || 'Standard'}
        </p>
      </div>

      {/* Financial Summary */}
      <div className={clsx(
        'grid gap-4 mb-4',
        compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
      )}>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Wealth</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(totalWealth)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Zakat Due</p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(zakatAmount)}
          </p>
        </div>
        
        {!compact && (
          <>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Zakatable</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(zakatableWealth)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                {zakatPercentage}%
              </p>
            </div>
          </>
        )}
      </div>

      {/* Nisab Status */}
      <div className="mb-4">
        <div className={clsx(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          aboveNisab 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        )}>
          {aboveNisab ? '✓ Above Nisab' : '✗ Below Nisab'}
          {aboveNisab && (
            <span className="ml-1">
              ({formatCurrency(nisabThreshold)} {snapshot.nisabBasis || 'GOLD'})
            </span>
          )}
        </div>
      </div>

      {/* Notes Preview */}
      {snapshot.userNotes && !compact && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {snapshot.userNotes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        {onView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
          >
            View Details
          </Button>
        )}
        
        {onEdit && isDraft && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
        
        {onFinalize && isDraft && (
          <Button
            variant="default"
            size="sm"
            onClick={onFinalize}
          >
            Finalize
          </Button>
        )}
        
        {onCompare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCompare}
          >
            Compare
          </Button>
        )}
        
        {onDelete && isDraft && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="ml-auto"
          >
            Delete
          </Button>
        )}
      </div>

      {/* Metadata */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span>Created: {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleDateString() : 'N/A'}</span>
        <span>Updated: {snapshot.updatedAt ? new Date(snapshot.updatedAt).toLocaleDateString() : 'N/A'}</span>
      </div>
    </div>
  );
};