/**
 * AssetSelectionTable Component (T099)
 * 
 * Asset selection table for manual Nisab Year Record creation
 * Features:
 * - Checkbox selection for each asset
 * - Pre-selects all zakatable assets by default
 * - Shows totals: Total Wealth, Zakatable Wealth, Zakat Amount (2.5%)
 * - Accessible (WCAG 2.1 AA): keyboard nav, ARIA labels, screen reader support
 */

import React, { useState, useEffect, useMemo } from 'react';

export interface Asset {
  id: string;
  name: string;
  category: string;
  value: number;
  isZakatable: boolean;
  addedAt: string;
}

export interface AssetSelectionTableProps {
  assets: Asset[];
  onSelectionChange: (selectedIds: string[]) => void;
  initialSelection?: string[];
}

export const AssetSelectionTable: React.FC<AssetSelectionTableProps> = ({
  assets,
  onSelectionChange,
  initialSelection,
}) => {
  // Initialize selection: use initialSelection or auto-select zakatable assets
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (initialSelection && initialSelection.length > 0) {
      return new Set(initialSelection);
    }
    // Auto-select all zakatable assets by default
    return new Set(assets.filter(a => a.isZakatable).map(a => a.id));
  });

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange(Array.from(selectedIds));
  }, [selectedIds, onSelectionChange]);

  // Calculate totals from selected assets
  const totals = useMemo(() => {
    const selectedAssets = assets.filter(a => selectedIds.has(a.id));
    const totalWealth = selectedAssets.reduce((sum, a) => sum + a.value, 0);
    const zakatableWealth = selectedAssets
      .filter(a => a.isZakatable)
      .reduce((sum, a) => sum + a.value, 0);
    const zakatAmount = zakatableWealth * 0.025; // 2.5%

    return { totalWealth, zakatableWealth, zakatAmount };
  }, [assets, selectedIds]);

  // Handle checkbox toggle
  const handleToggle = (assetId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  // Handle select all / deselect all
  const handleSelectAll = () => {
    if (selectedIds.size === assets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map(a => a.id)));
    }
  };

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

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500" role="status">
        <p>No assets found. Add assets to your portfolio first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Select Assets for Record
        </h3>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
          aria-label={selectedIds.size === assets.length ? 'Deselect all assets' : 'Select all assets'}
        >
          {selectedIds.size === assets.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="sr-only">Select</span>
              </th>
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
            {assets.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              return (
                <tr
                  key={asset.id}
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => handleToggle(asset.id)}
                  role="row"
                  aria-selected={isSelected}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(asset.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      aria-label={`Select ${asset.name}`}
                    />
                  </td>
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
                    {asset.isZakatable ? (
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
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900">
                Selected Assets Totals
              </td>
              <td colSpan={3} className="px-4 py-3">
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700">Total Wealth:</dt>
                    <dd className="font-bold text-gray-900">{formatCurrency(totals.totalWealth)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700">Zakatable Wealth:</dt>
                    <dd className="font-bold text-gray-900">{formatCurrency(totals.zakatableWealth)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                    <dt className="font-bold text-gray-900">Zakat Amount (2.5%):</dt>
                    <dd className="font-bold text-blue-600">{formatCurrency(totals.zakatAmount)}</dd>
                  </div>
                </dl>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-sm text-gray-600" role="status" aria-live="polite">
        {selectedIds.size} of {assets.length} assets selected
      </div>
    </div>
  );
};

export default AssetSelectionTable;
