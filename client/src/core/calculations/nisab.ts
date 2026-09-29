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
 * History worth keeping: the client computed 87.48/612.36 while the server computed
 * 85/595 (the server resolves `@zakapp/shared` to `server/src/shared_local.ts`, which
 * carried the other pair), so the same user could be shown one threshold and
 * calculated against another. Both lists now carry the same pair, and the pair a user
 * gets is the one they chose — see NISAB_STANDARDS below.
 */
/**
 * The two gram conventions in circulation, selectable by the user.
 *
 * They are the same classical obligation — 20 mithqal of gold, 200 dirhams of silver
 * — converted with a different weight per unit, which is the whole of the
 * disagreement:
 *
 *   tola   : 1 tola = 11.6638 g, so 7.5 tola gold / 52.5 tola silver
 *   aaoifi : 20 mithqal at 4.25 g = 85 g, 200 dirhams at 2.975 g = 595 g
 *
 * Islamic Relief states both in one sentence and treats 85/595 as primary — "85 grams
 * of gold and 595 grams of silver (or 87.48 grams of gold and 612.36 grams of silver
 * according to another opinion)" — and advises the silver figure because it is the
 * lower threshold and so brings more wealth into zakat.
 *
 * Neither is wrong, so this is a user preference rather than a project ruling. The
 * default is unchanged from what the app has always computed (see
 * DEFAULT_NISAB_STANDARD) so no existing user's obligation moves.
 *
 * The ~2.8% gap is not cosmetic: the lower figure makes zakat payable marginally
 * earlier, so the choice is exposed in Settings and never applied silently.
 */
export type NisabStandardId = 'tola' | 'aaoifi';

export interface NisabStandard {
    id: NisabStandardId;
    /** Short line for a selector. */
    label: string;
    /** Where the numbers come from, shown under the selector. */
    derivation: string;
    goldGrams: number;
    silverGrams: number;
}

export const NISAB_STANDARDS: Record<NisabStandardId, NisabStandard> = {
    tola: {
        id: 'tola',
        label: '87.48 g gold / 612.36 g silver',
        derivation: '7.5 tola and 52.5 tola (1 tola = 11.6638 g).',
        goldGrams: 87.48,
        silverGrams: 612.36,
    },
    aaoifi: {
        id: 'aaoifi',
        label: '85 g gold / 595 g silver',
        derivation: '20 mithqal at 4.25 g and 200 dirhams at 2.975 g. The lower threshold, so more wealth is zakatable.',
        goldGrams: 85,
        silverGrams: 595,
    },
};

/**
 * What the app computed before the preference existed, so existing users' thresholds
 * do not move under them. Changing this changes whose zakat becomes due — not a
 * casual edit.
 */
export const DEFAULT_NISAB_STANDARD: NisabStandardId = 'tola';

/** The gram weights for a standard, tolerating a missing/unknown value. */
export function getNisabStandard(id: string | null | undefined): NisabStandard {
    return NISAB_STANDARDS[(id as NisabStandardId)] ?? NISAB_STANDARDS[DEFAULT_NISAB_STANDARD];
}

export const DEFAULT_NISAB_DATA: NisabData = {
    // ponytail: static fallback prices, and they WILL be arbitrary the day they are
    // used — a price is only a fallback because no live rate was available, so it
    // is stale by construction. Kept in one place so at least the two values cannot
    // drift apart (gold was 65 here while the server logged 0.75 for silver against
    // 0.8 here). The real fix is to refuse to compute and say so; see the note on
    // `normalizeNisabPayload`.
    goldPrice: 65, // USD per gram — STALE FALLBACK, not a current price
    silverPrice: 0.8, // USD per gram — STALE FALLBACK, not a current price
    goldNisabGrams: NISAB_STANDARDS[DEFAULT_NISAB_STANDARD].goldGrams,
    silverNisabGrams: NISAB_STANDARDS[DEFAULT_NISAB_STANDARD].silverGrams
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
export interface ServerPrice {
    pricePerGram?: number;
    /** Pre-multiplied by the SERVER's gram convention — prefer `pricePerGram`. */
    nisabValue?: number;
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
export function readPricePerGram(value: number | ServerPrice | undefined): number | null {
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
export function normalizeNisabPayload(
    payload: ServerNisabPayload | null | undefined,
    nisabStandard: string = DEFAULT_NISAB_STANDARD
): NisabData {
    const gold = readPricePerGram(payload?.goldPrice);
    const silver = readPricePerGram(payload?.silverPrice);
    const grams = getNisabStandard(nisabStandard);

    return {
        goldPrice: gold ?? DEFAULT_NISAB_DATA.goldPrice,
        silverPrice: silver ?? DEFAULT_NISAB_DATA.silverPrice,
        goldNisabGrams: grams.goldGrams,
        silverNisabGrams: grams.silverGrams,
    };
}
