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

import { DataSeeder } from './DataSeeder';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Create mock objects
const mockBulkInsert = vi.fn().mockResolvedValue({ success: [], error: [] });
const mockRemove = vi.fn();
const mockFind = vi.fn(() => ({ remove: mockRemove }));

// Mock the db module
vi.mock('../db', () => ({
    getDb: vi.fn().mockResolvedValue({
        assets: {
            find: () => mockFind(),
            bulkInsert: (docs: any) => mockBulkInsert(docs)
        },
        payment_records: {
            find: () => mockFind(),
            bulkInsert: (docs: any) => mockBulkInsert(docs)
        },
        nisab_year_records: {
            find: () => mockFind(),
            bulkInsert: (docs: any) => mockBulkInsert(docs)
        }
    })
}));

describe('DataSeeder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBulkInsert.mockResolvedValue({ success: Array(10).fill({}), error: [] });
    });

    it('should seed assets', async () => {
        await DataSeeder.seedAssets(10);
        expect(mockBulkInsert).toHaveBeenCalledTimes(1);
        const args = mockBulkInsert.mock.calls[0][0];
        expect(args[0]).toHaveProperty('metadata'); // Metadata is now expected (e.g. seed timestamp)
        expect(args[0]).toHaveProperty('value');
    });

    it('should throw error on failure', async () => {
        mockBulkInsert.mockResolvedValueOnce({ success: [], error: [{ message: 'Schema failure' }] });
        await expect(DataSeeder.seedAssets(1)).rejects.toThrow();
    });
});
