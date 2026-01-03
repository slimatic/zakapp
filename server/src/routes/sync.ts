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
 * Sync Routes - CouchDB JWT Token Endpoint
 * 
 * Provides JWT tokens for authenticated users to sync with CouchDB.
 * Tokens contain user-specific roles for per-user database isolation.
 * 
 * @architect Security: Tokens expire in 1 hour, auto-refresh on client
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { syncService } from '../services/SyncService';

const router = Router();

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
        if (!syncService.isConfigured()) {
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

        // Use SyncService to ensure user and databases
        const result = await syncService.ensureUserAndDatabases(userId);

        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString();

        console.log(`🔑 Issued CouchDB credentials for user ${result.username}`);

        res.json({
            // Basic Auth credentials
            credentials: {
                username: result.username,
                password: result.password
            },
            expiresAt,
            userId: userId,
            databases: result.databases
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
    const configured = syncService.isConfigured();
    const couchDbUrl = process.env.COUCHDB_URL || process.env.REACT_APP_COUCHDB_URL;

    res.json({
        jwtConfigured: configured,
        couchDbUrl: couchDbUrl ? 'configured' : 'not configured',
        expirySeconds: TOKEN_EXPIRY_SECONDS
    });
});

/**
 * DELETE /api/sync/purge
 * 
 * Secure Remote Purge:
 * Deletes all user databases and the user document from CouchDB.
 * This ensures data is "gone" from the cloud, satisfying privacy requirements.
 * Data remains on the local client unless cleared there too.
 */
router.delete('/purge', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    console.log('Purge sync data endpoint called');
    try {
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log(`🗑️ PURGE REQUEST for user: ${user.id} (${user.email})`);

        // This is the "Secure Remote Purge" - authoritative deletion from CouchDB
        await syncService.deleteUser(user.id);

        console.log(`✅ Data purged for user ${user.id}`);

        res.json({
            success: true,
            message: 'All cloud data and sync account have been purged.'
        });

    } catch (error: any) {
        console.error('Failed to purge sync data:', error);
        res.status(500).json({
            error: 'Failed to purge data',
            message: error.message
        });
    }
});

export default router;
