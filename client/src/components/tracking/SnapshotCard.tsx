/**
 * SnapshotCard Component - T059
 * Displays a yearly snapshot with status badge and quick actions
 */

import React from 'react';
import { clsx } from 'clsx';
import type { YearlySnapshot } from '../../../../shared/types/tracking';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';
import { formatDualCalendar } from '../../utils/calendarConverter';

interface SnapshotCardProps {
  snapshot: YearlySnapshot;
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
    }
  };

  const status = statusConfig[snapshot.status];

  const zakatPercentage = snapshot.totalWealth > 0 
    ? ((snapshot.zakatAmount / snapshot.totalWealth) * 100).toFixed(2)
    : '0.00';

  const aboveNisab = snapshot.zakatableWealth >= snapshot.nisabThreshold;

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
              {snapshot.gregorianYear} ({snapshot.hijriYear} AH)
            </h3>
            {snapshot.isPrimary && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Primary
              </span>
            )}
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
          {formatDualCalendar(new Date(snapshot.calculationDate))}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Methodology:</span> {snapshot.methodologyUsed}
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
            {formatCurrency(snapshot.totalWealth)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Zakat Due</p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(snapshot.zakatAmount)}
          </p>
        </div>
        
        {!compact && (
          <>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Zakatable</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(snapshot.zakatableWealth)}
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
              ({formatCurrency(snapshot.nisabThreshold)} {snapshot.nisabType})
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
            variant="primary"
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
            variant="danger"
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
        <span>Created: {new Date(snapshot.createdAt).toLocaleDateString()}</span>
        <span>Updated: {new Date(snapshot.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};