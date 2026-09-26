/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect } from 'vitest';
import { isAssetZakatable, getAssetZakatableValue } from '../zakat';
import { AssetType } from '../../../types';

/**
 * The zakat engine matches asset.type against the AssetType enum, whose values
 * are UPPERCASE. The seeder previously wrote lowercase type strings, so every
 * seeded asset silently fell out of the methodology's zakatable list: the UI
 * showed "Not zakatable" and $0.00 for plain cash.
 *
 * That failure was invisible because the engine degrades quietly (unknown type
 * = not zakatable, no error). This pins the contract.
 */
describe('asset type casing is load-bearing', () => {
  const base = {
    id: 'a1',
    userId: 'u1',
    name: 'Test',
    value: 1000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  it('treats an uppercase CASH asset as zakatable', () => {
    const asset = { ...base, type: AssetType.CASH } as never;
    expect(isAssetZakatable(asset, 'STANDARD')).toBe(true);
    expect(getAssetZakatableValue(asset, 'STANDARD')).toBe(1000);
  });

  it('does not recognise a lowercase type string', () => {
    // Documents why the seeder had to change: the enum comparison is exact.
    const asset = { ...base, type: 'cash' } as never;
    expect(isAssetZakatable(asset, 'STANDARD')).toBe(false);
    expect(getAssetZakatableValue(asset, 'STANDARD')).toBe(0);
  });

  it('honours an explicit user exemption regardless of type', () => {
    const asset = { ...base, type: AssetType.CASH, zakatEligible: false } as never;
    expect(isAssetZakatable(asset, 'STANDARD')).toBe(false);
  });

  it('honours an explicit user inclusion for a normally-excluded type', () => {
    // isEligibilityManual marks it as the user's own call (#521).
    const asset = {
      ...base, type: AssetType.REAL_ESTATE, zakatEligible: true, isEligibilityManual: true,
    } as never;
    expect(isAssetZakatable(asset, 'STANDARD')).toBe(true);
  });
});
