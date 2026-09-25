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

import React from 'react';
import toast from 'react-hot-toast';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { Asset } from '../../types';
import { Button, LoadingSpinner, ErrorMessage } from '../ui';
import { EncryptedBadge } from '../ui/EncryptedBadge';
import { isAssetZakatable, getAssetZakatableValue } from '../../core/calculations/zakat';
import { AssetAmountHistory } from '../AssetAmountHistory';
import { formatCurrency } from '../../utils/formatters';

/**
 * AssetDetails component for displaying comprehensive asset information
 */
export const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // We need to fetch specific asset. useAssetRepository fetches all.
  // In a real app we'd add findById to the repository.
  // For now, let's filter from the list or add findById to repository.
  const { assets, isLoading, error: repoError } = useAssetRepository();

  // Find specific asset
  const asset = assets.find(a => a.id === id) || null;
  const error = repoError;

  // Mock delete for now or implement in repo
  // We need to add removeAsset to repository
  const { removeAsset } = useAssetRepository();
  const [isDeleting, setIsDeleting] = React.useState(false);




  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Invalid Date';
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cash: '💰',
      gold: '🥇',
      silver: '🥈',
      business: '🏢',
      property: '🏠',
      stocks: '📈',
      crypto: '₿',
      debts: '📝',
      expenses: '💳'
    };
    return icons[category] || '📊';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash & Savings',
      gold: 'Gold',
      silver: 'Silver',
      business: 'Business Assets',
      property: 'Property',
      stocks: 'Stocks & Investments',
      crypto: 'Cryptocurrency',
      debts: 'Debts Owed to You',
      expenses: 'Expenses'
    };
    return labels[category] || category;
  };

  const getSubCategoryLabel = (subCategory: string) => {
    return subCategory
      ? subCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorMessage
          error={error}
          onRetry={() => window.location.reload()}
          className="mb-6"
        />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-warn-soft border border-warn/30 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Asset Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The asset you're looking for doesn't exist or may have been deleted.
          </p>
          <Link to="/assets">
            <Button variant="default">
              Back to Assets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // TypeScript type narrowing assertion
  const safeAsset: Asset = asset;

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${safeAsset.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await removeAsset(safeAsset.id);
        navigate('/assets');
      } catch (e) {
        toast.error('Failed to delete asset. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  // Normalize numeric value for reliable calculations
  const numericValue = typeof safeAsset.value === 'string' ? parseFloat(safeAsset.value as any) : (safeAsset.value || 0);

  // Use core zakat calculation for accurate zakatable value
  const zakatableValue = getAssetZakatableValue(safeAsset, 'STANDARD');
  const effectiveModifier = numericValue > 0 ? zakatableValue / numericValue : 1.0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">
            {getCategoryIcon(safeAsset.type)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{safeAsset.name}</h1>
            <p className="text-lg text-muted-foreground">
              {getCategoryLabel(safeAsset.type)}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link to={`/assets/${safeAsset.id}/edit`}>
            <Button variant="secondary">
              Edit Asset
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
          >
            Delete Asset
          </Button>
        </div>
      </div>

      {/* Asset Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Value */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-foreground">Current Value</h3>
            <EncryptedBadge className="scale-90 origin-top-right" />
          </div>
          <p className="text-3xl font-bold text-success">
            {formatCurrency(numericValue, safeAsset.currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{safeAsset.currency}</p>
        </div>

        {/* Zakat Status */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Zakat Status</h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isAssetZakatable(safeAsset, 'STANDARD')
            ? 'bg-success-soft text-success'
            : 'bg-muted text-foreground'
            }`}>
            {isAssetZakatable(safeAsset, 'STANDARD') ? '✓ Zakat Eligible' : '✗ Not Eligible'}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isAssetZakatable(safeAsset, 'STANDARD')
              ? 'This asset will be included in Zakat calculations'
              : 'This asset will be excluded from Zakat calculations'
            }
          </p>
        </div>

        {/* Asset Age */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Asset Age</h3>
          {/*
            Measured from acquisitionDate, not createdAt. "Asset Age" means how long
            the asset has been held, which is what matters for hawl - createdAt is
            only when the row was typed in, and reading the label off createdAt made
            a five-year-old holding look brand new. Imported assets already carry the
            right acquisitionDate; this is the half that was displaying it as age 0.
          */}
          <p className="text-2xl font-bold text-secondary">
            {Math.max(0, Math.floor(
              (new Date().getTime() - new Date(safeAsset.acquisitionDate || safeAsset.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
            ))} days
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Acquired {formatDate(safeAsset.acquisitionDate || safeAsset.createdAt)}
          </p>
        </div>
      </div>

      {/* Asset Information */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Asset Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Basic Details
            </h4>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-foreground">Name</dt>
                <dd className="text-sm text-foreground">{safeAsset.name}</dd>
              </div>
              <div className="flex-1">
                <dt className="text-sm font-medium text-foreground">Category</dt>
                <dd className="text-sm text-foreground">{getCategoryLabel(safeAsset.type)}</dd>
              </div>
              {safeAsset.subCategory && (
                <div>
                  <dt className="text-sm font-medium text-foreground">Sub-Category</dt>
                  <dd className="text-sm text-foreground">{getSubCategoryLabel(safeAsset.subCategory)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-foreground">Value</dt>
                <dd className="text-sm text-foreground">
                  {formatCurrency(safeAsset.value, safeAsset.currency)}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Timestamps
            </h4>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-foreground">Acquired</dt>
                <dd className="text-sm text-foreground">
                  {formatDate(safeAsset.acquisitionDate || safeAsset.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-foreground">Created</dt>
                <dd className="text-sm text-foreground">{formatDate(safeAsset.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-foreground">Last Updated</dt>
                <dd className="text-sm text-foreground">{formatDate(safeAsset.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-foreground">Asset ID</dt>
                <dd className="text-sm text-foreground font-mono">{safeAsset.id}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Description */}
        {safeAsset.description && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Description
            </h4>
            <p className="text-sm text-foreground leading-6">{safeAsset.description}</p>
          </div>
        )}
      </div>

      {/* Zakat Calculation Info */}
      <div className={`rounded-lg border p-6 mb-6 ${isAssetZakatable(safeAsset, 'STANDARD')
        ? 'bg-success-soft border-success/30'
        : 'bg-surface-2 border-border'
        }`}>
        <h3 className={`text-xl font-semibold mb-4 ${isAssetZakatable(safeAsset, 'STANDARD') ? 'text-success' : 'text-foreground'}`}>
          Zakat Calculation Information
        </h3>
        <div className="space-y-3">
          <p className={`text-sm ${isAssetZakatable(safeAsset, 'STANDARD') ? 'text-success' : 'text-foreground'}`}>
            <span className="font-medium">Original Value:</span> {formatCurrency(numericValue, safeAsset.currency)}
          </p>

          {isAssetZakatable(safeAsset, 'STANDARD') ? (
            <>
              {effectiveModifier !== 1.0 && (
                <>
                  <p className="text-sm text-success">
                    <span className="font-medium">Zakatable Value (after modifier {Math.round(effectiveModifier * 100)}%):</span> {formatCurrency(zakatableValue, safeAsset.currency)}
                  </p>
                  {/* Explanation moved here from the list row: a list of assets
                      repeated this sentence on every card, which was noise. On
                      the detail page (one asset, room to read) it belongs. */}
                  <p className="text-sm text-muted-foreground">
                    {effectiveModifier === 0.3 &&
                      'Passive investments contribute 30% of value to Zakat.'}
                    {effectiveModifier === 0 &&
                      'Zakat-deferred assets are exempt until withdrawal.'}
                    {effectiveModifier !== 0.3 &&
                      effectiveModifier !== 0 &&
                      `This asset contributes ${Math.round(effectiveModifier * 100)}% of its value to Zakat.`}
                  </p>
                </>
              )}
              {effectiveModifier === 1.0 && (
                <p className="text-sm text-success">
                  <span className="font-medium">Zakatable Value:</span> {formatCurrency(zakatableValue, safeAsset.currency)}
                </p>
              )}
              <p className="text-sm text-success">
                <span className="font-medium">Estimated Zakat (2.5%):</span> {formatCurrency(zakatableValue * 0.025, safeAsset.currency)}
              </p>
            </>
          ) : (
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">🚫 Asset Excluded from Calculations</p>
              <p>
                Calculated Zakat: {formatCurrency(0, safeAsset.currency)}
              </p>
              {safeAsset.subCategory === 'jewelry' && (
                <p className="mt-2 text-xs text-muted-foreground italic">
                  Note: Jewelry for personal use is exempt under certain schools of thought (e.g., Hanbali, Shafi'i, Maliki).
                </p>
              )}
            </div>
          )}

          <p className={`text-xs mt-3 ${isAssetZakatable(safeAsset, 'STANDARD') ? 'text-success' : 'text-muted-foreground'}`}>
            * This is an estimate. Actual Zakat calculation depends on your total wealth,
            nisab threshold, and chosen calculation methodology.
          </p>
      </div>
      </div>

      {/* Asset Amount History */}
      <div className="mt-8">
        <AssetAmountHistory assetId={safeAsset.id} />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Link to="/assets">
          <Button variant="secondary">
            ← Back to Assets
          </Button>
        </Link>

        <div className="flex space-x-3">
          {/* Calculate Zakat currently has no route; hide until feature is available */}
        </div>
      </div>
    </div>
  );
};