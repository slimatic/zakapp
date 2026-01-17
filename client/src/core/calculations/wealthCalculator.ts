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

import { Asset, Liability } from '../../types';
import { getAssetZakatableValue, ZakatMethodology } from './zakat';
import { Decimal } from 'decimal.js';

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
    deductibleLiabilities: number;
    netZakatableWealth: number;
}

/**
 * Calculates total and zakatable wealth from a list of assets,
 * and deducts eligible liabilities (Immediate + Long-term Payments due in Hawl).
 * 
 * @param assets List of assets to calculate from
 * @param liabilities Optional list of liabilities to deduct
 * @param referenceDate Optional date to calculate based on (defaults to now)
 * @returns Object containing wealth metrics
 */
export const calculateWealth = (
    assets: Asset[],
    liabilities: Liability[] = [],
    referenceDate: Date = new Date(),
    methodology: ZakatMethodology = 'STANDARD'
): WealthCalculationResult => {
    // 1. Calculate Asset Wealth
    let totalWealth = new Decimal(0);
    let zakatableWealth = new Decimal(0);

    assets.forEach(asset => {
        const value = new Decimal(asset.value || 0);

        // 1. Always add to Total Wealth (Net Worth calculation)
        totalWealth = totalWealth.plus(value);

        // 2. Check Zakat Eligibility
        const isPotentialType = POTENTIAL_ZAKATABLE_TYPES.includes(asset.type);
        const explicitEligibility = asset.zakatEligible;

        // Determine strict eligibility - PURELY based on Asset flag
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
            // Use core zakat calculation for accurate zakatable value
            zakatableWealth = zakatableWealth.plus(new Decimal(getAssetZakatableValue(asset, methodology)));
        }
    });

    // 2. Calculate Deductible Liabilities
    const deductibleLiabilities = new Decimal(calculateDeductibleLiabilities(liabilities, referenceDate));

    // 3. Calculate Net Zakatable Wealth (prevent negative)
    const netZakatableWealth = Decimal.max(0, zakatableWealth.minus(deductibleLiabilities));

    return {
        totalWealth: totalWealth.toNumber(),
        zakatableWealth: zakatableWealth.toNumber(),
        deductibleLiabilities: deductibleLiabilities.toNumber(),
        netZakatableWealth: netZakatableWealth.toNumber()
    };
};

/**
 * Calculates the total deductible amount from liabilities.
 * 
 * Rule (@faqih 2.3):
 * - Immediate debts (due <= 1 year): Fully deductible.
 * - Long term debts (due > 1 year): Only deduct payments due within the next lunar year (354 days).
 * 
 * For this simplified implementation:
 * - We assume all passed liabilities are active.
 * - If due date is within 354 days, we deduct full amount.
 * - If due date is > 354 days, we currently CANNOT determine the "yearly payment" portion without an amortization schedule.
 *   
 *   > [!NOTE] 
 *   > For now, we will deduct ONLY liabilities due within ~1 lunar year (354 days).
 *   > Liabilities further out are considered "Long Term" and are NOT fully deductible to prevent zeroing out zakat via mortgage principal.
 * 
 * @param liabilities 
 * @param referenceDate 
 */
export const calculateDeductibleLiabilities = (liabilities: Liability[], referenceDate: Date): number => {
    let totalDeductible = new Decimal(0);
    const hawlDurationMs = 355 * 24 * 60 * 60 * 1000; // ~1 Lunar Year (safe buffer)
    const cutoffDate = new Date(referenceDate.getTime() + hawlDurationMs);

    liabilities.forEach(liability => {
        if (!liability.isActive) return;

        const amount = new Decimal(liability.amount || 0);
        const dueDate = new Date(liability.dueDate);

        // If due date is invalid, we lean on precaution and do NOT deduct (safer for zakat receiver)
        if (isNaN(dueDate.getTime())) return;

        // Check if due within the coming lunar year
        // We also deduct past due debts (dueDate < referenceDate) as they are "Immediate"
        if (dueDate <= cutoffDate) {
            totalDeductible = totalDeductible.plus(amount);
        }
    });

    return totalDeductible.toNumber();
};

