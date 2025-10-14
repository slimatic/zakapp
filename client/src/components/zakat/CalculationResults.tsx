import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ZakatCalculationResult } from '../../../shared/src/types';

/**
 * Props for the CalculationResults component
 */
interface CalculationResultsProps {
  /** The Zakat calculation result to display */
  calculation: ZakatCalculationResult;
  /** Callback when user wants to record a payment */
  onRecordPayment?: () => void;
  /** Callback when user wants to save as snapshot */
  onSaveSnapshot?: () => void;
  /** Whether the component is in loading state */
  isLoading?: boolean;
}

/**
 * CalculationResults Component - T022
 *
 * Displays detailed Zakat calculation results with prominent Zakat amount,
 * methodology information, nisab threshold, asset breakdown table,
 * and action buttons for recording payments and saving snapshots.
 */
const CalculationResults: React.FC<CalculationResultsProps> = ({
  calculation,
  onRecordPayment,
  onSaveSnapshot,
  isLoading = false
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryTooltip = (category: string): string => {
    const tooltips: Record<string, string> = {
      cash: 'Cash and cash equivalents including savings, checking accounts, and certificates of deposit',
      gold: 'Gold jewelry, coins, bars, and other gold assets',
      silver: 'Silver jewelry, coins, bars, and utensils',
      crypto: 'Cryptocurrency holdings and digital assets',
      business: 'Business inventory and assets (varies by methodology)',
      investment: 'Stocks, bonds, mutual funds, and other investment accounts',
      real_estate: 'Real estate holdings (generally not zakatable unless held for trade)',
      debts: 'Outstanding debts owed to you (may be deductible)'
    };
    return tooltips[category] || 'Asset category for Zakat calculation';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const zakatYear = calculation.zakatYear || currentYear;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with prominent Zakat amount */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Your Zakat for {zakatYear}
            </h1>
            <div className="text-4xl font-bold mt-2">
              {formatCurrency(calculation.totalZakat)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-100 text-sm">Calculation ID</div>
            <div className="font-mono text-xs">{calculation.calculationId?.slice(-8) || 'N/A'}</div>
            <div className="text-blue-100 text-sm mt-1">Date</div>
            <div className="text-sm">{new Date(calculation.calculationDate).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Methodology and Nisab Information */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Methodology Used
            </h3>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {calculation.methodology?.name || 'Standard'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {calculation.methodology?.description || 'AAOIFI compliant Zakat calculation'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Nisab Threshold Applied
            </h3>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {formatCurrency(calculation.nisabThreshold || 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Based on {calculation.nisabBasis || 'gold'} value
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRecordPayment}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Record Payment
          </button>
          <button
            onClick={onSaveSnapshot}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save as Snapshot
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Asset Breakdown Table */}
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zakatable
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zakat Owed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calculation.assetBreakdown?.map((asset, index) => {
                const categoryId = `category-${index}`;
                const isExpanded = expandedRows.has(categoryId);

                return (
                  <React.Fragment key={categoryId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {asset.category?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {asset.category}
                            </div>
                            <div className="text-xs text-gray-500" title={getCategoryTooltip(asset.category || '')}>
                              {getCategoryTooltip(asset.category || '').slice(0, 40)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(asset.totalValue || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(asset.zakatableAmount || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(asset.zakatAmount || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.assets && asset.assets.length > 0 && (
                          <button
                            onClick={() => toggleRowExpansion(categoryId)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {isExpanded ? 'Collapse' : 'Expand'} ({asset.assets.length})
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && asset.assets && (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 bg-gray-50">
                          <div className="space-y-2">
                            {asset.assets.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{item.name}</span>
                                <span className="font-medium">{formatCurrency(item.value || 0)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900" colSpan={3}>
                  Total Zakat Due
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  {formatCurrency(calculation.totalZakat)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Deductible Debts Section */}
      {calculation.deductibleDebts && calculation.deductibleDebts > 0 && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Deductible Debts Applied
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  ${calculation.deductibleDebts.toLocaleString()} in debts were deducted from your zakatable assets.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculationResults;