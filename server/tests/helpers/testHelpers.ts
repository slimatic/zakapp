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

1|/**
2| * Test Helper Utilities
3| * Provides consistent test data structures across all integration tests
4| */
5|
6|/**
7| * Creates a valid asset payload for POST /api/assets
8| * Maps test-friendly parameters to actual API requirements
9| */
10|export function createAssetPayload(params: {
11|  name: string;
12|  category: 'cash' | 'gold' | 'silver' | 'crypto' | 'business' | 'investment' | 'property' | 'other';
13|  value: number;
14|  currency?: string;
15|  acquisitionDate?: Date;
16|  notes?: string;
17|  isPassiveInvestment?: boolean;
18|  isRestrictedAccount?: boolean;
19|}) {
20|  return {
21|    name: params.name,
22|    category: params.category,
23|    value: params.value,
24|    currency: params.currency || 'USD',
25|    acquisitionDate: params.acquisitionDate || new Date(),
26|    notes: params.notes,
27|    isPassiveInvestment: params.isPassiveInvestment || false,
28|    isRestrictedAccount: params.isRestrictedAccount || false,
29|  };
30|}
31|
32|/**
33| * Creates an update payload for PUT /api/assets/:id
34| */
35|export function createAssetUpdatePayload(params: {
36|  value?: number;
37|  name?: string;
38|  notes?: string;
39|}) {
40|  return {
41|    ...(params.value !== undefined && { value: params.value }),
42|    ...(params.name && { name: params.name }),
43|    ...(params.notes && { notes: params.notes }),
44|  };
45|}
46|
47|/**
48| * Extracts asset ID from response
49| */
50|export function extractAssetId(response: any): string {
51|  // Handle both response formats
52|  return response.body.asset?.id || response.body.data?.asset?.id || response.body.id;
53|}
54|
55|/**
56| * Extracts asset value from response
57| */
58|export function extractAssetValue(response: any): number {
59|  return response.body.asset?.value || response.body.data?.asset?.value || response.body.value;
60|}
61|