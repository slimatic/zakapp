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

/** A price as the server sends it: `{ pricePerGram: 133.89, ... }`. */
interface ServerPrice {
    pricePerGram?: number;
}

/** The payload shape of `GET /api/zakat/nisab`. */
export interface ServerNisabPayload {
    currency?: string;
    goldPrice?: number | ServerPrice;
    silverPrice?: number | ServerPrice;
    lastUpdated?: string;
    effectiveDate?: string;
}

/**
 * Read a per-gram price out of the server payload.
 *
 * The endpoint returns NESTED objects (`goldPrice: { pricePerGram, nisabValue }`),
 * but the UI type declares a plain number. Reading the object as a number gave
 * `object * grams` = NaN, and `grandTotal >= NaN` is false — so the calculator
 * reported "$0.00 / Below Nisab Threshold ($NaN)" for a portfolio clearly above
 * nisab, with no error anywhere. This accepts either shape so a numeric field
 * keeps working if the API is ever flattened.
 */
function readPricePerGram(value: number | ServerPrice | undefined): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (value && typeof value === 'object' && typeof value.pricePerGram === 'number') {
        return Number.isFinite(value.pricePerGram) ? value.pricePerGram : null;
    }
    return null;
}

/**
 * Normalise the server's nisab payload into the flat `NisabData` the calculator
 * needs, falling back to DEFAULT_NISAB_DATA for anything missing.
 *
 * Both prices fall back INDEPENDENTLY. A partial payload (one price present)
 * previously left the other as NaN, which is enough to break the threshold for
 * whichever methodology reads it.
 */
export function normalizeNisabPayload(payload: ServerNisabPayload | null | undefined): NisabData {
    const gold = readPricePerGram(payload?.goldPrice);
    const silver = readPricePerGram(payload?.silverPrice);

    return {
        goldPrice: gold ?? DEFAULT_NISAB_DATA.goldPrice,
        silverPrice: silver ?? DEFAULT_NISAB_DATA.silverPrice,
        goldNisabGrams: DEFAULT_NISAB_DATA.goldNisabGrams,
        silverNisabGrams: DEFAULT_NISAB_DATA.silverNisabGrams,
    };
}
