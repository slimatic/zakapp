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
    let penalty = 0;
    let tax = 0;

    // Try metadata string parse for retirement details
    if (typeof asset.metadata === 'string' && asset.metadata.startsWith('{')) {
        try {
            const meta = JSON.parse(asset.metadata);
            if (meta.retirementDetails) {
                penalty = meta.retirementDetails.withdrawalPenalty || 0;
                tax = meta.retirementDetails.taxRate || 0;
            }
        } catch (e) {
            // ignore
        }
    }

    const netFactor = 1 - penalty - tax;
    return asset.value * Math.max(0, netFactor);
}

export function getAssetZakatableValue(asset: Asset, methodologyName: ZakatMethodology): number {
    if (!isAssetZakatable(asset, methodologyName)) {
        return 0;
    }

    // For retirement assets, use the net-withdrawable calculation
    if (asset.type === AssetType.RETIREMENT) {
        return calculateNetWithdrawable(asset);
    }

    // For assets with a calculationModifier (e.g., passive investments), apply it
    if (typeof asset.calculationModifier === 'number' && asset.calculationModifier !== 1.0) {
        return asset.value * asset.calculationModifier;
    }

    // Check if explicitly marked as passive investment (30% rule)
    if (asset.isPassiveInvestment === true) {
        return asset.value * 0.3;
    }

    return asset.value;
}

export function calculateZakat(
    assets: Asset[],
    liabilities: any[],
    nisabValues: { gold: number; silver: number }, // Pass both values to allow smart selection
    methodologyName: ZakatMethodology = 'STANDARD'
): CalculationResult {
    const config = getMethodology(methodologyName);

    // 1. Determine Correct Nisab
    const nisabThreshold = config.nisabSource === 'SILVER' ? nisabValues.silver : nisabValues.gold;

    // 2. Assets
    const assetBreakdown: Record<string, { total: number; zakatable: number }> = {};
    let totalAssets = 0;
    let zakatableAssets = 0;

    for (const asset of assets) {
        totalAssets += asset.value;
        const zakatableVal = getAssetZakatableValue(asset, methodologyName);
        zakatableAssets += zakatableVal;

        if (!assetBreakdown[asset.type]) {
            assetBreakdown[asset.type] = { total: 0, zakatable: 0 };
        }
        assetBreakdown[asset.type].total += asset.value;
        assetBreakdown[asset.type].zakatable += zakatableVal;
    }

    // 3. Liabilities
    let totalLiabilities = 0;
    let deductibleLiabilities = 0;
    const liabilityBreakdown: Record<string, { total: number; deductible: number }> = {};

    for (const liability of liabilities) {
        const amount = liability.amount || 0;
        totalLiabilities += amount;

        const type = liability.type?.toUpperCase() || 'OTHER';
        const isDeductible = config.deductibleLiabilities.includes(type);

        const deductibleVal = isDeductible ? amount : 0;
        deductibleLiabilities += deductibleVal;

        if (!liabilityBreakdown[type]) {
            liabilityBreakdown[type] = { total: 0, deductible: 0 };
        }
        liabilityBreakdown[type].total += amount;
        liabilityBreakdown[type].deductible += deductibleVal;
    }

    // 4. Final Calculations
    const netWorth = zakatableAssets - deductibleLiabilities;
    const isZakatObligatory = netWorth >= nisabThreshold;
    const zakatRate = 0.025;
    const zakatDue = isZakatObligatory ? netWorth * zakatRate : 0;

    return {
        totalAssets,
        zakatableAssets,
        totalLiabilities,
        deductibleLiabilities,
        netWorth,
        zakatDue,
        isZakatObligatory,
        breakdown: {
            assets: assetBreakdown,
            liabilities: liabilityBreakdown
        },
        meta: {
            methodology: config.name,
            nisabSource: config.nisabSource,
            zakatRate
        }
    };
}
