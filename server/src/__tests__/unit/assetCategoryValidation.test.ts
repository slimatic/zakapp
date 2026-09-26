/**
 * Guard for the asset-category case bug.
 *
 * THE DEFECT: two call sites did
 *
 *     VALID_ASSET_CATEGORY_VALUES.includes(value.toLowerCase())
 *
 * against a list holding UPPERCASE values ('CASH', 'BANK_ACCOUNT', …). No input
 * satisfies that, so POST /api/assets rejected every payload. The check was
 * unsatisfiable, not strict.
 *
 * WHY THIS FILE MOCKS THE CONSTANT:
 *
 * `@zakapp/shared` resolves differently per tool. tsconfig maps it to
 * server/src/shared_local.ts — 15 UPPERCASE values, what production bundles, and
 * where the defect was live. vitest aliases it to shared/src/constants.ts, a
 * legacy 9-value LOWERCASE list.
 *
 * That difference is exactly why the bug survived CI: with a lowercase list,
 * `['cash',…].includes('cash'.toLowerCase())` is TRUE, so the broken comparison
 * passes under vitest while failing in production. A test that inherits the
 * aliased list therefore cannot see the defect at all — verified by mutating the
 * fix back and watching such a test stay green.
 *
 * So this suite pins the UPPERCASE vocabulary to match production. Without the
 * mock the guard is inert.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@zakapp/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@zakapp/shared')>();
  return {
    ...actual,
    // The production vocabulary (server/src/shared_local.ts).
    VALID_ASSET_CATEGORY_VALUES: [
      'CASH', 'BANK_ACCOUNT', 'GOLD', 'SILVER', 'CRYPTOCURRENCY',
      'BUSINESS_INVENTORY', 'INVESTMENT_ACCOUNT', 'LOAN_RECEIVABLE',
      'PRIMARY_RESIDENCE', 'PERSONAL_VEHICLE', 'HOUSEHOLD_ITEMS',
      'PROFESSIONAL_EQUIPMENT', 'RENTAL_PROPERTY', 'BUSINESS_FIXED_ASSETS',
      'LIVESTOCK',
    ],
  };
});

import { SimpleValidation } from '../../utils/SimpleValidation';
import { VALID_ASSET_CATEGORY_VALUES } from '@zakapp/shared';

const CATEGORY_ERROR = 'Category must be one of';

function categoryRejected(category: string): boolean {
  const r = SimpleValidation.validateAsset({
    category, name: 'X', value: 1, currency: 'USD',
  });
  return r.errors.some((e) => e.includes(CATEGORY_ERROR));
}

describe('asset category validation (production vocabulary)', () => {
  it('the mock really installed the uppercase list', () => {
    // Guards this suite: if the mock stops applying, the assertions below go
    // inert again and this fails first.
    expect(VALID_ASSET_CATEGORY_VALUES).toContain('CASH');
    expect(VALID_ASSET_CATEGORY_VALUES.length).toBe(15);
  });

  it('accepts every uppercase value', () => {
    for (const c of VALID_ASSET_CATEGORY_VALUES) {
      expect(categoryRejected(String(c)), `${c} must be accepted`).toBe(false);
    }
  });

  it('accepts the lowercase spelling of the same values', () => {
    for (const c of VALID_ASSET_CATEGORY_VALUES) {
      expect(categoryRejected(String(c).toLowerCase()), `${c} lowercase`).toBe(false);
    }
  });

  it('still rejects a genuinely invalid category', () => {
    expect(categoryRejected('NOT_A_REAL_CATEGORY')).toBe(true);
  });

  it('rejects the legacy 9-value names that are no longer categories', () => {
    // 'property' and 'expenses' come from the other vocabulary. They are not in
    // the production list, so accepting them would be a different bug.
    expect(categoryRejected('property')).toBe(true);
    expect(categoryRejected('expenses')).toBe(true);
  });
});
