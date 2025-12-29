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

import { CalculationModifier } from '@zakapp/shared';

// Determine modifier based on flag precedence
export const determineModifier = (params: {
  isRestrictedAccount: boolean;
  isPassiveInvestment: boolean;
}): number => {
  if (params.isRestrictedAccount) return CalculationModifier.RESTRICTED;
  if (params.isPassiveInvestment) return CalculationModifier.PASSIVE;
  return CalculationModifier.FULL;
};

// Compute zakatable amount after applying modifier and exchange rate
export const calculateZakatableAmount = (
  asset: { value: number; calculationModifier: number },
  exchangeRate: number = 1.0
): number => {
  const valueInBase = asset.value * exchangeRate;
  return valueInBase * asset.calculationModifier;
};

// Compute zakat owed (2.5%) for a single asset
export const calculateAssetZakat = (
  asset: { value: number; calculationModifier: number },
  exchangeRate: number = 1.0
): number => {
  const ZAKAT_RATE = 0.025;
  const zakatableAmount = calculateZakatableAmount(asset, exchangeRate);
  return zakatableAmount * ZAKAT_RATE;
};

// Human-readable label for UI display
export const getModifierLabel = (modifier: number): string => {
  switch (modifier) {
    case CalculationModifier.RESTRICTED:
      return 'Deferred - Restricted';
    case CalculationModifier.PASSIVE:
      return '30% Rule Applied';
    case CalculationModifier.FULL:
      return 'Full Value';
    default:
      return 'Unknown';
  }
};
