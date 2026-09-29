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

import { getMethodology, type MethodologyName } from './methodology';

export interface NisabData {
    goldPrice: number;
    silverPrice: number;
    goldNisabGrams: number;
    silverNisabGrams: number;
}

/**
 * Fallback nisab data, used only when the server's price payload is missing or
 * incomplete.
 *
 * ⚠️ THE GRAM VALUES AND THE PROSE IN THE UI DISAGREE, AND THAT IS UNRESOLVED.
 *
 * The engine computes with 87.48 g gold / 612.36 g silver (7.5 tola / 52.5 tola,
 * the Hanafi reading, cited to the Simple Zakat Guide). Several user-facing strings
 * instead say 85 g / 595 g (the widely-quoted round figures) — see Dashboard,
 * GettingStarted, AssetCategories and the glossary.
 *
 * 87.48/612.36 is LOWER than 85/595 for gold, so the app currently begins charging
 * zakat slightly earlier than the prose tells the user it will.
 *
 * The choice between them is a fiqh decision, not an engineering one: it moves the
 * threshold at which someone becomes liable, so it is not ours to make silently.
 * These numbers are therefore left exactly as the engine has always used them, and
 * the prose was changed to quote them rather than the other way round. Do not
 * "tidy" one set to match the other without a scholar's ruling recorded in the PR.
 */
export const DEFAULT_NISAB_DATA: NisabData = {
    // ponytail: static fallback prices, and they WILL be arbitrary the day they are
    // used — a price is only a fallback because no live rate was available, so it
    // is stale by construction. Kept in one place so at least the two values cannot
    // drift apart (gold was 65 here while the server logged 0.75 for silver against
    // 0.8 here). The real fix is to refuse to compute and say so; see the note on
    // `normalizeNisabPayload`.
    goldPrice: 65, // USD per gram — STALE FALLBACK, not a current price
    silverPrice: 0.8, // USD per gram — STALE FALLBACK, not a current price
    goldNisabGrams: 87.48,
    silverNisabGrams: 612.36
};

/**
 * The nisab threshold for a methodology.
 *
 * The basis is NOT chosen independently: each school carries its own
 * `nisabSource` (Hanafi the silver threshold, the others gold), and this
 * follows it. There used to be a second switch here that re-implemented that
 * mapping by hand — it spelled `'SHAFI'` while the registry key is `SHAFII`, so
 * a caller passing the registry's own key silently got the Standard rule.
 * Keeping one source of truth removes the chance to disagree.
 */
export function calculateNisabThreshold(
    nisabData: NisabData,
    methodology: MethodologyName | string
): number {
    const goldNisabValue = nisabData.goldPrice * nisabData.goldNisabGrams;
    const silverNisabValue = nisabData.silverPrice * nisabData.silverNisabGrams;

    return getMethodology(methodology).nisabSource === 'SILVER'
        ? silverNisabValue
        : goldNisabValue;
}

/** Which basis a methodology uses — for display, so the UI need not guess. */
export function getNisabSource(methodology: MethodologyName | string): 'GOLD' | 'SILVER' {
    return getMethodology(methodology).nisabSource;
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
