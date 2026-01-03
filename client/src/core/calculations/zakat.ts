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

import { Asset, AssetType } from '../../types/index';
import { MethodologyName, getMethodology } from './methodology';

import { Decimal } from 'decimal.js';

export type ZakatMethodology = MethodologyName;

export interface CalculationResult {
    totalAssets: number;
    zakatableAssets: number;
    totalLiabilities: number;
    deductibleLiabilities: number;
    netWorth: number;
    zakatDue: number;
    isZakatObligatory: boolean;
    breakdown: {
        assets: Record<string, { total: number; zakatable: number }>;
        liabilities: Record<string, { total: number; deductible: number }>;
    };
    meta: {
        methodology: string;
        nisabSource: string;
        zakatRate: number;
    }
}

// AssetZakatable Logic
export function isAssetZakatable(asset: Asset, methodologyName: ZakatMethodology): boolean {
    const config = getMethodology(methodologyName);
    const inList = config.zakatableAssets.includes(asset.type);

    if (!inList) return false;

    // Check Explicit Overrides First
    if (asset.zakatEligible === true) return true;
    if (asset.zakatEligible === false) return false;

    // Default Logic for Jewelry (Gold/Silver)
    if (config.jewelryExempt && (asset.type === AssetType.GOLD || asset.type === AssetType.SILVER)) {
        // If methodology exempts jewelry and user hasn't explicitly said "It is zakatable (e.g. investment)",
        // then we assume it's personal jewelry and EXEMPT it.
        return false;
    }

    return true;
}

// Net Withdrawable Logic for Retirement
function calculateNetWithdrawable(asset: Asset): number {
    // Access metadata for retirement-specific settings
    let penalty = new Decimal(0);
    let tax = new Decimal(0);

    // Try metadata string parse for retirement details
    if (typeof asset.metadata === 'string' && asset.metadata.startsWith('{')) {
        try {
            const meta = JSON.parse(asset.metadata);
            if (meta.retirementDetails) {
                penalty = new Decimal(meta.retirementDetails.withdrawalPenalty || 0);
                tax = new Decimal(meta.retirementDetails.taxRate || 0);
            }
        } catch (e) {
            // ignore
        }
    } else if ((asset as any).retirementDetails) {
        // Fallback: Check if retirementDetails is already on the object (pre-parsed)
        const details = (asset as any).retirementDetails;
        penalty = new Decimal(details.withdrawalPenalty || 0);
        tax = new Decimal(details.taxRate || 0);
    }

    // netFactor = 1 - penalty - tax
    const one = new Decimal(1);
    const netFactor = one.minus(penalty).minus(tax);

    // asset.value * max(0, netFactor)
    const factor = Decimal.max(0, netFactor);
    return new Decimal(asset.value || 0).times(factor).toNumber();
}

export function getAssetZakatableValue(asset: Asset, methodologyName: ZakatMethodology): number {
    if (!isAssetZakatable(asset, methodologyName)) {
        return 0;
    }

    // For assets with a calculationModifier (e.g., passive investments, deferred retirement), apply it first
    // This allows specific overrides (like 0 for deferred) to take precedence over generic type logic
    if (typeof asset.calculationModifier === 'number' && asset.calculationModifier !== 1.0) {
        return new Decimal(asset.value || 0).times(asset.calculationModifier).toNumber();
    }

    // For retirement assets, use the net-withdrawable calculation (fallback if modifier is 1.0 or missing)
    if (asset.type === AssetType.RETIREMENT) {
        return calculateNetWithdrawable(asset);
    }

    // Check if explicitly marked as passive investment (30% rule)
    if (asset.isPassiveInvestment === true) {
        return new Decimal(asset.value || 0).times(0.3).toNumber();
    }

    return new Decimal(asset.value || 0).toNumber();
}

export function calculateZakat(
    assets: Asset[],
    liabilities: any[],
    nisabValues: { gold: number; silver: number }, // Pass both values to allow smart selection
    methodologyName: ZakatMethodology = 'STANDARD'
): CalculationResult {
    const config = getMethodology(methodologyName);

    // 1. Determine Correct Nisab
    const nisabThreshold = new Decimal(config.nisabSource === 'SILVER' ? nisabValues.silver : nisabValues.gold);

    // 2. Assets
    const assetBreakdown: Record<string, { total: number; zakatable: number }> = {};
    let totalAssets = new Decimal(0);
    let zakatableAssets = new Decimal(0);

    for (const asset of assets) {
        const assetValue = new Decimal(asset.value || 0);
        totalAssets = totalAssets.plus(assetValue);

        const zakatableVal = new Decimal(getAssetZakatableValue(asset, methodologyName));
        zakatableAssets = zakatableAssets.plus(zakatableVal);

        if (!assetBreakdown[asset.type]) {
            assetBreakdown[asset.type] = { total: 0, zakatable: 0 };
        }

        // Accumulate breakdown using Decimal -> toNumber
        assetBreakdown[asset.type].total = new Decimal(assetBreakdown[asset.type].total).plus(assetValue).toNumber();
        assetBreakdown[asset.type].zakatable = new Decimal(assetBreakdown[asset.type].zakatable).plus(zakatableVal).toNumber();
    }

    // 3. Liabilities
    let totalLiabilities = new Decimal(0);
    let deductibleLiabilities = new Decimal(0);
    const liabilityBreakdown: Record<string, { total: number; deductible: number }> = {};

    for (const liability of liabilities) {
        const amount = new Decimal(liability.amount || 0);
        totalLiabilities = totalLiabilities.plus(amount);

        const type = liability.type?.toUpperCase() || 'OTHER';
        const isDeductible = config.deductibleLiabilities.includes(type);

        const deductibleVal = isDeductible ? amount : new Decimal(0);
        deductibleLiabilities = deductibleLiabilities.plus(deductibleVal);

        if (!liabilityBreakdown[type]) {
            liabilityBreakdown[type] = { total: 0, deductible: 0 };
        }

        liabilityBreakdown[type].total = new Decimal(liabilityBreakdown[type].total).plus(amount).toNumber();
        liabilityBreakdown[type].deductible = new Decimal(liabilityBreakdown[type].deductible).plus(deductibleVal).toNumber();
    }

    // 4. Final Calculations
    const netWorth = zakatableAssets.minus(deductibleLiabilities);
    const isZakatObligatory = netWorth.greaterThanOrEqualTo(nisabThreshold);
    const zakatRate = new Decimal(0.025);
    const zakatDue = isZakatObligatory ? netWorth.times(zakatRate) : new Decimal(0);

    return {
        totalAssets: totalAssets.toNumber(),
        zakatableAssets: zakatableAssets.toNumber(),
        totalLiabilities: totalLiabilities.toNumber(),
        deductibleLiabilities: deductibleLiabilities.toNumber(),
        netWorth: netWorth.toNumber(),
        zakatDue: zakatDue.toNumber(),
        isZakatObligatory,
        breakdown: {
            assets: assetBreakdown,
            liabilities: liabilityBreakdown
        },
        meta: {
            methodology: config.name,
            nisabSource: config.nisabSource,
            zakatRate: zakatRate.toNumber() // 0.025 is safe
        }
    };
}
