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

1|// @ts-nocheck
2|
3|// Script to verify Hijri Calculation logic
4|// Run with: npx ts-node -O '{"module":"commonjs"}' scripts/verify_hijri.ts
5|
6|// MOCK the import because we are running outside of webpack/vite context
7|// and we need to point to the source file we just wrote.
8|// But ts-node might complain about imports.
9|// We will simply import the file if ts-node handles it, or mock it here for simplicity
10|// if complexity arises. 
11|// Let's try to require it relative to the script location.
12|
13|const { toHijri, toGregorian } = require('hijri-converter');
14|
15|// We copy the function logic here for verifying the ALGORITHM itself, 
16|// to avoid path/module resolution headaches with Client (ESM) vs Script (CJS).
17|// The goal is to verify the 'hijri-converter' behaves as expected.
18|
19|function dateToHijri(date: Date) {
20|    const { hy, hm, hd } = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
21|    return { year: hy, month: hm, day: hd };
22|}
23|
24|function hijriToDate(hijri: { year: number, month: number, day: number }) {
25|    const { gy, gm, gd } = toGregorian(hijri.year, hijri.month, hijri.day);
26|    return new Date(gy, gm - 1, gd); // Local time
27|}
28|
29|function addHawl(startDate: Date) {
30|    const hijri = dateToHijri(startDate);
31|    const nextYear = hijri.year + 1;
32|    return hijriToDate({
33|        year: nextYear,
34|        month: hijri.month,
35|        day: hijri.day
36|    });
37|}
38|
39|console.log("--- Verifying Hijri Calculations ---");
40|
41|// Test Case 1: Ramadan 1, 1445 -> Ramadan 1, 1446
42|// Ramadan is Month 9.
43|// 1445 Ramadan 1 approx March 11, 2024
44|const ramadan1445 = hijriToDate({ year: 1445, month: 9, day: 1 });
45|console.log(`Ramadan 1, 1445 is approx: ${ramadan1445.toDateString()}`);
46|
47|const nextHawl = addHawl(ramadan1445);
48|console.log(`+1 Hawl (Ramadan 1, 1446) is: ${nextHawl.toDateString()}`);
49|
50|const nextHijri = dateToHijri(nextHawl);
51|console.log(`Converted back to Hijri: ${nextHijri.year}-${nextHijri.month}-${nextHijri.day}`);
52|
53|if (nextHijri.year === 1446 && nextHijri.month === 9 && nextHijri.day === 1) {
54|    console.log("PASS: Exact Hawl match.");
55|} else {
56|    console.error("FAIL: Date drift detected.");
57|    process.exit(1);
58|}
59|
60|// Test Case 2: Duration Check
61|const diffTime = Math.abs(nextHawl.getTime() - ramadan1445.getTime());
62|const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Round to ignore usage of DST
63|console.log(`Duration of 1445 AH: ${diffDays} days`);
64|
65|if (diffDays >= 354 && diffDays <= 355) {
66|    console.log("PASS: Lunar year duration is valid (354-355 days).");
67|} else {
68|    console.error(`FAIL: Lunar year duration invalid (${diffDays} days).`);
69|    process.exit(1);
70|}
71|