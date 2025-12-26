import { Asset, AssetType } from '../types';
import { PaymentRecord } from '@zakapp/shared/types/tracking';

interface LegacyAsset {
    name: string;
    category: string; // Legacy field
    subCategory?: string;
    value: number;
    currency: string;
    description?: string;
    zakatEligible?: boolean;
    createdAt?: string;
    updatedAt?: string;
    type?: string;
    acquisitionDate?: string;
}

interface LegacyPayment {
    id?: string;
    paymentDate: string;
    amount: number;
    currency?: string;
    snapshotId?: string; // Might be missing
    snapshot?: string;   // Legacy alias
    calculationId?: string;
    recipientName: string;
    recipientType?: string;
    recipientCategory?: string;
    paymentMethod?: string;
    receiptReference?: string;
    receiptNumber?: string; // Legacy alias
    notes?: string;
    status?: string;
}

export interface MigrationResult {
    assets: { success: number; failed: number; errors: string[] };
    payments: { success: number; failed: number; errors: string[] };
    isFullSuccess: boolean;
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
                id: crypto.randomUUID(), // Always generate new ID to avoid collisions unless preserving specific logic
                userId: userId,
                name: raw.name || 'Untitled Asset',
                type: type,
                value: Number(raw.value) || 0,
                currency: raw.currency || 'USD',
                description: raw.description || '',
                // Legacy imports often lack acquisitionDate, use createdAt or now
                acquisitionDate: raw.acquisitionDate || raw.createdAt || new Date().toISOString(),
                createdAt: raw.createdAt || new Date().toISOString(),
                updatedAt: raw.updatedAt || new Date().toISOString(),
                isActive: true, // Default to active
                isPassiveInvestment: false,
                isRestrictedAccount: false,
                calculationModifier: 1.0,
                // Note: zakatEligible is implicit in logic now, but we could store it in notes if needed
                metadata: raw.zakatEligible !== undefined ? JSON.stringify({ legacyZakatEligible: raw.zakatEligible }) : undefined
            } as Asset;
        });
    }

    /**
     * Adapts raw JSON payments into valid PaymentRecords.
     */
    static adaptPayments(rawPayments: any[], userId: string = 'local-user', defaultSnapshotId?: string): PaymentRecord[] {
        return rawPayments.map(raw => {
            const cleanRecord: any = {
                id: raw.id || crypto.randomUUID(),
                userId: userId,
                snapshotId: raw.snapshotId || raw.snapshot || defaultSnapshotId || 'legacy-import',
                amount: Number(raw.amount) || 0,
                currency: raw.currency || 'USD',
                paymentDate: raw.paymentDate || new Date().toISOString(),
                recipientName: raw.recipientName || 'Unknown Recipient',
                recipientType: raw.recipientType || 'individual',
                recipientCategory: raw.recipientCategory || 'fakir',
                paymentMethod: raw.paymentMethod || 'cash',
                status: raw.status || 'recorded',
                exchangeRate: 1.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Optional fields (avoid passing null, which violates schema type: 'string')
            if (raw.calculationId) cleanRecord.calculationId = raw.calculationId;
            if (raw.receiptReference || raw.receiptNumber) cleanRecord.receiptReference = raw.receiptReference || raw.receiptNumber;
            if (raw.notes) cleanRecord.notes = raw.notes;

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
            '401k': AssetType.RETIREMENT
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
                id: raw.id || crypto.randomUUID(),
                userId: userId,
                hawlStartDate: raw.hawlStartDate || raw.startDate || new Date().toISOString(),
                hawlCompletionDate: raw.hawlCompletionDate || raw.endDate,
                hijriYear: raw.hijriYear || 1445,
                nisabBasis: raw.nisabBasis || 'GOLD',
                totalWealth: Number(raw.totalWealth) || 0,
                zakatableWealth: Number(raw.zakatableWealth) || 0,
                zakatAmount: Number(raw.zakatAmount) || 0,
                currency: raw.currency || 'USD',
                status: raw.status || 'DRAFT',
                createdAt: raw.createdAt || new Date().toISOString(),
                updatedAt: raw.updatedAt || new Date().toISOString()
            };
        });
    }
}
