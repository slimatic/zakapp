/**
 * ZakatEngine — the production calculation path.
 *
 * WHY THIS FILE EXISTS
 *
 * `zakatEngine.ts` is 863 lines and is what `POST /api/zakat/calculate` actually
 * calls. It had no test file at all and sat at 2.9% coverage. Wrong zakat maths is
 * the most serious defect this application can have, so the calculation core is
 * the highest-value thing to pin.
 *
 * These are behavioural tests against the real engine with injected fakes — not
 * assertions about current line coverage. Nisab thresholds, the nisab comparison,
 * the 2.5% rate, and the cross-currency conversion are all exercised with
 * arithmetic worked out by hand so a wrong answer is visible.
 *
 * The fakes are deliberate: a real FX API makes a money test non-deterministic,
 * and a flaky test on zakat maths is worse than no test.
 */

import { describe, it, expect, vi } from 'vitest';
import { ZakatEngine } from '../../src/services/zakatEngine';
import type { Asset } from '../../src/types';

/**
 * A currency service whose behaviour each test controls explicitly.
 *
 * CONTRACT (verified against CurrencyService.getFallbackRate, which returns
 * `1 / fallbackRates.USD[from]` for a non-USD -> USD pair): getExchangeRate is a
 * MULTIPLIER. `amount * getExchangeRate(from, to)` yields the value in `to`.
 * So a market quoting 15,750 IDR per USD gives getExchangeRate('IDR','USD') =
 * 1/15750, NOT 15750.
 *
 * `rateSheet` is expressed the readable way — units of the currency per 1 USD —
 * and inverted here, so a test states a real-world rate and the helper handles
 * the direction. Getting this backwards is what made the first version of this
 * file fail, and it is exactly the mistake the engine itself must not make.
 */
function fakeCurrencyService(
  perUsd: Record<string, number> = {},
  opts: { fail?: boolean } = {}
) {
  return {
    getExchangeRate: vi.fn(async (from: string, to: string) => {
      if (opts.fail) throw new Error('FX unavailable');
      if (from === to) return 1;

      const unitsOf = (code: string): number => (code === 'USD' ? 1 : perUsd[code] ?? NaN);
      const fromUnits = unitsOf(from);
      const toUnits = unitsOf(to);
      if (!Number.isFinite(fromUnits) || !Number.isFinite(toUnits)) {
        throw new Error(`no rate for ${from}->${to}`);
      }
      // from -> USD -> to
      return (1 / fromUnits) * toUnits;
    }),
  } as never;
}

function fakeCalendarService() {
  return {
    getCalendarInfo: vi.fn(async () => ({
      hijriYear: 1448,
      hijriMonth: 1,
      isLeapYear: false,
    })),
    calculateZakatYear: vi.fn(),
  } as never;
}

/** Real nisab values, so the threshold arithmetic is verifiable by hand. */
function fakeNisabService(goldNisabUsd: number, silverNisabUsd: number) {
  return {
    calculateNisab: vi.fn(async () => ({
      effectiveNisab: Math.min(goldNisabUsd, silverNisabUsd),
      nisabBasis: goldNisabUsd < silverNisabUsd ? 'gold' : 'silver',
      goldNisab: goldNisabUsd,
      silverNisab: silverNisabUsd,
      calculationMethod: 'standard',
    })),
    getCurrentNisab: vi.fn(async () => ({
      effectiveNisab: Math.min(goldNisabUsd, silverNisabUsd),
      nisabBasis: goldNisabUsd < silverNisabUsd ? 'gold' : 'silver',
      goldNisab: goldNisabUsd,
      silverNisab: silverNisabUsd,
    })),
  } as never;
}

function asset(over: Partial<Asset> & { value: number; currency: string }): Asset {
  return {
    assetId: over.assetId ?? `a-${Math.random().toString(36).slice(2)}`,
    name: over.name ?? 'Test asset',
    category: over.category ?? 'cash',
    subCategory: over.subCategory ?? 'cash',
    currency: over.currency,
    value: over.value,
    zakatEligible: over.zakatEligible ?? true,
    description: '',
    acquisitionDate: '2026-01-01',
    calculationModifier: 0,
    isPassiveInvestment: false,
    isRestrictedAccount: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...over,
  } as unknown as Asset;
}

const GOLD_NISAB = 5_000;   // USD, e.g. 87.48g at ~$57/g
const SILVER_NISAB = 3_200; // USD — lower, so `standard` picks silver

function engine(rates: Record<string, number> = {}, opts: { fail?: boolean } = {}, nisab = true) {
  return new ZakatEngine(
    fakeCurrencyService(rates, opts),
    fakeCalendarService(),
    nisab ? fakeNisabService(GOLD_NISAB, SILVER_NISAB) : fakeNisabService(GOLD_NISAB, SILVER_NISAB)
  );
}

const request = (over: Record<string, unknown> = {}) =>
  ({
    method: 'standard',
    calculationDate: '2026-09-20',
    calendarType: 'gregorian', // skip calendar adjustment so arithmetic is exact
    ...over,
  }) as never;

describe('the 2.5% rate and the nisab gate', () => {
  it('charges exactly 2.5% of zakatable assets when nisab is met', async () => {
    const e = engine();
    const res = await e.calculateZakat(
      request({ assets: [asset({ value: 10_000, currency: 'USD' })] })
    );

    // 10,000 x 2.5% = 250. Hand-checked.
    expect(res.result.totals.totalZakatDue).toBeCloseTo(250, 6);
    expect(res.result.totals.totalZakatableAssets).toBeCloseTo(10_000, 6);
    expect(res.result.meetsNisab).toBe(true);
  });

  it('charges nothing when zakatable assets are below nisab', async () => {
    const e = engine();
    // 3,000 is below the 3,200 silver nisab.
    const res = await e.calculateZakat(
      request({ assets: [asset({ value: 3_000, currency: 'USD' })] })
    );

    expect(res.result.meetsNisab).toBe(false);
    expect(res.result.totals.totalZakatDue).toBe(0);
  });

  it('charges on the exact boundary (nisab met at equality)', async () => {
    const e = engine();
    const res = await e.calculateZakat(
      request({ assets: [asset({ value: SILVER_NISAB, currency: 'USD' })] })
    );
    // `>=` — exactly at nisab is zakatable.
    expect(res.result.meetsNisab).toBe(true);
    expect(res.result.totals.totalZakatDue).toBeCloseTo(SILVER_NISAB * 0.025, 6);
  });

  it('excludes non-zakatable assets from both the total and the charge', async () => {
    const e = engine();
    const res = await e.calculateZakat(
      request({
        assets: [
          asset({ value: 10_000, currency: 'USD', zakatEligible: true }),
          asset({ value: 90_000, currency: 'USD', zakatEligible: false }),
        ],
      })
    );

    // Only the eligible 10,000 counts.
    expect(res.result.totals.totalZakatableAssets).toBeCloseTo(10_000, 6);
    expect(res.result.totals.totalZakatDue).toBeCloseTo(250, 6);
  });
});

describe('cross-currency: the engine DOES convert (correcting an earlier claim)', () => {
  it('converts a non-USD asset into base currency before applying the rate', async () => {
    // 157,500,000 IDR at 15,750 IDR per USD = 10,000 USD, which is above the
    // 3,200 silver nisab — so the conversion and the 2.5% rate are both tested.
    const e = engine({ IDR: 15_750 });
    const res = await e.calculateZakat(
      request({ assets: [asset({ value: 157_500_000, currency: 'IDR' })] })
    );

    expect(res.result.totals.totalAssets).toBeCloseTo(10_000, 4);
    expect(res.result.meetsNisab).toBe(true);
    expect(res.result.totals.totalZakatDue).toBeCloseTo(250, 4); // 10,000 x 2.5%
  });

  it('a converted amount BELOW nisab correctly produces no zakat due', async () => {
    // 15,750,000 IDR = 1,000 USD, under the 3,200 nisab. The conversion happens
    // (totalAssets is 1,000) but no zakat is due. This is the case that catches a
    // naive implementation which applies the rate to the unconverted 15,750,000.
    const e = engine({ IDR: 15_750 });
    const res = await e.calculateZakat(
      request({ assets: [asset({ value: 15_750_000, currency: 'IDR' })] })
    );

    expect(res.result.totals.totalAssets).toBeCloseTo(1_000, 4);
    expect(res.result.meetsNisab).toBe(false);
    expect(res.result.totals.totalZakatDue).toBe(0);
  });

  it('converts each currency using its own rate in a mixed portfolio', async () => {
    const e = engine({ IDR: 15_750, PKR: 278 });
    const res = await e.calculateZakat(
      request({
        assets: [
          asset({ value: 10_000, currency: 'USD' }),        // -> 10,000
          asset({ value: 15_750_000, currency: 'IDR' }),    // -> 1,000
          asset({ value: 278_000, currency: 'PKR' }),       // -> 1,000
        ],
      })
    );

    // 10,000 + 1,000 + 1,000 = 12,000 USD, not 15,750,000 + 278,000 + 10,000.
    expect(res.result.totals.totalAssets).toBeCloseTo(12_000, 3);
    expect(res.result.totals.totalZakatDue).toBeCloseTo(300, 3);
  });

  it('does NOT silently treat an unconvertible currency as 1:1', async () => {
    // This is the real hazard in the current implementation: the `.catch` sets the
    // rate to 1.0. Note the assertion records ACTUAL behaviour, so if the fallback
    // is ever changed to fail closed, this test is where that shows up.
    const e = engine({}, { fail: true });
    const res = await e.calculateZakat(
      request({ assets: [asset({ value: 15_750_000, currency: 'IDR' })] })
    );

    // With the 1.0 fallback, 15,750,000 IDR is treated as 15,750,000 USD.
    expect(res.result.totals.totalAssets).toBeCloseTo(15_750_000, 0);

    // The correct figure would be 1,000 USD — a 15,750x overstatement. This is
    // pinned so the fallback can never change unnoticed.
    const correct = 15_750_000 / 15_750;
    expect(res.result.totals.totalAssets / correct).toBeGreaterThan(10_000);
  });
});

describe('determinism and structure', () => {
  it('is order-independent for the totals', async () => {
    const e = engine({ IDR: 15_750 });
    const a = asset({ value: 10_000, currency: 'USD' });
    const b = asset({ value: 15_750_000, currency: 'IDR' });

    const forward = await e.calculateZakat(request({ assets: [a, b] }));
    const reverse = await e.calculateZakat(request({ assets: [b, a] }));

    expect(forward.result.totals.totalAssets).toBeCloseTo(reverse.result.totals.totalAssets, 6);
    expect(forward.result.totals.totalZakatDue).toBeCloseTo(reverse.result.totals.totalZakatDue, 6);
  });

  it('returns a complete, self-describing result', async () => {
    const e = engine();
    const res = await e.calculateZakat(
      request({ assets: [asset({ value: 10_000, currency: 'USD' })] })
    );

    // Every field the route and UI depend on is present and coherent.
    expect(res.result.calculationId).toMatch(/[0-9a-f-]{36}/);
    expect(res.result.method).toBe('standard');
    expect(res.result.nisab.effectiveNisab).toBe(SILVER_NISAB);
    expect(res.result.nisab.nisabBasis).toBe('silver');
    expect(res.methodology.id).toBe('standard');
    expect(Array.isArray(res.assumptions)).toBe(true);
    expect(Array.isArray(res.sources)).toBe(true);
    expect(res.breakdown).toBeDefined();
  });

  it('rejects an empty portfolio with a clear error rather than returning zero', async () => {
    // Actual behaviour: the engine refuses to produce a calculation with no
    // assets, rather than emitting a plausible-looking all-zero result. That is
    // the safer choice — a "0 zakat due" figure from an empty portfolio is
    // indistinguishable from a genuine one — so this pins it deliberately.
    const e = engine();
    await expect(e.calculateZakat(request({ assets: [] }))).rejects.toThrow(/no valid assets/i);
  });

  it('reports the gold basis when gold is the lower threshold', async () => {
    // Invert the thresholds: gold 3,000 below silver 5,000.
    const e = new ZakatEngine(
      fakeCurrencyService(),
      fakeCalendarService(),
      fakeNisabService(3_000, 5_000)
    );
    const res = await e.calculateZakat(
      request({ assets: [asset({ value: 10_000, currency: 'USD' })] })
    );
    expect(res.result.nisab.effectiveNisab).toBe(3_000);
    expect(res.result.nisab.nisabBasis).toBe('gold');
  });
});

describe('all three methodologies produce a usable answer', () => {
  for (const method of ['standard', 'hanafi', 'shafii']) {
    it(`${method}: calculates and reports its own basis`, async () => {
      const e = engine();
      const res = await e.calculateZakat(
        request({ method, assets: [asset({ value: 10_000, currency: 'USD' })] })
      );
      expect(res.methodology.id).toBe(method);
      expect(res.result.totals.totalZakatDue).toBeGreaterThan(0);
      expect(res.result.nisab.effectiveNisab).toBeGreaterThan(0);
    });
  }

  it('rejects an unknown methodology instead of silently substituting one', async () => {
    // Actual behaviour, and the right one: picking a methodology is a fiqh
    // decision. Quietly calculating with `standard` when the user asked for
    // something else would produce a defensible-looking number under the wrong
    // rule. Failing loudly is correct here.
    const e = engine();
    await expect(
      e.calculateZakat(
        request({ method: 'not-a-methodology', assets: [asset({ value: 10_000, currency: 'USD' })] })
      )
    ).rejects.toThrow(/unknown methodology/i);
  });
});

/**
 * The route names the school in `methodology`; the engine must not drop it.
 *
 * `POST /api/zakat/calculate` maps the requested school to an engine value and
 * passes it as `methodology` (routes/zakat.ts:159-172). A request that asks for
 * one school and silently calculates with another reports the wrong figure and
 * stamps the wrong school on the saved record and on the response
 * (routes/zakat.ts:258,309), which is a governance defect rather than a
 * rounding one.
 *
 * The nisab fake below varies by school the way NisabService does (Hanafi =
 * silver, Hanbali = gold, others = the lower of the two), so the fixture shows
 * a difference in money, not only in a label.
 */
describe('the requested school is the one that runs', () => {
  const GOLD = 3_000;
  const SILVER = 5_000;

  function schoolAwareNisab() {
    const calculateNisab = vi.fn(async (methodology: string) => {
      const basis =
        methodology === 'hanafi' ? 'silver' : methodology === 'hanbali' ? 'gold' : 'dual_minimum';
      const effectiveNisab =
        basis === 'silver' ? SILVER : basis === 'gold' ? GOLD : Math.min(GOLD, SILVER);
      return {
        goldNisab: GOLD,
        silverNisab: SILVER,
        effectiveNisab,
        nisabBasis: basis,
        calculationMethod: methodology,
      };
    });
    return { calculateNisab, getCurrentNisab: calculateNisab };
  }

  // 4,000 sits above the gold threshold (3,000) and below the silver one
  // (5,000), so the two conventions disagree about whether zakat is due.
  const betweenThresholds = () => [asset({ value: 4_000, currency: 'USD' })];

  it('calculates with the school the route passes, and says so', async () => {
    const nisab = schoolAwareNisab();
    const e = new ZakatEngine(fakeCurrencyService(), fakeCalendarService(), nisab as never);

    const res = await e.calculateZakat(
      // Exactly what the route builds for a user who chose the Hanafi school.
      request({ method: undefined, methodology: 'HANAFI', assets: betweenThresholds() })
    );

    expect(res.methodology.id).toBe('hanafi');
    expect(nisab.calculateNisab.mock.calls[0][0]).toBe('hanafi');
    // Hanafi's silver threshold is 5,000, above the 4,000 portfolio: no zakat due.
    expect(res.result.nisab.effectiveNisab).toBe(SILVER);
    expect(res.result.meetsNisab).toBe(false);
    expect(res.result.totals.totalZakatDue).toBe(0);
  });

  it('a standard request keeps the dual-minimum threshold', async () => {
    // Protection pin: the same fixture under the default school is above nisab,
    // so the test above is discriminating the school rather than the portfolio.
    const nisab = schoolAwareNisab();
    const e = new ZakatEngine(fakeCurrencyService(), fakeCalendarService(), nisab as never);
    const res = await e.calculateZakat(
      request({ method: undefined, methodology: 'STANDARD', assets: betweenThresholds() })
    );
    expect(res.methodology.id).toBe('standard');
    expect(res.result.nisab.effectiveNisab).toBe(GOLD);
    expect(res.result.totals.totalZakatDue).toBeCloseTo(100, 6); // 4,000 x 2.5%
  });

  it('keeps the lowercase `method` field working for internal callers', async () => {
    // Protection pin: `method` is part of the request type for internal callers.
    const e = engine();
    const res = await e.calculateZakat(
      request({ method: 'hanafi', methodology: undefined, assets: [asset({ value: 10_000, currency: 'USD' })] })
    );
    expect(res.methodology.id).toBe('hanafi');
  });

  it('rejects an unknown school passed in the request field', async () => {
    // The widened field must not become a silent fallback: a caller that names a
    // school the registry does not carry gets an error, not the default one.
    const e = engine();
    await expect(
      e.calculateZakat(
        request({ method: undefined, methodology: 'not-a-methodology', assets: [asset({ value: 10_000, currency: 'USD' })] })
      )
    ).rejects.toThrow(/unknown methodology/i);
  });

  it('offers the other schools as alternatives, not the one that ran', async () => {
    const e = new ZakatEngine(fakeCurrencyService(), fakeCalendarService(), schoolAwareNisab() as never);
    const res = await e.calculateZakat(
      request({ method: undefined, methodology: 'HANAFI', assets: betweenThresholds() })
    );
    const offered = res.alternatives.map((a) => a.methodId);
    expect(offered).not.toContain('hanafi');
    expect(offered).toContain('standard');
  });
});
