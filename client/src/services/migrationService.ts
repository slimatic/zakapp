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

import { Asset, AssetType } from '../types';
import { PaymentRecord } from '@zakapp/shared/types/tracking';
import { parseAmountFromImport } from '../utils/parseDecimal';


export interface MigrationResult {
    assets: { success: number; failed: number; errors: string[] };
    payments: { success: number; failed: number; errors: string[] };
    isFullSuccess: boolean;
}

/**
 * Coerce a value from a backup file into an amount, refusing to guess.
 *
 * A backup restore is the last line of defence: the user is here because they
 * already lost data once. Writing a wrong number is worse than failing, because
 * nothing looks broken afterwards.
 *
 * Two silent-corruption paths existed here:
 *   1. `Number('ZK1:...')` is NaN, so `|| 0` wrote ZERO into a real amount.
 *   2. `parseAmountFromImport('ZK1:...')` strips non-digits from base64 and
 *      produced a PLAUSIBLE WRONG NUMBER (e.g. 1928293), which is worse still.
 *
 * A missing amount is tolerated (older exports may omit optional fields) and
 * becomes 0. A present-but-unreadable one is an error and stops the import.
 */
function requireAmount(raw: any, field: string, context: string): number {
    if (raw === undefined || raw === null || raw === '') return 0;

    const parsed = parseAmountFromImport(raw);
    if (!Number.isFinite(parsed)) {
        // Distinguish the alarming case in the message: an encrypted field means
        // the backup came from a locked vault, not that the file is corrupt.
        const isCipher = typeof raw === 'string' && raw.startsWith('ZK1:');
        throw new Error(
            isCipher
                ? `${context}: ${field} is still encrypted (ZK1). Unlock the vault with the original ` +
                  `password, or re-export from an unlocked session - importing this would write a wrong amount.`
                : `${context}: ${field} is not a valid amount (got ${JSON.stringify(raw)}). ` +
                  `Import stopped rather than record a wrong value.`
        );
    }
    return parsed;
}

/**
 * Migration Service
 * Handles the "Smart Import" of legacy data structures into the modern RxDB Schema.
 */
export class MigrationService {

    /**
     * Adapts a raw JSON object into a valid Asset list.
     * Handles 'category' -> 'type' mapping and fills missing fields.
     */
    static adaptAssets(rawAssets: any[], userId: string = 'local-user'): Asset[] {
        return rawAssets.map(raw => {
            const type = this.mapCategoryToType(raw.category || raw.type);

            return {
                id: raw.id || raw.assetId || crypto.randomUUID(), // Preserve ID to prevent duplication on re-import
                userId: userId,
                name: raw.name || 'Untitled Asset',
                type: type,
                value: requireAmount(raw.value, "value", "Asset"),
                currency: raw.currency || 'USD',
                description: raw.description || '',
                // Free-text the user wrote about the asset. Optional in the schema,
                // so it is omitted entirely rather than written as an empty string.
                ...(raw.notes ? { notes: raw.notes } : {}),
                // Legacy imports often lack acquisitionDate, use createdAt or now
                acquisitionDate: raw.acquisitionDate || raw.createdAt || new Date().toISOString(),
                createdAt: raw.createdAt || new Date().toISOString(),
                updatedAt: raw.updatedAt || new Date().toISOString(),
                isActive: raw.isActive ?? true,
                isPassiveInvestment: raw.isPassiveInvestment ?? false,
                isRestrictedAccount: raw.isRestrictedAccount ?? false,
                // Restore the asset's own zakat treatment. These three fields are
                // part of the backup (the export writes the stored asset verbatim),
                // and defaulting them here discarded the user's own settings: an
                // asset held at a partial rate — a passive investment, a restricted
                // account, a retirement pot the user chose to include only in part —
                // came back at the full 100% and inflated the zakat due.
                //
                // A partial rate is the user's answer, not a derived value, so it
                // cannot be recomputed later. Only a genuinely absent field falls
                // back to the full rate.
                calculationModifier: raw.calculationModifier ?? 1.0,
                // `zakatEligible` must NOT be emitted here. It is absent from
                // AssetSchema, which is additionalProperties:false, so Ajv rejects the
                // doc — and because the key was assigned unconditionally it was
                // present (as undefined) on EVERY asset, failing the whole restore.
                // ALLOWED_SCHEMA_FIELDS in useAssetRepository lists it, which is how
                // the two drifted. The legacy value still rides in metadata.
                metadata: raw.metadata || (raw.zakatEligible !== undefined ? JSON.stringify({ legacyZakatEligible: raw.zakatEligible }) : undefined)
            } as Asset;
        });
    }

    /**
     * Adapts raw JSON payments into valid PaymentRecords.
     */
    static adaptPayments(rawPayments: any[], userId: string = 'local-user', defaultSnapshotId?: string): PaymentRecord[] {
        return rawPayments.map(raw => {
            const cleanRecord: any = {
                id: raw.id || crypto.randomUUID(), // Preserve ID
                userId: userId,
                snapshotId: raw.snapshotId || raw.snapshot || defaultSnapshotId || 'legacy-import',
                amount: requireAmount(raw.amount, "amount", "Payment"),
                currency: raw.currency || 'USD',
                paymentDate: raw.paymentDate || new Date().toISOString(),
                recipientName: raw.recipientName || 'Unknown Recipient',
                recipientType: raw.recipientType || 'individual',
                recipientCategory: raw.recipientCategory || 'fakir',
                paymentMethod: raw.paymentMethod || 'cash',
                status: raw.status || 'recorded',
                // The rate the payment was actually converted at. It is per-record:
                // two payments in the same currency can carry different rates, so it
                // cannot be recovered from the currency pair later. Defaulting to 1.0
                // asserted that every restored payment was one-for-one.
                exchangeRate: Number(raw.exchangeRate ?? 1.0) || 1.0,
                createdAt: raw.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Optional fields (avoid passing null, which violates schema type: 'string')
            if (raw.calculationId) cleanRecord.calculationId = raw.calculationId;
            if (raw.receiptReference || raw.receiptNumber) cleanRecord.receiptReference = raw.receiptReference || raw.receiptNumber;
            if (raw.notes) cleanRecord.notes = raw.notes;
            // The notes alias above uses `||`, so an empty string is skipped and
            // the field is simply absent - correct, since the schema declares
            // `notes` optional and an absent field is not an empty one. Nothing
            // else on this record is dropped.

            return cleanRecord as PaymentRecord;
        });
    }

    private static mapCategoryToType(legacyCategory: string): AssetType {
        const map: Record<string, AssetType> = {
            'cash': AssetType.CASH,
            'bank': AssetType.BANK_ACCOUNT,
            'gold': AssetType.GOLD,
            'silver': AssetType.SILVER,
            'crypto': AssetType.CRYPTOCURRENCY,
            'cryptocurrency': AssetType.CRYPTOCURRENCY,
            'stocks': AssetType.INVESTMENT_ACCOUNT,
            'investment': AssetType.INVESTMENT_ACCOUNT,
            'real_estate': AssetType.REAL_ESTATE,
            'property': AssetType.REAL_ESTATE,
            'business': AssetType.BUSINESS_ASSETS,
            'loan': AssetType.DEBTS_OWED_TO_YOU,
            'retirement': AssetType.RETIREMENT,
            '401k': AssetType.RETIREMENT,
            // Full Enum Support (for re-importing v2 exports)
            'investment_account': AssetType.INVESTMENT_ACCOUNT,
            'business_assets': AssetType.BUSINESS_ASSETS,
            'debts_owed_to_you': AssetType.DEBTS_OWED_TO_YOU,
            'bank_account': AssetType.BANK_ACCOUNT
        };

        const normalized = (legacyCategory || '').toLowerCase().trim();
        return map[normalized] || AssetType.OTHER;
    }

    /**
     * Adapts raw JSON into valid NisabYearRecords.
     */
    static adaptNisabRecords(rawRecords: any[], userId: string = 'local-user'): any[] {
        return rawRecords.map(raw => {
            return {
                id: raw.id || crypto.randomUUID(), // Preserve ID
                userId: userId,
                hawlStartDate: raw.hawlStartDate || raw.startDate || new Date().toISOString(),
                hawlCompletionDate: raw.hawlCompletionDate || raw.endDate,
                hijriYear: raw.hijriYear || 1445,
                nisabBasis: raw.nisabBasis || 'GOLD',
                totalWealth: requireAmount(raw.totalWealth, "totalWealth", "Nisab record"),
                zakatableWealth: requireAmount(raw.zakatableWealth, "zakatableWealth", "Nisab record"),
                zakatAmount: requireAmount(raw.zakatAmount, "zakatAmount", "Nisab record"),
                currency: raw.currency || 'USD',
                status: raw.status || 'DRAFT',
                createdAt: raw.createdAt || new Date().toISOString(),
                updatedAt: raw.updatedAt || new Date().toISOString(),
                // Everything below is already declared by NisabYearRecordSchema
                // and already written by the export - it was simply not copied on
                // the way back in. The costly omission is assetBreakdown: the
                // annual summary PDF's breakdown table and the year-over-year
                // charts read it directly, so a restored record used to lose the
                // entire per-year asset composition and fall back to a flat list.
                nisabThresholdAtStart: raw.nisabThresholdAtStart ?? '',
                methodologyUsed: raw.methodologyUsed ?? '',
                calculationDate: raw.calculationDate ?? raw.hawlStartDate ?? new Date().toISOString(),
                gregorianYear: raw.gregorianYear ?? 0,
                totalLiabilities: requireAmount(raw.totalLiabilities, "totalLiabilities", "Nisab record"),
                assetBreakdown: raw.assetBreakdown ?? '',
                calculationDetails: raw.calculationDetails ?? '',
                userNotes: raw.userNotes ?? '',
                isPrimary: raw.isPrimary ?? false,
                // The Hijri dates the assessment actually ran on. Recomputing them
                // from the Gregorian pair would apply the current moon-sighting
                // adjustment to a past year, which is how a Hijri year drifts by a
                // day against the record it is meant to describe.
                hawlStartDateHijri: raw.hawlStartDateHijri ?? '',
                hawlCompletionDateHijri: raw.hawlCompletionDateHijri ?? ''
            };
        });
    }

    /**
     * Adapts raw JSON into valid Liability list.
     */
    static adaptLiabilities(rawLiabilities: any[], userId: string = 'local-user'): any[] {
        return rawLiabilities.map(raw => {
            return {
                id: raw.id || crypto.randomUUID(),
                userId: userId,
                name: raw.name || 'Untitled Liability',
                type: raw.type || 'short_term',
                amount: requireAmount(raw.amount, "amount", "Liability"),
                currency: raw.currency || 'USD',
                description: raw.description || '',
                metadata: raw.metadata || '',
                // The deductible portion, not the whole balance. The schema declares
                // it `required` with no default, and the wealth calculator deducts
                // this figure rather than `amount` when it is set — so dropping it
                // re-deducted a long-term balance in full, which understates the
                // zakat due. Defaulting to the full amount preserves the only
                // behaviour the field had before it existed.
                deductibleAmount: Number(raw.deductibleAmount ?? raw.amount) || 0,
                isActive: raw.isActive ?? true,
                dueDate: raw.dueDate || new Date().toISOString(),
                creditor: raw.creditor || '',
                notes: raw.notes || '',
                createdAt: raw.createdAt || new Date().toISOString(),
                updatedAt: raw.updatedAt || new Date().toISOString()
            };
        });
    }

    /**
     * Adapts raw JSON into valid ZakatCalculation records.
     */
    static adaptCalculations(rawCalcs: any[], userId: string = 'local-user'): any[] {
        return rawCalcs.map(raw => {
            return {
                id: raw.id || crypto.randomUUID(),
                userId: userId,
                calculationDate: raw.calculationDate || new Date().toISOString(),
                methodology: raw.methodology || 'standard',
                calendarType: raw.calendarType || 'gregorian',
                totalAssets: Number(raw.totalAssets) || 0,
                totalLiabilities: Number(raw.totalLiabilities) || 0,
                netWorth: Number(raw.netWorth) || 0,
                nisabThreshold: Number(raw.nisabThreshold) || 0,
                nisabSource: raw.nisabSource || 'manual',
                isZakatObligatory: raw.isZakatObligatory ?? false,
                zakatAmount: Number(raw.zakatAmount) || 0,
                zakatRate: Number(raw.zakatRate) || 0.025,
                breakdown: raw.breakdown || '{}',
                assetsIncluded: raw.assetsIncluded || '[]',
                liabilitiesIncluded: raw.liabilitiesIncluded || '[]',
                createdAt: raw.createdAt || new Date().toISOString()
            };
        });
    }

    /**
     * Adapts raw JSON into valid UserSettings.
     */
    static adaptUserSettings(settings: any, userId: string = 'local-user'): any {
        if (!settings) return null;
        return {
            id: userId,
            profileName: settings.profileName || '',
            firstName: settings.firstName || '',
            lastName: settings.lastName || '',
            email: settings.email || '',
            preferredCalendar: settings.preferredCalendar || 'gregorian',
            // The user's own moon-sighting adjustment, in days. It shifts every
            // Hijri date the app shows, so re-importing at 0 silently moves the
            // dates of a record the user had deliberately set.
            hijriAdjustment: Number.isFinite(Number(settings.hijriAdjustment)) ? Number(settings.hijriAdjustment) : 0,
            preferredMethodology: settings.preferredMethodology || 'standard',
            baseCurrency: settings.baseCurrency || 'USD',
            language: settings.language || 'en',
            theme: settings.theme || 'system',
            lastLoginAt: settings.lastLoginAt,
            isSetupCompleted: settings.isSetupCompleted ?? true,
            securityProfile: settings.securityProfile,
            createdAt: settings.createdAt || new Date().toISOString(),
            updatedAt: settings.updatedAt || new Date().toISOString()
        };
    }
}
