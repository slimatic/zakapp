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

import { useState, useEffect } from 'react';
import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin, removeRxDatabase } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { wrappedKeyEncryptionCryptoJsStorage } from 'rxdb/plugins/encryption-crypto-js';
import { RxDBZeroKnowledgePlugin } from './plugins/zeroKnowledgePlugin';
import { AssetSchema } from './schema/asset.schema';
import { LiabilitySchema } from './schema/liability.schema';
import { ZakatCalculationSchema } from './schema/zakatCalc.schema';
import { NisabYearRecordSchema } from './schema/nisabYearRecord.schema';
import { PaymentRecordSchema } from './schema/paymentRecord.schema';
import { UserSettingsSchema } from './schema/userSettings.schema';

import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

console.log('RxDB Storage Adapter (Dexie):', getRxStorageDexie);

addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBZeroKnowledgePlugin);

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

const migrationStrategiesV4 = {
    ...migrationStrategiesV3,
    4: (doc: any) => doc
};

if (process.env.NODE_ENV === 'development') {
    addRxPlugin(RxDBDevModePlugin);
}

// Global window augmentation for HMR safety
declare global {
    interface Window {
        _zakapp_db_promise: Promise<ZakAppDatabase> | null;
        _zakapp_db_password?: string;
        _zakapp_storage?: any;
    }
}

// Internal Storage Creator (Singleton)
const getStorage = () => {
    if (window._zakapp_storage) return window._zakapp_storage;

    let storage;
    if (process.env.NODE_ENV === 'test') {
        storage = getRxStorageMemory();
        storage = wrappedKeyEncryptionCryptoJsStorage({ storage });
    } else {
        storage = getRxStorageDexie();
        if (process.env.NODE_ENV === 'development') {
            storage = wrappedValidateAjvStorage({ storage });
        }
        storage = wrappedKeyEncryptionCryptoJsStorage({ storage });
    }
    window._zakapp_storage = storage;
    return storage;
};

// Internal Creator
const _createDb = async (password?: string): Promise<ZakAppDatabase> => {
    console.log('DatabaseService: Creating database instance...');
    const storage = getStorage();
    const dbName = 'zakapp_db_v10';

    try {
        const db = await createRxDatabase<ZakAppCollections>({
            name: dbName,
            storage: storage,
            password: password,
            ignoreDuplicate: true
        });

        // Always check if collections are already there
        if (!db.collections.assets) {
            console.log('DatabaseService: Database created. Adding collections...');
            await db.addCollections({
                assets: { schema: AssetSchema, migrationStrategies: migrationStrategiesV4 },
                liabilities: { schema: LiabilitySchema, migrationStrategies: migrationStrategiesV3 },
                zakat_calculations: { schema: ZakatCalculationSchema, migrationStrategies: migrationStrategiesV2 },
                nisab_year_records: { schema: NisabYearRecordSchema, migrationStrategies: migrationStrategiesV4 },
                payment_records: { schema: PaymentRecordSchema, migrationStrategies: migrationStrategiesV4 },
                user_settings: { schema: UserSettingsSchema, migrationStrategies: migrationStrategiesV4 }
            });
            console.log('DatabaseService: Collections added.');
        } else {
            console.log('DatabaseService: Collections already exist in this instance.');
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
export const getDb = async (password?: string): Promise<ZakAppDatabase> => {
    // If we have an existing promise, check if it was created with the SAME password
    if (window._zakapp_db_promise) {
        if (window._zakapp_db_password === password) {
            console.log('DatabaseService: Returning existing DB singleton');
            return window._zakapp_db_promise;
        } else {
            // Password changed! We MUST close the old one before returning a new one
            console.warn('DatabaseService: Password changed, closing old instance...');
            await closeDb();
        }
    }

    // Otherwise create new
    window._zakapp_db_password = password;
    window._zakapp_db_promise = _createDb(password)
        .then(db => {
            notifyListeners(db);
            return db;
        })
        .catch(err => {
            console.error("FATAL: Failed to initialize DB", err);
            window._zakapp_db_promise = null; // Reset on failure
            window._zakapp_db_password = undefined;
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

            // Safety check: ensure db is valid and has destroy method
            if (db && !(db as any).destroyed) {
                if (typeof (db as any).destroy === 'function') {
                    await (db as any).destroy();
                    console.log("DatabaseService: DB Instance Destroyed (Closed).");
                } else {
                    console.warn("DatabaseService: DB instance exists but missing destroy() method:", Object.keys(db));
                }
            }
        } catch (e) {
            console.error('Error closing DB:', e);
        }
        window._zakapp_db_promise = null;
        window._zakapp_db_password = undefined;
        notifyListeners(null);
    }
};

// Removes the DB (Deletes ALL Data)
export const resetDb = async () => {
    // Ensure we close any open connection first
    await closeDb();

    if (window._zakapp_db_promise) { // Should be null by now, but just in case
        // ... (existing reset logic if needed, but closeDb handles the promise nulling)
    }
    // Actually resetDb logic in the original code relied on the promise. 
    // But wait, remove() requires the DB instance! 
    // So we can't close it first if we want to call .remove().

    // Correct logic for resetDb:
    if (window._zakapp_db_promise) {
        try {
            console.warn("DatabaseService: DELETING DB (RESET)...");
            const db = await window._zakapp_db_promise;
            if (db && !(db as any).destroyed) {
                if (typeof (db as any).remove === 'function') {
                    await (db as any).remove();
                    console.log("DatabaseService: DB Removed.");
                } else {
                    console.warn("DatabaseService: missing remove() method");
                }
            }
        } catch (e) {
            console.error('Error removing DB:', e);
        }
        window._zakapp_db_promise = null;
        window._zakapp_db_password = undefined;
        notifyListeners(null);
    }
};

// Force Delete DB by Name (Used when we can't open it)
export const forceResetDatabase = async () => {
    console.warn("DatabaseService: FORCING DB DELETION (forceResetDatabase)...");

    // CRITICAL: Close any lingering open instances first to prevent COL23 (Max Collections) leak
    await closeDb();

    try {
        // Need to replicate logic of storage selection
        let storage;
        if (process.env.NODE_ENV === 'test') {
            storage = getRxStorageMemory();
        } else {
            storage = getRxStorageDexie();
        }

        await removeRxDatabase('zakapp_db_v10', storage);
        console.log("DatabaseService: DB Forced Removed via removeRxDatabase.");
        window._zakapp_db_promise = null;
        window._zakapp_db_password = undefined;
        notifyListeners(null);
    } catch (err) {
        console.error("DatabaseService: Failed to force remove DB", err);
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

    // ... existing code ...
    return db;
};

// HMR Handling for Vite/React
// This fixes the "COL23: Maximum collections limited" error during development hot-reloads
if (import.meta.hot) {
    import.meta.hot.dispose(async () => {
        console.warn('DatabaseService: HMR Disposing - Closing Database...');
        await closeDb();
    });
}
