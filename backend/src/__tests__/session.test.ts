import fs from 'fs-extra';
import path from 'path';
import {
  updateSessionActivity,
  getSession,
  createSession,
  deleteSession,
  initializeSessions,
} from '../utils/session.js';

// Test database cleanup
const TEST_DATA_DIR = path.join(process.cwd(), 'data_test_session');
const TEST_SESSIONS_DIR = path.join(TEST_DATA_DIR, 'sessions');

beforeAll(async () => {
  // Set up test data directory
  process.env.DATA_DIR = TEST_DATA_DIR;
  await initializeSessions();
});

afterAll(async () => {
  // Clean up test data
  if (await fs.pathExists(TEST_DATA_DIR)) {
    await fs.remove(TEST_DATA_DIR);
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  if (await fs.pathExists(TEST_SESSIONS_DIR)) {
    await fs.remove(TEST_SESSIONS_DIR);
  }
  await fs.ensureDir(TEST_SESSIONS_DIR);
});

describe('Session Management', () => {
  const testUser = {
    userId: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com',
  };

  describe('createSession', () => {
    it('should create a valid session file', async () => {
      await createSession(testUser);

      const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUser.userId}.json`);
      expect(await fs.pathExists(sessionPath)).toBe(true);

      const sessionData = await fs.readJson(sessionPath);
      expect(sessionData.userId).toBe(testUser.userId);
      expect(sessionData.username).toBe(testUser.username);
      expect(sessionData.email).toBe(testUser.email);
      expect(sessionData.createdAt).toBeDefined();
      expect(sessionData.lastActivity).toBeDefined();
    });
  });

  describe('updateSessionActivity', () => {
    it('should update session activity for valid session file', async () => {
      await createSession(testUser);
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await updateSessionActivity(testUser.userId);

      const sessionData = await getSession(testUser.userId);
      expect(sessionData).not.toBeNull();
      expect(new Date(sessionData!.lastActivity).getTime()).toBeGreaterThan(
        new Date(sessionData!.createdAt).getTime()
      );
    });

    it('should handle non-existent session files gracefully', async () => {
      // Should not throw error for non-existent file
      await expect(updateSessionActivity('non-existent-user')).resolves.not.toThrow();
    });

    it('should handle malformed JSON session files gracefully', async () => {
      const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUser.userId}.json`);
      
      // Create a malformed JSON file (empty)
      await fs.writeFile(sessionPath, '');
      
      // Should not throw error and should handle gracefully
      await expect(updateSessionActivity(testUser.userId)).resolves.not.toThrow();
    });

    it('should handle incomplete JSON session files gracefully', async () => {
      const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUser.userId}.json`);
      
      // Create an incomplete JSON file
      await fs.writeFile(sessionPath, '{"userId": "test-user-123", "username":');
      
      // Should not throw error and should handle gracefully
      await expect(updateSessionActivity(testUser.userId)).resolves.not.toThrow();
    });

    it('should recover from corrupted session file by removing it', async () => {
      const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUser.userId}.json`);
      
      // Create a malformed JSON file
      await fs.writeFile(sessionPath, 'invalid json content');
      
      // Update session activity should handle this gracefully (logs warning and removes file)
      await updateSessionActivity(testUser.userId);
      
      // File should be removed and subsequent operations should return null
      const sessionData = await getSession(testUser.userId);
      expect(sessionData).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return session data for valid session file', async () => {
      await createSession(testUser);

      const sessionData = await getSession(testUser.userId);
      expect(sessionData).not.toBeNull();
      expect(sessionData!.userId).toBe(testUser.userId);
      expect(sessionData!.username).toBe(testUser.username);
      expect(sessionData!.email).toBe(testUser.email);
    });

    it('should return null for non-existent session file', async () => {
      const sessionData = await getSession('non-existent-user');
      expect(sessionData).toBeNull();
    });

    it('should return null for malformed JSON session files', async () => {
      const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUser.userId}.json`);
      
      // Create a malformed JSON file
      await fs.writeFile(sessionPath, 'invalid json');
      
      const sessionData = await getSession(testUser.userId);
      expect(sessionData).toBeNull();
    });

    it('should return null for empty session files', async () => {
      const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUser.userId}.json`);
      
      // Create an empty file
      await fs.writeFile(sessionPath, '');
      
      const sessionData = await getSession(testUser.userId);
      expect(sessionData).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session file', async () => {
      await createSession(testUser);
      
      const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUser.userId}.json`);
      expect(await fs.pathExists(sessionPath)).toBe(true);

      await deleteSession(testUser.userId);
      expect(await fs.pathExists(sessionPath)).toBe(false);
    });

    it('should handle deletion of non-existent session file gracefully', async () => {
      await expect(deleteSession('non-existent-user')).resolves.not.toThrow();
    });
  });
});