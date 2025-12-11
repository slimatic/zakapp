/**
 * SnapshotList Component - T060
 * Lists yearly snapshots with pagination and filtering
 */

import React, { useState } from 'react';
import { useSnapshots } from '../../hooks/useZakatSnapshots';
import { SnapshotCard } from './SnapshotCard';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Input } from '../ui/Input';

interface SnapshotListProps {
  onCreateNew?: () => void;
  onViewSnapshot?: (snapshotId: string) => void;
  onEditSnapshot?: (snapshotId: string) => void;
  onFinalizeSnapshot?: (snapshotId: string) => void;
  onDeleteSnapshot?: (snapshotId: string) => void;
  onCompareSelected?: (snapshotIds: string[]) => void;
  compact?: boolean;
  selectable?: boolean;
}

export const SnapshotList: React.FC<SnapshotListProps> = ({
  onCreateNew,
  onViewSnapshot,
  onEditSnapshot,
  onFinalizeSnapshot,
  onDeleteSnapshot,
  onCompareSelected,
  compact = false,
  selectable = false
}) => {
  // Filters and pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: compact ? 6 : 12,
    status: 'all' as 'all' | 'draft' | 'finalized',
    year: undefined as number | undefined
  });

  // Selection state for comparison
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);

  // Fetch snapshots
  const { data, isLoading, error, refetch } = useSnapshots({
    page: filters.page,
    limit: filters.limit,
    status: filters.status === 'all' ? undefined : filters.status,
    year: filters.year
  });

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectSnapshot = (snapshotId: string, selected: boolean) => {
    setSelectedSnapshots(prev => 
      selected 
        ? [...prev, snapshotId]
        : prev.filter(id => id !== snapshotId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && data?.snapshots) {
      setSelectedSnapshots(data.snapshots.map(s => s.id));
    } else {
      setSelectedSnapshots([]);
    }
  };

  const handleCompareSelected = () => {
    if (onCompareSelected && selectedSnapshots.length >= 2) {
      onCompareSelected(selectedSnapshots);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  const snapshots = data?.snapshots || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={compact ? 'text-xl font-semibold' : 'text-2xl font-bold'}>
            Nisab Year Records
          </h2>
          <p className="text-gray-600 mt-1">
            {pagination ? `${pagination.totalItems} records` : 'Your Zakat calculation history'}
          </p>
        </div>
        
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            Create New Record
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <Input
              type="number"
              placeholder="Filter by year"
              value={filters.year || ''}
              onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
              min={1900}
              max={2200}
            />
          </div>

          {/* Results per page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      {selectable && snapshots.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedSnapshots.length === snapshots.length && snapshots.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Select All ({selectedSnapshots.length} selected)
              </label>
            </div>
            
            {selectedSnapshots.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSnapshots([])}
              >
                Clear Selection
              </Button>
            )}
          </div>
          
          {selectedSnapshots.length >= 2 && onCompareSelected && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompareSelected}
            >
              Compare Selected ({selectedSnapshots.length})
            </Button>
          )}
        </div>
      )}

      {/* Snapshots Grid */}
      {snapshots.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
          <p className="text-gray-600 mb-4">
            {filters.status !== 'all' || filters.year 
              ? 'No Nisab Year Records match your current filters.' 
              : 'Create your first Nisab Year Record to start tracking your Zakat history.'}
          </p>
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              Create Your First Record
            </Button>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${compact ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {snapshots.map((snapshot) => (
            <SnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              onView={onViewSnapshot ? () => onViewSnapshot(snapshot.id) : undefined}
              onEdit={onEditSnapshot ? () => onEditSnapshot(snapshot.id) : undefined}
              onFinalize={onFinalizeSnapshot ? () => onFinalizeSnapshot(snapshot.id) : undefined}
              onDelete={onDeleteSnapshot ? () => onDeleteSnapshot(snapshot.id) : undefined}
              isSelected={selectedSnapshots.includes(snapshot.id)}
              onSelect={selectable ? (selected) => handleSelectSnapshot(snapshot.id, selected) : undefined}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const page = Math.max(1, pagination.currentPage - 2) + i;
                  if (page > pagination.totalPages) return null;
                  
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.currentPage ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                }
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};