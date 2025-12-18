/* global describe, it, expect */
import {
  calculateAssetZakat,
  calculateZakatableAmount,
  determineModifier,
  getModifierLabel,
} from '../../utils/assetModifiers';
import { CalculationModifier } from '@zakapp/shared';

describe('assetModifiers utils', () => {
  describe('determineModifier', () => {
    it('returns 0.0 when restricted', () => {
      expect(determineModifier({ isRestrictedAccount: true, isPassiveInvestment: false })).toBe(
        CalculationModifier.RESTRICTED
      );
    });

    it('returns 0.3 when passive', () => {
      expect(determineModifier({ isRestrictedAccount: false, isPassiveInvestment: true })).toBe(
        CalculationModifier.PASSIVE
      );
    });

    it('returns 1.0 when no flags set', () => {
      expect(determineModifier({ isRestrictedAccount: false, isPassiveInvestment: false })).toBe(
        CalculationModifier.FULL
      );
    });

    it('prioritizes restricted over passive', () => {
      expect(determineModifier({ isRestrictedAccount: true, isPassiveInvestment: true })).toBe(
        CalculationModifier.RESTRICTED
      );
    });
  });

  describe('calculateZakatableAmount', () => {
    it('applies modifier and exchange rate', () => {
      const amount = calculateZakatableAmount({ value: 10000, calculationModifier: 0.3 }, 2);
      expect(amount).toBe(6000); // 10000 * 2 * 0.3
    });
  });

  describe('calculateAssetZakat', () => {
    it('calculates zakat with passive modifier', () => {
      const zakat = calculateAssetZakat({ value: 10000, calculationModifier: 0.3 });
      expect(zakat).toBe(75); // 10000 * 0.3 * 0.025
    });

    it('calculates zero zakat for restricted modifier', () => {
      const zakat = calculateAssetZakat({ value: 100000, calculationModifier: 0 });
      expect(zakat).toBe(0);
    });
  });

  describe('getModifierLabel', () => {
    it('returns friendly labels', () => {
      expect(getModifierLabel(0)).toBe('Deferred - Restricted');
      expect(getModifierLabel(0.3)).toBe('30% Rule Applied');
      expect(getModifierLabel(1)).toBe('Full Value');
      expect(getModifierLabel(0.5)).toBe('Unknown');
    });
  });
});
