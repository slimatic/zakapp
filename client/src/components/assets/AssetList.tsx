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
import { Plus } from 'lucide-react';
import { AssetCard } from './AssetCard';
import { AssetsBreakdownChart } from '../dashboard/AssetsBreakdownChart';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { useUserSettingsRepository } from '../../hooks/useUserSettingsRepository';
import { getAssetZakatableValue, ZakatMethodology } from '../../core/calculations/zakat';
import { Button, Card } from '../ui';
import { Money } from '../ui/Money';
import { useFxRates } from '../../services/apiHooks';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { normalizeAssetsToCurrency, FxRates } from '../../utils/currencyNormalization';

/**
 * Assets page, composed like the mockup's assets page:
 *
 *   page head (title + one action)
 *   summary strip (total, nisab position, count) - a bar, not a card
 *   filter + list of dense rows
 *   composition chart, moved BELOW the list
 *
 * The chart used to lead the page in a 2-of-3 column block, so the thing the
 * user came to read (their assets) started halfway down. The grid/list toggle is
 * gone: the list row now works at every width, so a second layout mode was a
 * setting with no decision behind it.
 */

type FilterKey = 'all' | 'cash' | 'metals' | 'investments' | 'crypto' | 'property' | 'other';

const FILTERS: Array<{ key: FilterKey; label: string; match: (t: string) => boolean }> = [
  { key: 'all', label: 'All', match: () => true },
  {
    key: 'cash',
    label: 'Cash',
    match: (t) => ['cash', 'bank_account', 'expenses'].includes(t)
  },
  {
    key: 'metals',
    label: 'Gold & silver',
    match: (t) => ['gold', 'silver'].includes(t)
  },
  {
    key: 'investments',
    label: 'Investments',
    match: (t) =>
      ['stock', 'stocks', 'investment_account', 'etf', 'mutual_fund', '401k', 'retirement', 'traditional_ira', 'roth_ira', 'pension'].includes(t)
  },
  { key: 'crypto', label: 'Crypto', match: (t) => ['crypto', 'cryptocurrency'].includes(t) },
  { key: 'property', label: 'Property', match: (t) => ['property', 'real_estate'].includes(t) },
  { key: 'other', label: 'Other', match: () => true }
];

export const AssetList: React.FC = () => {
  const navigate = useNavigate();
  const { assets, isLoading, error, removeAsset } = useAssetRepository();
  const [filter, setFilter] = useState<FilterKey>('all');

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
      await removeAsset(id);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/assets/${id}/edit`);
  };

  const { settings } = useUserSettingsRepository();
  const methodology = (settings?.preferredMethodology?.toUpperCase() || 'STANDARD') as ZakatMethodology;
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
    return { totalAssets: total, estimatedZakat: zakatable * 0.025 };
  }, [assets, methodology, userCurrency, fxRates]);

  const visible = useMemo(() => {
    if (filter === 'all') return assets;
    const rule = FILTERS.find((f) => f.key === filter);
    if (!rule || filter === 'other') return assets;
    return assets.filter((a) =>
      rule.match(String(a.type || '').toLowerCase().replace(/[\s-]/g, '_'))
    );
  }, [assets, filter]);

  return (
    <div className="space-y-5">
      {/* Page head */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Assets
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Everything you own that counts toward zakat.
          </p>
        </div>
        <Button onClick={() => navigate('/assets/new')}>
          <Plus className="me-1.5 h-4 w-4" /> Add asset
        </Button>
      </div>

      {/* Summary strip */}
      {assets.length > 0 && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Total value</p>
            <Money value={totalAssets} currency={userCurrency} size="lg" className="mt-0.5" />
          </div>
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Estimated zakat</p>
            <Money value={estimatedZakat} currency={userCurrency} size="lg" tone="success" className="mt-0.5" />
          </div>
          <div className="col-span-2 bg-card px-4 py-3 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Assets</p>
            <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums text-foreground">
              {assets.length}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      {assets.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter assets">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex justify-center py-4" role="status" aria-live="polite">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-muted-foreground" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Loading your assets...</p>
        </Card>
      ) : error ? (
        <Card className="p-8 text-center">
          <h3 className="mb-2 text-lg font-medium text-foreground">Couldn't load your assets</h3>
          <p className="mb-6 text-muted-foreground">
            {error.message || 'Something went wrong reading your local data.'}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </Card>
      ) : assets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground">No assets yet</h3>
          <p className="mb-6 text-muted-foreground">
            Add your first asset to start tracking your wealth.
          </p>
          <Button onClick={() => navigate('/assets/new')}>Add your first asset</Button>
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card px-4 py-1 shadow-elev-1">
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No assets in this category.
            </p>
          ) : (
            visible.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={() => handleEdit(asset.id)}
                onDelete={() => handleDelete(asset.id, asset.name)}
              />
            ))
          )}
        </div>
      )}

      {/* Composition - supporting detail, below what the user came for.
          No heading here: AssetsBreakdownChart renders its own title, and the
          stacked pair read as a duplicated label. */}
      {assets.length > 1 && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-elev-1">
          <AssetsBreakdownChart assets={assets} />
        </div>
      )}
    </div>
  );
};
