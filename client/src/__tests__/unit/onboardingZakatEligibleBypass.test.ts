/**
 * #517 / #521 — an asset the user never classified must let the methodology rule.
 *
 * The onboarding wizard used to write `zakatEligible: true` for every asset it
 * created (ReviewStep.tsx:199). `isAssetZakatable` checked that flag before the
 * methodology, so the `jewelryExempt` branch was unreachable for every
 * wizard-created asset — a Shafi'i or Maliki user was shown "personal jewelry is
 * exempt" while the calculation taxed it, and /nisab-records credited them with
 * an override they never made.
 *
 * The wizard now writes `null` ("leave it to the methodology"), and only a real
 * answer (`true`/`false`) overrides the school. These assertions are the inverse
 * of the characterisation test that preceded the fix.
 */
import { describe, it, expect } from 'vitest';
import { isAssetZakatable } from '../../core/calculations/zakat';
import { normalizeZakatEligibility } from '../../core/calculations/zakatEligibility';
import { AssetType } from '../../types';

/** What onboarding now creates: the type, and the explicit "not answered". */
const unclassified = (type: AssetType, name: string) =>
  ({ id: 'a1', name, type, value: 100, zakatEligible: null } as any);

describe('an unanswered asset defers to the methodology', () => {
  it("Shafi'i and Maliki exempt personal jewelry", () => {
    const gold = unclassified(AssetType.GOLD, 'Gold Assets');
    expect(isAssetZakatable(gold, 'SHAFII')).toBe(false);
    expect(isAssetZakatable(gold, 'MALIKI')).toBe(false);
    const silver = unclassified(AssetType.SILVER, 'Silver Assets');
    expect(isAssetZakatable(silver, 'SHAFII')).toBe(false);
  });

  it('Hanafi counts jewelry regardless (unchanged)', () => {
    const gold = unclassified(AssetType.GOLD, 'Gold Assets');
    expect(isAssetZakatable(gold, 'HANAFI')).toBe(true);
  });

  it('STANDARD sets no jewelryExempt, so jewelry stays zakatable', () => {
    const gold = unclassified(AssetType.GOLD, 'Gold Assets');
    expect(isAssetZakatable(gold, 'STANDARD')).toBe(true);
  });

  it('treats undefined (legacy rows) exactly like null', () => {
    const legacy = { id: 'a1', name: 'Gold Assets', type: AssetType.GOLD, value: 100 } as any;
    expect(isAssetZakatable(legacy, 'SHAFII')).toBe(false);
    expect(isAssetZakatable(legacy, 'HANAFI')).toBe(true);
  });
});

describe('an explicit answer still overrides the school', () => {
  it('zakatEligible=true with the manual marker makes exempt jewelry zakatable', () => {
    const gold = {
      id: 'a1', name: 'Gold', type: AssetType.GOLD, value: 100,
      zakatEligible: true, isEligibilityManual: true,
    } as any;
    expect(isAssetZakatable(gold, 'SHAFII')).toBe(true);
  });

  it('a zakatEligible=true the user never set does NOT override the school', () => {
    // The onboarding-wizard case that #521 is about: flag written on the user's
    // behalf, no marker. The school must rule.
    const wizardGold = { id: 'a1', name: 'Gold', type: AssetType.GOLD, value: 100, zakatEligible: true } as any;
    expect(isAssetZakatable(wizardGold, 'SHAFII')).toBe(false);
    expect(isAssetZakatable(wizardGold, 'HANAFI')).toBe(true);
  });

  it('zakatEligible=false exempts an otherwise zakatable asset', () => {
    // An exemption is honoured regardless of the marker: the wizard only ever
    // wrote `true`, so a `false` is never the bug this issue is about.
    const car = { id: 'a1', name: 'Car', type: AssetType.CASH, value: 1, zakatEligible: false } as any;
    expect(isAssetZakatable(car, 'HANAFI')).toBe(false);
  });
});

describe('a mis-spelled methodology silently falls back to STANDARD (still open)', () => {
  it("'SHAFI' is not a registry key, so getMethodology returns STANDARD", () => {
    const legacy = { id: 'a1', name: 'Gold', type: AssetType.GOLD, value: 100 } as any;
    // Registry keys are SHAFII/MALIKI/HANBALI. This is a separate defect from
    // #517 — tracked so a future fix cannot silently restore it. See #521.
    // Cast: 'SHAFI' is deliberately not a MethodologyName, which is the point.
    expect(isAssetZakatable(legacy, 'SHAFI' as any)).toBe(true);
  });
});

describe('normalizeZakatEligibility', () => {
  it('keeps real answers and maps everything else to "defer"', () => {
    expect(normalizeZakatEligibility(true)).toBe(true);
    expect(normalizeZakatEligibility(false)).toBe(false);
    expect(normalizeZakatEligibility(null)).toBe(null);
    expect(normalizeZakatEligibility(undefined)).toBe(null);
    // Older rows stringified the value.
    expect(normalizeZakatEligibility('true')).toBe(true);
    expect(normalizeZakatEligibility('false')).toBe(false);
    expect(normalizeZakatEligibility('null')).toBe(null);
    expect(normalizeZakatEligibility('')).toBe(null);
    // Unrecognised input is "not answered", never an assumed yes.
    expect(normalizeZakatEligibility('maybe')).toBe(null);
    expect(normalizeZakatEligibility(0)).toBe(null);
  });
});
