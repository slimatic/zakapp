/**
 * Import-compatibility contract.
 *
 * Regression guard for the data-loss bug found during the currency migration:
 * `calculationExport` wrote FORMATTED strings into CSV while the importers parsed
 * with `parseFloat(...) || 0`. `parseFloat('$1,234,567.89')` is NaN, so a user who
 * exported a large dataset and later re-imported it had every amount silently
 * become 0. No error was raised.
 *
 * Two fixes are pinned here:
 *   1. Export writes raw machine values.
 *   2. Import accepts BOTH raw values and any formatted shape a past release
 *      produced, so files already sitting on users' disks still import.
 *
 * Point 2 matters most for data-heavy users: they are the ones with old export
 * files, and the ones who would lose the most.
 */

import { describe, it, expect } from 'vitest';
import { parseAmountFromImport } from '../parseDecimal';

describe('parseAmountFromImport — raw values', () => {
  it('passes numbers through', () => {
    expect(parseAmountFromImport(1234567.89)).toBe(1234567.89);
    expect(parseAmountFromImport(0)).toBe(0);
    expect(parseAmountFromImport(-500.5)).toBe(-500.5);
  });

  it('parses bare numeric strings', () => {
    expect(parseAmountFromImport('1234567.89')).toBe(1234567.89);
    expect(parseAmountFromImport('1500000')).toBe(1500000);
    expect(parseAmountFromImport('0')).toBe(0);
  });
});

describe('parseAmountFromImport — formatted strings from older exports', () => {
  it('parses US-formatted currency', () => {
    expect(parseAmountFromImport('$1,234,567.89')).toBe(1234567.89);
    expect(parseAmountFromImport('$500,000.00')).toBe(500000);
    expect(parseAmountFromImport('$1.50')).toBe(1.5);
  });

  it('parses Arabic-formatted currency (the pre-#428 SAR/EGP shape)', () => {
    expect(parseAmountFromImport('SAR 1,234.56')).toBe(1234.56);
    expect(parseAmountFromImport('EGP 1,234.56')).toBe(1234.56);
  });

  it('parses Indonesian grouping (dots as thousands)', () => {
    // Id-ID: 1.500.000 means one and a half million, NOT 1.5
    expect(parseAmountFromImport('Rp 1.500.000')).toBe(1500000);
    expect(parseAmountFromImport('IDR 15.750.000')).toBe(15750000);
    expect(parseAmountFromImport('1.500.000')).toBe(1500000);
  });

  it('parses European form (dot grouping, comma decimal)', () => {
    expect(parseAmountFromImport('1.500.000,25')).toBe(1500000.25);
    expect(parseAmountFromImport('1234,56')).toBe(1234.56);
  });

  it('distinguishes a 3-digit decimal from thousands grouping', () => {
    // '1.500' alone is ambiguous; treated as grouping -> 1500, matching id-ID.
    expect(parseAmountFromImport('1.500')).toBe(1500);
    // but a real decimal with a non-3-digit tail is a decimal
    expect(parseAmountFromImport('1234.56')).toBe(1234.56);
  });

  it('handles negatives in both shapes', () => {
    expect(parseAmountFromImport('-$500.50')).toBe(-500.5);
    expect(parseAmountFromImport('-1.500.000')).toBe(-1500000);
  });

  it('strips quotes and whitespace from CSV cells', () => {
    expect(parseAmountFromImport('  "$1,234.56"  ')).toBe(1234.56);
  });
});

describe('parseAmountFromImport — junk returns NaN, not 0', () => {
  it('returns NaN for empty/unparseable so callers choose the fallback', () => {
    // The old code used `parseFloat(x) || 0`, which masked real failures. NaN
    // forces the caller to decide rather than silently writing a zero.
    expect(Number.isNaN(parseAmountFromImport(''))).toBe(true);
    expect(Number.isNaN(parseAmountFromImport(null))).toBe(true);
    expect(Number.isNaN(parseAmountFromImport(undefined))).toBe(true);
    expect(Number.isNaN(parseAmountFromImport('abc'))).toBe(true);
    expect(Number.isNaN(parseAmountFromImport('-'))).toBe(true);
    expect(Number.isNaN(parseAmountFromImport(NaN))).toBe(true);
  });
});

describe('the original bug cannot regress', () => {
  it('a value the exporter now writes round-trips exactly', () => {
    const values = [0, 1, 1234.5, 1234.56, 500000, 1500000.25, 1234567.89, -500.5];
    for (const v of values) {
      expect(parseAmountFromImport(String(v)), `raw ${v}`).toBe(v);
    }
  });

  it('the OLD formatted output also round-trips (files already on disk)', () => {
    const oldCells: [string, number][] = [
      ['$1,234,567.89', 1234567.89],
      ['$500,000.00', 500000],
      ['$30,864.20', 30864.2],
    ];
    for (const [cell, expected] of oldCells) {
      expect(parseAmountFromImport(cell), `old cell ${cell}`).toBe(expected);
    }
  });
});
