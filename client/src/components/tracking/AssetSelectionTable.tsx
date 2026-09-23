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
  /** Currency for value display. Defaults to 'USD'. */
  currency?: string;
}

export const AssetSelectionTable: React.FC<AssetSelectionTableProps> = ({
  assets,
  onSelectionChange,
  initialSelection,
  currency = 'USD',
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

  // Format currency — driven by the currency prop (defaults to 'USD')
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
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
      <div className="text-center py-8 text-muted-foreground" role="status">
        <p>No assets found. Add assets to your portfolio first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">
          Select Assets for Record
        </h3>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-secondary hover:text-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
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
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${isSelected ? 'bg-accent border-border ring-1 ring-secondary/25' : 'bg-card border-border'}`}
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
                    className="h-5 w-5 text-secondary focus:ring-ring border-border-strong rounded"
                    aria-label={`Select ${asset.name}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-foreground truncate pe-2">{asset.name}</h4>
                    <span className="font-bold text-foreground whitespace-nowrap">{formatCurrency(asset.value)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground capitalize">{asset.type.replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="text-muted-foreground">Zakatable: {formatCurrency(displayZakatable)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {asset.zakatEligible ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-soft text-success">
                        Zakatable
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
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
        <div className="bg-muted p-4 rounded-lg border border-border mt-4 space-y-2">
          <h4 className="font-semibold text-foreground border-b border-border pb-2 mb-2">Selected Totals</h4>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Wealth</span>
            <span className="font-medium text-foreground">{formatCurrency(totals.totalWealth)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Zakatable Wealth</span>
            <span className="font-medium text-foreground">{formatCurrency(totals.zakatableWealth)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t border-border">
            <span className="text-foreground">Zakat Due (2.5%)</span>
            <span className="text-secondary">{formatCurrency(totals.zakatAmount)}</span>
          </div>
        </div>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full divide-y divide-border" role="table">
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-4 py-3 text-start">
                <span className="sr-only">Select</span>
              </th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-foreground/80 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-foreground/80 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-end text-xs font-medium text-foreground/80 uppercase tracking-wider">
                Value
              </th>
              <th scope="col" className="px-4 py-3 text-end text-xs font-medium text-foreground/80 uppercase tracking-wider">
                Zakatable
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-foreground/80 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-foreground/80 uppercase tracking-wider">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {assets.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              // Use core zakat calculator for accurate display
              const displayZakatable = getAssetZakatableValue(asset, 'STANDARD' as ZakatMethodology);

              return (
                <tr
                  key={asset.id}
                  className={`hover:bg-muted ${isSelected ? 'bg-accent' : ''}`}
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
                      className="h-4 w-4 text-secondary focus:ring-2 focus:ring-ring border-border-strong rounded cursor-pointer"
                      aria-label={`Select ${asset.name}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {asset.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                    {asset.type.replace(/_/g, ' ').toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-end font-medium">
                    {formatCurrency(asset.value)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-end font-medium">
                    {formatCurrency(displayZakatable)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {asset.zakatEligible ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-soft text-success">
                        <span className="sr-only">Zakatable: </span>Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
                        <span className="sr-only">Zakatable: </span>No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(asset.createdAt || asset.updatedAt || new Date().toISOString())}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted border-t-2 border-border-strong">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-foreground">
                Selected Assets Totals
              </td>
              <td colSpan={3} className="px-4 py-3">
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium text-foreground/80">Total Wealth:</dt>
                    <dd className="font-bold text-foreground">{formatCurrency(totals.totalWealth)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-foreground/80">Zakatable Wealth:</dt>
                    <dd className="font-bold text-foreground">{formatCurrency(totals.zakatableWealth)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border-strong pt-1 mt-1">
                    <dt className="font-bold text-foreground">Zakat Amount (2.5%):</dt>
                    <dd className="font-bold text-secondary">{formatCurrency(totals.zakatAmount)}</dd>
                  </div>
                </dl>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-sm text-muted-foreground" role="status" aria-live="polite" aria-label="Selection totals">
        {selectedIds.size} of {assets.length} assets selected
      </div>
    </div>
  );
};
export default AssetSelectionTable;
