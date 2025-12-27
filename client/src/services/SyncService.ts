/**
 * SyncService - Per-User CouchDB Replication with JWT Authentication
 * 
 * Architecture: Each user syncs to their OWN set of CouchDB databases:
 *   - zakapp_<userId>_assets
 *   - zakapp_<userId>_nisab_year_records
 *   - zakapp_<userId>_payment_records
 * 
 * Security: Uses JWT tokens issued by backend, NOT exposed credentials.
 * Tokens are fetched from /api/sync/token and auto-refresh before expiry.
 * 
 * @architect Zero-Knowledge: Documents are encrypted client-side before sync
 */

import { RxDatabase } from 'rxdb';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { ZakAppCollections } from '../db';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { BehaviorSubject } from 'rxjs';
import toast from 'react-hot-toast';
import { getCouchDbUrl, getApiBaseUrl } from '../config';

// Collections to sync - only core user data that needs multi-device sync
const SYNC_COLLECTIONS: (keyof ZakAppCollections)[] = [
    'assets',
    'nisab_year_records',
    'payment_records'
];

// Token refresh buffer (refresh 5 min before expiry)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface SyncToken {
    token: string;
    expiresAt: Date;
}

export class SyncService {
    private replicationStates: RxReplicationState<any, any>[] = [];
    private db: RxDatabase<ZakAppCollections> | null = null;
    private userId: string | null = null;

    // JWT Token Management
    private syncToken: SyncToken | null = null;
    private tokenRefreshPromise: Promise<string> | null = null;

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
        authMethod: 'jwt' | 'basic' | 'none';
    }>({
        active: false,
        pending: [],
        errors: [],
        lastSync: null,
        userId: null,
        authMethod: 'none'
    });

    constructor() { }

    /**
     * Get a valid JWT token, refreshing if needed.
     * Uses singleton pattern to prevent multiple simultaneous refreshes.
     */
    private async getToken(): Promise<string> {
        // Return cached token if still valid (with buffer time)
        if (this.syncToken && new Date() < new Date(this.syncToken.expiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS)) {
            return this.syncToken.token;
        }

        // If a refresh is already in progress, wait for it
        if (this.tokenRefreshPromise) {
            return this.tokenRefreshPromise;
        }

        // Start token refresh
        this.tokenRefreshPromise = this.refreshToken();

        try {
            const token = await this.tokenRefreshPromise;
            return token;
        } finally {
            this.tokenRefreshPromise = null;
        }
    }

    /**
     * Fetch a new JWT token from the backend.
     */
    private async refreshToken(): Promise<string> {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            throw new Error('No access token - user not authenticated');
        }

        const apiUrl = getApiBaseUrl();
        console.log('🔑 Fetching CouchDB sync token...');

        const response = await fetch(`${apiUrl}/sync/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.message || error.error || `Token request failed: ${response.status}`);
        }

        const data = await response.json();
        this.syncToken = {
            token: data.token,
            expiresAt: new Date(data.expiresAt)
        };

        console.log(`🔑 Sync token received (expires: ${data.expiresAt})`);
        return data.token;
    }

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
     * Uses PUT which creates if not exists.
     */
    private async ensureUserDatabase(dbName: string): Promise<boolean> {
        try {
            const token = await this.getToken();
            const couchUrl = getCouchDbUrl();

            const response = await fetch(`${couchUrl}/${dbName}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok || response.status === 412) {
                // 412 = DB already exists - that's fine
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
     * @param userId The authenticated user's ID.
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

        // Sanitize userId for CouchDB db name
        const safeUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const couchUrl = getCouchDbUrl();

        console.log(`🔄 SyncService: Starting JWT-authenticated sync for ${safeUserId} to ${couchUrl}`);

        // Update status to show JWT auth
        this.syncStatus$.next({
            ...this.syncStatus$.getValue(),
            authMethod: 'jwt',
            userId: safeUserId
        });

        // Pre-fetch token to validate auth works
        try {
            await this.getToken();
        } catch (err: any) {
            console.error('❌ Failed to get sync token:', err.message);
            toast.error('Sync authentication failed. Please re-login.', { id: 'sync-auth-failed' });
            return;
        }

        for (const collectionName of SYNC_COLLECTIONS) {
            const collection = db[collectionName];
            if (!collection) {
                console.warn(`⚠️ SyncService: Collection ${collectionName} not found`);
                continue;
            }

            const remoteDbName = `zakapp_${safeUserId}_${collectionName}`;

            try {
                // Ensure the user's database exists
                await this.ensureUserDatabase(remoteDbName);

                this.initialSyncPending.add(collectionName);
                this.updateSyncStatus();

                const replicationState = await replicateCouchDB({
                    replicationIdentifier: `zakapp-${safeUserId}-${collectionName}`,
                    collection,
                    url: `${couchUrl}/${remoteDbName}/`,
                    live: true,
                    retryTime: 10000,
                    pull: { modifier: (doc) => doc },
                    push: { modifier: (doc) => doc },
                    fetch: async (url, opts) => {
                        // Get fresh token for each request (auto-refresh)
                        const token = await this.getToken();
                        return fetch(url, {
                            ...opts,
                            headers: {
                                ...opts?.headers,
                                'Authorization': `Bearer ${token}`
                            }
                        });
                    }
                });

                // Monitor errors
                replicationState.error$.subscribe(err => {
                    console.error(`❌ Sync Error (${collectionName}):`, err);
                    const errAny = err as any;
                    const innerMsg = errAny?.parameters?.errors?.[0]?.message || err.message || JSON.stringify(err);
                    const statusCode = errAny?.parameters?.errors?.[0]?.status || (err as any).status;

                    if (statusCode === 401 || innerMsg.includes('401')) {
                        // Token expired - clear and retry on next request
                        this.syncToken = null;
                        toast.error(`Sync auth expired. Refreshing...`, { id: `sync-auth-${collectionName}` });
                    } else if (innerMsg.includes('Failed to fetch') || innerMsg.includes('Connection refused')) {
                        console.warn(`Network Error (${collectionName}): ${couchUrl}`);
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
        this.syncToken = null;
        this.db = null;
        this.userId = null;
        this.syncStatus$.next({
            active: false,
            pending: [],
            errors: [],
            lastSync: new Date(),
            userId: null,
            authMethod: 'none'
        });
    }
}

export const syncService = new SyncService();
