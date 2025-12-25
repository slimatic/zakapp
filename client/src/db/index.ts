import { useState, useEffect } from 'react';
import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { AssetSchema } from './schema/asset.schema';
import { LiabilitySchema } from './schema/liability.schema';
import { ZakatCalculationSchema } from './schema/zakatCalc.schema';

// Enable dev mode in development
if (process.env.NODE_ENV === 'development') {
    addRxPlugin(RxDBDevModePlugin);
}

addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

export type ZakAppCollections = {
    assets: RxCollection;
    liabilities: RxCollection;
    zakat_calculations: RxCollection;
};

export type ZakAppDatabase = RxDatabase<ZakAppCollections>;

let dbPromise: Promise<ZakAppDatabase> | null = null;

const _createDb = async (): Promise<ZakAppDatabase> => {
    console.log('DatabaseService: Creating database instance...');

    let storage = getRxStorageDexie();

    // Wrap storage with validation in development to fix DVM1 error
    if (process.env.NODE_ENV === 'development') {
        storage = wrappedValidateAjvStorage({
            storage
        });
    }

    try {
        const db = await createRxDatabase<ZakAppCollections>({
            name: 'zakapp_local_db',
            storage: storage,
            ignoreDuplicate: true
        });

        console.log('DatabaseService: Database created. Adding collections...');
        await db.addCollections({
            assets: {
                schema: AssetSchema
            },
            liabilities: {
                schema: LiabilitySchema
            },
            zakat_calculations: {
                schema: ZakatCalculationSchema
            }
        });

        console.log('DatabaseService: Collections added.');
        return db;
    } catch (err) {
        console.error('DatabaseService: Failed to create database', err);
        throw err;
    }
};

export const getDb = (): Promise<ZakAppDatabase> => {
    if (!dbPromise) {
        dbPromise = _createDb().catch(err => {
            dbPromise = null; // Reset promise on failure so we can retry
            throw err;
        });
    }
    return dbPromise;
};

// Hook for React components

export const useDb = () => {
    const [db, setDb] = useState<ZakAppDatabase | null>(null);

    useEffect(() => {
        getDb().then(setDb);
    }, []);

    return db;
};
