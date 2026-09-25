/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { Decimal } from 'decimal.js';

/**
 * Prefix for a zero-knowledge ciphertext blob (see CryptoService.ZK_PREFIX).
 * Duplicated as a plain string rather than imported so this module stays free of
 * the crypto service's dependencies - it is used in import paths where pulling in
 * the whole key-management stack would be wrong.
 */
const ZK_PREFIX = 'ZK1:';

/**
 * Safely parse a string/number input into a Decimal for financial calculations.
 * Falls back to 0 on invalid input to prevent NaN propagation.
 *
 * @param value - Raw input (string from form field, number, undefined, null)
 * @returns Decimal instance (never null/undefined)
 */
export function parseDecimal(value: string | number | undefined | null): Decimal {
  if (value === undefined || value === null || value === '') {
    return new Decimal(0);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return new Decimal(0);
    return new Decimal(value);
  }
  const trimmed = String(value).trim();
  if (trimmed === '') return new Decimal(0);
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return new Decimal(0);
  return new Decimal(trimmed);
}

/**
 * Convenience: parse and return as number.
 * Use this for form state that stores numbers (not Decimals).
 */
export function parseDecimalNumber(value: string | number | undefined | null): number {
  return parseDecimal(value).toNumber();
}

/**
 * Import-path variant of parseAmountFromImport: reject rather than record a wrong
 * amount.
 *
 * Use this anywhere a value from a user-supplied file becomes a money field. A
 * backup restore is the one flow where the user has ALREADY lost data once, so a
 * silent zero or a plausible-looking wrong figure is the worst possible outcome -
 * nothing appears broken and they stop looking for the real problem.
 *
 * Callers that must tolerate junk (a CSV column that is sometimes blank) should
 * keep using parseAmountFromImport and handle the NaN themselves.
 */
export function requireImportedAmount(value: unknown, context: string): number {
  if (value === undefined || value === null || value === '') return 0;

  const parsed = parseAmountFromImport(value);
  if (Number.isFinite(parsed)) return parsed;

  const encrypted = typeof value === 'string' && value.startsWith(ZK_PREFIX);
  throw new Error(
    encrypted
      ? context + ': value is still encrypted (ZK1). Unlock the vault with the original password ' +
        'and re-export - importing this would record a wrong amount.'
      : context + ': not a valid amount (got ' + JSON.stringify(value) + '). ' +
        'Import stopped rather than record a wrong value.'
  );
}

/**
 * True when a value looks like an un-decrypted vault blob. Export paths check this
 * so a backup can never quietly ship ciphertext where a number should be.
 */
export function looksEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(ZK_PREFIX);
}

/**
 * Field names whose value must be a plain number in a backup.
 *
 * A leak here means a MONEY field went out un-decrypted, which restores into a
 * wrong balance. Deliberately NOT every encrypted field: `user_settings` keeps
 * profileName/firstName/lastName/email encrypted by design and that repository
 * never decrypts them, so flagging those would block every export on earth
 * while protecting nothing financial.
 */
const MONEY_FIELDS = new Set([
  'value', 'amount', 'deductibleAmount',
  'totalWealth', 'totalLiabilities', 'zakatableWealth', 'zakatAmount',
  'nisabThreshold', 'netWorth', 'totalAssets', 'calculationModifier',
  'exchangeRate', 'zakatRate',
]);

/**
 * Scan an export payload for ciphertext sitting in a money field.
 *
 * The export path reads collections that decrypt lazily, so a lock-state or a
 * failed decryption can leave a ZK1 blob where an amount belongs. Shipping that
 * in a "backup" is how a user ends up with a file that restores into broken
 * numbers - and they only discover it when they need the backup.
 *
 * @returns offending "path" strings; empty means the export is safe to write.
 */
export function findEncryptedLeaks(payload: unknown, path = ''): string[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((item, i) => findEncryptedLeaks(item, `${path}[${i}]`));
  }
  if (payload && typeof payload === 'object') {
    return Object.entries(payload as Record<string, unknown>).flatMap(([k, v]) => {
      const here = path ? `${path}.${k}` : k;
      if (MONEY_FIELDS.has(k) && looksEncrypted(v)) return [here];
      return findEncryptedLeaks(v, here);
    });
  }
  // No bare-value fallback on purpose. Without a field name we cannot tell a
  // leaked ciphertext from a legitimately encrypted string (asset `name`, a
  // receipt reference, a profile field), and a false positive here blocks the
  // user's export entirely - the opposite of the goal. Money fields are named.
  return [];
}

/**
 * Parse an amount that may have been written by ANY past version of this app.
 *
 * Older exports wrote formatted strings (`$1,234,567.89`, `IDR 15.750.000`,
 * `Rp 1.500.000`) rather than raw numbers. `parseFloat` on those returns NaN,
 * and callers coercing with `|| 0` silently turned a user's re-imported records
 * into zeroes. This accepts both shapes.
 *
 * The grouping rule is the subtle one: `1.500.000` is 1.5 million (dots group)
 * while `1234.56` has a real decimal. Rule used: when a separator appears more
 * than once it is grouping; when it appears once, it is a decimal only if the
 * trailing group is not exactly 3 digits (`1.500` -> 1500, `1234.56` -> 1234.56).
 *
 * @returns a finite number, or NaN when truly unparseable so callers can decide.
 */
export function parseAmountFromImport(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (value === null || value === undefined) return NaN;

  let s = String(value).replace(/"/g, '').trim();
  if (s === '') return NaN;

  // A ciphertext blob is NOT an amount. Without this the symbol-stripping below
  // turns base64 into a believable number: 'ZK1:xG9kLm2nPq:8fJ2kL9mQ3vX' -> 1928293.
  // A wrong-but-plausible figure is far more dangerous than a rejection, because
  // nothing about it looks broken. Callers decide what to do with NaN.
  if (s.startsWith(ZK_PREFIX)) return NaN;

  // Drop a leading ISO code (USD, IDR, SAR…) then any remaining symbols.
  s = s.replace(/^[A-Za-z]{2,3}\s*/, '').replace(/[^\d.,\-+]/g, '');
  if (s === '' || s === '-' || s === '+') return NaN;

  const negative = s.startsWith('-');
  s = s.replace(/^[-+]/, '');

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  let normalised: string;

  if (hasComma && hasDot) {
    normalised =
      s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.') // 1.500.000,25
        : s.replace(/,/g, '');                   // 1,500,000.25
  } else if (hasDot) {
    const parts = s.split('.');
    normalised =
      parts.length > 2
        ? parts.join('')                         // 1.500.000 -> 1500000
        : parts.length === 2 && parts[1].length !== 3
          ? s                                    // 1234.56 -> 1234.56
          : parts.join('');                      // 1.500 -> 1500
  } else if (hasComma) {
    const parts = s.split(',');
    normalised =
      parts.length > 2
        ? parts.join('')
        : parts.length === 2 && parts[1].length !== 3
          ? s.replace(',', '.')                  // 1234,56 -> 1234.56
          : parts.join('');                      // 1,500 -> 1500
  } else {
    normalised = s;
  }

  const n = Number(normalised);
  if (!Number.isFinite(n)) return NaN;
  return negative ? -n : n;
}

