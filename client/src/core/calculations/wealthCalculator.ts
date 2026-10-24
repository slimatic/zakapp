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
import { getAssetZakatableValue, isAssetZakatable, ZakatMethodology } from './zakat';
import { activeAssets } from './activeAssets';
import { calculateDeductibleLiabilities } from './liabilityRules';
import { Decimal } from 'decimal.js';

/**
 * Zakat Calculation Logic extracted from UI components.
 * Pure function for testability.
 */

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

    activeAssets(assets).forEach(asset => {
        const value = new Decimal(asset.value || 0);

        // 1. Always add to Total Wealth (Net Worth calculation)
        totalWealth = totalWealth.plus(value);

        // 2. Check Zakat Eligibility — the shared rule in ./zakat is the single
        // source of truth. It honours a genuine user answer (zakatEligible set
        // with isEligibilityManual) and otherwise defers to the selected school.
        if (isAssetZakatable(asset, methodology)) {
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
