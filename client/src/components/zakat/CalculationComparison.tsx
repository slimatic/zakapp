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

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Calculation {
  id: string;
  methodology: string;
  calendarType: string;
  calculationDate: string;
  totalWealth: number;
  nisabThreshold: number;
  zakatDue: number;
  zakatRate: number;
  assetBreakdown: Record<string, any>;
  notes?: string;
}

interface ComparisonStatistics {
  wealth: {
    min: number;
    max: number;
    range: number;
    average: number;
  };
  zakat: {
    min: number;
    max: number;
    range: number;
    average: number;
  };
  nisab: {
    min: number;
    max: number;
    range: number;
    average: number;
  };
}

interface ComparisonResult {
  calculations: Calculation[];
  statistics: ComparisonStatistics;
  methodologies: string[];
  comparisonCount: number;
}

export const CalculationComparison: React.FC = () => {
  const [availableCalculations, setAvailableCalculations] = useState<Calculation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableCalculations();
  }, []);

  const loadAvailableCalculations = async () => {
    try {
      const response = await fetch('/api/calculations?limit=50&sortBy=calculationDate&sortOrder=desc', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load calculations');
      }

      const data = await response.json();
      if (data.success) {
        setAvailableCalculations(data.calculations || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calculations');
    }
  };

  const compareCalculations = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 calculations to compare');
      return;
    }

    if (selectedIds.length > 10) {
      setError('Maximum 10 calculations can be compared at once');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/calculations/compare', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ calculationIds: selectedIds })
      });

      if (!response.ok) {
        throw new Error('Failed to compare calculations');
      }

      const data = await response.json();
      if (data.success) {
        setComparison(data.comparison);
      } else {
        throw new Error(data.message || 'Failed to compare calculations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else if (prev.length < 10) {
        return [...prev, id];
      } else {
        setError('Maximum 10 calculations can be selected');
        return prev;
      }
    });
    // Clear error when selection changes
    if (error?.includes('select at least')) {
      setError(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatMethodology = (methodology: string): string => {
    const names: Record<string, string> = {
      'standard': 'Standard (AAOIFI)',
      'hanafi': 'Hanafi',
      'shafii': "Shafi'i",
      'custom': 'Custom'
    };
    return names[methodology] || methodology;
  };

  const getMethodologyColor = (methodology: string): string => {
    const colors: Record<string, string> = {
      'standard': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'hanafi': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'shafii': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'custom': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[methodology] || colors.custom;
  };

  const exportComparison = () => {
    if (!comparison) return;

    const dataStr = JSON.stringify(comparison, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zakat-comparison-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Compare Calculations
        </h2>
      </div>

      {/* Selection Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Calculations to Compare
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select 2-10 calculations ({selectedIds.length} selected)
            </p>
          </div>
          <button
            onClick={compareCalculations}
            disabled={selectedIds.length < 2 || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Comparing...' : 'Compare Selected'}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableCalculations.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No calculations available. Complete some calculations first.
            </p>
          ) : (
            availableCalculations.map((calc) => (
              <label
                key={calc.id}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedIds.includes(calc.id)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(calc.id)}
                  onChange={() => toggleSelection(calc.id)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodologyColor(calc.methodology)}`}>
                      {formatMethodology(calc.methodology)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(calc.calculationDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Wealth: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(calc.totalWealth)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Nisab: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(calc.nisabThreshold)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Zakat: </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(calc.zakatDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <>
          {/* Statistics Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comparison Statistics
              </h3>
              <button
                onClick={exportComparison}
                className="px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
              >
                Export Results
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wealth Statistics */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Wealth Statistics
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Minimum:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.wealth.min)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Maximum:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.wealth.max)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Range:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.wealth.range)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">Average:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(comparison.statistics.wealth.average)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Zakat Statistics */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Zakat Statistics
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Minimum:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.zakat.min)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Maximum:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.zakat.max)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Range:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.zakat.range)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">Average:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(comparison.statistics.zakat.average)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nisab Statistics */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Nisab Statistics
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Minimum:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.nisab.min)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Maximum:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.nisab.max)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Range:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(comparison.statistics.nisab.range)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">Average:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {formatCurrency(comparison.statistics.nisab.average)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Methodology Summary */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Methodologies Used
              </h4>
              <div className="flex flex-wrap gap-2">
                {comparison.methodologies.map((method) => (
                  <span
                    key={method}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getMethodologyColor(method)}`}
                  >
                    {formatMethodology(method)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detailed Comparison
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Methodology
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Wealth
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nisab
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Zakat Due
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {comparison.calculations.map((calc) => (
                    <tr key={calc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(new Date(calc.calculationDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodologyColor(calc.methodology)}`}>
                          {formatMethodology(calc.methodology)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(calc.totalWealth)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(calc.nisabThreshold)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(calc.zakatDue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                        {calc.zakatRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Comparison Insights:</strong> This comparison shows how different methodologies and time periods affect your Zakat calculation. The range in values helps you understand the impact of methodology choice and wealth fluctuations on your Zakat obligation.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalculationComparison;
