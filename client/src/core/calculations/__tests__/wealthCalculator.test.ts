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

import { describe, it, expect } from 'vitest';
import { calculateWealth } from '../wealthCalculator';
import { Asset, AssetType, Liability } from '../../../types';

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

    describe('liability deduction', () => {
        const baseAssets: Asset[] = [
            {
                id: '1',
                name: 'Cash',
                type: AssetType.CASH,
                value: 10000,
                currency: 'USD',
                isActive: true,
                createdAt: '',
                updatedAt: '',
                zakatEligible: true,
                calculationModifier: 1.0
            }
        ];

        // Reference date: Jan 1, 2024
        const refDate = new Date('2024-01-01T00:00:00Z');

        it('should deduct immediate debts (due within 354 days)', () => {
            const liabilities: Liability[] = [
                {
                    id: 'L1',
                    userId: 'u1',
                    name: 'Credit Card',
                    type: 'short_term',
                    amount: 2000,
                    currency: 'USD',
                    isActive: true,
                    createdAt: '',
                    updatedAt: '',
                    dueDate: '2024-03-01T00:00:00Z' // Within 354 days
                }
            ];

            const result = calculateWealth(baseAssets, liabilities, refDate);

            // 10000 - 2000 = 8000
            expect(result.zakatableWealth).toBe(10000); // Raw zakatable wealth (assets only)
            expect(result.deductibleLiabilities).toBe(2000);
            expect(result.netZakatableWealth).toBe(8000);
        });

        it('should NOT deduct long-term debts (due > 354 days)', () => {
            const liabilities: Liability[] = [
                {
                    id: 'L2',
                    userId: 'u1',
                    name: 'Mortgage Future',
                    type: 'long_term',
                    amount: 50000,
                    currency: 'USD',
                    isActive: true,
                    createdAt: '',
                    updatedAt: '',
                    dueDate: '2025-06-01T00:00:00Z' // Approx 1.5 years from Jan 1, 2024
                }
            ];

            const result = calculateWealth(baseAssets, liabilities, refDate);

            expect(result.deductibleLiabilities).toBe(0);
            expect(result.netZakatableWealth).toBe(10000);
        });

        it('should calculate mixed liabilities correctly', () => {
            // 10k assets
            // 1k immediate debt (deduct)
            // 5k long term debt (ignore)
            // Net = 9k

            const liabilities: Liability[] = [
                {
                    id: 'L1',
                    userId: 'u1',
                    name: 'Rent',
                    type: 'short_term',
                    amount: 1000,
                    currency: 'USD',
                    isActive: true,
                    createdAt: '',
                    updatedAt: '',
                    dueDate: '2024-02-01T00:00:00Z'
                },
                {
                    id: 'L2',
                    userId: 'u1',
                    name: 'Student Loan Future',
                    type: 'long_term',
                    amount: 5000,
                    currency: 'USD',
                    isActive: true,
                    createdAt: '',
                    updatedAt: '',
                    dueDate: '2030-01-01T00:00:00Z'
                }
            ];

            const result = calculateWealth(baseAssets, liabilities, refDate);
            expect(result.deductibleLiabilities).toBe(1000);
            expect(result.netZakatableWealth).toBe(9000);
        });

        it('should handle past due liabilities (overdue) as immediate', () => {
            // Debt due yesterday is still owed
            const liabilities: Liability[] = [
                {
                    id: 'Loverdue',
                    userId: 'u1',
                    name: 'Overdue Bill',
                    type: 'short_term',
                    amount: 500,
                    currency: 'USD',
                    isActive: true,
                    createdAt: '',
                    updatedAt: '',
                    dueDate: '2023-12-01T00:00:00Z' // Before Ref Date
                }
            ];

            // Should verify logic. Our logic implementation (snapshot earlier):
            // const isDueWithinYear = dueDate <= oneLunarYearFromNow; 
            // Past dates are < oneLunarYearFromNow, so they should be included.

            const result = calculateWealth(baseAssets, liabilities, refDate);
            expect(result.deductibleLiabilities).toBe(500);
            expect(result.netZakatableWealth).toBe(9500);
        });
    });
});
