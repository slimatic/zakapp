/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

import fetch from 'node-fetch';
import { Logger } from './logger';

const logger = new Logger('CouchStats');

const COUCHDB_URL = process.env.COUCHDB_URL || 'http://couchdb:5984';
const COUCHDB_USER = process.env.COUCHDB_USER || 'admin';
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || 'password';

interface CouchDBStats {
    doc_count: number;
    disk_size: number;
}

export const getCouchDBStats = async (dbName: string): Promise<CouchDBStats> => {
    try {
        const auth = Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64');
        const response = await fetch(`${COUCHDB_URL}/${dbName}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // If DB doesn't exist, return 0 stats
            return { doc_count: 0, disk_size: 0 };
        }

        const data: any = await response.json();
        return {
            doc_count: data.doc_count || 0,
            disk_size: data.sizes?.active || 0
        };
    } catch (error) {
        logger.warn(`Failed to fetch stats for ${dbName}: ${error instanceof Error ? error.message : String(error)}`);
        return { doc_count: 0, disk_size: 0 };
    }
};

export const getUserCouchDBStats = async (userId: string) => {
    // Sanitize userId as per CouchDB naming conventions used in SyncService
    const safeUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Core collections
    const collections = ['assets', 'liabilities', 'nisab_year_records', 'payment_records'];
    const stats: Record<string, number> = {};

    await Promise.all(collections.map(async (col) => {
        const dbName = `zakapp_${safeUserId}_${col}`;
        const data = await getCouchDBStats(dbName);
        stats[col] = data.doc_count;
    }));

    return {
        assets: stats['assets'] || 0,
        liabilities: stats['liabilities'] || 0,
        nisabRecords: stats['nisab_year_records'] || 0,
        payments: stats['payment_records'] || 0
    };
};
