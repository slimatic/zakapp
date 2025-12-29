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

export interface NisabData {
    goldPrice: number;
    silverPrice: number;
    goldNisabGrams: number;
    silverNisabGrams: number;
}

export const DEFAULT_NISAB_DATA: NisabData = {
    goldPrice: 65, // USD per gram (fallback)
    silverPrice: 0.8, // USD per gram (fallback)
    goldNisabGrams: 87.48,
    silverNisabGrams: 612.36
};

export function calculateNisabThreshold(
    nisabData: NisabData,
    methodology: 'STANDARD' | 'HANAFI' | 'SHAFI'
): number {
    const goldNisabValue = nisabData.goldPrice * nisabData.goldNisabGrams;
    const silverNisabValue = nisabData.silverPrice * nisabData.silverNisabGrams;

    switch (methodology) {
        case 'HANAFI':
            // Hanafi uses Silver Nisab (lower threshold, more people pay)
            return silverNisabValue;
        case 'SHAFI':
        default:
            // Standard/Shafi uses Gold Nisab (higher threshold)
            return goldNisabValue;
    }
}
