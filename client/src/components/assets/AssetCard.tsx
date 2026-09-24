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
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  Coins,
  TrendingUp,
  Bitcoin,
  Building2,
  Package,
  PiggyBank,
  CircleDollarSign,
  CreditCard,
  Wallet,
  MoreVertical,
  type LucideIcon
} from 'lucide-react';
import { Asset } from '../../types';
import { getModifierLabel } from '../../utils/assetModifiers';
import { getAssetZakatableValue, isAssetZakatable } from '../../core/calculations/zakat';
import { Money } from '../ui/Money';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * AssetCard - one asset as a dense list row.
 *
 * This used to be a tall card that printed the value three times (asset value,
 * zakatable, estimated zakat - so three "$0.00" rows for an exempt asset) and
 * stamped a red-tinted explanation box on every single card. A screen of those
 * was unreadable. This is the mockup's list row instead: icon chip, name, one
 * muted sub-line carrying the zakat treatment, right-aligned money, and a single
 * actions menu rather than two full-width buttons per row.
 *
 * Money rendering and privacy masking both go through <Money>, which resolves
 * the display currency and applies the mask - so the local `****` guard is gone.
 */

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cash: Landmark,
  bank_account: Landmark,
  gold: Coins,
  silver: Coins,
  stock: TrendingUp,
  stocks: TrendingUp,
  investment_account: TrendingUp,
  etf: TrendingUp,
  'mutual fund': TrendingUp,
  '401k': PiggyBank,
  retirement: PiggyBank,
  'traditional ira': PiggyBank,
  'roth ira': PiggyBank,
  pension: PiggyBank,
  business: Building2,
  business_assets: Building2,
  property: Building2,
  real_estate: Building2,
  crypto: Bitcoin,
  cryptocurrency: Bitcoin,
  debts: CircleDollarSign,
  debts_owed_to_you: CircleDollarSign,
  expenses: CreditCard,
  liability: CreditCard,
  other: Package
};

/**
 * Human treatment label. Returns null for the plain, fully-zakatable case.
 *
 * `zakatable` comes from isAssetZakatable() rather than being re-derived here.
 * An asset can have zakatEligible undefined AND a type the methodology does not
 * recognise, which makes it non-zakatable while still looking "eligible" - that
 * combination used to render as "Deferred until withdrawn", which is a
 * different (and false) claim. The engine decides; the label just reports it.
 */
function treatmentLabel(
  zakatable: boolean,
  modifier: number,
  options: { subCategory?: string; userMarkedExempt: boolean }
): string | null {
  if (!zakatable) {
    // Distinguish the two reasons an asset carries no zakat: the user said so
    // ("Exempt"), or the methodology does not count this asset type
    // ("Not zakatable"). Collapsing them told users they had opted out when
    // they had not.
    if (options.subCategory === 'jewelry') return 'Exempt - jewelry';
    return options.userMarkedExempt ? 'Exempt' : 'Not zakatable';
  }
  if (modifier === 1) return null;
  if (modifier === 0) return 'Deferred until withdrawn';
  if (modifier === 0.3) return '30% rule applies';
  return getModifierLabel(modifier);
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isEligible = asset.zakatEligible !== false;
  // The engine is the source of truth for whether zakat applies at all.
  const zakatable = isAssetZakatable(asset, 'STANDARD');

  const zakatableAmount = getAssetZakatableValue(asset, 'STANDARD');
  const modifier =
    asset.value > 0 ? zakatableAmount / asset.value : isEligible ? 1 : 0;

  const key = String(asset.type || 'other').toLowerCase().replace(/[\s-]/g, '_');
  const Icon = CATEGORY_ICONS[key] ?? Wallet;

  const treatment = treatmentLabel(zakatable, modifier, {
    subCategory: asset.subCategory,
    userMarkedExempt: asset.zakatEligible === false
  });
  const zakatOwed = Math.round(zakatableAmount * 0.025 * 100) / 100;

  const open = () => (onClick ? onClick() : navigate(`/assets/${asset.id}`));

  const subtitle = [
    asset.subCategory ? asset.subCategory.replace(/_/g, ' ') : null,
    String(asset.type || '').replace(/_/g, ' ').toLowerCase(),
    treatment
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className="group flex items-center gap-3 border-b border-border py-3 last:border-b-0"
      role="article"
      aria-label={`Asset: ${asset.name}`}
    >
      <button
        type="button"
        onClick={open}
        className="flex min-w-0 flex-1 items-center gap-3 text-start"
      >
        <span
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-accent text-secondary"
          aria-hidden="true"
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {asset.name}
          </span>
          <span className="block truncate text-xs capitalize text-muted-foreground">
            {subtitle}
          </span>
        </span>

        <span className="shrink-0 text-end">
          <Money value={asset.value || 0} currency={asset.currency} size="sm" />
          <span className="block text-xs text-muted-foreground">
            {zakatOwed > 0 ? `${zakatOwed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due` : 'No zakat due'}
          </span>
        </span>
      </button>

      {(onEdit || onDelete) && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Actions for ${asset.name}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              {/* Click-away layer: closes the menu without a document listener */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                className="absolute end-0 z-20 mt-1 w-40 rounded-lg border border-border bg-popover py-1 shadow-elev-3"
                role="menu"
              >
                {onEdit && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="block w-full px-3 py-2 text-start text-sm text-foreground hover:bg-accent"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="block w-full px-3 py-2 text-start text-sm text-danger hover:bg-danger-soft"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AssetCard;
