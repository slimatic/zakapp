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
import { cryptoService } from './CryptoService';

// Collections to sync - only core user data that needs multi-device sync
const SYNC_COLLECTIONS: (keyof ZakAppCollections)[] = [
    'assets',
    'liabilities',
    'zakat_calculations',
    'nisab_year_records',
    'payment_records',
    'user_settings'
];

// Token refresh buffer (refresh 5 min before expiry)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface SyncCredentials {
    username: string;
    password: string;
    expiresAt: Date;
}

export class SyncService {
    private replicationStates: RxReplicationState<any, any>[] = [];
    private db: RxDatabase<ZakAppCollections> | null = null;
    private userId: string | null = null;

    // CouchDB Credential Management
    private syncCredentials: SyncCredentials | null = null;
    private credsRefreshPromise: Promise<SyncCredentials> | null = null;

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
     * Get valid CouchDB credentials, refreshing if needed.
     */
    private async getCredentials(): Promise<SyncCredentials> {
        // Return cached credentials if still valid (with buffer time)
        if (this.syncCredentials && new Date() < new Date(this.syncCredentials.expiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS)) {
            return this.syncCredentials;
        }

        // If a refresh is already in progress, wait for it
        if (this.credsRefreshPromise) {
            return this.credsRefreshPromise;
        }

        // Start credential refresh
        this.credsRefreshPromise = this.refreshCredentials();

        try {
            const creds = await this.credsRefreshPromise;
            return creds;
        } finally {
            this.credsRefreshPromise = null;
        }
    }

    /**
     * Fetch new CouchDB credentials from the backend.
     */
    private async refreshCredentials(): Promise<SyncCredentials> {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            throw new Error('No access token - user not authenticated');
        }

        const apiUrl = getApiBaseUrl();
        console.log('🔑 Fetching CouchDB sync credentials...');

        const response = await fetch(`${apiUrl}/sync/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({ error: 'Unknown error' }));
            // Support both shapes: { message: '...', ... } and { error: { message: '...' } }
            const errMsg = body?.error?.message || body?.message || body?.error || `Credential request failed: ${response.status}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const credentials = {
            username: data.credentials.username,
            password: data.credentials.password,
            expiresAt: new Date(data.expiresAt)
        };

        this.syncCredentials = credentials;

        console.log(`🔑 Sync credentials received (expires: ${data.expiresAt})`);
        return credentials;
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
            const creds = await this.getCredentials();
            const authHeader = 'Basic ' + btoa(`${creds.username}:${creds.password}`);
            const couchUrl = getCouchDbUrl();

            // Use GET to check if database exists and is accessible.
            // Client should NOT attempt to create (PUT) the database as it's handled by the backend.
            const response = await fetch(`${couchUrl}/${dbName}`, {
                method: 'GET',
                headers: { 'Authorization': authHeader }
            });

            if (response.ok) {
                console.log(`📦 Database '${dbName}' is available`);
                return true;
            }

            if (response.status === 401 || response.status === 403) {
                console.warn(`⚠️ Access to '${dbName}' denied. This may be temporary during provisioning.`);
                return false;
            }

            if (response.status === 404) {
                console.warn(`📦 Database '${dbName}' not found. Backend provisioning may be in progress.`);
                return false;
            }

            console.error(`❌ Unexpected status for DB '${dbName}': ${response.status}`);
            return false;
        } catch (err) {
            console.error(`❌ Error checking DB '${dbName}':`, err);
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

        console.log(`🔄 SyncService: Starting Basic Auth sync for ${safeUserId} to ${couchUrl}`);

        // Update status to show Basic auth
        this.syncStatus$.next({
            ...this.syncStatus$.getValue(),
            authMethod: 'basic',
            userId: safeUserId
        });

        // Pre-fetch credentials to validate auth works
        try {
            await this.getCredentials();
        } catch (err: any) {
            console.error('❌ Failed to get sync credentials:', err.message);
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
                    // DECRYPTION: Pull from CouchDB → Decrypt → Local DB
                    pull: {
                        modifier: async (doc: any) => {
                            // Skip system documents or invalid docs
                            if (!doc?._id || typeof doc._id !== 'string' || doc._id.startsWith('_design/')) return doc;

                            // If document has encrypted field, decrypt it
                            if (doc.encrypted && doc.iv && doc.tag) {
                                try {
                                    const decrypted = await cryptoService.decryptObject({
                                        ciphertext: doc.encrypted,
                                        iv: doc.iv,
                                        tag: doc.tag
                                    });

                                    // Merge decrypted data with metadata
                                    return {
                                        _id: doc._id,
                                        _rev: doc._rev,
                                        ...decrypted
                                    };
                                } catch (err) {
                                    console.error(`Decryption failed for ${collectionName}:`, err);
                                    throw err;
                                }
                            }

                            // Document is not encrypted (legacy data or migration)
                            return doc;
                        }
                    },
                    // ENCRYPTION: Local DB → Encrypt → Push to CouchDB
                    push: {
                        modifier: async (doc: any) => {
                            // Skip system documents or invalid docs
                            if (!doc?._id || typeof doc._id !== 'string' || doc._id.startsWith('_design/')) return doc;

                            // Extract metadata fields (NOT encrypted)
                            const { _id, _rev, _deleted, _attachments, ...sensitiveData } = doc;

                            // Encrypt all sensitive fields
                            const { ciphertext, iv, tag } = await cryptoService.encryptObject(sensitiveData);

                            // Return encrypted document structure
                            return {
                                _id,
                                _rev,
                                ..._deleted ? { _deleted } : {},
                                ..._attachments ? { _attachments } : {},
                                encrypted: ciphertext,
                                iv,
                                tag
                            };
                        }
                    },
                    fetch: async (url, opts) => {
                        try {
                            const creds = await this.getCredentials();
                            const authHeader = 'Basic ' + btoa(`${creds.username}:${creds.password}`);

                            const response = await fetch(url, {
                                ...opts,
                                headers: {
                                    ...opts?.headers,
                                    'Authorization': authHeader
                                }
                            });

                            if (!response.ok && response.status !== 404) {
                                console.warn(`⚠️ Sync fetch failed [${collectionName}]: ${response.status} ${url}`);
                            }

                            return response;
                        } catch (err: any) {
                            console.error(`❌ Sync fetch network error [${collectionName}]:`, err.message);
                            throw err;
                        }
                    }
                });

                // Monitor errors
                replicationState.error$.subscribe(err => {
                    console.error(`❌ Sync Error (${collectionName}):`, err);
                    const errAny = err as any;
                    const innerMsg = errAny?.parameters?.errors?.[0]?.message || err.message || JSON.stringify(err);
                    const statusCode = errAny?.parameters?.errors?.[0]?.status || (err as any).status;

                    if (statusCode === 401 || innerMsg.includes('401')) {
                        // Auth expired - clear and retry on next request
                        this.syncCredentials = null;
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

                // Monitor initial sync completion with a timeout
                const initialSyncTimeout = setTimeout(() => {
                    if (this.initialSyncPending.has(collectionName)) {
                        console.warn(`⏳ Initial sync timed out: ${collectionName} (proceeding)`);
                        this.initialSyncPending.delete(collectionName);
                        this.updateSyncStatus();
                    }
                }, 15000); // 15s timeout for the "Syncing..." indicator

                replicationState.awaitInitialReplication()
                    .then(() => {
                        clearTimeout(initialSyncTimeout);
                        console.log(`✅ Initial sync complete: ${collectionName}`);
                        this.initialSyncPending.delete(collectionName);
                        this.updateSyncStatus();
                    })
                    .catch(err => {
                        clearTimeout(initialSyncTimeout);
                        console.error(`❌ Initial sync failed: ${collectionName}`, err);
                        this.initialSyncPending.delete(collectionName);
                        this.updateSyncStatus();
                    });

                // Monitor active/idle state
                replicationState.active$.subscribe(isActive => {
                    if (isActive) {
                        this.activeCollections.add(collectionName);
                    } else {
                        this.activeCollections.delete(collectionName);
                    }
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
        this.syncCredentials = null;
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
