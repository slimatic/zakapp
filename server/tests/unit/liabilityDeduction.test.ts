/**
 * Liabilities reach the server's zakat figure.
 *
 * WHY THIS FILE EXISTS
 *
 * `POST /api/zakat/calculate` fetched the user's liabilities, reported them in
 * the breakdown, and then computed zakat on gross wealth: `zakatEngine` summed
 * asset zakat and left `finalCalculation.totalDeductions` at a literal 0. A user
 * with 10,000 in cash and a 5,000 debt received a summary whose own `netWorth`
 * said 5,000 while `zakatAmount` charged 2.5% of 10,000 — the response
 * contradicted itself and the user overpaid by the rate on every dollar owed.
 *
 * The client had one rule (`client/src/core/calculations/liabilityRules.ts`);
 * the server had none. These tests pin the server's copy of that rule and the
 * engine's use of it, with arithmetic worked out by hand.
 */

import { describe, it, expect, vi } from 'vitest';
import { ZakatEngine } from '../../src/services/zakatEngine';
import {
  calculateDeductibleLiabilities,
  deductibleLiabilityAmount,
  type LiabilityRow,
} from '../../src/services/liabilityDeduction';
import type { Asset } from '../../src/types';

const DAY = 24 * 60 * 60 * 1000;
const REF = new Date('2026-09-20T00:00:00.000Z');

function liability(over: Partial<LiabilityRow> = {}): LiabilityRow {
  return { type: 'LOAN', amount: 5_000, ...over };
}

describe('the one liability rule, server side', () => {
  it('deducts a debt due within the coming lunar year in full', () => {
    // 30 days from the reference date — plainly immediate.
    const due = new Date(REF.getTime() + 30 * DAY);
    expect(deductibleLiabilityAmount(liability({ dueDate: due }), REF)).toBe(5_000);
  });

  it('deducts a past-due debt — it is already owed', () => {
    const due = new Date(REF.getTime() - 90 * DAY);
    expect(deductibleLiabilityAmount(liability({ dueDate: due }), REF)).toBe(5_000);
  });

  it('deducts nothing for a debt due beyond the lunar year', () => {
    // A mortgage balance three years out: one balance cannot yield an
    // amortization schedule, and deducting the principal would zero the zakat.
    const due = new Date(REF.getTime() + 3 * 365 * DAY);
    expect(deductibleLiabilityAmount(liability({ dueDate: due }), REF)).toBe(0);
  });

  it('transports a user-confirmed portion verbatim, whatever the due date', () => {
    const due = new Date(REF.getTime() + 3 * 365 * DAY);
    expect(
      deductibleLiabilityAmount(liability({ dueDate: due, deductibleAmount: 1_200 }), REF)
    ).toBe(1_200);
  });

  it('gives no deduction when there is no due date and no confirmed amount', () => {
    expect(deductibleLiabilityAmount(liability({ dueDate: null }), REF)).toBe(0);
    expect(deductibleLiabilityAmount(liability({ dueDate: 'not-a-date' }), REF)).toBe(0);
  });

  it('counts a missing isActive as active and a closed liability as nothing', () => {
    const due = new Date(REF.getTime() + 10 * DAY);
    expect(deductibleLiabilityAmount(liability({ dueDate: due, isActive: undefined }), REF)).toBe(5_000);
    expect(deductibleLiabilityAmount(liability({ dueDate: due, isActive: false }), REF)).toBe(0);
  });

  it('sums only the deductible rows', () => {
    const soon = new Date(REF.getTime() + 10 * DAY);
    const far = new Date(REF.getTime() + 3 * 365 * DAY);
    const rows = [
      liability({ amount: 2_000, dueDate: soon }),
      liability({ amount: 9_000, dueDate: far }),      // beyond the window: 0
      liability({ amount: 7_000, dueDate: soon, isActive: false }), // closed: 0
    ];
    expect(calculateDeductibleLiabilities(rows, REF)).toBe(2_000);
  });
});

/* ---------- the engine, with the same fakes the engine suite uses ---------- */

function fakeCurrencyService() {
  return { getExchangeRate: vi.fn(async (from: string, to: string) => (from === to ? 1 : 1)) } as never;
}
function fakeCalendarService() {
  return {
    getCalendarInfo: vi.fn(async () => ({ hijriYear: 1448, hijriMonth: 1, isLeapYear: false })),
    calculateZakatYear: vi.fn(),
  } as never;
}
function fakeNisabService(goldUsd: number, silverUsd: number) {
  return {
    calculateNisab: vi.fn(async () => ({
      effectiveNisab: Math.min(goldUsd, silverUsd),
      nisabBasis: goldUsd < silverUsd ? 'gold' : 'silver',
      goldNisab: goldUsd,
      silverNisab: silverUsd,
      calculationMethod: 'standard',
    })),
    getCurrentNisab: vi.fn(async () => ({
      effectiveNisab: Math.min(goldUsd, silverUsd),
      nisabBasis: goldUsd < silverUsd ? 'gold' : 'silver',
      goldNisab: goldUsd,
      silverNisab: silverUsd,
    })),
  } as never;
}

const GOLD_NISAB = 5_000;   // USD
const SILVER_NISAB = 3_200; // USD — lower, so `standard` picks silver

function cash(value: number): Asset {
  return {
    assetId: `a-${value}`,
    name: 'Cash',
    category: 'cash',
    subCategory: 'cash',
    currency: 'USD',
    value,
    zakatEligible: true,
    description: '',
    acquisitionDate: '2026-01-01',
    calculationModifier: 0,
    isPassiveInvestment: false,
    isRestrictedAccount: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  } as unknown as Asset;
}

function engine() {
  return new ZakatEngine(
    fakeCurrencyService(),
    fakeCalendarService(),
    fakeNisabService(GOLD_NISAB, SILVER_NISAB)
  );
}

const request = (over: Record<string, unknown> = {}) =>
  ({
    method: 'standard',
    calculationDate: '2026-09-20',
    calendarType: 'gregorian', // no calendar factor: the arithmetic is exact
    ...over,
  }) as never;

describe('the engine deducts what the rule allows', () => {
  it('charges 2.5% on wealth net of an immediate debt', async () => {
    const res = await engine().calculateZakat(
      request({ assets: [cash(10_000)], deductibleLiabilities: 5_000 })
    );

    // (10,000 - 5,000) x 2.5% = 125. Hand-checked.
    expect(res.result.totals.totalZakatDue).toBeCloseTo(125, 6);
    expect(res.result.totals.netZakatableAssets).toBeCloseTo(5_000, 6);
    expect(res.breakdown.finalCalculation?.totalDeductions).toBeCloseTo(5_000, 6);
    expect(res.breakdown.finalCalculation?.zakatableAmount).toBeCloseTo(5_000, 6);
  });

  it('drops below nisab when the deduction takes the portfolio under it', async () => {
    // 4,000 - 1,000 = 3,000, under the 3,200 silver nisab: nothing due.
    const res = await engine().calculateZakat(
      request({ assets: [cash(4_000)], deductibleLiabilities: 1_000 })
    );

    expect(res.result.meetsNisab).toBe(false);
    expect(res.result.totals.totalZakatDue).toBe(0);
  });

  it('never nets below zero when debts exceed assets', async () => {
    const res = await engine().calculateZakat(
      request({ assets: [cash(10_000)], deductibleLiabilities: 20_000 })
    );

    expect(res.result.totals.netZakatableAssets).toBe(0);
    expect(res.result.totals.totalZakatDue).toBe(0);
  });

  it('leaves the arithmetic untouched when nothing is deductible', async () => {
    const res = await engine().calculateZakat(
      request({ assets: [cash(10_000)], deductibleLiabilities: 0 })
    );

    // 10,000 x 2.5% = 250 — the same figure the release candidate shipped.
    expect(res.result.totals.totalZakatDue).toBeCloseTo(250, 6);
  });
});
