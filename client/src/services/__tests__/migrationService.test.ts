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
    });

    describe('adaptLiabilities', () => {
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
