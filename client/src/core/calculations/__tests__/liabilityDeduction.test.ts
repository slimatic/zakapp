/**
 * Copyright (c) 2024 ZakApp Contributors
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

/**
 * Liability deduction: the one rule both calculator engines apply.
 *
 * Expected values are computed by hand from the stated rule, not read off the
 * implementation. The rule:
 * - A deductible amount the user confirmed is transported verbatim; it is never
 *   re-derived from the liability's type.
 * - Otherwise a liability due within ~1 lunar year (355 days) of the reference
 *   date — overdue included — deducts in full.
 * - A debt due further out, with no confirmed portion, deducts nothing.
 * - A closed (isActive: false) liability counts nowhere; a missing isActive
 *   counts as active (the schema defaults it to true).
 * - A liability with no parseable due date and no confirmed amount deducts
 *   nothing (the receiver keeps the benefit of the doubt).
 * The methodology chooses the nisab source and the jewelry exemption; it does
 * not change this deduction set. Which debts each school would make deductible
 * is an open question left to a qualified scholar — the engine never picks one.
 */
import { describe, it, expect } from 'vitest';
import { calculateZakat, ZakatMethodology } from '../zakat';
import { calculateWealth } from '../wealthCalculator';
import { Asset, AssetType, Liability } from '../../../types';

const REF = new Date('2024-01-01T00:00:00Z');
const NISAB = { gold: 7435.8, silver: 734.832 };

const cash = (value: number): Asset => ({
  id: 'a1',
  type: AssetType.CASH,
  name: 'Cash',
  value,
  currency: 'USD',
  isActive: true,
  createdAt: '',
  updatedAt: '',
});

const liability = (extra: Partial<Liability>): Liability => ({
  id: 'l1',
  userId: 'u1',
  name: 'Debt',
  type: 'short_term',
  amount: 1000,
  currency: 'USD',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  dueDate: '2024-03-01T00:00:00Z', // within the 355-day window from REF
  ...extra,
} as Liability);

const bothEngines = (
  liabilities: Liability[],
  methodology: ZakatMethodology = 'STANDARD'
) => ({
  calc: calculateZakat([cash(20000)], liabilities, NISAB, methodology, REF),
  wealth: calculateWealth([cash(20000)], liabilities, REF, methodology),
});

describe('liability deduction — the rule both engines share', () => {
  it('a debt due within the year deducts on the Calculator', () => {
    const { calc } = bothEngines([liability({})]);
    expect(calc.deductibleLiabilities).toBe(1000);
    expect(calc.netWorth).toBe(19000);
    expect(calc.zakatDue).toBeCloseTo(475, 6); // 19000 x 0.025
  });

  it('both engines deduct the same set for the same debts', () => {
    const { calc, wealth } = bothEngines([
      liability({}),
      liability({ id: 'l2', type: 'long_term', amount: 500, dueDate: '2030-01-01T00:00:00Z' }),
    ]);
    expect(calc.deductibleLiabilities).toBe(wealth.deductibleLiabilities);
    expect(calc.deductibleLiabilities).toBe(1000);
  });

  it('a user-confirmed deductible amount is transported verbatim, on both engines', () => {
    // 10,000 due 2030 with the user's confirmed 1,200 portion.
    const { calc, wealth } = bothEngines([
      liability({
        type: 'long_term',
        amount: 10000,
        deductibleAmount: 1200,
        dueDate: '2030-01-01T00:00:00Z',
      }),
    ]);
    expect(calc.deductibleLiabilities).toBe(1200);
    expect(wealth.deductibleLiabilities).toBe(1200);
  });

  it('a closed liability counts nowhere', () => {
    // 1,000 active + 5,000 closed: the closed debt reaches neither the totals
    // nor the deduction on either engine.
    const { calc, wealth } = bothEngines([
      liability({ id: 'active', amount: 1000 }),
      liability({ id: 'closed', amount: 5000, isActive: false }),
    ]);
    expect(calc.totalLiabilities).toBe(1000);
    expect(calc.deductibleLiabilities).toBe(1000);
    expect(wealth.deductibleLiabilities).toBe(1000);
  });

  it('a debt missing isActive (raw payload) counts as active on both engines', () => {
    const raw = liability({ id: 'raw', amount: 400 });
    delete (raw as Record<string, unknown>).isActive;

    const { calc, wealth } = bothEngines([raw]);
    expect(calc.deductibleLiabilities).toBe(400);
    expect(wealth.deductibleLiabilities).toBe(400);
  });

  it('the methodology never changes the deduction set', () => {
    const debts = [
      liability({}),
      liability({ id: 'card', type: 'credit_card', amount: 500 }),
    ];
    for (const methodology of ['STANDARD', 'SHAFII', 'HANAFI'] as const) {
      const { calc, wealth } = bothEngines(debts, methodology);
      expect(calc.deductibleLiabilities, methodology).toBe(1500);
      expect(wealth.deductibleLiabilities, methodology).toBe(1500);
    }
  });

  it('a debt due beyond the year with no confirmed portion is owed but not deducted', () => {
    const { calc, wealth } = bothEngines([
      liability({ type: 'long_term', amount: 50000, dueDate: '2025-06-01T00:00:00Z' }),
    ]);
    expect(calc.totalLiabilities).toBe(50000);
    expect(calc.deductibleLiabilities).toBe(0);
    expect(wealth.deductibleLiabilities).toBe(0);
    expect(wealth.netZakatableWealth).toBe(20000);
  });

  it('a past-due debt is still owed and deducts', () => {
    const { calc, wealth } = bothEngines([
      liability({ dueDate: '2023-12-01T00:00:00Z', amount: 500 }),
    ]);
    expect(calc.deductibleLiabilities).toBe(500);
    expect(wealth.deductibleLiabilities).toBe(500);
  });

  it('a liability with an unparseable date and no confirmed portion deducts nothing', () => {
    const { calc, wealth } = bothEngines([liability({ dueDate: 'not-a-date', amount: 700 })]);
    expect(calc.deductibleLiabilities).toBe(0);
    expect(wealth.deductibleLiabilities).toBe(0);
    expect(calc.totalLiabilities).toBe(700);
  });

  it('one vocabulary: mixed-case and legacy types file into one canonical set', () => {
    const { calc } = bothEngines([
      liability({ id: 'a', type: 'short_term', amount: 1000 }),
      liability({ id: 'b', type: 'SHORT_TERM', amount: 2000 }),
      liability({ id: 'c', type: 'LOAN', amount: 4000 }),
    ]);
    // All three are due within the window, so all 7,000 deduct together, and
    // they classify under one vocabulary rather than three spellings.
    expect(calc.deductibleLiabilities).toBe(7000);
    expect(Object.keys(calc.breakdown.liabilities).sort()).toEqual(['loan', 'short_term']);
  });
});