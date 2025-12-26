import { RxDatabase } from 'rxdb';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { ZakAppCollections } from '../db';
import { RxReplicationState } from 'rxdb/plugins/replication';

const getAppConfig = () => {
    if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
        return (window as any).APP_CONFIG;
    }
    return {};
};

const config = getAppConfig();
// Use window.location.hostname to ensure we connect to the same host the app is served from.
// This allows 'localhost' to work even if the config has a LAN IP, and vice versa.
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const COUCH_URL = config.COUCHDB_URL || `http://${hostname}:5984`;
const COUCH_USER = config.COUCHDB_USER || 'admin';
const COUCH_PASSWORD = config.COUCHDB_PASSWORD || 'password';

// Collections to sync
const SYNC_COLLECTIONS: (keyof ZakAppCollections)[] = [
    'assets',
    'liabilities',
    'nisab_year_records',
    'payment_records',
    'user_settings',
    'zakat_calculations'
];

export class SyncService {
    private replicationStates: RxReplicationState<any, any>[] = [];
    private db: RxDatabase<ZakAppCollections> | null = null;

    // Status Observable
    public syncStatus$ = new BehaviorSubject<{
        active: boolean;
        errors: any[];
        lastSync: Date | null;
    }>({
        active: false,
        errors: [],
        lastSync: null
    });

    private activeCollections = new Set<string>();

    constructor() { }

    private updateSyncStatus() {
        const isActive = this.activeCollections.size > 0;
        const current = this.syncStatus$.getValue();

        // Only emit if changed to avoid noise (though RxJS distinctUntilChanged handled by UI usually)
        if (current.active !== isActive) {
            this.syncStatus$.next({
                ...current,
                active: isActive,
                lastSync: isActive ? null : new Date()
            });
        }

        if (isActive) {
            console.log(`🔄 Sync Active: [${Array.from(this.activeCollections).join(', ')}]`);
        } else {
            console.log('✅ Sync Idle (All collections synced)');
        }
    }

    async startSync(db: RxDatabase<ZakAppCollections>) {
        if (this.db === db) return; // Already started for this db instance
        this.db = db;

        console.log('🔄 SyncService: Starting replication to', COUCH_URL);

        // Basic Auth Header
        const authHeader = 'Basic ' + btoa(`${COUCH_USER}:${COUCH_PASSWORD}`);

        const errors: any[] = [];

        for (const collectionName of SYNC_COLLECTIONS) {
            const collection = db[collectionName];
            if (!collection) {
                console.warn(`⚠️ SyncService: Collection ${collectionName} not found in DB`);
                continue;
            }

            try {
                const replicationState = await replicateCouchDB({
                    collection,
                    url: `${COUCH_URL}/zakapp_${collectionName}/`,
                    live: true,
                    retryTime: 10000,
                    pull: { modifier: (doc) => doc },
                    push: { modifier: (doc) => doc },
                    fetch: (url, opts) => {
                        return fetch(url, {
                            ...opts,
                            headers: { ...opts?.headers, 'Authorization': authHeader }
                        });
                    }
                });

                // Monitor errors
                replicationState.error$.subscribe(err => {
                    console.error(`❌ Sync Error (${collectionName}):`, err);
                    const current = this.syncStatus$.getValue();
                    this.syncStatus$.next({
                        ...current,
                        errors: [...current.errors, { collection: collectionName, error: err }]
                    });
                });

                // Monitor activity with Set tracking
                replicationState.active$.subscribe(active => {
                    if (active) {
                        this.activeCollections.add(collectionName);
                    } else {
                        this.activeCollections.delete(collectionName);
                    }
                    this.updateSyncStatus();
                });

                this.replicationStates.push(replicationState);
                console.log(`✅ Sync started for ${collectionName}`);

            } catch (err) {
                console.error(`❌ Failed to start sync for ${collectionName}:`, err);
                errors.push(err);
            }
        }

        // Initial status update (force active to allow UI to show starting)
        this.syncStatus$.next({
            active: true,
            errors,
            lastSync: null
        });
    }

    async stopSync() {
        console.log('🛑 SyncService: Stopping replication...');
        await Promise.all(this.replicationStates.map(state => state.cancel()));
        this.replicationStates = [];
        this.activeCollections.clear(); // Clear state
        this.db = null;
        this.syncStatus$.next({
            active: false,
            errors: [],
            lastSync: new Date() // Final sync timestamp
        });
    }
}
import { BehaviorSubject } from 'rxjs';

export const syncService = new SyncService();
