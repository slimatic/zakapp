/**
 * Guard for the asset-category case bug.
 *
 * THE DEFECT: both call sites did
 *
 *     VALID_ASSET_CATEGORY_VALUES.includes(value.toLowerCase())
 *
 * against a list holding UPPERCASE values ('CASH', 'BANK_ACCOUNT', ...).
 * `['CASH',...].includes('cash')` is false, so EVERY category was rejected and
 * POST /api/assets was unusable in production.
 *
 * WHY THIS TEST MOCKS `@zakapp/shared`:
 * The module resolves differently per tool - tsconfig maps it to
 * server/src/shared_local.ts (15 UPPERCASE values, what production runs), but
 * vitest resolves the real package (legacy 9 lowercase values). With the
 * lowercase list the broken comparison PASSES, so an unmocked test of this bug
 * is a green over nothing - which is exactly how it reached main. Mocking the
 * production vocabulary is what makes this guard bite. See #502.
 */
import { describe, it, expect, vi } from 'vitest';
import { VALID_ASSET_CATEGORY_VALUES as PROD_VALUES } from '../../shared_local';

vi.mock('@zakapp/shared', () => ({
  VALID_ASSET_CATEGORY_VALUES: PROD_VALUES,
}));

const { SimpleValidation } = await import('../../utils/SimpleValidation');

const VALID: string = (PROD_VALUES as readonly string[])[0];

function categoryErrors(value: unknown): string[] {
  const r = SimpleValidation.validateAsset({
    name: 'Test',
    category: value,
    value: 100,
    currency: 'USD',
    acquisitionDate: '2026-01-01',
  } as any);
  return (r.errors || []).filter((e: string) => e.toLowerCase().includes('category'));
}

describe('asset category validation', () => {
  it('the production vocabulary really is UPPERCASE', () => {
    // If this ever becomes lowercase, the comparison below stops being a
    // regression test and this assertion says so out loud.
    expect(VALID).toBe(VALID.toUpperCase());
    expect(VALID).not.toBe(VALID.toLowerCase());
  });

  it('accepts a canonical value', () => {
    expect(categoryErrors(VALID)).toEqual([]);
  });

  it('accepts the lowercase form - the case that was impossible before the fix', () => {
    expect(categoryErrors(VALID.toLowerCase())).toEqual([]);
  });

  it('accepts mixed case', () => {
    expect(categoryErrors(VALID.charAt(0) + VALID.slice(1).toLowerCase())).toEqual([]);
  });

  it('rejects a genuinely unknown category', () => {
    expect(categoryErrors('NOT_A_REAL_CATEGORY').length).toBeGreaterThan(0);
  });

  it('rejects non-string categories', () => {
    expect(categoryErrors(42).length).toBeGreaterThan(0);
    expect(categoryErrors(null).length).toBeGreaterThan(0);
  });
});
