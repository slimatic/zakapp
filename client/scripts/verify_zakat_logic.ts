/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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


import { calculateZakat, isAssetZakatable } from '../src/core/calculations/zakat';
import { Asset, AssetType } from '../src/types/index';

// Mock Assets
const assets: Asset[] = [
    {
        id: '1',
        userId: 'u1',
        type: AssetType.CASH,
        value: 10000,
        currency: 'USD',
        name: 'Cash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        isPassiveInvestment: false,
        isRestrictedAccount: false,
        calculationModifier: 1
    },
    {
        id: '2',
        userId: 'u1',
        type: AssetType.GOLD,
        value: 5000,
        currency: 'USD',
        name: 'Gold',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        isPassiveInvestment: false,
        isRestrictedAccount: false,
        calculationModifier: 1
    }
];

// Liabilities
const liabilities = [
    { type: 'MORTGAGE', amount: 200000 }, // Deductible in Hanafi, not Shafi (usually)
    { type: 'LOAN', amount: 5000 } // Deductible in both
];

// Nisab Values
const nisabValues = {
    gold: 4000, // $4,000 threshold
    silver: 400 // $400 threshold
};

console.log('--- Verifying Zakat Logic Port ---');

// Test 1: Standard
console.log('\n[TEST 1] STANDARD Methodology');
const resStandard = calculateZakat(assets, liabilities, nisabValues, 'STANDARD');
console.log('Methodology:', resStandard.meta.methodology);
console.log('Nisab Source:', resStandard.meta.nisabSource); // Should be GOLD
console.log('Total Assets:', resStandard.totalAssets);
console.log('Deductible Liabilities:', resStandard.deductibleLiabilities); // Should be 5000 (LOAN only)
console.log('Net Worth:', resStandard.netWorth);
console.log('Zakat Due:', resStandard.zakatDue);

// Test 2: Hanafi
console.log('\n[TEST 2] HANAFI Methodology');
const resHanafi = calculateZakat(assets, liabilities, nisabValues, 'HANAFI');
console.log('Methodology:', resHanafi.meta.methodology);
console.log('Nisab Source:', resHanafi.meta.nisabSource); // Should be SILVER
console.log('Deductible Liabilities:', resHanafi.deductibleLiabilities); // Should be 205000 (LOAN + MORTGAGE)
console.log('Net Worth:', resHanafi.netWorth); // Likely negative
console.log('Zakat Due:', resHanafi.zakatDue);

// Test 3: Shafi
console.log('\n[TEST 3] SHAFI Methodology');
const resShafi = calculateZakat(assets, liabilities, nisabValues, 'SHAFI');
console.log('Methodology:', resShafi.meta.methodology);
console.log('Nisab Source:', resShafi.meta.nisabSource); // Should be GOLD
console.log('Deductible Liabilities:', resShafi.deductibleLiabilities); // Should be 5000
console.log('Zakat Due:', resShafi.zakatDue);

if (resStandard.meta.nisabSource === 'GOLD' &&
    resHanafi.meta.nisabSource === 'SILVER' &&
    resHanafi.deductibleLiabilities > resStandard.deductibleLiabilities) {
    console.log('\n✅ VERIFICATION SUCCESS: Methodology logic is correctly applied.');
} else {
    console.error('\n❌ VERIFICATION FAILED: Logic mismatch.');
    process.exit(1);
}
