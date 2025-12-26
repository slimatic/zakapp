
import { describe, it, expect } from 'vitest';
import { calculateWealth } from '../wealthCalculator';
import { Asset, AssetType } from '../../../types';

describe('wealthCalculator', () => {
    it('should calculate pure zakatable assets correctly (Johntest Baseline)', () => {
        // Scenario: User has mixed assets.
        // 1. Cash: $10,000 (Fully zakatable)
        // 2. 401k: $50,000 (Zakat eligible, but modified - e.g. 30% for passive/restricted)
        // 3. Personal Car: $20,000 (Not zakat eligible)

        // We expect Total Wealth = 10k + 50k + 20k = 80k
        // We expect Zakatable Wealth = 10k + (50k * 0.3) + 0 = 10k + 15k = 25k

        const assets: Asset[] = [
            {
                id: '1',
                name: 'Savings',
                type: AssetType.CASH,
                value: 10000,
                currency: 'USD',
                isActive: true,
                createdAt: '',
                updatedAt: '',
                zakatEligible: true, // Cash is eligible
                calculationModifier: 1.0
            },
            {
                id: '2',
                name: '401k Fund',
                type: AssetType.RETIREMENT,
                value: 50000,
                currency: 'USD',
                isActive: true,
                createdAt: '',
                updatedAt: '',
                zakatEligible: true, // User marked eligible
                isPassiveInvestment: true,
                calculationModifier: 0.3 // 30% rule
            },
            {
                id: '3',
                name: 'Personal Car',
                type: AssetType.OTHER,
                value: 20000,
                currency: 'USD',
                isActive: true,
                createdAt: '',
                updatedAt: '',
                zakatEligible: false, // User marked ineligible
                calculationModifier: 1.0
            }
        ];

        const result = calculateWealth(assets);

        expect(result.totalWealth).toBe(80000);
        expect(result.zakatableWealth).toBe(25000);
    });

    it('should exclude ineligible types unless explicitly marked eligible', () => {
        // Scenario: Real Estate (Rental vs Personal)
        // Rental Property: $100k, eligible, 100% modifier (simplistic view for test)
        // Personal Home: $500k, ineligible (type REAL_ESTATE usually potential, but explicit flag false)

        const assets: Asset[] = [
            {
                id: '1',
                name: 'Rental Unit',
                type: AssetType.REAL_ESTATE, // Not in POTENTIAL_ZAKATABLE_TYPES list? Let's check logic.
                // Wait, REAL_ESTATE is NOT in the default list in wealthCalculator.ts
                // So it depends on zakatEligible flag.
                value: 100000,
                isActive: true,
                currency: 'USD',
                createdAt: '',
                updatedAt: '',
                zakatEligible: true,
                calculationModifier: 1.0
            },
            {
                id: '2',
                name: 'Primary Residence',
                type: AssetType.REAL_ESTATE,
                value: 500000,
                isActive: true,
                currency: 'USD',
                createdAt: '',
                updatedAt: '',
                zakatEligible: false,
                calculationModifier: 1.0
            }
        ];

        const result = calculateWealth(assets);

        expect(result.totalWealth).toBe(600000); // 100k + 500k
        expect(result.zakatableWealth).toBe(100000); // Only rental
    });

    it('should handle missing modifiers as 1.0', () => {
        const assets: Asset[] = [
            {
                id: '1',
                name: 'Gold',
                type: AssetType.GOLD,
                value: 5000,
                currency: 'USD',
                isActive: true,
                createdAt: '',
                updatedAt: '',
                zakatEligible: true
                // calculationModifier undefined
            }
        ];

        const result = calculateWealth(assets);
        expect(result.zakatableWealth).toBe(5000);
    });
});
