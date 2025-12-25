import { Asset, AssetType } from '../../types/index';

// Simplify Asset type for calculation if needed, but we can use the main one.
// We need to match the logic from server/src/services/ZakatCalculationService.ts

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
}

export type ZakatMethodology = 'STANDARD' | 'HANAFI' | 'SHAFI';

// AssetZakatable Logic
export function isAssetZakatable(asset: Asset, methodology: ZakatMethodology): boolean {
    // Map AssetType to categories used in logic
    const type = asset.type;

    switch (methodology) {
        case 'HANAFI':
            return [
                AssetType.CASH,
                AssetType.BANK_ACCOUNT,
                AssetType.GOLD,
                AssetType.SILVER,
                AssetType.BUSINESS_ASSETS,
                AssetType.CRYPTOCURRENCY,
                AssetType.RETIREMENT, // Added based on new logic
                AssetType.INVESTMENT_ACCOUNT // Often treated as zakatable
            ].includes(type);

        case 'SHAFI':
            // Shafi strictness usually excludes some business assets unless trading goods
            return [
                AssetType.CASH,
                AssetType.BANK_ACCOUNT,
                AssetType.GOLD,
                AssetType.SILVER,
                AssetType.CRYPTOCURRENCY,
                AssetType.RETIREMENT,
                AssetType.INVESTMENT_ACCOUNT
            ].includes(type);

        default: // STANDARD
            return [
                AssetType.CASH,
                AssetType.BANK_ACCOUNT,
                AssetType.GOLD,
                AssetType.SILVER,
                AssetType.CRYPTOCURRENCY,
                AssetType.BUSINESS_ASSETS,
                AssetType.RETIREMENT,
                AssetType.INVESTMENT_ACCOUNT
            ].includes(type);
    }
}

export function getAssetZakatableValue(asset: Asset, methodology: ZakatMethodology): number {
    if (!isAssetZakatable(asset, methodology)) {
        return 0;
    }

    let value = asset.value;

    // Retirement Logic (401k/IRA)
    // We check if asset.metadata contains retirement details
    // In the client, `asset` might already have this parsed if we use the DTO properly, 
    // but let's assume raw or extended interface. 
    // We'll try to check if `retirementDetails` property exists on the asset object (if we extended the type)
    // or parse metadata if it serves as a raw string.

    // For the `Asset` interface in `types/index.ts`, it doesn't have `retirementDetails`.
    // But `types/asset.types.ts` defines `AssetWithZakatInfo` or DTOs.
    // We should cast or check safely.

    const assetAny = asset as any;
    if (asset.type === AssetType.RETIREMENT) {
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
        value = value * Math.max(0, netFactor);
    }

    return value;
}

export function calculateZakat(
    assets: Asset[],
    liabilities: any[], // Define Liability type if imported
    nisabThreshold: number,
    methodology: ZakatMethodology = 'STANDARD'
): CalculationResult {

    // Assets
    const assetBreakdown: Record<string, { total: number; zakatable: number }> = {};
    let totalAssets = 0;
    let zakatableAssets = 0;

    for (const asset of assets) {
        totalAssets += asset.value;
        const zakatableVal = getAssetZakatableValue(asset, methodology);
        zakatableAssets += zakatableVal;

        if (!assetBreakdown[asset.type]) {
            assetBreakdown[asset.type] = { total: 0, zakatable: 0 };
        }
        assetBreakdown[asset.type].total += asset.value;
        assetBreakdown[asset.type].zakatable += zakatableVal;
    }

    // Liabilities (Simplified for now - strictly allow Deduction)
    // Logic from server: isLiabilityDeductible
    let totalLiabilities = 0;
    let deductibleLiabilities = 0;
    const liabilityBreakdown: Record<string, { total: number; deductible: number }> = {};

    for (const liability of liabilities) {
        const amount = liability.amount || 0;
        totalLiabilities += amount;

        // Determine deductibility
        let isDeductible = false;
        const type = liability.type?.toUpperCase();

        // Simplified Methodology Mapping
        if (['LOAN', 'BUSINESS_DEBT'].includes(type)) {
            isDeductible = true;
        }
        if (methodology === 'HANAFI' && ['MORTGAGE', 'CREDIT_CARD'].includes(type)) {
            isDeductible = true;
        }

        const deductibleVal = isDeductible ? amount : 0;
        deductibleLiabilities += deductibleVal;

        if (!liabilityBreakdown[liability.type]) {
            liabilityBreakdown[liability.type] = { total: 0, deductible: 0 };
        }
        liabilityBreakdown[liability.type].total += amount;
        liabilityBreakdown[liability.type].deductible += deductibleVal;
    }

    // Final Calculations
    const netWorth = zakatableAssets - deductibleLiabilities;
    const isZakatObligatory = netWorth >= nisabThreshold;
    const zakatDue = isZakatObligatory ? netWorth * 0.025 : 0;

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
        }
    };
}
