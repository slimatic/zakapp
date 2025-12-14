/**
 * AssetCard component for displaying asset information in list/grid views
 * Includes modifier badge and zakatable amount calculations
 */

import React from 'react';
import { Asset } from '@zakapp/shared';
import { getModifierBadge, getModifierLabel, calculateZakat } from '../../utils/assetModifiers';

interface AssetCardProps {
  asset: Asset & { zakatableAmount?: number; zakatOwed?: number; modifierApplied?: string };
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * AssetCard: Displays asset summary with modifier badge and zakat info
 */
export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onEdit, onDelete }) => {
  const modifier = (asset as any)?.calculationModifier || 1.0;
  const modifierBadge = getModifierBadge(modifier);
  const zakatableAmount = asset.zakatableAmount || (asset.value * modifier);
  const zakatOwed = asset.zakatOwed || calculateZakat(asset.value, modifier);

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      cash: '💰',
      gold: '🥇',
      silver: '🥈',
      stock: '📈',
      etf: '📊',
      'mutual fund': '📑',
      '401k': '🏦',
      'traditional ira': '🏦',
      'roth ira': '🏦',
      pension: '🏦',
      business: '🏢',
      property: '🏠',
      crypto: '₿',
      debts: '📝',
      expenses: '💳'
    };
    return icons[category?.toLowerCase()] || '📊';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: asset.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
      onClick={onClick}
      role="article"
      aria-label={`Asset: ${asset.name}`}
    >
      {/* Header: Icon, Name, and Modifier Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl" aria-hidden="true">
            {getCategoryIcon(asset.category)}
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">
              {asset.name}
            </h3>
            <p className="text-xs text-gray-500 capitalize">
              {asset.category}
            </p>
          </div>
        </div>

        {/* Modifier Badge */}
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${modifierBadge.color} whitespace-nowrap ml-2`}
          title={getModifierLabel(modifier)}
        >
          <span aria-hidden="true">{modifierBadge.icon}</span> {modifierBadge.text}
        </div>
      </div>

      {/* Value Section */}
      <div className="space-y-2 mb-4 border-t border-gray-100 pt-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Asset Value:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(asset.value)}</span>
        </div>

        {/* Zakatable Amount (only show if modifier applies) */}
        {modifier !== 1.0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Zakatable:</span>
            <span className="font-medium text-blue-600">{formatCurrency(zakatableAmount)}</span>
          </div>
        )}

        {/* Zakat Owed */}
        <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
          <span className="font-medium text-gray-900">Zakat Owed:</span>
          <span className="font-bold text-green-600">{formatCurrency(zakatOwed)}</span>
        </div>
      </div>

      {/* Modifier Info (if applicable) */}
      {modifier !== 1.0 && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-2 mb-3">
          <p className="font-medium mb-1">
            {modifier === 0.3 ? '📊 30% Rule Applied' : modifier === 0.0 ? '⏸️ Deferred' : `◐ ${(modifier * 100).toFixed(1)}% Applied`}
          </p>
          <p>
            {modifier === 0.3 && 'Passive investments contribute 30% of value to Zakat.'}
            {modifier === 0.0 && 'Restricted accounts are deferred from Zakat calculation.'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            aria-label={`Edit ${asset.name}`}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
            aria-label={`Delete ${asset.name}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default AssetCard;
