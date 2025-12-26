/**
 * AssetBreakdownView Component (T102)
 * 
 * Read-only display of historical asset snapshot for FINALIZED/UNLOCKED records
 * Shows the assets as they were when the record was captured
 * 
 * Features:
 * - Read-only table of historical assets
 * - Timestamp of snapshot capture
 * - Totals (Total Wealth, Zakatable Wealth)
 * - Visual indicator for historical data
 * - Link to current assets page
 */

import React from 'react';
import { Link } from 'react-router-dom';

export interface AssetBreakdownData {
  assets: Array<{
    id: string;
    name: string;
    category: string;
    value: number;
    zakatEligible: boolean;
    addedAt: string;
  }>;
  capturedAt: string;
  totalWealth: number;
  zakatableWealth: number;
}

export interface AssetBreakdownViewProps {
  assetBreakdown: AssetBreakdownData;
  recordStatus?: 'FINALIZED' | 'UNLOCKED';
}

export const AssetBreakdownView: React.FC<AssetBreakdownViewProps> = ({
  assetBreakdown,
  recordStatus = 'FINALIZED',
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!assetBreakdown || !assetBreakdown.assets || assetBreakdown.assets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No asset snapshot available for this record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with timestamp */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-amber-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-amber-800">
              Historical Snapshot
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>
                Snapshot taken on{' '}
                <span className="font-semibold">
                  {formatTimestamp(assetBreakdown.capturedAt)}
                </span>
              </p>
              <p className="mt-1">
                These are not current values. View{' '}
                <Link
                  to="/assets"
                  className="font-medium underline hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
                >
                  current assets →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Value
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Zakatable
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assetBreakdown.assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {asset.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                  {asset.category}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                  {formatCurrency(asset.value)}
                </td>
                <td className="px-4 py-3 text-center">
                  {asset.zakatEligible ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="sr-only">Zakatable: </span>Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <span className="sr-only">Zakatable: </span>No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(asset.addedAt)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">
                Snapshot Totals
              </td>
              <td colSpan={3} className="px-4 py-3">
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700">Total Wealth:</dt>
                    <dd className="font-bold text-gray-900">
                      {formatCurrency(assetBreakdown.totalWealth)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700">Zakatable Wealth:</dt>
                    <dd className="font-bold text-gray-900">
                      {formatCurrency(assetBreakdown.zakatableWealth)}
                    </dd>
                  </div>
                </dl>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Status indicator */}
      <div className="text-sm text-gray-600 flex items-center space-x-2">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${recordStatus === 'FINALIZED'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
            }`}
        >
          {recordStatus}
        </span>
        <span>
          {assetBreakdown.assets.length} asset{assetBreakdown.assets.length !== 1 ? 's' : ''} in snapshot
        </span>
      </div>
    </div>
  );
};

export default AssetBreakdownView;
