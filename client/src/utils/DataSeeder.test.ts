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
