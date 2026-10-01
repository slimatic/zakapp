/**
 * Regression coverage for two Calculator defects found in QA on the dev stack.
 *
 * 1. Selecting a methodology showed "Failed to save methodology preference".
 *    MethodologySelector hand-rolled a fetch reading `localStorage.getItem('token')`,
 *    a key NOTHING writes — the session writes `accessToken`. So it sent
 *    `Authorization: Bearer null` and the server answered 401.
 *
 * 2. The Review step showed "$0.00" and "Below Nisab Threshold ($NaN)" for a user
 *    above nisab. `GET /api/zakat/nisab` returns NESTED objects
 *    (`goldPrice: { pricePerGram }`), but the code read `nisabInfo.goldPrice` as a
 *    number. `object * 87.48` is NaN, and `total >= NaN` is false, so the
 *    obligation silently never triggered and zakatDue stayed 0.
 */

import { describe, it, expect } from 'vitest';
import { calculateNisabThreshold, normalizeNisabPayload } from '../../core/calculations/nisab';
import { calculateZakat } from '../../core/calculations/zakat';
import { AssetType } from '../../types/index';

/** The real shape returned by GET /api/zakat/nisab?currency=USD. */
const serverPayload = {
  effectiveDate: '2026-09-26T11:39:35.026Z',
  currency: 'USD',
  goldPrice: { pricePerGram: 133.89346136259718, currency: 'USD', nisabGrams: 87.48, nisabValue: 11713 },
  silverPrice: { pricePerGram: 2.011316872427983, currency: 'USD', nisabGrams: 612.36, nisabValue: 1231.65 },
  recommendation: 'silver',
  lastUpdated: '2026-09-26T11:39:35.027Z',
  source: 'Nisab',
};

describe('normalizeNisabPayload', () => {
  it('reads per-gram prices out of the nested server payload', () => {
    const data = normalizeNisabPayload(serverPayload);

    expect(data.goldPrice).toBe(serverPayload.goldPrice.pricePerGram);
    expect(data.silverPrice).toBe(serverPayload.silverPrice.pricePerGram);
  });

  it('produces a finite threshold from the nested payload', () => {
    const threshold = calculateNisabThreshold(normalizeNisabPayload(serverPayload), 'STANDARD');
    expect(Number.isFinite(threshold)).toBe(true);

    // Gold nisab: 133.89/g * 87.48g
    expect(threshold).toBeCloseTo(11713, 0);
  });

  it('still accepts a flat numeric payload', () => {
    const data = normalizeNisabPayload({ goldPrice: 65, silverPrice: 0.8 });
    expect(data.goldPrice).toBe(65);
    expect(data.silverPrice).toBe(0.8);
  });

  it('falls back per price, not all-or-nothing', () => {
    // One price missing must not poison the other one.
    const data = normalizeNisabPayload({ goldPrice: { pricePerGram: 133.89 } });
    expect(data.goldPrice).toBe(133.89);
    expect(Number.isFinite(data.silverPrice)).toBe(true);
  });

  it('falls back entirely when given nothing usable', () => {
    for (const bad of [null, undefined, {}, { goldPrice: null, silverPrice: {} }]) {
      const data = normalizeNisabPayload(bad as any);
      expect(Number.isFinite(data.goldPrice)).toBe(true);
      expect(Number.isFinite(data.silverPrice)).toBe(true);
    }
  });

  it('documents the defect: reading the object as a number is NaN', () => {
    expect(Number.isNaN(Number(serverPayload.goldPrice) * 87.48)).toBe(true);
  });
});

describe('zakat obligation for the reported portfolio', () => {
  // The user's Review screen: $153,950.33 of assets, all zakatable.
  const assets = [
    { id: 'a1', name: 'Bank', type: AssetType.CASH, value: 153950.33, currency: 'USD' } as any,
  ];

  it('triggers the obligation and a nonzero due once the threshold is finite', () => {
    const data = normalizeNisabPayload(serverPayload);
    const nisabValues = {
      gold: data.goldPrice * data.goldNisabGrams,
      silver: data.silverPrice * data.silverNisabGrams,
    };

    const result = calculateZakat(assets, [], nisabValues, 'STANDARD');

    expect(result.isZakatObligatory).toBe(true);
    expect(result.zakatDue).toBeGreaterThan(0);
    expect(Number.isFinite(result.zakatDue)).toBe(true);
  });

  it('documents why the bug showed $0.00 rather than an error', () => {
    // A comparison against NaN is always false, so the obligation never fires.
    // Nothing throws — it reads as a calculation, not a failure.
    expect(153950.33 >= NaN).toBe(false);
  });
});
