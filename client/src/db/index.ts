import { useState, useEffect } from 'react';
// @ts-ignore
// @ts-ignore
import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from 'rxdb';
// @ts-ignore
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
// @ts-ignore
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { wrappedKeyEncryptionCryptoJsStorage } from 'rxdb/plugins/encryption-crypto-js';
import { AssetSchema } from './schema/asset.schema';
import { LiabilitySchema } from './schema/liability.schema';
import { ZakatCalculationSchema } from './schema/zakatCalc.schema';
import { NisabYearRecordSchema } from './schema/nisabYearRecord.schema';
import { PaymentRecordSchema } from './schema/paymentRecord.schema';
import { UserSettingsSchema } from './schema/userSettings.schema';

// @ts-ignore
// @ts-ignore
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
// @ts-ignore
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

console.log('RxDB Storage Adapter (Dexie):', getRxStorageDexie);

addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

export type ZakAppCollections = {
    assets: RxCollection;
    liabilities: RxCollection;
    zakat_calculations: RxCollection;
    nisab_year_records: RxCollection;
    payment_records: RxCollection;
    user_settings: RxCollection;
};

export type ZakAppDatabase = RxDatabase<ZakAppCollections>;

let dbPromise: Promise<ZakAppDatabase> | null = null;

const migrationStrategiesV2 = {
    1: (doc: any) => doc,
    2: (doc: any) => doc
};

const migrationStrategiesV3 = {
    1: (doc: any) => doc,
    2: (doc: any) => doc,
    3: (doc: any) => doc
};

if (process.env.NODE_ENV === 'development') {
    addRxPlugin(RxDBDevModePlugin);
}

const _createDb = async (password?: string): Promise<ZakAppDatabase> => {
    console.log('DatabaseService: Creating database instance...');
    console.trace('Database creation triggered by:');

    let storage;
    let dbName = 'zakapp_db_v6';

    if (process.env.NODE_ENV === 'test') {
        storage = getRxStorageMemory();
        dbName = `zakapp_test_db_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`DatabaseService: Using Memory Storage for Test (DB: ${dbName})`);

        // Apply Encryption Wrapper in Test too
        storage = wrappedKeyEncryptionCryptoJsStorage({
            storage
        });
    } else {
        storage = getRxStorageDexie();
        console.log('DatabaseService: Raw Storage Instance:', storage);

        // Wrap storage with validation in development to fix DVM1 error
        if (process.env.NODE_ENV === 'development') {
            storage = wrappedValidateAjvStorage({
                storage
            });
            console.log('DatabaseService: Wrapped Storage Instance:', storage);
        }

        // Apply Encryption Wrapper
        storage = wrappedKeyEncryptionCryptoJsStorage({
            storage
        });
    }

    try {
        const db = await createRxDatabase<ZakAppCollections>({
            name: dbName,
            storage: storage,
            password: password, // Pass encryption key
            ignoreDuplicate: true
        });

        // Check if collections already exist (idempotency for ignoreDuplicate: true)
        if (!db.collections.assets) {
            console.log('DatabaseService: Database created. Adding collections...');
            await db.addCollections({
                assets: {
                    schema: AssetSchema,
                    migrationStrategies: migrationStrategiesV3
                },
                liabilities: {
                    schema: LiabilitySchema,
                    migrationStrategies: migrationStrategiesV2
                },
                zakat_calculations: {
                    schema: ZakatCalculationSchema,
                    migrationStrategies: migrationStrategiesV2
                },
                nisab_year_records: {
                    schema: NisabYearRecordSchema,
                    migrationStrategies: migrationStrategiesV3
                },
                payment_records: {
                    schema: PaymentRecordSchema,
                    migrationStrategies: migrationStrategiesV3
                },
                user_settings: {
                    schema: UserSettingsSchema,
                    migrationStrategies: migrationStrategiesV2
                }
            });
            console.log('DatabaseService: Collections added.');
        } else {
            console.log('DatabaseService: Collections already exist. Skipping initialization.');
        }

        console.log('DatabaseService: Collections added.');
        return db;
    } catch (err) {
        console.error('DatabaseService: Failed to create database', err);
        throw err;
    }
};

export const getDb = (password?: string): Promise<ZakAppDatabase> => {
    if (!dbPromise) {
        dbPromise = _createDb(password).catch(err => {
            dbPromise = null; // Reset promise on failure so we can retry
            throw err;
        });
    }
    return dbPromise;
};

// For testing purposes
export const resetDb = async () => {
    if (dbPromise) {
        try {
            const db = await dbPromise;
            if (db) await db.remove();
        } catch (e) {
            console.error('Error destroying DB:', e);
        }
        dbPromise = null;
    }
};

// Hook for React components

export const useDb = () => {
    const [db, setDb] = useState<ZakAppDatabase | null>(null);

    useEffect(() => {
        getDb().then(setDb);
    }, []);

    return db;
};
