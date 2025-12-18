/**
 * Frontend utilities for asset modifiers and UI logic
 * Handles conditional rendering and UI state for passive/restricted checkboxes
 */

import { PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '../constants/sharedFallback';

/**
 * Determine if passive checkbox should be visible for given asset type
 * @param assetType Asset category
 * @param isRestricted Whether asset is marked as restricted
 * @returns true if passive checkbox should be shown
 */
export function shouldShowPassiveCheckbox(assetType: string, isRestricted: boolean = false): boolean {
  if (!assetType) return false;
  const isEligible = PASSIVE_INVESTMENT_TYPES.includes(assetType as any);
  // Don't show passive when restricted (mutually exclusive)
  return isEligible && !isRestricted;
}

/**
 * Determine if restricted checkbox should be visible for given asset type
 * @param assetType Asset category
 * @returns true if restricted checkbox should be shown
 */
export function shouldShowRestrictedCheckbox(assetType: string): boolean {
  if (!assetType) return false;
  return RESTRICTED_ACCOUNT_TYPES.includes(assetType as any);
}

/**
 * Get modifier badge information for UI display
 * @param modifier Calculation modifier value
 * @returns Object with display text and color class
 */
export function getModifierBadge(modifier: number | undefined): { text: string; color: string; icon: string } {
  if (modifier === undefined || modifier === null) {
    return { text: 'Full Value', color: 'bg-green-100 text-green-800', icon: '✓' };
  }

  switch (modifier) {
    case 0.0:
      return {
        text: 'Deferred - Restricted',
        color: 'bg-gray-100 text-gray-800',
        icon: '⏸',
      };
    case 0.3:
      return {
        text: '30% Rule Applied',
        color: 'bg-blue-100 text-blue-800',
        icon: '📊',
      };
    case 1.0:
      return {
        text: 'Full Value',
        color: 'bg-green-100 text-green-800',
        icon: '✓',
      };
    default:
      return {
        text: `${(modifier * 100).toFixed(1)}% Applied`,
        color: 'bg-yellow-100 text-yellow-800',
        icon: '◐',
      };
  }
}

/**
 * Get friendly label for modifier type
 * @param modifier Calculation modifier value
 * @returns Human-readable modifier description
 */
export function getModifierLabel(modifier: number | undefined): string {
  if (modifier === undefined || modifier === null || modifier === 1.0) {
    return 'Full Value';
  }

  if (modifier === 0.0) {
    return 'Deferred - Restricted Account';
  }

  if (modifier === 0.3) {
    return '30% Rule Applied (Passive Investment)';
  }

  return `${(modifier * 100).toFixed(1)}% Applied`;
}

/**
 * Get Islamic guidance text for passive investment
 * @returns Guidance text for display
 */
export function getPassiveInvestmentGuidance(): string {
  return 'Passive investments like stocks, ETFs, and mutual funds contribute only 30% of their value to Zakat calculation. This follows Islamic principles where passive holdings are considered less obligatory than immediately available wealth.';
}

/**
 * Get Islamic guidance text for restricted accounts
 * @returns Guidance text for display
 */
export function getRestrictedAccountGuidance(): string {
  return 'Restricted retirement accounts (401k, Traditional IRA, Pension) are marked as deferred. Since these funds are not currently accessible without penalties, they are deferred from Zakat calculation until withdrawal.';
}

/**
 * Determine if passive checkbox should be disabled
 * @param isRestrictedAccount Whether asset is marked as restricted
 * @returns true if passive checkbox should be disabled
 */
export function isPassiveCheckboxDisabled(isRestrictedAccount: boolean): boolean {
  // Passive cannot be enabled when restricted
  return isRestrictedAccount;
}

/**
 * Calculate zakatable amount for display
 * @param value Asset value
 * @param modifier Calculation modifier
 * @param exchangeRate Optional currency exchange rate
 * @returns Zakatable amount after modifier applied
 */
export function calculateZakatableAmount(
  value: number,
  modifier: number = 1.0,
  exchangeRate: number = 1.0
): number {
  if (value <= 0 || modifier === undefined) return 0;
  return value * exchangeRate * modifier;
}

/**
 * Calculate Zakat owed for asset
 * @param value Asset value
 * @param modifier Calculation modifier
 * @param zakatRate Annual Zakat rate (default: 0.025 = 2.5%)
 * @param exchangeRate Optional currency exchange rate
 * @returns Zakat amount owed
 */
export function calculateZakat(
  value: number,
  modifier: number = 1.0,
  zakatRate: number = 0.025,
  exchangeRate: number = 1.0
): number {
  const zakatableAmount = calculateZakatableAmount(value, modifier, exchangeRate);
  return zakatableAmount * zakatRate;
}
