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
