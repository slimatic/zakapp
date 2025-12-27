/**
 * SyncService - Per-User CouchDB Replication
 * 
 * Architecture: Each user syncs to their OWN set of CouchDB databases:
 *   - zakapp_<userId>_assets
 *   - zakapp_<userId>_liabilities
 *   - etc.
 * 
 * This follows the Obsidian LiveSync model where each user has isolated storage.
 * Documents are encrypted client-side before sync - CouchDB only sees ciphertext.
 */

import { RxDatabase } from 'rxdb';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { ZakAppCollections } from '../db';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { BehaviorSubject } from 'rxjs';
import toast from 'react-hot-toast';

const getAppConfig = () => {
    if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
        return (window as any).APP_CONFIG;
    }
    return {};
};

const config = getAppConfig();

/**
 * CouchDB URL Resolution Strategy:
 * 
 * 1. APP_CONFIG.COUCHDB_URL (preferred) - For production with Cloudflare Tunnel
 *    Set this in config.js: COUCHDB_URL: 'https://couch.yoursite.com'
 * 
 * 2. Hostname-based detection (fallback) - For local/LAN development
 *    Uses window.location.hostname + port 5984
 */
const getCouchDbUrl = (): string => {
    if (typeof window === 'undefined') return 'http://localhost:5984';

    // Priority 1: Explicit config (for Cloudflare Tunnel / production)
    if (config.COUCHDB_URL) {
        console.log(`🔧 CouchDB URL: ${config.COUCHDB_URL} (from APP_CONFIG)`);
        return config.COUCHDB_URL;
    }

    // Priority 2: Derive from hostname (for local/LAN development)
    const hostname = window.location.hostname;
    const couchPort = 5984;
    const url = `http://${hostname}:${couchPort}`;

    console.log(`🔧 CouchDB URL: ${url} (derived from window.location)`);
    return url;
};

const COUCH_URL = getCouchDbUrl();
const COUCH_USER = config.COUCHDB_USER || 'admin';
const COUCH_PASSWORD = config.COUCHDB_PASSWORD || 'password';

// Collections to sync - only core user data that needs multi-device sync
// Derived data (liabilities, calculations) stays local, user_settings is personal preference
const SYNC_COLLECTIONS: (keyof ZakAppCollections)[] = [
    'assets',
    'nisab_year_records',
    'payment_records'
];

export class SyncService {
    private replicationStates: RxReplicationState<any, any>[] = [];
    private db: RxDatabase<ZakAppCollections> | null = null;
    private userId: string | null = null;

    // Activity Tracking
    private initialSyncPending = new Set<string>();
    private activeCollections = new Set<string>();
    private activityDebounceTimer: any = null;

    // Status Observable
    public syncStatus$ = new BehaviorSubject<{
        active: boolean;
        pending: string[];
        errors: any[];
        lastSync: Date | null;
        userId: string | null;
    }>({
        active: false,
        pending: [],
        errors: [],
        lastSync: null,
        userId: null
    });

    constructor() { }

    private updateSyncStatus() {
        const isInitialSync = this.initialSyncPending.size > 0;
        const isThroughputActive = this.activeCollections.size > 0;
        const isActive = isInitialSync || isThroughputActive;

        const current = this.syncStatus$.getValue();
        const pendingList = Array.from(this.initialSyncPending);
        const pendingChanged = JSON.stringify(current.pending.sort()) !== JSON.stringify(pendingList.sort());

        if (current.active !== isActive || pendingChanged) {
            this.syncStatus$.next({
                ...current,
                active: isActive,
                pending: pendingList,
                lastSync: isActive ? null : new Date(),
                userId: this.userId
            });

            if (isActive) {
                console.log(`🔄 Sync Active [${this.userId}]: [${pendingList.join(', ')}]`);
            } else {
                console.log(`✅ Sync Idle [${this.userId}]: All collections synced`);
            }
        }
    }

    private triggerActivity(collectionName: string) {
        this.activeCollections.add(collectionName);
        this.updateSyncStatus();

        if (this.activityDebounceTimer) clearTimeout(this.activityDebounceTimer);
        this.activityDebounceTimer = setTimeout(() => {
            this.activeCollections.clear();
            this.updateSyncStatus();
        }, 2000);
    }

    /**
     * Ensures the user-specific CouchDB database exists.
     * Uses PUT which creates if not exists (with admin credentials).
     */
    private async ensureUserDatabase(dbName: string, authHeader: string): Promise<boolean> {
        try {
            const response = await fetch(`${COUCH_URL}/${dbName}`, {
                method: 'PUT',
                headers: { 'Authorization': authHeader }
            });
            if (response.ok || response.status === 412) {
                // 412 = Precondition Failed = DB already exists. Both are fine.
                console.log(`📦 Database '${dbName}' ready`);
                return true;
            }
            console.error(`❌ Failed to create DB '${dbName}': ${response.status}`);
            return false;
        } catch (err) {
            console.error(`❌ Error creating DB '${dbName}':`, err);
            return false;
        }
    }

    /**
     * Start replication for the given user.
     * @param db The RxDB database instance.
     * @param userId The authenticated user's ID (Prisma cuid).
     */
    async startSync(db: RxDatabase<ZakAppCollections>, userId: string) {
        if (this.db === db && this.userId === userId) {
            console.log('🔄 SyncService: Already syncing for this user/db');
            return;
        }

        // Stop any existing sync first
        if (this.db) {
            await this.stopSync();
        }

        this.db = db;
        this.userId = userId;

        // Sanitize userId for CouchDB db name (lowercase, no special chars)
        const safeUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');

        console.log(`🔄 SyncService: Starting per-user sync for ${safeUserId} to ${COUCH_URL}`);

        const authHeader = 'Basic ' + btoa(`${COUCH_USER}:${COUCH_PASSWORD}`);

        for (const collectionName of SYNC_COLLECTIONS) {
            const collection = db[collectionName];
            if (!collection) {
                console.warn(`⚠️ SyncService: Collection ${collectionName} not found`);
                continue;
            }

            // Per-user database naming: zakapp_<userId>_<collection>
            const remoteDbName = `zakapp_${safeUserId}_${collectionName}`;

            try {
                // Ensure the user's database exists
                await this.ensureUserDatabase(remoteDbName, authHeader);

                this.initialSyncPending.add(collectionName);
                this.updateSyncStatus();

                const replicationState = await replicateCouchDB({
                    replicationIdentifier: `zakapp-${safeUserId}-${collectionName}`,
                    collection,
                    url: `${COUCH_URL}/${remoteDbName}/`,
                    live: true,
                    retryTime: 10000,
                    pull: { modifier: (doc) => doc },
                    push: { modifier: (doc) => doc },
                    fetch: (url, opts) => fetch(url, {
                        ...opts,
                        headers: { ...opts?.headers, 'Authorization': authHeader }
                    })
                });

                // Monitor errors
                replicationState.error$.subscribe(err => {
                    console.error(`❌ Sync Error (${collectionName}):`, err);
                    const errAny = err as any;
                    const innerMsg = errAny?.parameters?.errors?.[0]?.message || err.message || JSON.stringify(err);
                    const statusCode = errAny?.parameters?.errors?.[0]?.status || (err as any).status;

                    if (statusCode === 401 || innerMsg.includes('401')) {
                        toast.error(`Sync Auth Failed. Check CouchDB credentials.`, { id: `sync-auth-${collectionName}` });
                    } else if (innerMsg.includes('Failed to fetch') || innerMsg.includes('Connection refused')) {
                        console.warn(`Network Error (${collectionName}): ${COUCH_URL}`);
                    } else {
                        toast.error(`Sync Error (${collectionName}): ${innerMsg}`, { id: `sync-err-${collectionName}` });
                    }

                    const current = this.syncStatus$.getValue();
                    this.syncStatus$.next({
                        ...current,
                        errors: [...current.errors, { collection: collectionName, error: innerMsg }]
                    });
                });

                // Monitor throughput
                replicationState.received$.subscribe(() => this.triggerActivity(collectionName));
                replicationState.sent$.subscribe(() => this.triggerActivity(collectionName));

                // Monitor initial sync completion
                replicationState.awaitInitialReplication()
                    .then(() => {
                        console.log(`✅ Initial sync complete: ${collectionName}`);
                        this.initialSyncPending.delete(collectionName);
                        this.updateSyncStatus();
                    })
                    .catch(err => {
                        console.error(`❌ Initial sync failed: ${collectionName}`, err);
                        this.initialSyncPending.delete(collectionName);
                        this.updateSyncStatus();
                    });

                this.replicationStates.push(replicationState);
                console.log(`✅ Replication started: ${remoteDbName}`);

            } catch (err) {
                console.error(`❌ Failed to start sync for ${collectionName}:`, err);
                this.initialSyncPending.delete(collectionName);
            }
        }

        this.updateSyncStatus();
    }

    async stopSync() {
        console.log(`🛑 SyncService: Stopping sync for ${this.userId}`);
        await Promise.all(this.replicationStates.map(state => state.cancel()));
        this.replicationStates = [];
        this.activeCollections.clear();
        this.initialSyncPending.clear();
        this.db = null;
        this.userId = null;
        this.syncStatus$.next({
            active: false,
            pending: [],
            errors: [],
            lastSync: new Date(),
            userId: null
        });
    }
}

export const syncService = new SyncService();
