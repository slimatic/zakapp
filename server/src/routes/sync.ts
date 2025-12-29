/**
 * Sync Routes - CouchDB JWT Token Endpoint
 * 
 * Provides JWT tokens for authenticated users to sync with CouchDB.
 * Tokens contain user-specific roles for per-user database isolation.
 * 
 * @architect Security: Tokens expire in 1 hour, auto-refresh on client
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Environment Variables
const COUCHDB_JWT_SECRET = process.env.COUCHDB_JWT_SECRET;
const COUCHDB_URL = process.env.COUCHDB_URL || 'http://couchdb:5984';
const COUCHDB_USER = process.env.COUCHDB_USER || 'admin';
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || 'password';

// Token expiry: 1 hour
const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour

/**
 * Generates a deterministic CouchDB password for a user
 */
const generateCouchDBPassword = (userId: string): string => {
    if (!COUCHDB_JWT_SECRET) throw new Error('COUCHDB_JWT_SECRET missing');
    return crypto
        .createHmac('sha256', COUCHDB_JWT_SECRET)
        .update(userId)
        .digest('hex');
};

/**
 * POST /api/sync/token
 * 
 * Issues a JWT token for CouchDB authentication.
 * The token includes the user's ID and CouchDB roles.
 * 
 * Response: { token: string, expiresAt: string }
 */
router.post('/token', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    console.log('Sync token endpoint called');
    try {
        console.log('Checking secret...');
        if (!COUCHDB_JWT_SECRET) {
            console.error('COUCHDB_JWT_SECRET not configured');
            return res.status(500).json({
                error: 'Sync not configured',
                message: 'Server missing COUCHDB_JWT_SECRET environment variable'
            });
        }
        console.log('Secret configured.');

        // Get user from auth middleware
        const user = req.user;
        if (!user || !user.id) {
            console.error('User not authenticated in controller');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log(`User authenticated: ${user.id}`);

        const userId = user.id;
        const safeUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const couchUsername = `user_${safeUserId}`;
        const couchPassword = generateCouchDBPassword(userId);

        console.log(`Ensuring CouchDB user: ${couchUsername}`);

        const authHeader = 'Basic ' + Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64');

        // 1. Ensure CouchDB User exists in _users
        try {
            const userDocUrl = `${COUCHDB_URL}/_users/org.couchdb.user:${couchUsername}`;
            let rev = undefined;

            try {
                // Check if user exists and get revision
                const existingUser = await axios.get(userDocUrl, { headers: { 'Authorization': authHeader } });
                rev = existingUser.data._rev;
                console.log(`✅ CouchDB user exists: ${couchUsername} (rev: ${rev})`);
            } catch (userErr: any) {
                if (userErr.response?.status !== 404) {
                    throw userErr;
                }
                console.log(`Creating new CouchDB user: ${couchUsername}`);
            }

            // Create or Update user with current password
            // This ensures password rotation applies if the secret changed
            await axios.put(userDocUrl, {
                _id: `org.couchdb.user:${couchUsername}`,
                name: couchUsername,
                password: couchPassword,
                roles: [couchUsername],
                type: 'user',
                ...(rev ? { _rev: rev } : {})
            }, { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } });

            console.log(`✅ Ensure CouchDB user: ${couchUsername} (Synced Credentials)`);

        } catch (err: any) {
            console.error('Failed to ensure CouchDB user:', err.response?.data || err.message);
            throw new Error(`Failed to ensure CouchDB user: ${err.message}`);
        }

        // 2. Ensure user's databases exist
        const dbNames = [
            `zakapp_${safeUserId}_assets`,
            `zakapp_${safeUserId}_liabilities`,
            `zakapp_${safeUserId}_zakat_calculations`,
            `zakapp_${safeUserId}_nisab_year_records`,
            `zakapp_${safeUserId}_payment_records`,
            `zakapp_${safeUserId}_user_settings`
        ];

        for (const dbName of dbNames) {
            try {
                const checkUrl = `${COUCHDB_URL}/${dbName}`;

                // Check if database exists
                try {
                    await axios.head(checkUrl, {
                        headers: { 'Authorization': authHeader }
                    });
                    console.log(`✅ Database exists: ${dbName}`);
                } catch (checkErr: any) {
                    if (checkErr.response?.status === 404) {
                        // Database doesn't exist, create it
                        console.log(`Creating database: ${dbName}`);

                        await axios.put(checkUrl, {}, {
                            headers: { 'Authorization': authHeader }
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
                                'Authorization': authHeader,
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

        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString();

        console.log(`🔑 Issued CouchDB credentials for user ${safeUserId}`);

        res.json({
            // Basic Auth credentials instead of JWT
            credentials: {
                username: couchUsername,
                password: couchPassword
            },
            expiresAt,
            userId: safeUserId,
            databases: dbNames
        });

    } catch (error: any) {
        console.error('Failed to issue sync token:', error);
        res.status(500).json({
            error: 'Failed to generate sync token',
            message: error.message
        });
    }
});

/**
 * GET /api/sync/status
 * 
 * Returns the sync configuration status.
 * Useful for debugging and client health checks.
 */
router.get('/status', (req: Request, res: Response) => {
    const configured = !!COUCHDB_JWT_SECRET;
    const couchDbUrl = process.env.COUCHDB_URL || process.env.REACT_APP_COUCHDB_URL;

    res.json({
        jwtConfigured: configured,
        couchDbUrl: couchDbUrl ? 'configured' : 'not configured',
        expirySeconds: TOKEN_EXPIRY_SECONDS
    });
});

export default router;
