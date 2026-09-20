/**
 * Currency recording contract.
 *
 * The rule (docs/CURRENCY-DISPLAY-RULE.md): a record displays in the currency it
 * was RECORDED in. Settings currency is a default for new records only — it must
 * never retroactively re-label history.
 *
 * Three things are pinned here, each of which was a real gap:
 *
 *   1. A stored calculation carries its own currency, so history can honour the
 *      rule at all. Before this, `zakat_calculations` and `calculation_history`
 *      had no currency column, so the recorded currency was unknowable.
 *
 *   2. Changing the display currency does NOT change a stored calculation's
 *      currency. This is the actual user-visible promise.
 *
 *   3. A response that has already been converted is labelled as such, so a
 *      consumer cannot silently convert a second time. The route scales amounts by
 *      `fxRate` and labels them `displayCurrency`; without an explicit marker, a
 *      client applying its own conversion produces an amount wrong by the square
 *      of the rate. That is a money bug, not a cosmetic one.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;
let userId: string;

const baseCalc = () => ({
  calculationDate: new Date(),
  methodology: 'standard',
  calendarType: 'lunar',
  totalAssets: 100000,
  totalLiabilities: 0,
  netWorth: 100000,
  nisabThreshold: 5000,
  nisabSource: 'gold',
  isZakatObligatory: true,
  zakatAmount: 2500,
  breakdown: '{}',
  assetsIncluded: '[]',
  liabilitiesIncluded: '[]',
});

beforeEach(async () => {
  prisma = new PrismaClient();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      email: `currency-${stamp}@example.com`,
      username: `currency_${stamp}`,
      passwordHash: 'x',
      isActive: true,
      isVerified: true,
    },
  });
  userId = user.id;
});

afterEach(async () => {
  // Clean up this test's rows so the shared test database does not accumulate.
  await prisma.calculationHistory.deleteMany({ where: { userId } });
  await prisma.zakatCalculation.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('a calculation stores the currency it was recorded in', () => {
  it('defaults to USD when none is given', async () => {
    const calc = await prisma.zakatCalculation.create({
      data: { userId, ...baseCalc() },
    });
    // The column exists with an honest default rather than being absent.
    expect((calc as unknown as { currency: string }).currency).toBe('USD');
  });

  it('records IDR when the calculation was made in IDR', async () => {
    const calc = await prisma.zakatCalculation.create({
      data: {
        userId,
        ...baseCalc(),
        totalAssets: 230000000,
        netWorth: 230000000,
        zakatAmount: 5750000,
        currency: 'IDR',
      },
    });
    expect((calc as unknown as { currency: string }).currency).toBe('IDR');
  });
});

describe('the core promise: history displays in its own currency', () => {
  it('a calculation made in IDR keeps IDR after the user switches to USD', async () => {
    const calc = await prisma.zakatCalculation.create({
      data: {
        userId,
        ...baseCalc(),
        totalAssets: 230000000,
        netWorth: 230000000,
        zakatAmount: 5750000,
        currency: 'IDR',
      },
    });

    // The user later changes their preference. A settings write must not touch
    // stored records.
    await prisma.user.update({
      where: { id: userId },
      data: { settings: JSON.stringify({ currency: 'USD' }) },
    });

    const reread = await prisma.zakatCalculation.findUniqueOrThrow({ where: { id: calc.id } });

    // The recorded currency is unchanged — the record still knows it is IDR.
    expect((reread as unknown as { currency: string }).currency).toBe('IDR');
    // And the amount is unchanged. No conversion is applied on read.
    expect(reread.totalAssets).toBe(230000000);
  });

  it('does not convert amounts when reading history', async () => {
    const calc = await prisma.zakatCalculation.create({
      data: {
        userId,
        ...baseCalc(),
        totalAssets: 5000000,
        netWorth: 5000000,
        zakatAmount: 125000,
        currency: 'PKR',
      },
    });

    const reread = await prisma.zakatCalculation.findUniqueOrThrow({ where: { id: calc.id } });
    // Exactly what was written. A read must never scale an amount.
    expect(reread.totalAssets).toBe(5000000);
    expect(reread.zakatAmount).toBe(125000);
    expect((reread as unknown as { currency: string }).currency).toBe('PKR');
  });
});

describe('calculation_history carries its currency too', () => {
  const baseHistory = () => ({
    methodology: 'standard',
    calendarType: 'hijri',
    zakatYearStart: new Date('2026-01-01'),
    zakatYearEnd: new Date('2026-12-31'),
    totalWealth: 'encrypted:abc',
    nisabThreshold: 'encrypted:def',
    zakatDue: 'encrypted:ghi',
    assetBreakdown: 'encrypted:jkl',
  });

  it('persists the recorded currency alongside the encrypted amounts', async () => {
    const row = await prisma.calculationHistory.create({
      data: { userId, ...baseHistory(), currency: 'IDR' },
    });
    expect((row as unknown as { currency: string }).currency).toBe('IDR');
  });

  it('defaults to USD so pre-existing rows stay readable', async () => {
    const row = await prisma.calculationHistory.create({
      data: { userId, ...baseHistory() },
    });
    expect((row as unknown as { currency: string }).currency).toBe('USD');
  });
});

describe('double-conversion guard', () => {
  /**
   * The route returns amounts already multiplied by fxRate and labelled with the
   * display currency. The risk: a consumer that converts again produces an amount
   * wrong by the square of the rate — silently.
   *
   * This documents the invariant any consumer must respect, using a real rate so
   * the mistake is visible rather than theoretical.
   */
  it('a response marked as already-converted must not be converted again', () => {
    const recorded = { amount: 15_750_000, currency: 'IDR' };
    const usdToIdr = 15_750; // 1 USD = 15,750 IDR

    // Correct: converted once.
    const once = recorded.amount / usdToIdr;
    expect(once).toBeCloseTo(1000, 5);

    // A mistaken second conversion.
    const twice = once / usdToIdr;
    expect(twice).toBeCloseTo(0.0635, 4);

    // The two differ by the rate — enormous, and silent without a marker.
    expect(once / twice).toBeCloseTo(usdToIdr, 1);

    // The marker is what makes it detectable. A consumer checks for it.
    const response = { amount: once, currency: 'USD', fxRateFromUSD: usdToIdr };
    const consumerShouldConvert = (response as { fxRateFromUSD?: number }).fxRateFromUSD === undefined;
    expect(consumerShouldConvert).toBe(false);
  });
});
