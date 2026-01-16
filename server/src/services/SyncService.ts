/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import axios from 'axios';
import crypto from 'crypto';

export class SyncService {
    private couchDbUrl: string;
    private couchUser: string;
    private couchPass: string;
    private jwtSecret: string;
    private authHeader: string;

    constructor() {
        this.couchDbUrl = process.env.COUCHDB_URL || 'http://couchdb:5984';
        this.couchUser = process.env.COUCHDB_USER || 'admin';
        this.couchPass = process.env.COUCHDB_PASSWORD || 'password';
        this.jwtSecret = process.env.COUCHDB_JWT_SECRET || '';

        // Basic Auth header for Admin operations
        this.authHeader = 'Basic ' + Buffer.from(`${this.couchUser}:${this.couchPass}`).toString('base64');
    }

    /**
     * Generates a deterministic CouchDB password for a user
     */
    private generateCouchDBPassword(userId: string): string {
        if (!this.jwtSecret) throw new Error('COUCHDB_JWT_SECRET missing');
        return crypto
            .createHmac('sha256', this.jwtSecret)
            .update(userId)
            .digest('hex');
    }

    /**
     * Get safe user ID for CouchDB naming
     */
    private getSafeUserId(userId: string): string {
        return userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    /**
     * Get list of database names for a user
     */
    private getUserDatabaseNames(safeUserId: string): string[] {
        return [
            `zakapp_${safeUserId}_assets`,
            `zakapp_${safeUserId}_liabilities`,
            `zakapp_${safeUserId}_nisab_year_records`,
            `zakapp_${safeUserId}_payment_records`,
            `zakapp_${safeUserId}_user_settings`
        ];
    }

    /**
     * Check if service is fully configured
     */
    public isConfigured(): boolean {
        return !!this.jwtSecret;
    }

    /**
     * Ensure user exists in CouchDB and has access to their databases
     */
    public async ensureUserAndDatabases(userId: string) {
        if (!this.isConfigured()) {
            throw new Error('Sync service not configured (missing COUCHDB_JWT_SECRET)');
        }

        const safeUserId = this.getSafeUserId(userId);
        const couchUsername = `user_${safeUserId}`;
        const couchPassword = this.generateCouchDBPassword(userId);

        console.log(`Ensuring CouchDB user: ${couchUsername}`);

        // 1. Ensure CouchDB User exists in _users
        // Use retry logic to handle race conditions when multiple requests hit simultaneously
        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const userDocUrl = `${this.couchDbUrl}/_users/org.couchdb.user:${couchUsername}`;
                let rev: string | undefined = undefined;

                try {
                    // Check if user exists and get revision
                    const existingUser = await axios.get(userDocUrl, { headers: { 'Authorization': this.authHeader } });
                    rev = existingUser.data._rev;
                    console.log(`✅ CouchDB user exists: ${couchUsername} (rev: ${rev})`);
                } catch (userErr: any) {
                    if (userErr.response?.status !== 404) {
                        throw userErr;
                    }
                    console.log(`Creating new CouchDB user: ${couchUsername}`);
                }

                // Create or Update user
                await axios.put(userDocUrl, {
                    _id: `org.couchdb.user:${couchUsername}`,
                    name: couchUsername,
                    password: couchPassword,
                    roles: [couchUsername], // Role matches username for isolation
                    type: 'user',
                    ...(rev ? { _rev: rev } : {})
                }, { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } });

                console.log(`✅ Ensure CouchDB user: ${couchUsername} (Synced Credentials)`);
                break; // Success, exit retry loop

            } catch (err: any) {
                // Handle 409 Conflict (race condition with another request)
                if (err.response?.status === 409 && attempt < MAX_RETRIES) {
                    console.log(`CouchDB user update conflict, retrying (${attempt}/${MAX_RETRIES})...`);
                    // Small delay before retry to let the other request complete
                    await new Promise(r => setTimeout(r, 100 * attempt));
                    continue; // Retry with fresh rev fetch
                }
                console.error('Failed to ensure CouchDB user:', err.response?.data || err.message);
                throw new Error(`Failed to ensure CouchDB user: ${err.message}`);
            }
        }

        // 2. Ensure user's databases exist and have correct permissions
        const dbNames = this.getUserDatabaseNames(safeUserId);

        for (const dbName of dbNames) {
            try {
                const checkUrl = `${this.couchDbUrl}/${dbName}`;

                // Check if database exists
                try {
                    await axios.head(checkUrl, {
                        headers: { 'Authorization': this.authHeader }
                    });
                    console.log(`✅ Database exists: ${dbName}`);
                } catch (checkErr: any) {
                    if (checkErr.response?.status === 404) {
                        // Database doesn't exist, create it
                        console.log(`Creating database: ${dbName}`);

                        await axios.put(checkUrl, {}, {
                            headers: { 'Authorization': this.authHeader }
                        });
                        console.log(`✅ Created database: ${dbName}`);

                        // Set security to allow BOTH the username and the role
                        await axios.put(`${checkUrl}/_security`, {
                            admins: { names: [], roles: [] },
                            members: {
                                names: [couchUsername],
                                roles: [couchUsername]
                            }
                        }, {
                            headers: {
                                'Authorization': this.authHeader,
                                'Content-Type': 'application/json'
                            }
                        });
                        console.log(`✅ Set security for: ${dbName} (user: ${couchUsername})`);
                    } else {
                        throw checkErr;
                    }
                }
            } catch (err) {
                console.error(`Error ensuring database ${dbName}:`, err);
            }
        }

        return {
            username: couchUsername,
            password: couchPassword,
            databases: dbNames
        };
    }

    /**
     * Delete a user and all their databases from CouchDB
     * Used during account deletion to ensure data privacy
     */
    public async deleteUser(userId: string): Promise<void> {
        if (!this.isConfigured()) {
            console.warn('Sync service not configured, skipping CouchDB deletion');
            return;
        }

        const safeUserId = this.getSafeUserId(userId);
        const couchUsername = `user_${safeUserId}`;

        console.log(`Deleting CouchDB user and data for: ${couchUsername}`);

        // 1. Delete all user databases
        const dbNames = this.getUserDatabaseNames(safeUserId);
        for (const dbName of dbNames) {
            try {
                await axios.delete(`${this.couchDbUrl}/${dbName}`, {
                    headers: { 'Authorization': this.authHeader }
                });
                console.log(`✅ Deleted database: ${dbName}`);
            } catch (err: any) {
                if (err.response?.status === 404) {
                    console.log(`Database already gone: ${dbName}`);
                } else {
                    console.error(`Failed to delete database ${dbName}:`, err.message);
                    // Continue to try deleting other DBs even if one fails
                }
            }
        }

        // 2. Delete the user document
        try {
            const userDocUrl = `${this.couchDbUrl}/_users/org.couchdb.user:${couchUsername}`;
            const existingUser = await axios.get(userDocUrl, { headers: { 'Authorization': this.authHeader } });
            const rev = existingUser.data._rev;

            await axios.delete(`${userDocUrl}?rev=${rev}`, {
                headers: { 'Authorization': this.authHeader }
            });
            console.log(`✅ Deleted CouchDB user: ${couchUsername}`);
        } catch (err: any) {
            if (err.response?.status === 404) {
                console.log(`CouchDB user already gone: ${couchUsername}`);
            } else {
                console.error(`Failed to delete CouchDB user ${couchUsername}:`, err.message);
            }
        }
    }
}

export const syncService = new SyncService();
