import fs from 'fs-extra';
import path from 'path';

// Set up test data directory BEFORE importing session module
const TEST_DATA_DIR = path.join(process.cwd(), 'data_test_corruption');
const TEST_SESSIONS_DIR = path.join(TEST_DATA_DIR, 'sessions');
process.env.DATA_DIR = TEST_DATA_DIR;

import {
  updateSessionActivity,
  getSession,
  initializeSessions,
} from '../utils/session.js';

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
  // Clean up test data before each test and ensure fresh environment
  if (await fs.pathExists(TEST_DATA_DIR)) {
    await fs.remove(TEST_DATA_DIR);
  }
  await fs.ensureDir(TEST_SESSIONS_DIR);
  
  // Clear any potential module-level caches
  jest.clearAllMocks();
});

describe('Session Corruption Handling', () => {
  const testUserId = 'corrupt-test-user';

  it('should handle empty JSON file gracefully', async () => {
    const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUserId}.json`);
    
    // Create an empty file
    await fs.writeFile(sessionPath, '');
    
    // Test getSession - should return null and remove corrupted file
    const sessionData = await getSession(testUserId);
    expect(sessionData).toBeNull();
    
    // File should be removed
    expect(await fs.pathExists(sessionPath)).toBe(false);
  });

  it('should handle malformed JSON file gracefully', async () => {
    const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUserId}.json`);
    
    // Create a malformed JSON file
    await fs.writeFile(sessionPath, '{"incomplete": "json"');
    
    // Test getSession - should return null and remove corrupted file
    const sessionData = await getSession(testUserId);
    expect(sessionData).toBeNull();
    
    // File should be removed
    expect(await fs.pathExists(sessionPath)).toBe(false);
  });

  it('should handle updateSessionActivity with corrupted file', async () => {
    const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUserId}.json`);
    
    // Create a corrupted JSON file
    await fs.writeFile(sessionPath, 'invalid json content');
    
    // updateSessionActivity should handle this gracefully
    await expect(updateSessionActivity(testUserId)).resolves.not.toThrow();
    
    // File should be removed
    expect(await fs.pathExists(sessionPath)).toBe(false);
  });

  it('should handle valid JSON file normally', async () => {
    const sessionPath = path.join(TEST_SESSIONS_DIR, `${testUserId}.json`);
    
    // Create a valid session file
    const validSession = {
      userId: testUserId,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
    await fs.writeJson(sessionPath, validSession, { spaces: 2 });
    
    // Test getSession - should return the session data
    const sessionData = await getSession(testUserId);
    expect(sessionData).not.toBeNull();
    expect(sessionData!.userId).toBe(testUserId);
    
    // File should still exist
    expect(await fs.pathExists(sessionPath)).toBe(true);
  });
});