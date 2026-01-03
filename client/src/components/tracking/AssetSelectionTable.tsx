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
import { Asset } from '../../types';
import { getAssetZakatableValue, ZakatMethodology } from '../../core/calculations/zakat';

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
    if (initialSelection) {
      return new Set(initialSelection);
    }
    // Auto-select all zakatable assets by default
    return new Set(assets.filter(a => a.zakatEligible).map(a => a.id));
  });

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange(Array.from(selectedIds));
  }, [selectedIds, onSelectionChange]);

  // Calculate totals from selected assets
  const totals = useMemo(() => {
    const selectedAssets = assets.filter(a => selectedIds.has(a.id));
    const totalWealth = selectedAssets.reduce((sum, a) => sum + a.value, 0);
    const zakatableWealth = selectedAssets.reduce((sum, a) => {
      // Use core zakat calculation for accurate zakatable value
      return sum + getAssetZakatableValue(a, 'STANDARD' as ZakatMethodology);
    }, 0);
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

      {/* Mobile View: Stacked List */}
      <div className="md:hidden space-y-3">
        {assets.map((asset) => {
          const isSelected = selectedIds.has(asset.id);
          // Use core zakat calculator for accurate display
          const displayZakatable = getAssetZakatableValue(asset, 'STANDARD' as ZakatMethodology);

          return (
            <div
              key={asset.id}
              onClick={() => handleToggle(asset.id)}
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-200'}`}
              role="button"
              aria-pressed={isSelected}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(asset.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label={`Select ${asset.name}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-gray-900 truncate pr-2">{asset.name}</h4>
                    <span className="font-bold text-gray-900 whitespace-nowrap">{formatCurrency(asset.value)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 capitalize">{asset.type.replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="text-gray-600">Zakatable: {formatCurrency(displayZakatable)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {asset.zakatEligible ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Zakatable
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Exempt
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {/* Mobile Totals Footer */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4 space-y-2">
          <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-2">Selected Totals</h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Wealth</span>
            <span className="font-medium text-gray-900">{formatCurrency(totals.totalWealth)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Zakatable Wealth</span>
            <span className="font-medium text-gray-900">{formatCurrency(totals.zakatableWealth)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
            <span className="text-gray-900">Zakat Due (2.5%)</span>
            <span className="text-blue-600">{formatCurrency(totals.zakatAmount)}</span>
          </div>
        </div>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
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
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Value
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Zakatable
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              // Use core zakat calculator for accurate display
              const displayZakatable = getAssetZakatableValue(asset, 'STANDARD' as ZakatMethodology);

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
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      aria-label={`Select ${asset.name}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {asset.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {asset.type.replace(/_/g, ' ').toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(asset.value)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(displayZakatable)}
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
                    {formatDate(asset.createdAt || asset.updatedAt || new Date().toISOString())}
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

      <div className="text-sm text-gray-600" role="status" aria-live="polite" aria-label="Selection totals">
        {selectedIds.size} of {assets.length} assets selected
      </div>
    </div>
  );
};
export default AssetSelectionTable;
