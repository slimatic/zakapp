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

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List as ListIcon } from 'lucide-react';
import { AssetCard } from './AssetCard';
import { AssetsBreakdownChart } from '../dashboard/AssetsBreakdownChart';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { useUserSettingsRepository } from '../../hooks/useUserSettingsRepository';
import { getAssetZakatableValue, ZakatMethodology } from '../../core/calculations/zakat';
import { Button, Card } from '../ui';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { useFxRates } from '../../services/apiHooks';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { normalizeAssetsToCurrency, FxRates } from '../../utils/currencyNormalization';

export const AssetList: React.FC = () => {
  const navigate = useNavigate();
  const { assets, isLoading, error, removeAsset } = useAssetRepository();
  const { privacyMode } = usePrivacy();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await removeAsset(id);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/assets/${id}/edit`);
  };

  const { settings } = useUserSettingsRepository();
  const methodology = (settings?.preferredMethodology?.toUpperCase() || 'STANDARD') as ZakatMethodology;
  // Currency resolution (#341): consolidated into useDisplayCurrency, which
  // implements the #310 round 5 chain (local baseCurrency → auth settings →
  // profile prefs → USD).
  const { currency: userCurrency } = useDisplayCurrency();
  const fxRatesQuery = useFxRates();
  const fxRates = fxRatesQuery?.data?.data?.rates as FxRates | undefined;

  const { totalAssets, estimatedZakat } = useMemo(() => {
    // Issue #310 (round 4): normalize mixed currencies before summing.
    const normalized = normalizeAssetsToCurrency(assets, userCurrency, fxRates);
    const total = normalized.reduce((sum, asset) => sum + (asset.value || 0), 0);
    const zakatable = normalized.reduce((sum, asset) => {
      const zVal = getAssetZakatableValue(asset, methodology);
      return sum + zVal;
    }, 0);
    return {
      totalAssets: total,
      estimatedZakat: zakatable * 0.025
    };
  }, [assets, methodology, userCurrency, fxRates]);

  const formatCurrency = (value: number, currency?: string) => {
    if (privacyMode) return '****';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || userCurrency,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-card-foreground">My Assets</h1>
        <div className="flex items-center space-x-3">
          <div className="bg-card border-border rounded-lg p-1 flex shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-muted text-card-foreground' : 'text-muted-foreground hover:text-card-foreground'}`}
              aria-label="Grid View"
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-muted text-card-foreground' : 'text-muted-foreground hover:text-card-foreground'}`}
              aria-label="List View"
              title="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>
          <Button onClick={() => navigate('/assets/new')}>
            <Plus className="h-4 w-4 mr-2" /> Add Asset
          </Button>
        </div>
      </div>

      {/* Visualization Section - Only show if assets exist */}
      {assets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 bg-card rounded-lg border-border p-6 shadow-sm border">
            <div className="h-full">
              <AssetsBreakdownChart assets={assets} />
            </div>
          </div>

          <div className="bg-muted rounded-lg border-border p-6 border flex flex-col justify-center">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Total Assets</span>
                <span className="font-bold text-lg text-card-foreground">
                  {formatCurrency(totalAssets)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-card-foreground">{assets.length} items</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                <span className="text-muted-foreground font-medium">Estimated Zakat</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(estimatedZakat)}
                </span>
              </div>
              <div className="pt-4 mt-2">
                <div className="bg-green-100 text-green-800 text-xs px-3 py-2 rounded-md">
                  {privacyMode
                    ? "Privacy Mode Enabled: Values are hidden."
                    : "All values are legally owned by you and calculated locally."
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets List/Grid */}
      {isLoading ? (
        /* Loading state — prevents the "No assets yet" flash before RxDB resolves */
        <Card className="p-12 text-center">
          <div className="flex justify-center py-4" role="status" aria-live="polite">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-muted-foreground"></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Loading your assets…</p>
        </Card>
      ) : error ? (
        /* Error state — honest failure, with a retry path */
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-card-foreground mb-2">Couldn't load your assets</h3>
          <p className="text-muted-foreground mb-6">{error.message || 'Something went wrong reading your local data.'}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </Card>
      ) : assets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-muted-foreground/70" />
          </div>
          <h3 className="text-lg font-medium text-card-foreground mb-2">No assets yet</h3>
          <p className="text-muted-foreground mb-6">Add your first asset to start tracking your wealth.</p>
          <Button onClick={() => navigate('/assets/new')}>
            Add Your First Asset
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => navigate(`/assets/${asset.id}`)}
              onEdit={() => handleEdit(asset.id)}
              onDelete={() => handleDelete(asset.id, asset.name)}
            />
          ))}
        </div>
      ) : (
        <div className="animate-slide-up">
          {/* Mobile List View: Stacked Cards */}
          <div className="md:hidden space-y-3">
            {assets.map((asset) => {
              const isEligible = asset.zakatEligible !== false;
              const modifier = isEligible ? ((asset as any)?.calculationModifier || 1.0) : 0;
              const zakatableAmount = asset.value * modifier;

              return (
                <div
                  key={asset.id}
                  onClick={() => navigate(`/assets/${asset.id}`)}
                  className="bg-card p-4 rounded-lg border-border shadow-sm active:bg-accent transition-colors border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-card-foreground">{asset.name}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground uppercase tracking-wide">
                        {asset.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-card-foreground">{formatCurrency(asset.value, asset.currency)}</div>
                      <div className="text-xs text-muted-foreground">Zakatable: {formatCurrency(zakatableAmount, asset.currency)}</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(asset.id); }}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(asset.id, asset.name); }}
                      className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop List View: Table */}
          <div className="hidden md:block bg-card shadow-sm rounded-lg overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Value</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Zakatable</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {assets.map((asset) => {
                    const isEligible = asset.zakatEligible !== false;
                    const modifier = isEligible ? ((asset as any)?.calculationModifier || 1.0) : 0;
                    const zakatableAmount = asset.value * modifier;

                    return (
                      <tr
                        key={asset.id}
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        className="hover:bg-accent cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-card-foreground">{asset.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-card-foreground uppercase tracking-wide">
                            {asset.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-card-foreground">
                          {formatCurrency(asset.value, asset.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-muted-foreground">
                          {formatCurrency(zakatableAmount, asset.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(asset.id); }}
                            className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(asset.id, asset.name); }}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
