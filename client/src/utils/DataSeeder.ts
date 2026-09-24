/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { logger } from './logger';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AssetType } from '../types';

// Helper to get random item from array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper for random number range
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

// Helper to get current user ID strictly for seeding purposes
const getSeedUserId = (): string => {
    try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const parsed = JSON.parse(storage);
            if (parsed?.state?.user?.id) return parsed.state.user.id;
        }
    } catch (e) {
        console.warn('Could not read auth storage', e);
    }
    return 'test_user_id';
};

export class DataSeeder {

    static async clearAllData() {
        const db = await getDb();
        if (!db) throw new Error('DB not initialized');

        logger.info('🗑️ Clearing all data...');

        try {
            await Promise.all([
                db.assets.find().remove(),
                db.payment_records.find().remove(),
                db.nisab_year_records.find().remove()
            ]);
            logger.info('✅ All data cleared');
        } catch (err) {
            console.error('Error clearing data:', err);
        }
    }

    static async seedAssets(count: number = 100) {
        const db = await getDb();
        if (!db) throw new Error('DB not initialized');

        const userId = getSeedUserId();
        logger.info(`🌱 Seeding ${count} assets for user ${userId}...`);

        const assets = [];
        // The zakat engine matches asset.type against the AssetType enum, whose
        // values are UPPERCASE ('CASH', 'GOLD', ...). Seeding lowercase strings
        // ('cash') meant isAssetZakatable's `zakatableAssets.includes(type)`
        // never matched, so every seeded asset silently reported "Not zakatable"
        // and $0.00. Match the enum.
        const assetTypes: AssetType[] = [
            AssetType.CASH,
            AssetType.GOLD,
            AssetType.SILVER,
            AssetType.CRYPTOCURRENCY,
            AssetType.INVESTMENT_ACCOUNT,
            AssetType.REAL_ESTATE,
            AssetType.BUSINESS_ASSETS
        ];

        for (let i = 0; i < count; i++) {
            const type = random(assetTypes);
            assets.push({
                id: uuidv4(),
                userId: userId,
                name: `${type
                    .split('_')
                    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                    .join(' ')} Asset ${i + 1}`,
                type: type,
                value: randomFloat(100, 50000), // Converted from 'amount' to 'value' per schema
                currency: 'USD',
                acquisitionDate: new Date().toISOString(), // Required per schema
                isActive: true, // Required per schema
                metadata: JSON.stringify({ // metadata must be a STRING (Encrypted JSON) according to schema
                    notes: `Seeded data ${new Date().toISOString()}`
                }),
                // Removed isZakatable as it violates strict schema
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        // Bulk insert for performance
        try {
            const result = await db.assets.bulkInsert(assets);
            if (result.error && result.error.length > 0) {
                console.error(`❌ Seeding failed. First error details:`, JSON.stringify(result.error[0], null, 2));
                throw new Error(`Failed to insert ${result.error.length} assets.`);
            }
            logger.info(`✅ ${result.success.length} assets created`);
        } catch (e: any) {
            console.error(`❌ Seeding threw exception:`, JSON.stringify(e, null, 2));
            if (e.message) console.error('Error Message:', e.message);
            throw e;
        }
    }

    static async seedPayments(count: number = 50) {
        const db = await getDb();
        if (!db) throw new Error('DB not initialized');

        const userId = getSeedUserId();
        logger.info(`🌱 Seeding ${count} payments...`);

        const payments = [];
        const categories = ['poor', 'needy', 'administrators', 'hearts_aligned', 'slaves', 'debtors', 'cause_of_god', 'wayfarer'];

        for (let i = 0; i < count; i++) {
            payments.push({
                id: uuidv4(),
                userId: userId, // REQUIRED per PaymentRecordSchema
                amount: randomFloat(10, 500),
                currency: 'USD',
                paymentDate: new Date(Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000)).toISOString(), // REQUIRED
                recipientName: `Charity Organization ${i + 1}`, // Schema: recipientName
                recipientCategory: random(categories),
                notes: 'Seeded payment',
                status: 'verified',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        try {
            const result = await db.payment_records.bulkInsert(payments);
            if (result.error && result.error.length > 0) {
                console.error(`❌ Seeding failed. First error:`, JSON.stringify(result.error[0], null, 2));
                throw new Error(`Failed to insert ${result.error.length} payments.`);
            }
            logger.info(`✅ ${result.success.length} payments created`);
        } catch (e: any) {
            console.error(`❌ Seeding payments threw exception:`, JSON.stringify(e, null, 2));
            throw e;
        }
    }

    static async seedNisabHistory(years: number = 5) {
        const db = await getDb();
        if (!db) throw new Error('DB not initialized');

        const userId = getSeedUserId();

        logger.info(`🌱 Seeding ${years} years of Nisab history...`);
        const records = [];
        const currentYear = new Date().getFullYear();

        for (let i = 0; i < years; i++) {
            const hijriYear = 1446 - i;
            const gregorianYear = currentYear - i;

            const calcDetails = {
                cash: randomFloat(1000, 10000),
                gold: randomFloat(5000, 20000),
                stock: randomFloat(0, 50000)
            };

            const total = calcDetails.cash + calcDetails.gold + calcDetails.stock;

            records.push({
                id: uuidv4(),
                userId: userId, // REQUIRED
                hijriYear: hijriYear,
                hawlStartDate: new Date(`${gregorianYear}-01-01`).toISOString(), // REQUIRED
                hawlCompletionDate: new Date(`${gregorianYear}-12-30`).toISOString(), // Schema: hawlCompletionDate

                gregorianYear: gregorianYear,
                totalWealth: total,
                zakatableWealth: total * 0.9,
                zakatAmount: (total * 0.9) * 0.025,

                status: 'FINALIZED',

                assetBreakdown: JSON.stringify(calcDetails),
                calculationDetails: JSON.stringify({ method: 'standard', notes: 'seeded' }),

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        try {
            const result = await db.nisab_year_records.bulkInsert(records);
            if (result.error && result.error.length > 0) {
                console.error(`❌ Seeding failed. First error:`, JSON.stringify(result.error[0], null, 2));
                throw new Error(`Failed to insert ${result.error.length} nisab records.`);
            }
            logger.info(`✅ ${result.success.length} Nisab records created`);
        } catch (e: any) {
            console.error(`❌ Seeding Nisab threw exception:`, JSON.stringify(e, null, 2));
            throw e;
        }
    }

    /**
     * Seed an ACTIVE (DRAFT) hawl record - the in-progress zakat year.
     *
     * seedNisabHistory only writes FINALIZED records, so the dashboard's hawl
     * card and its moon arc had nothing to render: `activeRecord` is defined as
     * status === 'DRAFT', so a history-only database shows no hawl at all. This
     * is the record that makes the signature component visible.
     *
     * Start date is backdated to `daysElapsed` ago so the arc lands mid-year
     * (the design was drawn at ~58% of a 354-day lunar year).
     */
    static async seedActiveHawl(daysElapsed: number = 207) {
        const db = await getDb();
        if (!db) throw new Error('DB not initialized');

        const userId = getSeedUserId();
        const TOTAL_DAYS = 354; // lunar year

        const start = new Date();
        start.setDate(start.getDate() - daysElapsed);
        const completion = new Date(start);
        completion.setDate(completion.getDate() + TOTAL_DAYS);

        const totalWealth = randomFloat(60000, 140000);
        const zakatableWealth = totalWealth * 0.92;

        const record = {
            id: uuidv4(),
            userId,
            hijriYear: 1448,
            gregorianYear: start.getFullYear(),
            hawlStartDate: start.toISOString(),
            hawlCompletionDate: completion.toISOString(),
            nisabBasis: 'GOLD' as const,
            nisabThresholdAtStart: 6145.30,
            totalWealth,
            zakatableWealth,
            zakatAmount: zakatableWealth * 0.025,
            status: 'DRAFT' as const,
            assetBreakdown: JSON.stringify({
                cash: totalWealth * 0.42,
                gold: totalWealth * 0.3,
                stock: totalWealth * 0.28
            }),
            calculationDetails: JSON.stringify({ method: 'standard', notes: 'seeded active hawl' }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const result = await db.nisab_year_records.insert(record);
        if (result.error) {
            console.error('❌ Active hawl seed failed:', JSON.stringify(result.error, null, 2));
            throw new Error('Failed to insert active hawl record.');
        }
        logger.info(`✅ Active hawl created: day ${daysElapsed} of ${TOTAL_DAYS}`);
    }

    /**
     * Seed liabilities.
     *
     * There was no liability seeder at all, so the Liabilities page could only
     * ever be reviewed as an empty state.
     *
     * Deliberately includes both kinds, because they are treated differently:
     * a long-term mortgage is excluded from net wealth under most positions,
     * a credit card due this month is deducted.
     */
    static async seedLiabilities() {
        const db = await getDb();
        if (!db) throw new Error('DB not initialized');

        const userId = getSeedUserId();

        const dueSoon = new Date();
        dueSoon.setDate(dueSoon.getDate() + 12);

        const liabilities = [
            {
                id: uuidv4(),
                userId,
                name: 'Mortgage - primary residence',
                type: 'long_term',
                amount: 18400,
                currency: 'USD',
                description: 'Balance due 2049. Excluded from net wealth as a long-term obligation.',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId,
                name: 'Credit card',
                type: 'short_term',
                amount: 640.20,
                currency: 'USD',
                description: `Statement balance, due ${dueSoon.toISOString().slice(0, 10)}. Deducted from net wealth.`,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId,
                name: 'Business payable - supplier invoice',
                type: 'business_payable',
                amount: 1285.50,
                currency: 'USD',
                description: 'Owed to supplier, netted against business inventory.',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        const result = await db.liabilities.bulkInsert(liabilities);
        if (result.error && result.error.length > 0) {
            console.error('❌ Liability seed failed:', JSON.stringify(result.error[0], null, 2));
            throw new Error(`Failed to insert ${result.error.length} liabilities.`);
        }
        logger.info(`✅ ${result.success.length} liabilities created`);
    }
}
