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
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const COUCHDB_JWT_SECRET = process.env.COUCHDB_JWT_SECRET;
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
    try {
        if (!COUCHDB_JWT_SECRET) {
            console.error('COUCHDB_JWT_SECRET not configured');
            return res.status(500).json({
                error: 'Sync not configured',
                message: 'Server missing COUCHDB_JWT_SECRET environment variable'
            });
        }

        // Get user from auth middleware
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userId = user.id;

        // Sanitize userId for CouchDB database naming (lowercase, alphanumeric + underscore)
        const safeUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');

        // Generate JWT with CouchDB-specific claims
        const token = jwt.sign(
            {
                sub: userId,                           // Standard JWT subject claim
                '_couchdb.roles': [`user_${safeUserId}`], // CouchDB role for per-user DB access
            },
            COUCHDB_JWT_SECRET,
            {
                algorithm: 'HS256',
                expiresIn: TOKEN_EXPIRY_SECONDS
            }
        );

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
