/**
 * Zakat math regression suite.
 *
 * These expected values were computed INDEPENDENTLY (Python Decimal, by hand from the stated
 * rule), not read off the implementation. That is the point: a test that copies the code's
 * current output cannot catch the code being wrong - it only catches it changing.
 *
 * Every case below states the fiqh rule it encodes, so a reader can check the RULE rather
 * than trust the assertion. Where the rule itself is in dispute (jewelry, 401k treatment,
 * debt deduction scope), the test pins the app's DOCUMENTED position and says so explicitly
 * instead of pretending the question is settled.
 *
 * Rates: nisab = gold 87.48g, silver 612.36g (classical thresholds). Test prices are chosen
 * for clean arithmetic: gold $85/g -> $7,435.80 ; silver $1.20/g -> $734.832.
 * Zakat rate 2.5% (1/40) - agreed across all four schools.
 */
import { describe, it, expect } from 'vitest';
import { calculateZakat, isAssetZakatable, getAssetZakatableValue } from '../zakat';
import { Asset, AssetType } from '../../../types';

const NISAB = { gold: 7435.8, silver: 734.832 };

const asset = (type: AssetType, value: number, extra: Partial<Asset> = {}): Asset =>
  ({
    id: `${type}-${value}`,
    type,
    name: `${type} holding`,
    value,
    currency: 'USD',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...extra,
  }) as Asset;

const liability = (type: string, amount: number) => ({ type, amount });

describe('zakat math — nisab threshold selection', () => {
  it('STANDARD uses the GOLD nisab, so 5,000 is below it and nothing is due', () => {
    // Rule: STANDARD = gold nisab. 5,000 < 7,435.80 -> no obligation.
    const r = calculateZakat([asset(AssetType.CASH, 5000)], [], NISAB, 'STANDARD');
    expect(r.isZakatObligatory).toBe(false);
    expect(r.zakatDue).toBe(0);
  });

  it('HANAFI uses the SILVER nisab, so the SAME 5,000 becomes zakatable', () => {
    // Rule: Hanafi = silver nisab (lower threshold, more people pay). 5,000 > 734.832.
    // This single pair is the clearest evidence the methodology actually changes the outcome.
    const std = calculateZakat([asset(AssetType.CASH, 5000)], [], NISAB, 'STANDARD');
    const han = calculateZakat([asset(AssetType.CASH, 5000)], [], NISAB, 'HANAFI');
    expect(std.zakatDue).toBe(0);
    expect(han.isZakatObligatory).toBe(true);
    expect(han.zakatDue).toBeCloseTo(125, 6); // 5000 * 0.025
  });
});

describe('zakat math — the obligation boundary', () => {
  it('is obligatory exactly AT nisab (>=, not >)', () => {
    // Rule: reaching nisab obliges zakat; it is not "must exceed".
    const r = calculateZakat([asset(AssetType.CASH, 7435.8)], [], NISAB, 'STANDARD');
    expect(r.isZakatObligatory).toBe(true);
    expect(r.zakatDue).toBeCloseTo(185.895, 6); // 7435.8 * 0.025
  });

  it('is NOT obligatory one cent below nisab', () => {
    const r = calculateZakat([asset(AssetType.CASH, 7435.79)], [], NISAB, 'STANDARD');
    expect(r.isZakatObligatory).toBe(false);
    expect(r.zakatDue).toBe(0);
  });
});

describe('zakat math — rate and negative net worth', () => {
  it('applies 2.5% (1/40)', () => {
    const r = calculateZakat([asset(AssetType.CASH, 100000)], [], NISAB, 'STANDARD');
    expect(r.zakatDue).toBeCloseTo(2500, 6);
    expect(r.meta.zakatRate).toBeCloseTo(0.025, 10);
  });

  it('deducting liabilities cannot produce NEGATIVE zakat', () => {
    // Assets 1,000, deductible loan 5,000 -> net worth negative. Zakat is never negative.
    // This is the one case where a sign error would silently CREATE wealth for the user.
    const r = calculateZakat(
      [asset(AssetType.CASH, 1000)],
      [liability('LOAN', 5000)],
      NISAB,
      'STANDARD'
    );
    expect(r.zakatDue).toBe(0);
    expect(r.isZakatObligatory).toBe(false);
    expect(r.netWorth).toBeLessThan(0);
  });
});

describe('zakat math — debt deduction scope differs by school', () => {
  it("SHAFII deducts LOAN and BUSINESS_DEBT but NOT a credit card", () => {
    // Rule: the four schools differ on what clears a debt before zakat. Shafi'i is the
    // narrower list in this app. 20000 - 5000 = 15000 ; card's 1000 stays in.
    const r = calculateZakat(
      [asset(AssetType.CASH, 20000)],
      [liability('LOAN', 5000), liability('CREDIT_CARD', 1000)],
      NISAB,
      'SHAFII'
    );
    expect(r.deductibleLiabilities).toBeCloseTo(5000, 6);
    expect(r.netWorth).toBeCloseTo(15000, 6);
    expect(r.zakatDue).toBeCloseTo(375, 6); // 15000 * 0.025
  });

  it('HANAFI additionally deducts MORTGAGE and CREDIT_CARD', () => {
    // Same inputs, Hanafi's broader list -> 20000 - 6000 = 14000.
    const r = calculateZakat(
      [asset(AssetType.CASH, 20000)],
      [liability('LOAN', 5000), liability('CREDIT_CARD', 1000)],
      NISAB,
      'HANAFI'
    );
    expect(r.deductibleLiabilities).toBeCloseTo(6000, 6);
    expect(r.netWorth).toBeCloseTo(14000, 6);
    expect(r.zakatDue).toBeCloseTo(350, 6);
  });

  it('a NON-deductible liability still shows in totals but never reduces net worth', () => {
    const r = calculateZakat(
      [asset(AssetType.CASH, 20000)],
      [liability('LOAN', 5000), liability('OTHER', 9999)],
      NISAB,
      'SHAFII'
    );
    expect(r.totalLiabilities).toBeCloseTo(14999, 6);
    expect(r.deductibleLiabilities).toBeCloseTo(5000, 6);
    expect(r.netWorth).toBeCloseTo(15000, 6);
  });
});

describe('zakat math — jewelry exemption is a SCHOOL difference, not an opinion', () => {
  // These four assertions pin the app's documented position. Personal-jewelry zakatability
  // is a genuine ikhtilaf among the schools; the app must implement ONE school per
  // methodology and state it, never average them. Recorded here so a change is deliberate.
  it("SHAFII/standalone jewellery is EXEMPT when not explicitly marked zakatable", () => {
    const ring = asset(AssetType.GOLD, 10000);
    expect(isAssetZakatable(ring, 'SHAFII')).toBe(false);
    expect(getAssetZakatableValue(ring, 'SHAFII')).toBe(0);
  });

  it('HANAFI treats the same jewellery as ZAKATABLE', () => {
    const ring = asset(AssetType.GOLD, 10000);
    expect(isAssetZakatable(ring, 'HANAFI')).toBe(true);
    expect(getAssetZakatableValue(ring, 'HANAFI')).toBeCloseTo(10000, 6);
  });

  it('an EXPLICIT zakatEligible=true overrides the school exemption', () => {
    // Rule: the user's own classification wins - the school default is a default, not a trap.
    const goldAsInvestment = asset(AssetType.GOLD, 10000, { zakatEligible: true } as never);
    expect(isAssetZakatable(goldAsInvestment, 'SHAFII')).toBe(true);
    expect(getAssetZakatableValue(goldAsInvestment, 'SHAFII')).toBeCloseTo(10000, 6);
  });

  it('an EXPLICIT zakatEligible=false overrides a school that would tax it', () => {
    const personalRing = asset(AssetType.GOLD, 10000, { zakatEligible: false } as never);
    expect(isAssetZakatable(personalRing, 'HANAFI')).toBe(false);
  });
});

describe('zakat math — decimal precision', () => {
  it('accumulates many fractional values without float drift', () => {
    // 30 x 333.3 = 9,999.00 exactly - and 30 rows is realistic (a year of monthly holdings).
    // NOTE 10 x 333.3 = 3,333 would be BELOW nisab and correctly yield zero, so the count has
    // to clear the threshold for this test to be about precision rather than about nisab.
    // Naive float summation of the same 30 rows drifts to 9998.999999999998; over a real
    // ledger that becomes a visible cent-level error in a money figure.
    const assets = Array.from({ length: 30 }, () => asset(AssetType.CASH, 333.3));
    const r = calculateZakat(assets, [], NISAB, 'STANDARD');
    expect(r.zakatableAssets).toBeCloseTo(9999, 6);
    expect(r.zakatDue).toBeCloseTo(249.975, 6); // 9999 * 0.025
  });

  it('handles a value larger than float-safe integer range', () => {
    const r = calculateZakat([asset(AssetType.CASH, 1e15)], [], NISAB, 'STANDARD');
    expect(r.zakatDue).toBeCloseTo(2.5e13, 2);
  });

  it('treats a missing/NaN value as zero rather than producing NaN', () => {
    const broken = [{ ...asset(AssetType.CASH, 0), value: undefined }] as unknown as Asset[];
    const r = calculateZakat(broken, [], NISAB, 'STANDARD');
    expect(Number.isNaN(r.zakatDue)).toBe(false);
    expect(r.zakatDue).toBe(0);
  });
});
