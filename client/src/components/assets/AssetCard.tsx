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
import { Asset } from '../../types';
import { getModifierBadge, getModifierLabel } from '../../utils/assetModifiers';
import { getAssetZakatableValue } from '../../core/calculations/zakat';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * AssetCard: Displays asset summary with privacy support
 */
export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onEdit, onDelete }) => {
  const { privacyMode } = usePrivacy();
  const isEligible = asset.zakatEligible !== false; // Default to true

  // Use core zakat calculation for accurate zakatable value
  const zakatableAmount = getAssetZakatableValue(asset, 'STANDARD');
  const effectiveModifier = asset.value > 0 ? zakatableAmount / asset.value : (isEligible ? 1.0 : 0);

  const modifierBadge = isEligible ? getModifierBadge(effectiveModifier) : { icon: '🚫', text: 'Exempt', color: 'bg-muted text-muted-foreground' };
  const zakatOwed = zakatableAmount * 0.025; // Estimate at 2.5%

  const getCategoryIcon = (type: string): string => {
    const icons: Record<string, string> = {
      cash: '💰',
      bank_account: '💰',
      gold: '🥇',
      silver: '🥈',
      stock: '📈',
      investment_account: '📈',
      etf: '📊',
      'mutual fund': '📑',
      '401k': '🏦',
      retirement: '🏦',
      'traditional ira': '🏦',
      'roth ira': '🏦',
      pension: '🏦',
      business: '🏢',
      business_assets: '🏢',
      property: '🏠',
      real_estate: '🏠',
      crypto: '₿',
      cryptocurrency: '₿',
      debts: '📝',
      debts_owed_to_you: '📝',
      expenses: '💳',
      other: '📦'
    };
    return icons[type?.toLowerCase()] || '📊';
  };

  const formatCurrency = (value: number): string => {
    if (privacyMode) return '****';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: asset.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div
      className="bg-card border-border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
      onClick={onClick}
      role="article"
      aria-label={`Asset: ${asset.name}`}
    >
      {/* Header: Icon, Name, and Modifier Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl" aria-hidden="true">
            {getCategoryIcon(asset.type)}
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground text-sm md:text-base">
              {asset.name}
            </h3>
            <p className="text-xs text-muted-foreground capitalize">
              {asset.subCategory ? (
                <span>
                  {asset.subCategory.replace(/_/g, ' ')} • {asset.type.replace(/_/g, ' ').toLowerCase()}
                </span>
              ) : (
                asset.type.replace(/_/g, ' ').toLowerCase()
              )}
            </p>
          </div>
        </div>

        {/* Modifier Badge */}
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${!isEligible ? 'bg-muted text-muted-foreground' : modifierBadge.color
            } whitespace-nowrap ml-2`}
          title={getModifierLabel(effectiveModifier)}
        >
          <span aria-hidden="true">{!isEligible ? '🚫' : modifierBadge.icon}</span>{' '}
          {!isEligible
            ? (asset.subCategory === 'jewelry' ? 'Exempt (Jewelry)' : 'Exempt')
            : modifierBadge.text}
        </div>
      </div>

      {/* Value Section */}
      <div className="space-y-2 mb-4 border-t border-border pt-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Asset Value:</span>
          <span className="font-semibold text-card-foreground">{formatCurrency(asset.value)}</span>
        </div>

        {/* Zakatable Amount (only show if modifier applies) */}
        {effectiveModifier !== 1.0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Zakatable:</span>
            <span className="font-medium text-blue-600">{formatCurrency(zakatableAmount)}</span>
          </div>
        )}

        {/* Estimated Zakat */}
        <div className="flex justify-between items-center text-sm border-t border-border pt-2 mt-2">
          <span className="font-medium text-card-foreground">Estimated Zakat:</span>
          <span className="font-bold text-green-600">{formatCurrency(zakatOwed)}</span>
        </div>
      </div>

      {/* Modifier Info (if applicable) */}
      {effectiveModifier !== 1.0 && (
        <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-2 mb-3">
          <p className="font-medium mb-1">
            {effectiveModifier === 0.3 ? '📊 30% Rule Applied' : effectiveModifier === 0.0 ? '⏸️ Deferred' : `◐ ${(effectiveModifier * 100).toFixed(1)}% Applied`}
          </p>
          <p>
            {effectiveModifier === 0.3 && 'Passive investments contribute 30% of value to Zakat.'}
            {effectiveModifier === 0.0 && 'Zakat-Deferred assets are exempt until withdrawal.'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted hover:bg-accent rounded transition-colors"
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
