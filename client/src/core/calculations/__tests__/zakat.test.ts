/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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
 * Copyright (c) 2024 ZakApp Contributors
 *
 * Multi-asset zakat calculation tests
 */

import { describe, it, expect } from 'vitest';
import { calculateZakat, isAssetZakatable, getAssetZakatableValue, calculateAssetZakat } from '../zakat';
import { Asset, AssetType } from '../../../types/index';

describe('Multi-Asset Zakat Engine', () => {
  const nisab = { gold: 5000, silver: 350 };

  const makeAsset = (overrides: Partial<Asset>): Asset => ({
    id: 'test-id',
    userId: 'u1',
    type: AssetType.CASH,
    name: 'Test',
    value: 1000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  describe('Cryptocurrency', () => {
    it('treats crypto as zakatable mal (currency)', () => {
      const crypto = makeAsset({ type: AssetType.CRYPTOCURRENCY, value: 5000 });
      expect(isAssetZakatable(crypto, 'STANDARD')).toBe(true);
      expect(getAssetZakatableValue(crypto, 'STANDARD')).toBe(5000);
    });

    it('applies 2.5% rate to crypto', () => {
      const crypto = makeAsset({ type: AssetType.CRYPTOCURRENCY, value: 10000 });
      const result = calculateZakat([crypto], [], nisab, 'STANDARD');
      expect(result.zakatDue).toBe(250); // 10000 * 0.025
    });
  });

  describe('Stocks / ETFs', () => {
    it('treats stocks as zakatable', () => {
      const stock = makeAsset({ type: AssetType.STOCKS, value: 5000 });
      expect(isAssetZakatable(stock, 'STANDARD')).toBe(true);
    });

    it('treats ETFs as zakatable', () => {
      const etf = makeAsset({ type: AssetType.ETF, value: 5000 });
      expect(isAssetZakatable(etf, 'STANDARD')).toBe(true);
    });

    it('applies passive investment modifier (30% rule)', () => {
      const stock = makeAsset({ type: AssetType.STOCKS, value: 10000, isPassiveInvestment: true });
      const result = calculateZakat([stock], [], nisab, 'STANDARD');
      expect(result.zakatDue).toBe(75); // 10000 * 0.3 * 0.025 = 75
    });
  });

  describe('Retirement / Pension', () => {
    it('treats pension as zakatable', () => {
      const pension = makeAsset({ type: AssetType.PENSION, value: 5000 });
      expect(isAssetZakatable(pension, 'STANDARD')).toBe(true);
    });

    it('uses net withdrawable value for collectible_value methodology', () => {
      const retirement = makeAsset({
        type: AssetType.RETIREMENT,
        value: 100000,
        metadata: JSON.stringify({ retirementConfig: {
          methodology: 'collectible_value',
          withdrawalPenalty: 0.10,
          estimatedTaxRate: 0.25
        } }),
      });
      const result = calculateZakat([retirement], [], nisab, 'STANDARD');
      // 100000 * (1 - 0.10 - 0.25) = 65000 * 0.025 = 1625
      expect(result.zakatDue).toBe(1625);
    });

    it('uses preserved growth (0.5% rule) when configured', () => {
      const retirement = makeAsset({
        type: AssetType.RETIREMENT,
        value: 100000,
        metadata: JSON.stringify({ retirementConfig: {
          methodology: 'preserved_growth',
          withdrawalPenalty: 0,
          estimatedTaxRate: 0
        } }),
      });
      const result = calculateZakat([retirement], [], nisab, 'STANDARD');
      // 100000 * 0.005 = 500
      expect(result.zakatDue).toBe(500);
    });
  });

  describe('Property', () => {
    it('exempts primary residence', () => {
      const home = makeAsset({
        type: AssetType.REAL_ESTATE,
        value: 500000,
        metadata: JSON.stringify({ propertyUse: 'primary_residence' }),
      });
      expect(isAssetZakatable(home, 'STANDARD')).toBe(false);
    });

    it('zakatable rental income only (not property value)', () => {
      const rental = makeAsset({
        type: AssetType.REAL_ESTATE,
        value: 500000, // property value should be ignored
        metadata: JSON.stringify({ propertyUse: 'rental_investment', rentalIncome: 24000, maintenanceCosts: 4800 }),
      });
      expect(isAssetZakatable(rental, 'STANDARD')).toBe(true);
      expect(getAssetZakatableValue(rental, 'STANDARD')).toBe(19200); // 24000 - 4800
    });

    it('attributions property scholarly sources', () => {
      const home = makeAsset({
        type: AssetType.REAL_ESTATE,
        value: 500,
        metadata: JSON.stringify({ propertyUse: 'rental_investment', rentalIncome: 1000, maintenanceCosts: 0 }),
      });
      expect(getAssetZakatableValue(home, 'STANDARD')).toBe(1000);
    });
  });

  describe('Agricultural Produce', () => {
    it('treats crops as zakatable', () => {
      const crops = makeAsset({ type: AssetType.AGRICULTURAL_PRODUCE, value: 5000 });
      expect(isAssetZakatable(crops, 'STANDARD')).toBe(true);
    });

    it('applies 10% rate for rain-fed crops', () => {
      const crops = makeAsset({
        type: AssetType.AGRICULTURAL_PRODUCE,
        value: 10000,
        metadata: JSON.stringify({ irrigationMethod: 'rain_fed' }),
      });
      const result = calculateZakat([crops], [], nisab, 'STANDARD');
      expect(result.zakatDue).toBe(1000); // 10000 * 0.10
  });

    it('applies 5% rate for irrigated crops', () => {
      const crops = makeAsset({
        type: AssetType.AGRICULTURAL_PRODUCE,
        value: 10000,
        metadata: JSON.stringify({ irrigationMethod: 'irrigated' }),
      });
      const result = calculateZakat([crops], [], nisab, 'STANDARD');
      expect(result.zakatDue).toBe(500); // 10000 * 0.05
    });

    it('applies 5% rate for mixed irrigation', () => {
      const crops = makeAsset({
        type: AssetType.AGRICULTURAL_PRODUCE,
        value: 10000,
        metadata: JSON.stringify({ irrigationMethod: 'mixed' }),
      });
      expect(calculateZakat([crops], [], nisab, 'STANDARD').zakatDue).toBe(500);
    });
  });

  describe('Cross-asset calculation', () => {
    it('calculates combined zakat across asset types', () => {
      const cash = makeAsset({ type: AssetType.CASH, value: 10000 });
      const crypto = makeAsset({ type: AssetType.CRYPTOCURRENCY, value: 5000 });
      const crops = makeAsset({
        type: AssetType.AGRICULTURAL_PRODUCE,
        value: 50000,
        metadata: JSON.stringify({ irrigationMethod: 'rain_fed' }),
      });
      const result = calculateZakat([cash, crypto, crops], [], nisab, 'STANDARD');
      // cash 2.5%: 250, crypto 2.5%: 125, crops 10%: 5000 = 5375
      expect(result.zakatDue).toBe(5375);
      expect(result.isZakatObligatory).toBe(true);
    });

    it('returns zakatDue=0 when below nisab', () => {
      const cash = makeAsset({ type: AssetType.CASH, value: 100 });
      const result = calculateZakat([cash], [], nisab, 'STANDARD');
      expect(result.isZakatObligatory).toBe(false);
      expect(result.zakatDue).toBe(0);
    });

    it('deducts liabilities per methodology', () => {
      const cash = makeAsset({ type: AssetType.CASH, value: 10000 });
      const loan = { amount: 2000, type: 'LOAN' };
      const result = calculateZakat([cash], [loan], nisab, 'STANDARD');
      // Net: 10000 - 2000 = 8000; zakat: 8000 * 0.025 = 200
      expect(result.zakatDue).toBe(200);
    });
  });

  describe('Methodology variations', () => {
    it('Hanafi uses silver nisab', () => {
      const cash = makeAsset({ type: AssetType.CASH, value: 400 });
      const result = calculateZakat([cash], [], nisab, 'HANAFI');
      // Silver nisab = 350, so 400 >= 350 = zakatable
      expect(result.isZakatObligatory).toBe(true);
      expect(result.meta.nisabSource).toBe('SILVER');
    });

    it('Hanafi includes liabilities broadly', () => {
      const cash = makeAsset({ type: AssetType.CASH, value: 10000 });
      const mortgage = { amount: 5000, type: 'MORTGAGE' };
      const hanafiResult = calculateZakat([cash], [mortgage], nisab, 'HANAFI');
      const shafiiResult = calculateZakat([cash], [mortgage], nisab, 'SHAFII');
      // Hanafi allows MORTGAGE deduction, Shafii does not
      expect(hanafiResult.zakatDue).toBe(125);  // (10000 - 5000) * 0.025
      expect(shafiiResult.zakatDue).toBe(250); // 10000 * 0.025
    });

    it('Hanafi does not exempt jewelry', () => {
      const jewelry = makeAsset({ type: AssetType.GOLD, value: 10000 });
      expect(isAssetZakatable(jewelry, 'HANAFI')).toBe(true);
    });

    it('Shafii exempts jewelry', () => {
      const jewelry = makeAsset({ type: AssetType.GOLD, value: 10000 });
      expect(isAssetZakatable(jewelry, 'SHAFII')).toBe(false);
    });
  });
});
