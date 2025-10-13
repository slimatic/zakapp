/**
 * ComparisonTable Component - T063
 * Side-by-side comparison of multiple yearly snapshots
 */

import React from 'react';
import { useComparison } from '../../hooks/useComparison';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { formatGregorianDate, formatHijriDate } from '../../utils/calendarConverter';
import type { YearlySnapshot } from '../../../../shared/types/tracking';

interface ComparisonTableProps {
  snapshotIds: string[];
  title?: string;
  compact?: boolean;
}

interface ComparisonRow {
  label: string;
  field: keyof YearlySnapshot | 'derived';
  formatter?: (value: any, snapshot?: YearlySnapshot) => string;
  highlight?: boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  // Basic Information
  { label: 'Calculation Date', field: 'calculationDate', formatter: (value) => formatGregorianDate(value) },
  { label: 'Hijri Date', field: 'hijriYear', formatter: (_, snapshot) => 
    snapshot ? formatHijriDate({ 
      hy: snapshot.hijriYear, 
      hm: snapshot.hijriMonth, 
      hd: snapshot.hijriDay 
    }) : '-' 
  },
  { label: 'Status', field: 'status', formatter: (value) => 
    value === 'finalized' ? '✅ Finalized' : '🔄 Draft' 
  },
  { label: 'Methodology', field: 'methodologyUsed' },
  
  // Financial Overview
  { label: 'Total Wealth', field: 'totalWealth', formatter: (value) => formatCurrency(value), highlight: true },
  { label: 'Total Liabilities', field: 'totalLiabilities', formatter: (value) => formatCurrency(value) },
  { label: 'Zakatable Wealth', field: 'zakatableWealth', formatter: (value) => formatCurrency(value), highlight: true },
  { label: 'Zakat Amount', field: 'zakatAmount', formatter: (value) => formatCurrency(value), highlight: true },
  
  // Derived Calculations
  { 
    label: 'Zakat Rate', 
    field: 'derived', 
    formatter: (_, snapshot) => {
      if (!snapshot || !snapshot.zakatableWealth || snapshot.zakatableWealth === 0) return '0%';
      const rate = (snapshot.zakatAmount / snapshot.zakatableWealth) * 100;
      return formatPercentage(rate / 100);
    }
  },
  { 
    label: 'Net Worth', 
    field: 'derived', 
    formatter: (_, snapshot) => {
      if (!snapshot) return '-';
      const netWorth = snapshot.totalWealth - snapshot.totalLiabilities;
      return formatCurrency(netWorth);
    },
    highlight: true
  },
  
  // Nisab Information
  { label: 'Nisab Threshold', field: 'nisabThreshold', formatter: (value) => formatCurrency(value) },
  { label: 'Nisab Type', field: 'nisabType', formatter: (value) => 
    value === 'gold' ? '🥇 Gold' : '🥈 Silver' 
  },
  { 
    label: 'Above Nisab', 
    field: 'derived', 
    formatter: (_, snapshot) => {
      if (!snapshot) return '-';
      const isAbove = snapshot.zakatableWealth >= snapshot.nisabThreshold;
      return isAbove ? '✅ Yes' : '❌ No';
    }
  }
];

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  snapshotIds,
  title = 'Snapshot Comparison',
  compact = false
}) => {
  const { data: comparison, isLoading, error } = useComparison({ snapshotIds });

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
        <ErrorMessage error={error} />
      </div>
    );
  }

  if (!comparison?.snapshots || comparison.snapshots.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No snapshots to compare</h3>
        <p className="text-gray-600">Select multiple snapshots to see a side-by-side comparison.</p>
      </div>
    );
  }

  const snapshots = comparison.snapshots;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={compact ? 'text-lg font-semibold' : 'text-xl font-bold'}>
            {title}
          </h3>
          <p className="text-gray-600 mt-1">
            Comparing {snapshots.length} snapshots side by side
          </p>
        </div>

        {/* Summary Stats */}
        {comparison.summary && (
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Period Zakat</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(comparison.summary.totalZakat)}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                Metric
              </th>
              {snapshots.map((snapshot: YearlySnapshot, index: number) => (
                <th 
                  key={snapshot.id} 
                  className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b min-w-32"
                >
                  <div className="flex flex-col items-center">
                    <div className="font-semibold">
                      Year {snapshot.gregorianYear}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {snapshot.isPrimary && '⭐ Primary'}
                      {snapshot.status === 'draft' && '🔄 Draft'}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {COMPARISON_ROWS.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={`${row.highlight ? 'bg-green-50' : 'hover:bg-gray-50'}`}
              >
                <td className={`px-4 py-3 text-sm font-medium ${row.highlight ? 'text-green-800' : 'text-gray-700'}`}>
                  {row.label}
                </td>
                {snapshots.map((snapshot: YearlySnapshot) => {
                  let value: string;
                  
                  if (row.field === 'derived') {
                    value = row.formatter ? row.formatter(null, snapshot) : '-';
                  } else {
                    const rawValue = snapshot[row.field];
                    value = row.formatter ? row.formatter(rawValue, snapshot) : (rawValue?.toString() || '-');
                  }

                  return (
                    <td 
                      key={snapshot.id}
                      className={`px-4 py-3 text-center text-sm ${row.highlight ? 'font-semibold text-green-700' : 'text-gray-600'}`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Year-over-Year Changes */}
      {snapshots.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const sorted = [...snapshots].sort((a, b) => a.gregorianYear - b.gregorianYear);
            const latest = sorted[sorted.length - 1];
            const previous = sorted[sorted.length - 2];
            
            const wealthChange = latest.totalWealth - previous.totalWealth;
            const zakatChange = latest.zakatAmount - previous.zakatAmount;
            const zakatableChange = latest.zakatableWealth - previous.zakatableWealth;
            
            return [
              {
                label: 'Wealth Change',
                value: wealthChange,
                isPositive: wealthChange >= 0
              },
              {
                label: 'Zakatable Wealth Change',
                value: zakatableChange,
                isPositive: zakatableChange >= 0
              },
              {
                label: 'Zakat Change',
                value: zakatChange,
                isPositive: zakatChange >= 0
              }
            ].map((change, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {change.label}
                </div>
                <div className={`text-lg font-bold ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {change.isPositive ? '+' : ''}{formatCurrency(change.value)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {previous.gregorianYear} → {latest.gregorianYear}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Export Options */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Print Comparison
        </button>
        <button 
          onClick={() => {
            // Export to CSV functionality would go here
            console.log('Export to CSV functionality not implemented yet');
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
        >
          Export to CSV
        </button>
      </div>

      {/* Additional Notes */}
      {comparison.notes && comparison.notes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Comparison Notes</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {comparison.notes.map((note: string, index: number) => (
              <li key={index}>• {note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};