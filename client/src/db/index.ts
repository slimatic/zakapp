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

// Migration Strategies
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

// Global window augmentation for HMR safety
declare global {
    interface Window {
        _zakapp_db_promise: Promise<ZakAppDatabase> | null;
    }
}

// Ensure singleton across HMR
if (!window._zakapp_db_promise) {
    window._zakapp_db_promise = null;
}

// Internal Creator
const _createDb = async (password?: string): Promise<ZakAppDatabase> => {
    console.log('DatabaseService: Creating database instance...');

    let storage;
    let dbName = 'zakapp_db_v10'; // BUMPED TO V10 for Email Schema

    if (process.env.NODE_ENV === 'test') {
        storage = getRxStorageMemory();
        dbName = `zakapp_test_db_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`DatabaseService: Using Memory Storage for Test (DB: ${dbName})`);

        storage = wrappedKeyEncryptionCryptoJsStorage({ storage });
    } else {
        storage = getRxStorageDexie();
        console.log('DatabaseService: Raw Storage Instance:', storage);

        if (process.env.NODE_ENV === 'development') {
            storage = wrappedValidateAjvStorage({ storage });
            console.log('DatabaseService: Wrapped Storage Instance:', storage);
        }

        storage = wrappedKeyEncryptionCryptoJsStorage({ storage });
    }

    try {
        const db = await createRxDatabase<ZakAppCollections>({
            name: dbName,
            storage: storage,
            password: password,
            ignoreDuplicate: true
        });

        if (!db.collections.assets) {
            console.log('DatabaseService: Database created. Adding collections...');
            await db.addCollections({
                assets: { schema: AssetSchema, migrationStrategies: migrationStrategiesV3 },
                liabilities: { schema: LiabilitySchema, migrationStrategies: migrationStrategiesV2 },
                zakat_calculations: { schema: ZakatCalculationSchema, migrationStrategies: migrationStrategiesV2 },
                nisab_year_records: { schema: NisabYearRecordSchema, migrationStrategies: migrationStrategiesV3 },
                payment_records: { schema: PaymentRecordSchema, migrationStrategies: migrationStrategiesV3 },
                user_settings: { schema: UserSettingsSchema, migrationStrategies: migrationStrategiesV2 }
            });
            console.log('DatabaseService: Collections added.');
        } else {
            console.log('DatabaseService: Collections already exist. Skipping initialization.');
        }

        return db;
    } catch (err) {
        console.error('DatabaseService: Failed to create database', err);
        throw err;
    }
};

// Event Emitter for DB changes
const dbListeners: ((db: ZakAppDatabase | null) => void)[] = [];

const notifyListeners = (db: ZakAppDatabase | null) => {
    dbListeners.forEach(listener => listener(db));
};

// Public Accessor (Singleton)
export const getDb = (password?: string): Promise<ZakAppDatabase> => {
    // Return existing singleton if active
    if (window._zakapp_db_promise) {
        return window._zakapp_db_promise;
    }

    // Otherwise create new
    window._zakapp_db_promise = _createDb(password)
        .then(db => {
            notifyListeners(db);
            return db;
        })
        .catch(err => {
            console.error("FATAL: Failed to initialize DB", err);
            window._zakapp_db_promise = null; // Reset on failure
            throw err;
        });

    return window._zakapp_db_promise;
};

// Destroys the DB instance (Close Connection) WITHOUT deleting data
export const closeDb = async () => {
    if (window._zakapp_db_promise) {
        try {
            console.log("DatabaseService: Closing DB connection...");
            const db = await window._zakapp_db_promise;
            if (db && !db.destroyed) {
                await db.destroy();
                console.log("DatabaseService: DB Instance Destroyed (Closed).");
            }
        } catch (e) {
            console.error('Error closing DB:', e);
        }
        window._zakapp_db_promise = null;
        notifyListeners(null);
    }
};

// Removes the DB (Deletes ALL Data)
export const resetDb = async () => {
    if (window._zakapp_db_promise) {
        try {
            console.warn("DatabaseService: DELETING DB (RESET)...");
            const db = await window._zakapp_db_promise;
            if (db && !db.destroyed) {
                await db.remove();
                console.log("DatabaseService: DB Removed.");
            }
        } catch (e) {
            console.error('Error removing DB:', e);
        }
        window._zakapp_db_promise = null;
        notifyListeners(null);
    }
};

// Hook for React components - Reactively updates when DB instance changes
export const useDb = () => {
    const [db, setDb] = useState<ZakAppDatabase | null>(null);

    useEffect(() => {
        let isMounted = true;

        // Initial fetch
        if (window._zakapp_db_promise) {
            window._zakapp_db_promise.then(d => {
                if (isMounted) setDb(d);
            }).catch(() => {
                if (isMounted) setDb(null);
            });
        }

        // Subscribe to changes
        const listener = (newDb: ZakAppDatabase | null) => {
            if (isMounted) setDb(newDb);
        };
        dbListeners.push(listener);

        return () => {
            isMounted = false;
            const index = dbListeners.indexOf(listener);
            if (index > -1) {
                dbListeners.splice(index, 1);
            }
        };
    }, []);

    return db;
};
