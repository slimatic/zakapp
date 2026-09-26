/**
 * Proves the onboarding defect: assets created by the wizard carry
 * `zakatEligible: true` (ReviewStep hardcodes it), and `isAssetZakatable`
 * checks that flag BEFORE consulting the methodology — so the school's
 * jewelry ruling never applies to a wizard-created asset.
 */
import { describe, it, expect } from 'vitest';
import { isAssetZakatable } from '../../core/calculations/zakat';
import { AssetType } from '../../types';

/** What onboarding creates: type + the hardcoded flag, no other signals. */
const onboardingAsset = (type: AssetType, name: string) =>
  ({ id: 'a1', name, type, value: 100, zakatEligible: true } as any);

describe('onboarding zakatEligible hardcode bypasses the methodology', () => {
  it('Shafi\'i exempts personal jewelry only when the flag is ABSENT', () => {
    const noFlag = { id: 'a1', name: 'Gold', type: AssetType.GOLD, value: 100 } as any;
    // Absent flag -> methodology consulted -> Shafi'i exempts jewelry.
    // NB: the registry key is 'SHAFII'; passing 'SHAFI' silently falls back to
    // STANDARD (see the case below), which is how a caller gets the wrong rules.
    expect(isAssetZakatable(noFlag, 'SHAFII')).toBe(false);
    expect(isAssetZakatable(noFlag, 'MALIKI')).toBe(false);
    // STANDARD sets no jewelryExempt, so it treats jewelry as zakatable.
    expect(isAssetZakatable(noFlag, 'STANDARD')).toBe(true);
  });

  it('a mis-spelled methodology silently falls back to STANDARD', () => {
    const noFlag = { id: 'a1', name: 'Gold', type: AssetType.GOLD, value: 100 } as any;
    // 'SHAFI' is not a key in METHODOLOGIES (they are SHAFII/MALIKI/HANBALI),
    // and getMethodology() returns METHODOLOGIES.STANDARD rather than throwing.
    // STANDARD has no jewelryExempt, so jewelry wrongly comes back zakatable.
    expect(isAssetZakatable(noFlag, 'SHAFI')).toBe(true);
  });

  it('the flag onboarding stamps overrides that exemption', () => {
    const gold = onboardingAsset(AssetType.GOLD, 'Gold Assets');
    const silver = onboardingAsset(AssetType.SILVER, 'Silver Assets');
    // Same methodology, but the hardcoded true wins before jewelryExempt runs.
    expect(isAssetZakatable(gold, 'SHAFII')).toBe(true);
    expect(isAssetZakatable(silver, 'SHAFII')).toBe(true);
    expect(isAssetZakatable(gold, 'STANDARD')).toBe(true);
  });

  it('Hanafi is unaffected — it treats jewelry as zakatable anyway', () => {
    const gold = onboardingAsset(AssetType.GOLD, 'Gold Assets');
    expect(isAssetZakatable(gold, 'HANAFI')).toBe(true);
    const noFlag = { id: 'a1', name: 'Gold', type: AssetType.GOLD, value: 100 } as any;
    expect(isAssetZakatable(noFlag, 'HANAFI')).toBe(true);
  });

  it('an explicit user override still wins', () => {
    const exempt = { id: 'a1', name: 'Car', type: AssetType.CASH, value: 1, zakatEligible: false } as any;
    expect(isAssetZakatable(exempt, 'HANAFI')).toBe(false);
  });
});
