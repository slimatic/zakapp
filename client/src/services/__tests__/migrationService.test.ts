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

import { MigrationService } from '../migrationService';
import { AssetType } from '../../types';

describe('MigrationService Client-Side', () => {
    const userId = 'test-user';

    describe('adaptAssets', () => {
        it('should map legacy categories to AssetType', () => {
            const raw = [{ name: 'Gold Bar', category: 'gold', value: 100 }];
            const adapted = MigrationService.adaptAssets(raw, userId);
            expect(adapted[0].type).toBe(AssetType.GOLD);
            expect(adapted[0].userId).toBe(userId);
        });

        it('should handle missing categories', () => {
            const raw = [{ name: 'Secret Item', value: 100 }];
            const adapted = MigrationService.adaptAssets(raw, userId);
            expect(adapted[0].type).toBe(AssetType.OTHER);
        });

        // A backup carries the asset's own zakat treatment. Defaulting these on
        // import silently restored every asset at the full rate, so a partial-rate
        // holding came back worth more than the user had set it to.
        it('preserves a partial calculationModifier', () => {
            const raw = [{ id: 'a1', name: 'Brokerage', type: 'INVESTMENT_ACCOUNT', value: 1000, calculationModifier: 0.3 }];
            const adapted = MigrationService.adaptAssets(raw, userId);
            expect(adapted[0].calculationModifier).toBe(0.3);
        });

        it('preserves a zero modifier', () => {
            const raw = [{ id: 'a2', name: 'Pension', type: 'RETIREMENT', value: 1000, calculationModifier: 0 }];
            const adapted = MigrationService.adaptAssets(raw, userId);
            expect(adapted[0].calculationModifier).toBe(0);
        });

        it('defaults calculationModifier to 1.0 only when absent', () => {
            const raw = [{ id: 'a3', name: 'Cash', type: 'CASH', value: 100 }];
            const adapted = MigrationService.adaptAssets(raw, userId);
            expect(adapted[0].calculationModifier).toBe(1.0);
        });

        it('preserves the passive and restricted flags', () => {
            const raw = [{ id: 'a4', name: 'Fund', type: 'INVESTMENT_ACCOUNT', value: 500, isPassiveInvestment: true, isRestrictedAccount: true }];
            const adapted = MigrationService.adaptAssets(raw, userId);
            expect(adapted[0].isPassiveInvestment).toBe(true);
            expect(adapted[0].isRestrictedAccount).toBe(true);
        });

        it('preserves an inactive asset rather than reactivating it', () => {
            const raw = [{ id: 'a5', name: 'Closed', type: 'CASH', value: 0, isActive: false }];
            const adapted = MigrationService.adaptAssets(raw, userId);
            expect(adapted[0].isActive).toBe(false);
        });

        it('preserves asset notes', () => {
            const raw = [{ id: 'a6', name: 'Land', type: 'REAL_ESTATE', value: 100, notes: 'bought with family' }];
            const adapted = MigrationService.adaptAssets(raw, userId);
            expect(adapted[0].notes).toBe('bought with family');
        });

    });

    describe('adaptLiabilities', () => {
        // The wealth calculator deducts `deductibleAmount`, not `amount`, so a
        // dropped deductible re-deducts a long-term balance in full.
        it('preserves the deductible amount', () => {
            const raw = [{ id: 'l1', name: 'Loan', amount: 10000, deductibleAmount: 2500 }];
            const adapted = MigrationService.adaptLiabilities(raw, userId);
            expect(adapted[0].deductibleAmount).toBe(2500);
        });

        it('falls back to the full amount when no deductible is set', () => {
            const raw = [{ id: 'l2', name: 'Card', amount: 400 }];
            const adapted = MigrationService.adaptLiabilities(raw, userId);
            expect(adapted[0].deductibleAmount).toBe(400);
        });

        it('should adapt raw liabilities correctly', () => {
            const raw = [{ name: 'Mortgage', amount: 50000, type: 'loan' }];
            const adapted = MigrationService.adaptLiabilities(raw, userId);
            expect(adapted[0].name).toBe('Mortgage');
            expect(adapted[0].amount).toBe(50000);
            expect(adapted[0].type).toBe('loan');
            expect(adapted[0].userId).toBe(userId);
        });
    });

    describe('adaptCalculations', () => {
        it('should adapt raw calculations correctly', () => {
            const raw = [{
                calculationDate: '2023-01-01T00:00:00Z',
                zakatAmount: 1250,
                totalAssets: 50000
            }];
            const adapted = MigrationService.adaptCalculations(raw, userId);
            expect(adapted[0].zakatAmount).toBe(1250);
            expect(adapted[0].totalAssets).toBe(50000);
            expect(adapted[0].userId).toBe(userId);
        });
    });

    describe('adaptUserSettings', () => {
        // A non-zero adjustment shifts every Hijri date the app displays, so it
        // must survive the round trip rather than resetting to 0.
        it('preserves the hijri adjustment', () => {
            const adapted = MigrationService.adaptUserSettings({ profileName: 'p', hijriAdjustment: 1 }, userId);
            expect(adapted.hijriAdjustment).toBe(1);
        });

        it('preserves the name fields', () => {
            const adapted = MigrationService.adaptUserSettings({ firstName: 'A', lastName: 'B' }, userId);
            expect(adapted.firstName).toBe('A');
            expect(adapted.lastName).toBe('B');
        });

        it('should adapt user settings correctly', () => {
            const raw = {
                preferredCalendar: 'hijri',
                baseCurrency: 'SAR',
                theme: 'dark'
            };
            const adapted = MigrationService.adaptUserSettings(raw, userId);
            expect(adapted.preferredCalendar).toBe('hijri');
            expect(adapted.baseCurrency).toBe('SAR');
            expect(adapted.theme).toBe('dark');
            expect(adapted.id).toBe(userId);
        });

        it('should return null for null input', () => {
            expect(MigrationService.adaptUserSettings(null, userId)).toBeNull();
        });
    });
});
