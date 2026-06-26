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

1|
2|import { calculateZakat, isAssetZakatable } from '../src/core/calculations/zakat';
3|import { Asset, AssetType } from '../src/types/index';
4|
5|// Mock Assets
6|const assets: Asset[] = [
7|    {
8|        id: '1',
9|        userId: 'u1',
10|        type: AssetType.CASH,
11|        value: 10000,
12|        currency: 'USD',
13|        name: 'Cash',
14|        createdAt: new Date().toISOString(),
15|        updatedAt: new Date().toISOString(),
16|        isActive: true,
17|        isPassiveInvestment: false,
18|        isRestrictedAccount: false,
19|        calculationModifier: 1
20|    },
21|    {
22|        id: '2',
23|        userId: 'u1',
24|        type: AssetType.GOLD,
25|        value: 5000,
26|        currency: 'USD',
27|        name: 'Gold',
28|        createdAt: new Date().toISOString(),
29|        updatedAt: new Date().toISOString(),
30|        isActive: true,
31|        isPassiveInvestment: false,
32|        isRestrictedAccount: false,
33|        calculationModifier: 1
34|    }
35|];
36|
37|// Liabilities
38|const liabilities = [
39|    { type: 'MORTGAGE', amount: 200000 }, // Deductible in Hanafi, not Shafi (usually)
40|    { type: 'LOAN', amount: 5000 } // Deductible in both
41|];
42|
43|// Nisab Values
44|const nisabValues = {
45|    gold: 4000, // $4,000 threshold
46|    silver: 400 // $400 threshold
47|};
48|
49|console.log('--- Verifying Zakat Logic Port ---');
50|
51|// Test 1: Standard
52|console.log('\n[TEST 1] STANDARD Methodology');
53|const resStandard = calculateZakat(assets, liabilities, nisabValues, 'STANDARD');
54|console.log('Methodology:', resStandard.meta.methodology);
55|console.log('Nisab Source:', resStandard.meta.nisabSource); // Should be GOLD
56|console.log('Total Assets:', resStandard.totalAssets);
57|console.log('Deductible Liabilities:', resStandard.deductibleLiabilities); // Should be 5000 (LOAN only)
58|console.log('Net Worth:', resStandard.netWorth);
59|console.log('Zakat Due:', resStandard.zakatDue);
60|
61|// Test 2: Hanafi
62|console.log('\n[TEST 2] HANAFI Methodology');
63|const resHanafi = calculateZakat(assets, liabilities, nisabValues, 'HANAFI');
64|console.log('Methodology:', resHanafi.meta.methodology);
65|console.log('Nisab Source:', resHanafi.meta.nisabSource); // Should be SILVER
66|console.log('Deductible Liabilities:', resHanafi.deductibleLiabilities); // Should be 205000 (LOAN + MORTGAGE)
67|console.log('Net Worth:', resHanafi.netWorth); // Likely negative
68|console.log('Zakat Due:', resHanafi.zakatDue);
69|
70|// Test 3: Shafi
71|console.log('\n[TEST 3] SHAFI Methodology');
72|const resShafi = calculateZakat(assets, liabilities, nisabValues, 'SHAFI');
73|console.log('Methodology:', resShafi.meta.methodology);
74|console.log('Nisab Source:', resShafi.meta.nisabSource); // Should be GOLD
75|console.log('Deductible Liabilities:', resShafi.deductibleLiabilities); // Should be 5000
76|console.log('Zakat Due:', resShafi.zakatDue);
77|
78|if (resStandard.meta.nisabSource === 'GOLD' &&
79|    resHanafi.meta.nisabSource === 'SILVER' &&
80|    resHanafi.deductibleLiabilities > resStandard.deductibleLiabilities) {
81|    console.log('\n✅ VERIFICATION SUCCESS: Methodology logic is correctly applied.');
82|} else {
83|    console.error('\n❌ VERIFICATION FAILED: Logic mismatch.');
84|    process.exit(1);
85|}
86|