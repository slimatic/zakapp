/**
 * Copyright (c) 2024 ZakApp Contributors
 * GNU Affero General Public License v3.0+
 */
import React from 'react';
import { parseDecimalNumber } from '../../utils/parseDecimal';
import { EditDatePopover } from './EditDatePopover';
import { formatHijriDate, gregorianToHijri } from '../../utils/calendarConverter';
import { NisabYearRecord } from '../../types/nisabYearRecord';

export interface NisabRecordCardProps {
  record: NisabYearRecord;
  isSelected: boolean;
  selectedRecordId?: string | null;
  showEditPopover: boolean;
  newStartDate: string;
  onSelect: () => void;
  onFinalize: (e: React.MouseEvent) => void;
  onUnlock: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onEditDate: (e: React.MouseEvent) => void;
  onSaveDate: () => void;
  onCancelDate: () => void;
  onDateChange: (v: string) => void;
  onGeneratePdf: (e: React.MouseEvent) => void;
  formatCurrency: (amount: number, currency?: string) => string;
  currency?: string;
  allAssets?: any[];
  allLiabilities?: any[];
}

const statusBadges: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'blue', label: 'Active' },
  FINALIZED: { color: 'green', label: 'Finalized' },
  UNLOCKED: { color: 'amber', label: 'Unlocked for Editing' },
};

export const NisabRecordCard: React.FC<NisabRecordCardProps> = React.memo(({
  record,
  isSelected,
  selectedRecordId,
  showEditPopover,
  newStartDate,
  onSelect,
  onFinalize,
  onUnlock,
  onDelete,
  onEditDate,
  onSaveDate,
  onCancelDate,
  onDateChange,
  onGeneratePdf,
  formatCurrency,
  currency = 'USD',
}) => {
  const badge = statusBadges[record.status || 'DRAFT'] || { color: 'gray', label: record.status || 'Unknown' };
  const startDate = new Date(record.hawlStartDate || new Date());
  const startDateFormatted = startDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const zakatAmount = parseDecimalNumber(String(record.zakatAmount || record.finalZakatAmount || '0'));
  const totalWealth = parseDecimalNumber(String(record.totalWealth || '0'));
  const zakatableWealth = parseDecimalNumber(String(record.zakatableWealth || '0'));
  const shouldHideOnMobile = selectedRecordId && !isSelected;

  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-4 sm:p-5 cursor-pointer transition-all ${shouldHideOnMobile ? 'hidden lg:block' : ''} ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {Number(record.hijriYear || 0) > 0
                ? `${record.hijriYear} H • ${startDateFormatted.split(',')[1]?.trim() || startDateFormatted}`
                : startDateFormatted}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${badge.color === 'green' ? 'bg-green-100 text-green-800' : badge.color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Nisab Basis</div>
            <div className="text-sm font-medium text-gray-900">
              {record.nisabBasis === 'GOLD' ? '🟡 Gold' : '⚪ Silver'}
            </div>
          </div>
          {totalWealth > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Total Wealth</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(totalWealth, currency)}</div>
            </div>
          )}
          {zakatableWealth > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Zakatable</div>
              <div className="text-sm font-medium text-green-700">{formatCurrency(zakatableWealth, currency)}</div>
            </div>
          )}
          {zakatAmount > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Zakat Obligation</div>
              <div className="text-sm font-bold text-blue-700">{formatCurrency(zakatAmount, currency)}</div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-1 text-xs text-gray-600">
          <div>
            Started: <span className="text-gray-900 font-medium">{startDateFormatted}</span>
            <span className="text-gray-500 ml-1">({formatHijriDate(gregorianToHijri(startDate))})</span>
          </div>
          {record.hawlCompletionDate && (
            <div>
              Ends: <span className="text-gray-900 font-medium">{new Date(record.hawlCompletionDate).toLocaleDateString()}</span>
              <span className="text-gray-500 ml-1">({formatHijriDate(gregorianToHijri(new Date(record.hawlCompletionDate)))})</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap relative">
          {isSelected && record.status === 'DRAFT' && (
            <button onClick={onEditDate} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-300 hover:bg-gray-200">Change Date</button>
          )}

          {showEditPopover && (
            <div className="absolute bg-white border p-4 shadow-xl z-20 rounded-lg w-72" onClick={e => e.stopPropagation()}>
              <EditDatePopover value={newStartDate} onChange={onDateChange} onSave={onSaveDate} onCancel={onCancelDate} />
            </div>
          )}

          {record.status === 'DRAFT' && (
            <button onClick={onFinalize} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Finalize</button>
          )}
          {record.status === 'FINALIZED' && (
            <>
              <button onClick={onUnlock} className="px-2 py-1 bg-amber-600 text-white rounded text-xs">Unlock</button>
              <button onClick={onGeneratePdf} className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200 flex items-center gap-1">📄 PDF</button>
            </>
          )}
          <button onClick={onDelete} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">Delete</button>
        </div>
      </div>
    </div>
  );
});

NisabRecordCard.displayName = 'NisabRecordCard';
