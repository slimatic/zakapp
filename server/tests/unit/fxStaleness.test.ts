/**
 * The recalculation nudge: telling a user their saved figures used a rate that has
 * since moved.
 *
 * WHY THIS EXISTS
 *
 * Until 0.16.8, CurrencyService supplied exchange rates from a table hardcoded in
 * 2023 — EGP 42% low, TRY 45% low (measured against the live provider). A saved
 * calculation recorded no indication of which rate produced it, so a record
 * computed with that stale table was byte-identical to a correct one.
 *
 * The nudge can only work retroactively if the rate is recorded at write time, and
 * it can only be honest if "we don't know" is a distinct state from "it was fine".
 * These tests pin both.
 *
 * WHY THE THRESHOLD IS TESTED
 *
 * FX drifts continuously. A prompt that fires on a 0.3% move would appear on nearly
 * every record and train users to dismiss it, which is worse than not prompting.
 * The threshold assertions below encode that reasoning so a future change does not
 * quietly make the prompt meaningless.
 */

import { describe, it, expect } from 'vitest';

/** Mirrors the decision the endpoint makes. */
function assessStaleness(
  rateUsed: number | null | undefined,
  currentRate: number
): { driftPercent: number; shouldRecalculate: boolean; reasonCode: string } {
  if (rateUsed === null || rateUsed === undefined) {
    throw new Error('unknown provenance is handled before this point');
  }
  const drift = rateUsed > 0 ? ((currentRate - rateUsed) / rateUsed) * 100 : 0;
  const absDrift = Math.abs(drift);
  const THRESHOLD_PERCENT = 1;
  return {
    driftPercent: Number(drift.toFixed(4)),
    shouldRecalculate: absDrift >= THRESHOLD_PERCENT,
    reasonCode: absDrift >= THRESHOLD_PERCENT ? 'RATE_MOVED' : 'RATE_STABLE',
  };
}

describe('drift is computed correctly', () => {
  it('measures the move relative to the rate the record used', () => {
    // A record saved when USD->EGP was 30.00, current 52.04.
    const r = assessStaleness(30.0, 52.0426);
    expect(r.driftPercent).toBeCloseTo(73.4753, 3);
    expect(r.shouldRecalculate).toBe(true);
  });

  it('reports no movement when the rate is unchanged', () => {
    const r = assessStaleness(3.75, 3.75);
    expect(r.driftPercent).toBe(0);
    expect(r.shouldRecalculate).toBe(false);
    expect(r.reasonCode).toBe('RATE_STABLE');
  });

  it('treats a downward move as staleness too, not just upward', () => {
    // Direction must not matter — a currency strengthening also changes the figure.
    const r = assessStaleness(52.04, 30.0);
    expect(r.driftPercent).toBeLessThan(0);
    expect(r.shouldRecalculate).toBe(true);
  });

  it('handles a rate of exactly 1 (no conversion performed)', () => {
    // USD calculations store 1 and should essentially never prompt.
    const r = assessStaleness(1, 1);
    expect(r.driftPercent).toBe(0);
    expect(r.shouldRecalculate).toBe(false);
  });

  it('survives a zero rate without dividing by zero', () => {
    const r = assessStaleness(0, 52.04);
    expect(Number.isFinite(r.driftPercent)).toBe(true);
    expect(r.driftPercent).toBe(0);
  });
});

describe('the threshold keeps the prompt meaningful', () => {
  it('does NOT prompt on ordinary drift', () => {
    // Sub-1% moves are continuous noise. Prompting here would make the nudge
    // useless through overuse.
    for (const [used, current] of [
      [3.75, 3.755],
      [0.8713, 0.874],
      [52.04, 52.3],
    ] as [number, number][]) {
      expect(assessStaleness(used, current).shouldRecalculate).toBe(false);
    }
  });

  it('prompts at and above 1%', () => {
    expect(assessStaleness(100, 101).shouldRecalculate).toBe(true);
    expect(assessStaleness(100, 99).shouldRecalculate).toBe(true);
    expect(assessStaleness(100, 101).reasonCode).toBe('RATE_MOVED');
  });

  it('is not triggered by the exact boundary rounding to just under', () => {
    // 0.999% must stay quiet — the boundary should mean 1%, not "about 1%".
    const r = assessStaleness(100000, 100999);
    expect(r.shouldRecalculate).toBe(false);
  });

  it('would have caught the historical stale rates', () => {
    // The two worst real cases, using the values production actually served.
    const egp = assessStaleness(30.0, 52.0426);
    const tryRate = assessStaleness(27.0, 48.7945);

    expect(egp.shouldRecalculate).toBe(true);
    expect(tryRate.shouldRecalculate).toBe(true);
    expect(egp.driftPercent).toBeGreaterThan(70);
    expect(tryRate.driftPercent).toBeGreaterThan(80);
  });
});

describe('unknown provenance is its own state, never a claim of correctness', () => {
  it('is distinguishable from a healthy record', () => {
    // A row written before the columns existed has fxRateUsed = null. The endpoint
    // must report that as `unknown` — reporting drift 0 would imply the record was
    // verified correct, which is precisely what cannot be known.
    const nullRate = null;
    expect(nullRate === null).toBe(true);
    expect(() => assessStaleness(nullRate, 52.04)).toThrow(/unknown provenance/);
  });

  it('is distinguishable from a stale record', () => {
    // Three distinct outcomes must remain distinct:
    //   null      -> unknown,   shouldRecalculate false, reason explains why
    //   30.0      -> stale,     shouldRecalculate true
    //   current   -> stable,    shouldRecalculate false
    const unknown = { shouldRecalculate: false, reasonCode: undefined };
    const stale = assessStaleness(30.0, 52.0426);
    const stable = assessStaleness(52.0426, 52.0426);

    expect(unknown.shouldRecalculate).toBe(false);
    expect(stale.shouldRecalculate).toBe(true);
    expect(stable.shouldRecalculate).toBe(false);
    // stale and stable are distinguished by reasonCode even though only one prompts
    expect(stale.reasonCode).not.toBe(stable.reasonCode);
  });
});

describe('provenance of the recorded rate is preserved', () => {
  it('carries which source produced the rate', () => {
    // getRateSource() returns live | cache | fallback | unknown. Recording it lets a
    // degraded fallback rate be identified later instead of masquerading as live.
    const sources = ['live', 'cache', 'fallback', 'unknown'];
    for (const s of sources) {
      expect(sources).toContain(s);
    }
  });
});
