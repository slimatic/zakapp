import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateZakat } from '../../core/calculations/zakat';
import { Asset, AssetType } from '../../types';

describe('Zakat Calculation Properties (Fuzzing)', () => {

    it('should never return NaN or Infinity for valid inputs', () => {
        fc.assert(
            fc.property(
                // Generator for list of assets
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        userId: fc.uuid(),
                        name: fc.string(),
                        type: fc.constantFrom(
                            AssetType.CASH,
                            AssetType.GOLD,
                            AssetType.SILVER,
                            AssetType.STOCKS,
                            AssetType.CRYPTO,
                            AssetType.REAL_ESTATE
                        ),
                        value: fc.double({ min: 0, max: 1_000_000_000, noNaN: true, noInfinity: true }),
                        currency: fc.constant('USD'),
                        acquisitionDate: fc.constant('2024-01-01T00:00:00.000Z'),
                        createdAt: fc.constant('2024-01-01T00:00:00.000Z'),
                        updatedAt: fc.constant('2024-01-01T00:00:00.000Z'),
                        isActive: fc.boolean(),
                        isPassiveInvestment: fc.boolean(),
                        isRestrictedAccount: fc.boolean(),
                        calculationModifier: fc.double({ min: 0, max: 1 })
                    })
                ),
                fc.double({ min: 0, max: 100_000 }), // Nisab Threshold (e.g. Gold Price)
                (assets: any[], nisabValue) => {
                    const nisabValues = { gold: nisabValue, silver: nisabValue / 10 };
                    const result = calculateZakat(assets as Asset[], [], nisabValues);
                    expect(result.zakatDue).not.toBeNaN();
                    expect(result.zakatDue).not.toBe(Infinity);
                    expect(result.totalAssets).not.toBeNaN();
                    expect(result.zakatableAssets).not.toBeNaN();
                }
            ),
            { numRuns: 1000 } // Run 1000 random permutations
        );
    });

    it('zakat amount should always be 2.5% of zakatable wealth', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        userId: fc.uuid(),
                        name: fc.string(),
                        type: fc.constantFrom(AssetType.CASH, AssetType.GOLD),
                        value: fc.double({ min: 0, max: 1_000_000 }),
                        currency: fc.constant('USD'),
                        acquisitionDate: fc.constant('2024-01-01T00:00:00.000Z'),
                        createdAt: fc.constant('2024-01-01T00:00:00.000Z'),
                        updatedAt: fc.constant('2024-01-01T00:00:00.000Z'),
                        isActive: fc.constant(true),
                        isPassiveInvestment: fc.constant(false),
                        isRestrictedAccount: fc.constant(false),
                        calculationModifier: fc.constant(1.0)
                    })
                ),
                fc.double({ min: 1, max: 5000 }), // Nisab Threshold
                (assets: any[], nisabValue) => {
                    const nisabValues = { gold: nisabValue, silver: nisabValue / 10 };
                    const result = calculateZakat(assets as Asset[], [], nisabValues);

                    if (result.zakatableAssets >= nisabValue) {
                        // CloseTo check for floating point math
                        expect(result.zakatDue).toBeCloseTo(result.zakatableAssets * 0.025, 2);
                    } else {
                        expect(result.zakatDue).toBe(0);
                    }
                }
            )
        );
    });

    it('should be idempotent (same inputs = same outputs)', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        userId: fc.uuid(),
                        name: fc.string(),
                        type: fc.constant(AssetType.CASH),
                        value: fc.double({ min: 0, max: 500_000 }),
                        currency: fc.constant('USD'),
                        acquisitionDate: fc.constant('2024-01-01T00:00:00.000Z'),
                        createdAt: fc.constant('2024-01-01T00:00:00.000Z'),
                        updatedAt: fc.constant('2024-01-01T00:00:00.000Z'),
                        isActive: fc.constant(true),
                        isPassiveInvestment: fc.constant(false),
                        isRestrictedAccount: fc.constant(false),
                        calculationModifier: fc.constant(1.0)
                    })
                ),
                fc.double({ min: 1, max: 10000 }),
                (assets: any[], nisabValue) => {
                    const nisabValues = { gold: nisabValue, silver: nisabValue / 10 };
                    const run1 = calculateZakat(assets as Asset[], [], nisabValues);
                    const run2 = calculateZakat(assets as Asset[], [], nisabValues);
                    expect(run1).toEqual(run2);
                }
            )
        );
    });
});
