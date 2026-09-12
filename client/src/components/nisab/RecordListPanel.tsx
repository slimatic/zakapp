/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * RecordListPanel — status tabs + records list extracted from
 * NisabYearRecordsPage (#341 slice 3). Pure presentation: state and
 * record actions arrive as props.
 */

import React from 'react';
import { NisabRecordCard } from './index';
import { NisabRecordLike } from './RecordDetailPanel';

export type RecordStatusFilter = 'all' | 'DRAFT' | 'FINALIZED' | 'UNLOCKED';

export const RECORD_STATUS_FILTERS = ['all', 'DRAFT', 'FINALIZED', 'UNLOCKED'] as const;

const TAB_LABELS: Record<RecordStatusFilter, string> = {
  all: 'All',
  DRAFT: 'Active',
  FINALIZED: 'Finalized',
  UNLOCKED: 'Unlocked for Editing',
};

export interface RecordListPanelProps {
  records: NisabRecordLike[];
  isLoading: boolean;
  activeStatusFilter: RecordStatusFilter;
  onStatusFilterChange: (status: RecordStatusFilter) => void;
  selectedRecordId: string | null;
  onSelectRecord: (id: string) => void;
  onClearSelection: () => void;
  editingStartDateRecordId: string | null;
  newStartDate: string;
  onFinalize: (record: NisabRecordLike) => void;
  onUnlock: (record: NisabRecordLike) => void;
  onDelete: (record: NisabRecordLike) => void;
  onEditDate: (record: NisabRecordLike) => void;
  onSaveDate: (recordId: string) => void;
  onCancelDate: () => void;
  onDateChange: (date: string) => void;
  onGeneratePdf: (record: NisabRecordLike) => void;
  onCreateRecord: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
  currency: string;
}

/** Extracted per-record event wiring so the map body stays readable. */
interface RecordCardHandlers {
  onSelect: () => void;
  onFinalize: (e: React.MouseEvent) => void;
  onUnlock: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onEditDate: (e: React.MouseEvent) => void;
  onSaveDate: () => void;
  onCancelDate: () => void;
  onDateChange: (date: string) => void;
  onGeneratePdf: (e: React.MouseEvent) => void;
}

export const RecordListPanel: React.FC<RecordListPanelProps> = ({
  records,
  isLoading,
  activeStatusFilter,
  onStatusFilterChange,
  selectedRecordId,
  onSelectRecord,
  onClearSelection,
  editingStartDateRecordId,
  newStartDate,
  onFinalize,
  onUnlock,
  onDelete,
  onEditDate,
  onSaveDate,
  onCancelDate,
  onDateChange,
  onGeneratePdf,
  onCreateRecord,
  formatCurrency,
  currency,
}) => {
  return (
    <>
      {/* Back button for mobile when record is selected */}
      {selectedRecordId && (
        <button
          onClick={onClearSelection}
          className="lg:hidden flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to list
        </button>
      )}

      {/* Status tabs */}
      <div className={`flex gap-2 border-b border-gray-200 overflow-x-auto pb-px ${selectedRecordId ? 'hidden lg:flex' : ''}`}>
        {RECORD_STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => onStatusFilterChange(status)}
            className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${activeStatusFilter === status
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            {TAB_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Records list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No {activeStatusFilter === 'all' ? '' : activeStatusFilter} records yet</p>
          <button
            onClick={onCreateRecord}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first record →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const handlers: RecordCardHandlers = {
              onSelect: () => onSelectRecord(record.id),
              onFinalize: (e) => { e.stopPropagation(); onFinalize(record); },
              onUnlock: (e) => { e.stopPropagation(); onUnlock(record); },
              onDelete: (e) => { e.stopPropagation(); onDelete(record); },
              onEditDate: (e) => { e.stopPropagation(); onEditDate(record); },
              onSaveDate: () => onSaveDate(record.id),
              onCancelDate,
              onDateChange,
              onGeneratePdf: (e) => { e.stopPropagation(); onGeneratePdf(record); },
            };
            return (
              <NisabRecordCard
                key={record.id}
                record={record as never}
                isSelected={selectedRecordId === record.id}
                selectedRecordId={selectedRecordId}
                showEditPopover={editingStartDateRecordId === record.id}
                newStartDate={newStartDate}
                {...handlers}
                formatCurrency={formatCurrency}
                currency={currency}
              />
            );
          })}
        </div>
      )}
    </>
  );
};