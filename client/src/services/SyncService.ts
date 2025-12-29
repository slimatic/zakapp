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

    private pollingInterval: any = null;
    private localChangeSubs: any[] = [];
    private isSyncingOneShot = new Map<string, boolean>();

    /**
     * Start "Smart Sync" for the given user.
     * Strategy:
     * 1. Sequential Sync (Loop) to avoid browser connection saturation (Max 6).
     * 2. Poll every 30s for server changes.
     * 3. Listen to local changes -> Trigger immediate push.
     */
    async startSync(db: RxDatabase<ZakAppCollections>, userId: string) {
        if (this.db === db && this.userId === userId) {
            return;
        }

        if (this.db) {
            await this.stopSync();
        }

        this.db = db;
        this.userId = userId;

        const safeUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');

        this.syncStatus$.next({
            ...this.syncStatus$.getValue(),
            authMethod: 'basic',
            userId: safeUserId,
            active: true
        });

        // 1. Setup Local Change Listeners (Immediate Push)
        SYNC_COLLECTIONS.forEach(colName => {
            const col = db[colName];
            if (col) {
                const sub = col.$.subscribe(changeEvent => {
                    // Only trigger on LOCAL changes to avoid loops
                    if (!changeEvent.isLocal) return;
                    console.log(`📝 Local change in ${colName} -> Triggering sync`);
                    this.syncCollection(colName, safeUserId);
                });
                this.localChangeSubs.push(sub);
            }
        });

        // 2. Initial Full Sync (Sequential)
        this.syncAllSequentially(safeUserId);

        // 3. Setup Polling (Every 30s)
        this.pollingInterval = setInterval(() => {
            console.log('⏰ Polling for server changes...');
            this.syncAllSequentially(safeUserId);
        }, 30000);
    }

    private async syncAllSequentially(safeUserId: string) {
        for (const colName of SYNC_COLLECTIONS) {
            await this.syncCollection(colName, safeUserId);
        }
    }

    private async syncCollection(collectionName: string, safeUserId: string) {
        // Prevent concurrent runs for same collection
        if (this.isSyncingOneShot.get(collectionName)) return;
        this.isSyncingOneShot.set(collectionName, true);

        // Notify UI
        this.activeCollections.add(collectionName);
        this.updateSyncStatus();

        try {
            const remoteDbName = `zakapp_${safeUserId}_${collectionName}`;
            const couchUrl = getCouchDbUrl();

            // Ensure the user's database exists
            await this.ensureUserDatabase(remoteDbName);

            const collection = this.db![collectionName as keyof ZakAppCollections];
            if (!collection) return;

            // One-Shot Replication
            const replicationState = await replicateCouchDB({
                replicationIdentifier: `zakapp-${safeUserId}-${collectionName}`,
                collection,
                url: `${couchUrl}/${remoteDbName}/`,
                live: false, // ONE-SHOT
                retryTime: 5000,
                pull: {
                    modifier: async (doc: any) => {
                        // Skip system documents or invalid docs
                        if (!doc?._id || typeof doc._id !== 'string' || doc._id.startsWith('_design/')) return doc;

                        if (doc.encrypted && doc.iv && doc.tag) {
                            try {
                                const decrypted = await cryptoService.decryptObject({
                                    ciphertext: doc.encrypted,
                                    iv: doc.iv,
                                    tag: doc.tag
                                });
                                return { _id: doc._id, _rev: doc._rev, ...decrypted };
                            } catch (err) {
                                console.error(`Decryption failed for ${collectionName}:`, err);
                                throw err; // allow retry
                            }
                        }
                        return doc;
                    }
                },
                push: {
                    modifier: async (doc: any) => {
                        if (!doc?._id || typeof doc._id !== 'string' || doc._id.startsWith('_design/')) return doc;
                        const { _id, _rev, _deleted, _attachments, ...sensitiveData } = doc;
                        const { ciphertext, iv, tag } = await cryptoService.encryptObject(sensitiveData);
                        return {
                            _id, _rev,
                            ..._deleted ? { _deleted } : {},
                            ..._attachments ? { _attachments } : {},
                            encrypted: ciphertext, iv, tag
                        };
                    }
                },
                fetch: async (url, opts) => {
                    const creds = await this.getCredentials();
                    const authHeader = 'Basic ' + btoa(`${creds.username}:${creds.password}`);
                    return fetch(url, { ...opts, headers: { ...opts?.headers, 'Authorization': authHeader } });
                }
            });

            // Wait for completion
            await replicationState.awaitInitialReplication();

        } catch (err: any) {
            console.warn(`⚠️ Sync Warning (${collectionName}):`, err.message || err);
        } finally {
            this.isSyncingOneShot.set(collectionName, false);
            this.activeCollections.delete(collectionName);
            this.updateSyncStatus();
        }
    }

    async stopSync() {
        console.log(`🛑 SyncService: Stopping sync for ${this.userId}`);

        // Clear Intervals/Listeners
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.localChangeSubs.forEach(sub => sub.unsubscribe());
        this.localChangeSubs = [];

        this.activeCollections.clear();
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
