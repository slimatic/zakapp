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

        // Sanitize userId for CouchDB database naming (lowercase, alphanumeric + underscore)
        const safeUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
        console.log(`Safe userId: ${safeUserId}`);

        // Ensure user's databases exist
        const dbNames = [
            `zakapp_${safeUserId}_assets`,
            `zakapp_${safeUserId}_nisab_year_records`,
            `zakapp_${safeUserId}_payment_records`
        ];

        const authHeader = 'Basic ' + Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64');

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

                        // Set security to ONLY allow this user's JWT role
                        await axios.put(`${checkUrl}/_security`, {
                            admins: { names: [], roles: [] },
                            members: { names: [], roles: [`user_${safeUserId}`] }  // ✅ ENFORCE JWT ROLE
                        }, {
                            headers: {
                                'Authorization': authHeader,
                                'Content-Type': 'application/json'
                            }
                        });
                        console.log(`✅ Set security for: ${dbName} (role: user_${safeUserId})`);
                    } else {
                        throw checkErr;
                    }
                }
            } catch (err) {
                console.error(`Error ensuring database ${dbName}:`, err);
                // Don't fail the token request if database creation fails
            }
        }

        // Generate JWT with CouchDB-specific claims
        console.log('Signing token...');
        const token = jwt.sign(
            {
                sub: userId,                           // Standard JWT subject claim
                '_couchdb.roles': [`user_${safeUserId}`], // CouchDB role for per-user DB access
            },
            COUCHDB_JWT_SECRET,
            {
                algorithm: 'HS256',
                expiresIn: TOKEN_EXPIRY_SECONDS,
                keyid: 'zakapp_v1'
            }
        );
        console.log('Token signed.');

        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString();

        console.log(`🔑 Issued CouchDB JWT for user ${safeUserId} (expires: ${expiresAt})`);

        res.json({
            token,
            expiresAt,
            userId: safeUserId,
            databases: [
                `zakapp_${safeUserId}_assets`,
                `zakapp_${safeUserId}_nisab_year_records`,
                `zakapp_${safeUserId}_payment_records`
            ]
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
