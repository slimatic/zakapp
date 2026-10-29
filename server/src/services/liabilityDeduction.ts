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
 * The server half of the one liability rule.
 *
 * `client/src/core/calculations/liabilityRules.ts` states the rule and both
 * client calculators route through it. The server engine applied no rule at
 * all: `zakatEngine` summed asset zakat and left `totalDeductions` at 0, so the
 * API charged 2.5% on gross wealth while the response's own `netWorth` line had
 * the debts subtracted. This module is the server's copy of the client's rule —
 * same branches, same order — so a portfolio deducts the same set on both sides.
 *
 * Rule (@faqih 2.3):
 * - A deductible amount the user confirmed is transported as-is.
 * - Immediate debts (due within ~1 lunar year, overdue included) deduct in full.
 * - A debt due further out deducts nothing until the user confirms a portion:
 *   one balance cannot yield an amortization schedule, and deducting the whole
 *   principal would zero the obligation through a mortgage.
 * - A closed (`isActive: false`) liability counts nowhere; a missing `isActive`
 *   counts as active (the schema defaults it to true).
 * - No parseable due date and no confirmed amount: not deducted.
 *
 * Which debts each school would make deductible is an open question the engine
 * never decides: every methodology applies this same stated rule.
 */

export interface LiabilityRow {
  type: string;
  name?: string | null;
  amount: number;
  currency?: string | null;
  dueDate?: Date | string | null;
  isActive?: boolean | null;
  deductibleAmount?: number | null;
}

/** ~1 lunar year (354.367d) plus the same safe buffer the client uses. */
export const HAWL_WINDOW_MS = 355 * 24 * 60 * 60 * 1000;

export const activeLiabilities = <T extends LiabilityRow>(rows: T[]): T[] =>
  rows.filter(row => row.isActive !== false);

export const deductibleLiabilityAmount = (
  liability: LiabilityRow,
  referenceDate: Date
): number => {
  if (liability.isActive === false) return 0;

  const confirmed = liability.deductibleAmount;
  if (confirmed !== null && confirmed !== undefined && confirmed > 0) {
    return new Decimal(confirmed).toNumber();
  }

  const amount = new Decimal(liability.amount || 0);
  if (!liability.dueDate) return 0;

  const dueDate = new Date(liability.dueDate);
  if (isNaN(dueDate.getTime())) return 0;

  const cutoff = new Date(referenceDate.getTime() + HAWL_WINDOW_MS);
  return dueDate <= cutoff ? amount.toNumber() : 0;
};

export const calculateDeductibleLiabilities = (
  rows: LiabilityRow[],
  referenceDate: Date
): number =>
  activeLiabilities(rows)
    .reduce(
      (total, liability) => total.plus(deductibleLiabilityAmount(liability, referenceDate)),
      new Decimal(0)
    )
    .toNumber();
