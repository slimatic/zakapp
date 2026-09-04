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
 * RecordRulingsPanel Component
 *
 * Shows WHY each asset in a Nisab Year Record is zakatable or exempt
 * under the user's chosen madhab, with scholarly citations.
 * Backed by the same registry the calc engine uses (data/rulings.ts),
 * so explanations can never contradict the calculation.
 */

import React from 'react';
import { Scale } from 'lucide-react';
import { AssetRulingExplanation } from '../zakat/AssetRulingExplanation';
import { getAssetRuling } from '../../data/rulings';
import { AssetType } from '../../types/index';

export interface RecordRulingsPanelProps {
  /** Assets attached to the record (live assets or snapshot rows) */
  assets: Array<{
    id: string;
    name: string;
    /** Server category (cash, gold, silver, business, property, stocks, crypto, debts, expenses) */
    category?: string;
    /** Client AssetType (CASH, GOLD, ...) when available */
    type?: string;
    zakatEligible?: boolean | null;
  }>;
  /** User's preferred methodology (STANDARD, HANAFI, SHAFII, MALIKI, HANBALI — any case) */
  methodologyName: string;
  className?: string;
}

/**
 * Map server asset categories (lowercase strings) to the AssetType enum
 * the rulings registry is keyed by. Mirrors AssetForm's type→category map
 * in reverse. Unknown categories fall back to OTHER, which the registry
 * covers with an explicit ruling.
 */
export const categoryToAssetType = (category?: string): AssetType => {
  const map: Record<string, AssetType> = {
    cash: AssetType.CASH,
    bank: AssetType.BANK_ACCOUNT,
    bank_account: AssetType.BANK_ACCOUNT,
    gold: AssetType.GOLD,
    silver: AssetType.SILVER,
    crypto: AssetType.CRYPTOCURRENCY,
    cryptocurrency: AssetType.CRYPTOCURRENCY,
    stocks: AssetType.INVESTMENT_ACCOUNT,
    investment: AssetType.INVESTMENT_ACCOUNT,
    investment_account: AssetType.INVESTMENT_ACCOUNT,
    retirement: AssetType.RETIREMENT,
    '401k': AssetType.RETIREMENT,
    property: AssetType.REAL_ESTATE,
    real_estate: AssetType.REAL_ESTATE,
    business: AssetType.BUSINESS_ASSETS,
    business_assets: AssetType.BUSINESS_ASSETS,
    debts: AssetType.DEBTS_OWED_TO_YOU,
    loan: AssetType.DEBTS_OWED_TO_YOU,
    debts_owed_to_you: AssetType.DEBTS_OWED_TO_YOU,
  };
  const key = (category || '').toLowerCase().trim();
  return map[key] || AssetType.OTHER;
};

export const RecordRulingsPanel: React.FC<RecordRulingsPanelProps> = ({
  assets,
  methodologyName,
  className = '',
}) => {
  if (!assets || assets.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`} data-testid="record-rulings-panel">
      <div className="flex items-center gap-2 mb-3">
        <Scale className="h-4 w-4 text-gray-500" aria-hidden="true" />
        <h3 className="font-semibold text-gray-900 text-sm">Why each asset counts the way it does</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Rulings under your selected methodology, with sources. Expand any asset for details.
      </p>
      <div className="space-y-2">
        {assets.map(asset => {
          const assetType = (asset.type as AssetType) || categoryToAssetType(asset.category);
          const ruling = getAssetRuling(
            { type: assetType, zakatEligible: asset.zakatEligible, name: asset.name },
            methodologyName
          );
          return (
            <AssetRulingExplanation key={asset.id} ruling={ruling} assetName={asset.name} />
          );
        })}
      </div>
      <p className="text-xs text-gray-400 italic mt-3">
        Educational guidance only — for specific situations, consult a qualified scholar.
      </p>
    </div>
  );
};

export default RecordRulingsPanel;