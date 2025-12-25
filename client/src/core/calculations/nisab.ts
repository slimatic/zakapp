export interface NisabData {
    goldPrice: number;
    silverPrice: number;
    goldNisabGrams: number;
    silverNisabGrams: number;
}

export const DEFAULT_NISAB_DATA: NisabData = {
    goldPrice: 65, // USD per gram (fallback)
    silverPrice: 0.8, // USD per gram (fallback)
    goldNisabGrams: 87.48,
    silverNisabGrams: 612.36
};

export function calculateNisabThreshold(
    nisabData: NisabData,
    methodology: 'STANDARD' | 'HANAFI' | 'SHAFI'
): number {
    const goldNisabValue = nisabData.goldPrice * nisabData.goldNisabGrams;
    const silverNisabValue = nisabData.silverPrice * nisabData.silverNisabGrams;

    switch (methodology) {
        case 'HANAFI':
            // Hanafi uses Silver Nisab (lower threshold, more people pay)
            return silverNisabValue;
        case 'SHAFI':
        default:
            // Standard/Shafi uses Gold Nisab (higher threshold)
            return goldNisabValue;
    }
}
