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
 * Ruling Registry Tests — Multi-Madhab Transparency Engine
 *
 * 1. Coverage: every MethodologyName × AssetType pair has a ruling with citations.
 * 2. Parity: ruling status must match isAssetZakatable from the calc engine
 *    for type-default scenarios (no user overrides).
 */

import { describe, it, expect } from 'vitest';
import { AssetType } from '../../types/index';
import { METHODOLOGIES } from '../../core/calculations/methodology';
import { isAssetZakatable } from '../../core/calculations/zakat';
import { getRulingForType, getAssetRuling, type MethodologyName } from '../../data/rulings';

const METHODOLOGY_NAMES: MethodologyName[] = [
  'STANDARD',
  'HANAFI',
  'SHAFII',
  'MALIKI',
  'HANBALI',
];

const ALL_ASSET_TYPES = Object.values(AssetType);

const makeAsset = (overrides: Partial<Parameters<typeof isAssetZakatable>[0]> = {}) =>
  ({
    id: 'test-asset',
    userId: 'test-user',
    name: 'Test Asset',
    type: AssetType.CASH,
    value: 10000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }) as Parameters<typeof isAssetZakatable>[0];

describe('Ruling Registry — coverage (CI-enforced sync with METHODOLOGIES)', () => {
  it('has a ruling with at least one citation for every madhab × asset type', () => {
    for (const madhab of METHODOLOGY_NAMES) {
      for (const assetType of ALL_ASSET_TYPES) {
        const ruling = getRulingForType(madhab, assetType);
        expect(ruling, `missing ruling for ${madhab} × ${assetType}`).not.toBeNull();
        expect(
          ruling!.citations.length,
          `${madhab} × ${assetType} ruling has no citations`
        ).toBeGreaterThanOrEqual(1);
        expect(ruling!.ruling.length).toBeGreaterThan(0);
        expect(ruling!.reasoning.length).toBeGreaterThan(0);
      }
    }
  });

  it('every citation with a url uses https', () => {
    for (const madhab of METHODOLOGY_NAMES) {
      for (const assetType of ALL_ASSET_TYPES) {
        const ruling = getRulingForType(madhab, assetType)!;
        for (const citation of ruling.citations) {
          if (citation.url !== undefined) {
            expect(citation.url.startsWith('https://')).toBe(true);
          }
        }
      }
    }
  });
});

describe('Ruling Registry — parity with isAssetZakatable (no overrides)', () => {
  it('GOLD type-default status matches isAssetZakatable for all madhabs', () => {
    for (const madhab of METHODOLOGY_NAMES) {
      const calcSaysZakatable = isAssetZakatable(makeAsset({ type: AssetType.GOLD }), madhab);
      const ruling = getAssetRuling(makeAsset({ type: AssetType.GOLD }), madhab);
      expect(ruling.status === 'zakatable').toBe(calcSaysZakatable);
    }
  });

  it('every asset type status matches isAssetZakatable for all madhabs', () => {
    for (const madhab of METHODOLOGY_NAMES) {
      for (const assetType of ALL_ASSET_TYPES) {
        const asset = makeAsset({ type: assetType });
        const calcSaysZakatable = isAssetZakatable(asset, madhab);
        const ruling = getAssetRuling(asset, madhab);
        expect(ruling.status === 'zakatable').toBe(calcSaysZakatable);
      }
    }
  });
});

describe('Ruling Registry — override handling', () => {
  it('override-zakatable: explains both the user override and the madhab default', () => {
    // Shafi'i defaults personal jewelry (GOLD) to exempt; forcing zakatEligible=true is an override
    const asset = makeAsset({ type: AssetType.GOLD, zakatEligible: true });
    const ruling = getAssetRuling(asset, 'SHAFII');
    expect(ruling.status).toBe('override-zakatable');
    expect(ruling.override).toBeDefined();
    expect(ruling.madhabDefault.ruling.length).toBeGreaterThan(0);
  });

  it('override-exempt: explains both the user override and the madhab default', () => {
    // CASH is zakatable by default everywhere; forcing zakatEligible=false is an override
    const asset = makeAsset({ type: AssetType.CASH, zakatEligible: false });
    const ruling = getAssetRuling(asset, 'HANAFI');
    expect(ruling.status).toBe('override-exempt');
    expect(ruling.override).toBeDefined();
    expect(ruling.madhabDefault.ruling.length).toBeGreaterThan(0);
  });
});

describe('Ruling Registry — jewelry exemption parity', () => {
  it('GOLD without override is exempt exactly for jewelryExempt madhabs', () => {
    for (const madhab of METHODOLOGY_NAMES) {
      const config = METHODOLOGIES[madhab];
      const ruling = getAssetRuling(makeAsset({ type: AssetType.GOLD }), madhab);
      if (config.jewelryExempt) {
        expect(ruling.status).toBe('exempt');
      } else {
        expect(ruling.status).toBe('zakatable');
      }
    }
  });
});