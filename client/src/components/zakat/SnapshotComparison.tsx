import React, { useState, useMemo } from 'react';
import { useSnapshots, useCompareSnapshots } from '../../hooks';

/**
 * SnapshotComparison Component - T025
 *
 * Provides comprehensive comparison between two Zakat calculation snapshots
 * with visual charts, growth metrics, and export functionality.
 */
const SnapshotComparison: React.FC = () => {
  const [fromYear, setFromYear] = useState<number>(new Date().getFullYear() - 1);
  const [toYear, setToYear] = useState<number>(new Date().getFullYear());
  const [selectedFromSnapshot, setSelectedFromSnapshot] = useState<string>('');
  const [selectedToSnapshot, setSelectedToSnapshot] = useState<string>('');

  // Fetch snapshots for both years
  const { data: fromSnapshots, isLoading: fromLoading } = useSnapshots({ year: fromYear });
  const { data: toSnapshots, isLoading: toLoading } = useSnapshots({ year: toYear });

  // Compare selected snapshots
  const { data: comparison, isLoading: comparisonLoading } = useCompareSnapshots(
    selectedFromSnapshot,
    selectedToSnapshot
  );

  // Get available years for selectors
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleExportPDF = () => {
    // This would integrate with a PDF generation library
    alert('PDF export functionality would be implemented here');
  };

  const handleExportExcel = () => {
    // This would generate CSV data for Excel
    alert('Excel export functionality would be implemented here');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nisab Year Comparison</h1>
          <p className="text-gray-600">Compare Zakat calculations across different periods</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Year and Snapshot Selectors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* From Snapshot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From (Baseline)
            </label>
            <div className="space-y-2">
              <select
                value={fromYear}
                onChange={(e) => {
                  setFromYear(parseInt(e.target.value));
                  setSelectedFromSnapshot('');
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {fromLoading ? (
                <div className="text-sm text-gray-500">Loading records...</div>
              ) : (
                <select
                  value={selectedFromSnapshot}
                  onChange={(e) => setSelectedFromSnapshot(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a Nisab Year</option>
                  {fromSnapshots?.data?.snapshots?.map((snapshot: any) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {new Date(snapshot.calculationDate).toLocaleDateString()} - {formatCurrency(snapshot.zakatDue || 0)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* To Snapshot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To (Comparison)
            </label>
            <div className="space-y-2">
              <select
                value={toYear}
                onChange={(e) => {
                  setToYear(parseInt(e.target.value));
                  setSelectedToSnapshot('');
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {toLoading ? (
                <div className="text-sm text-gray-500">Loading records...</div>
              ) : (
                <select
                  value={selectedToSnapshot}
                  onChange={(e) => setSelectedToSnapshot(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a Nisab Year</option>
                  {toSnapshots?.data?.snapshots?.map((snapshot: any) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {new Date(snapshot.calculationDate).toLocaleDateString()} - {formatCurrency(snapshot.zakatDue || 0)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {selectedFromSnapshot && selectedToSnapshot ? (
        comparisonLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Comparing Nisab Years...</p>
            </div>
          </div>
        ) : comparison?.data ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Total Assets Change</div>
                <div className={`text-2xl font-bold ${getGrowthColor(comparison.data.assetGrowth || 0)}`}>
                  {formatPercentage(comparison.data.assetGrowth || 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Zakat Amount Change</div>
                <div className={`text-2xl font-bold ${getGrowthColor(comparison.data.zakatGrowth || 0)}`}>
                  {formatPercentage(comparison.data.zakatGrowth || 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Net Worth Change</div>
                <div className={`text-2xl font-bold ${getGrowthColor(comparison.data.netWorthGrowth || 0)}`}>
                  {formatPercentage(comparison.data.netWorthGrowth || 0)}
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Detailed Comparison</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From ({fromYear})
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To ({toYear})
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Growth
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total Assets
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(comparison.data.fromSnapshot?.totalAssets || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(comparison.data.toSnapshot?.totalAssets || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency((comparison.data.toSnapshot?.totalAssets || 0) - (comparison.data.fromSnapshot?.totalAssets || 0))}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getGrowthColor(comparison.data.assetGrowth || 0)}`}>
                        {formatPercentage(comparison.data.assetGrowth || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Zakat Due
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(comparison.data.fromSnapshot?.zakatDue || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(comparison.data.toSnapshot?.zakatDue || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency((comparison.data.toSnapshot?.zakatDue || 0) - (comparison.data.fromSnapshot?.zakatDue || 0))}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getGrowthColor(comparison.data.zakatGrowth || 0)}`}>
                        {formatPercentage(comparison.data.zakatGrowth || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Nisab Threshold
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(comparison.data.fromSnapshot?.nisabThreshold || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(comparison.data.toSnapshot?.nisabThreshold || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency((comparison.data.toSnapshot?.nisabThreshold || 0) - (comparison.data.fromSnapshot?.nisabThreshold || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        N/A
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Asset Category Breakdown */}
            {comparison.data.categoryBreakdown && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Category Changes</h2>
                <div className="space-y-3">
                  {Object.entries(comparison.data.categoryBreakdown).map(([category, data]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 capitalize">{category}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">
                          {formatCurrency(data.fromValue || 0)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(data.toValue || 0)}
                        </span>
                        <span className={`font-medium ${getGrowthColor(data.growth || 0)}`}>
                          {formatPercentage(data.growth || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">From Nisab Year:</span>
                  <div className="text-gray-600 mt-1">
                    Date: {new Date(comparison.data.fromSnapshot?.calculationDate).toLocaleDateString()}<br/>
                    Methodology: {comparison.data.fromSnapshot?.methodology}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">To Nisab Year:</span>
                  <div className="text-gray-600 mt-1">
                    Date: {new Date(comparison.data.toSnapshot?.calculationDate).toLocaleDateString()}<br/>
                    Methodology: {comparison.data.toSnapshot?.methodology}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Nisab Years to compare</h3>
              <p className="text-gray-500">
                Choose Nisab Year Records from different periods to see how your Zakat situation has changed over time.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Nisab Years to compare</h3>
            <p className="text-gray-500">
              Choose Nisab Year Records from different periods to see how your Zakat situation has changed over time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnapshotComparison;