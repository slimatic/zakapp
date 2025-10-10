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
  metadata?: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

interface CalculationHistoryProps {
  userId?: string;
}

export const CalculationHistory: React.FC<CalculationHistoryProps> = () => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false
  });
  const [selectedMethodology, setSelectedMethodology] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'calculationDate' | 'totalWealth' | 'zakatDue'>('calculationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);

  useEffect(() => {
    loadCalculations();
  }, [pagination.page, selectedMethodology, sortBy, sortOrder]);

  const loadCalculations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });

      if (selectedMethodology !== 'all') {
        params.append('methodology', selectedMethodology);
      }

      // Make API call
      const response = await fetch(`/api/calculations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load calculation history');
      }

      const data = await response.json();

      if (data.success) {
        setCalculations(data.calculations || []);
        setPagination(data.pagination);
      } else {
        throw new Error(data.message || 'Failed to load calculations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCalculation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calculation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/calculations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete calculation');
      }

      // Reload calculations
      await loadCalculations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete calculation');
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
    const methodologyNames: Record<string, string> = {
      'standard': 'Standard (AAOIFI)',
      'hanafi': 'Hanafi',
      'shafi': 'Shafi\'i',
      'custom': 'Custom'
    };
    return methodologyNames[methodology] || methodology;
  };

  const getMethodologyColor = (methodology: string): string => {
    const colors: Record<string, string> = {
      'standard': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'hanafi': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'shafi': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'custom': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[methodology] || colors.custom;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={loadCalculations}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Calculation History
        </h2>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Methodology Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Methodology
            </label>
            <select
              value={selectedMethodology}
              onChange={(e) => {
                setSelectedMethodology(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Methodologies</option>
              <option value="standard">Standard (AAOIFI)</option>
              <option value="hanafi">Hanafi</option>
              <option value="shafi">Shafi'i</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="calculationDate">Date</option>
              <option value="totalWealth">Total Wealth</option>
              <option value="zakatDue">Zakat Due</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calculations List */}
      {calculations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No calculations found
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Start by calculating your Zakat to see your history here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {calculations.map((calc) => (
            <div
              key={calc.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMethodologyColor(calc.methodology)}`}>
                      {formatMethodology(calc.methodology)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(calc.calculationDate), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Wealth</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(calc.totalWealth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nisab Threshold</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(calc.nisabThreshold)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Zakat Due</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(calc.zakatDue)}
                      </p>
                    </div>
                  </div>

                  {calc.notes && (
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 italic">
                      "{calc.notes}"
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedCalculation(calc)}
                    className="px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    aria-label="View details"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteCalculation(calc.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    aria-label="Delete calculation"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} calculations
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.hasMore}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Calculation Details
                </h3>
                <button
                  onClick={() => setSelectedCalculation(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Close modal"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {format(new Date(selectedCalculation.calculationDate), 'PPP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Methodology</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {formatMethodology(selectedCalculation.methodology)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Calendar Type</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white capitalize">
                      {selectedCalculation.calendarType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Zakat Rate</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {selectedCalculation.zakatRate}%
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Financial Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Wealth:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(selectedCalculation.totalWealth)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Nisab Threshold:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(selectedCalculation.nisabThreshold)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg border-t border-gray-200 dark:border-gray-700 pt-3">
                      <span className="font-semibold text-gray-900 dark:text-white">Zakat Due:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(selectedCalculation.zakatDue)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedCalculation.notes && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Notes
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedCalculation.notes}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Asset Breakdown
                  </h4>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedCalculation.assetBreakdown, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculationHistory;
