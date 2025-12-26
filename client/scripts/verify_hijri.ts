// @ts-nocheck

// Script to verify Hijri Calculation logic
// Run with: npx ts-node -O '{"module":"commonjs"}' scripts/verify_hijri.ts

// MOCK the import because we are running outside of webpack/vite context
// and we need to point to the source file we just wrote.
// But ts-node might complain about imports.
// We will simply import the file if ts-node handles it, or mock it here for simplicity
// if complexity arises. 
// Let's try to require it relative to the script location.

const { toHijri, toGregorian } = require('hijri-converter');

// We copy the function logic here for verifying the ALGORITHM itself, 
// to avoid path/module resolution headaches with Client (ESM) vs Script (CJS).
// The goal is to verify the 'hijri-converter' behaves as expected.

function dateToHijri(date: Date) {
    const { hy, hm, hd } = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return { year: hy, month: hm, day: hd };
}

function hijriToDate(hijri: { year: number, month: number, day: number }) {
    const { gy, gm, gd } = toGregorian(hijri.year, hijri.month, hijri.day);
    return new Date(gy, gm - 1, gd); // Local time
}

function addHawl(startDate: Date) {
    const hijri = dateToHijri(startDate);
    const nextYear = hijri.year + 1;
    return hijriToDate({
        year: nextYear,
        month: hijri.month,
        day: hijri.day
    });
}

console.log("--- Verifying Hijri Calculations ---");

// Test Case 1: Ramadan 1, 1445 -> Ramadan 1, 1446
// Ramadan is Month 9.
// 1445 Ramadan 1 approx March 11, 2024
const ramadan1445 = hijriToDate({ year: 1445, month: 9, day: 1 });
console.log(`Ramadan 1, 1445 is approx: ${ramadan1445.toDateString()}`);

const nextHawl = addHawl(ramadan1445);
console.log(`+1 Hawl (Ramadan 1, 1446) is: ${nextHawl.toDateString()}`);

const nextHijri = dateToHijri(nextHawl);
console.log(`Converted back to Hijri: ${nextHijri.year}-${nextHijri.month}-${nextHijri.day}`);

if (nextHijri.year === 1446 && nextHijri.month === 9 && nextHijri.day === 1) {
    console.log("PASS: Exact Hawl match.");
} else {
    console.error("FAIL: Date drift detected.");
    process.exit(1);
}

// Test Case 2: Duration Check
const diffTime = Math.abs(nextHawl.getTime() - ramadan1445.getTime());
const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Round to ignore usage of DST
console.log(`Duration of 1445 AH: ${diffDays} days`);

if (diffDays >= 354 && diffDays <= 355) {
    console.log("PASS: Lunar year duration is valid (354-355 days).");
} else {
    console.error(`FAIL: Lunar year duration invalid (${diffDays} days).`);
    process.exit(1);
}
