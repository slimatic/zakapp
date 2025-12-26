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
    return config.zakatableAssets.includes(asset.type);
}

// Net Withdrawable Logic for Retirement
function calculateNetWithdrawable(asset: Asset): number {
    const assetAny = asset as any;
    let penalty = 0;
    let tax = 0;

    // Try typed property
    if (assetAny.retirementDetails) {
        penalty = assetAny.retirementDetails.withdrawalPenalty || 0;
        tax = assetAny.retirementDetails.taxRate || 0;
    }
    // Try metadata string parse
    else if (typeof assetAny.metadata === 'string' && assetAny.metadata.startsWith('{')) {
        try {
            const meta = JSON.parse(assetAny.metadata);
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

    if (asset.type === AssetType.RETIREMENT) {
        return calculateNetWithdrawable(asset);
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
