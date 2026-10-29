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

import { Liability } from '../../types';
import { Decimal } from 'decimal.js';

/**
 * The one liability vocabulary and the one deduction rule every calculator
 * applies, so the same portfolio deducts the same set on every surface.
 *
 * Rule (@faqih 2.3 — stated by the year-record calculator and the liability
 * form's own guidance):
 * - A deductible amount the user confirmed is transported as-is; it is never
 *   re-derived from the liability's type.
 * - Immediate debts (due within ~1 lunar year, overdue included): fully
 *   deductible.
 * - A debt due further out deducts nothing until the user confirms its portion
 *   (for example their next installment): a single balance cannot yield an
 *   amortization schedule, and deducting the whole principal would zero out
 *   the obligation through a mortgage.
 * - A closed (isActive: false) liability counts nowhere; a missing isActive
 *   counts as active (the schema defaults it to true).
 * - No parseable due date and no confirmed amount: not deducted — the receiver
 *   keeps the benefit of the doubt.
 *
 * Which debts each school would make deductible is an open question the engine
 * never decides: every methodology applies this same stated rule.
 */

/**
 * The canonical (lowercase) liability categories. An unrecognized value — for
 * example a legacy import — classifies as itself, lowercased; it is never
 * guessed into another category, because the user's typing is a fact.
 */
export const canonicalLiabilityType = (type: string): string =>
    (type || '').toString().trim().toLowerCase() || 'other';

/**
 * The one lifecycle rule for liability totals (mirroring ./activeAssets):
 * only an explicit `isActive: false` excludes — the schema defaults a missing
 * value to true, so an absent field is a liability the user still owes.
 */
export const activeLiabilities = (liabilities: Liability[]): Liability[] =>
    liabilities.filter(liability => liability.isActive !== false);

export const deductibleLiabilityAmount = (liability: Liability, referenceDate: Date): number => {
    if (liability.isActive === false) return 0;

    const confirmed = liability.deductibleAmount;
    if (confirmed !== null && confirmed !== undefined && confirmed > 0) {
        return new Decimal(confirmed).toNumber();
    }

    const amount = new Decimal(liability.amount || 0);
    const dueDate = new Date(liability.dueDate);

    // No date to lean on: not deducted (precaution).
    if (isNaN(dueDate.getTime())) return 0;

    // Due within the coming lunar year deducts in full. Past-due debts are
    // included: they are already owed.
    const hawlDurationMs = 355 * 24 * 60 * 60 * 1000; // ~1 Lunar Year (safe buffer)
    const cutoffDate = new Date(referenceDate.getTime() + hawlDurationMs);
    if (dueDate <= cutoffDate) return amount.toNumber();

    return 0;
};

/**
 * The shared sum: every engine routes liability deduction through these
 * functions, so the two calculators cannot disagree on the set.
 */
export const calculateDeductibleLiabilities = (liabilities: Liability[], referenceDate: Date): number => {
    let totalDeductible = new Decimal(0);
    activeLiabilities(liabilities).forEach(liability => {
        totalDeductible = totalDeductible.plus(deductibleLiabilityAmount(liability, referenceDate));
    });
    return totalDeductible.toNumber();
};