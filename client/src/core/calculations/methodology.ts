import { AssetType } from '../../types/index';

export type MethodologyName = 'STANDARD' | 'HANAFI' | 'SHAFI';
export type NisabSource = 'GOLD' | 'SILVER';

export interface MethodologyConfig {
    name: MethodologyName;
    nisabSource: NisabSource;
    zakatableAssets: AssetType[];
    deductibleLiabilities: string[]; // Using string for Liability type keys for now
    description: string;
}

export const METHODOLOGIES: Record<MethodologyName, MethodologyConfig> = {
    STANDARD: {
        name: 'STANDARD',
        nisabSource: 'GOLD',
        zakatableAssets: [
            AssetType.CASH,
            AssetType.BANK_ACCOUNT,
            AssetType.GOLD,
            AssetType.SILVER,
            AssetType.CRYPTOCURRENCY,
            AssetType.BUSINESS_ASSETS,
            AssetType.RETIREMENT,
            AssetType.INVESTMENT_ACCOUNT
        ],
        deductibleLiabilities: ['LOAN', 'BUSINESS_DEBT'],
        description: "Standard view: Gold Nisab, basic debt deduction."
    },
    HANAFI: {
        name: 'HANAFI',
        nisabSource: 'SILVER', // Hanafi traditionally uses Silver (lower threshold, safer for poor)
        zakatableAssets: [
            AssetType.CASH,
            AssetType.BANK_ACCOUNT,
            AssetType.GOLD,
            AssetType.SILVER,
            AssetType.BUSINESS_ASSETS,
            AssetType.CRYPTOCURRENCY,
            AssetType.RETIREMENT,
            AssetType.INVESTMENT_ACCOUNT
        ],
        deductibleLiabilities: ['LOAN', 'MORTGAGE', 'CREDIT_CARD', 'BUSINESS_DEBT'], // Broader deduction
        description: "Hanafi view: Silver Nisab (precautionary), broader debt deductions."
    },
    SHAFI: {
        name: 'SHAFI',
        nisabSource: 'GOLD',
        zakatableAssets: [
            AssetType.CASH,
            AssetType.BANK_ACCOUNT,
            AssetType.GOLD,
            AssetType.SILVER,
            AssetType.CRYPTOCURRENCY,
            AssetType.RETIREMENT,
            AssetType.INVESTMENT_ACCOUNT
            // Often excludes general business merchandise unless explicitly trading
        ],
        deductibleLiabilities: ['LOAN', 'BUSINESS_DEBT'], // Stricter deductions
        description: "Shafi'i view: Gold Nisab, stricter debt deductions."
    }
};

export const getMethodology = (name: string): MethodologyConfig => {
    const key = name.toUpperCase() as MethodologyName;
    return METHODOLOGIES[key] || METHODOLOGIES.STANDARD;
};
