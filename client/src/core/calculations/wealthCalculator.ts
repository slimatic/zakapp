import { Asset } from '../../types';

/**
 * Zakat Calculation Logic extracted from UI components.
 * Pure function for testability.
 */

// List of asset types that are potentially zakatable
export const POTENTIAL_ZAKATABLE_TYPES = [
    'CASH',
    'GOLD',
    'SILVER',
    'CRYPTOCURRENCY',
    'BUSINESS_ASSETS',
    'INVESTMENT_ACCOUNT',
    'STOCKS'
];

interface WealthCalculationResult {
    totalWealth: number;
    zakatableWealth: number;
}

/**
 * Calculates total and zakatable wealth from a list of assets.
 * Respects `zakatEligible` flag and `calculationModifier`.
 * 
 * @param assets List of assets to calculate from
 * @returns Object containing totalWealth and zakatableWealth
 */
export const calculateWealth = (assets: Asset[]): WealthCalculationResult => {
    // 1. Identify Assets (using same logic as creation default)
    // We include assets that are EITHER in the potential list OR explicitly marked eligible.
    // Actually, the original logic filtered by:
    // allAssets.filter(a => potentialZakatableTypes.includes(a.type) || a.zakatEligible);
    // This implies if an asset is 'REAL_ESTATE' (not in list) but has zakatEligible=true, it is included in the loop.
    // However, `zakatEligible` might be undefined for some.

    let totalWealth = 0;
    let zakatableWealth = 0;

    assets.forEach(asset => {
        const value = Number(asset.value) || 0;

        // 1. Always add to Total Wealth (Net Worth calculation)
        totalWealth += value;

        // 2. Check Zakat Eligibility
        const isPotentialType = POTENTIAL_ZAKATABLE_TYPES.includes(asset.type);
        const explicitEligibility = asset.zakatEligible;

        // Determine strict eligibility
        let isEligible = false;

        if (explicitEligibility === true) {
            isEligible = true;
        } else if (explicitEligibility === false) {
            isEligible = false;
        } else {
            // undefined: Fallback to potential list check
            isEligible = isPotentialType;
        }

        if (isEligible) {
            const modifier = asset.calculationModifier ?? 1.0;
            zakatableWealth += value * modifier;
        }
    });

    return {
        totalWealth,
        zakatableWealth
    };
};
