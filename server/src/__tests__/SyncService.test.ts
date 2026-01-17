import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { SyncService } from '../services/SyncService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('SyncService', () => {
    let syncService: SyncService;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.COUCHDB_URL = 'http://localhost:5984';
        process.env.COUCHDB_USER = 'admin';
        process.env.COUCHDB_PASSWORD = 'password';
        process.env.COUCHDB_JWT_SECRET = 'test-secret';
        syncService = new SyncService();
    });

    describe('ensureUserAndDatabases', () => {
        it('should create user and databases if they do not exist', async () => {
            const userId = 'test-user';

            // Mock user check (404)
            mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });
            // Mock user creation
            mockedAxios.put.mockResolvedValueOnce({ data: { ok: true } });
            // Mock database check (404) for all 5 databases
            mockedAxios.head.mockRejectedValue({ response: { status: 404 } });
            // Mock database creation and security
            mockedAxios.put.mockResolvedValue({ data: { ok: true } });

            const result = await syncService.ensureUserAndDatabases(userId);

            expect(result.username).toBe('user_test_user');
            expect(result.databases).toHaveLength(5);
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
            expect(mockedAxios.put).toHaveBeenCalled(); // Many puts for DBs and security
        });

        it('should handle existing user by updating with revision', async () => {
            const userId = 'test-user';

            // Mock user check (exists)
            mockedAxios.get.mockResolvedValueOnce({ data: { _rev: '1-old' } });
            // Mock user update
            mockedAxios.put.mockResolvedValueOnce({ data: { ok: true } });
            // Mock database check (exists)
            mockedAxios.head.mockResolvedValue({ status: 200 });

            await syncService.ensureUserAndDatabases(userId);

            expect(mockedAxios.put).toHaveBeenCalledWith(
                expect.stringContaining('org.couchdb.user:user_test_user'),
                expect.objectContaining({ _rev: '1-old' }),
                expect.anything()
            );
        });
    });

    describe('deleteUser', () => {
        it('should delete all user databases and the user document', async () => {
            const userId = 'test-user';

            // Mock database deletions
            mockedAxios.delete.mockResolvedValue({ data: { ok: true } });
            // Mock user fetch for rev
            mockedAxios.get.mockResolvedValueOnce({ data: { _rev: '1-rev' } });
            // Mock user deletion
            mockedAxios.delete.mockResolvedValueOnce({ data: { ok: true } });

            await syncService.deleteUser(userId);

            // 5 databases + 1 user deletion = 6 deletions
            expect(mockedAxios.delete).toHaveBeenCalledTimes(6);
        });

        it('should handle already deleted databases gracefully', async () => {
            const userId = 'test-user';

            mockedAxios.delete.mockRejectedValue({ response: { status: 404 } });
            mockedAxios.get.mockRejectedValue({ response: { status: 404 } });

            await expect(syncService.deleteUser(userId)).resolves.not.toThrow();
        });
    });
});
