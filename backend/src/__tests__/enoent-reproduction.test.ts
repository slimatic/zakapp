import fs from 'fs-extra';
import path from 'path';

// Set up test data directory BEFORE importing session module
const TEST_DATA_DIR = path.join(process.cwd(), 'data_test_enoent');
const TEST_SESSIONS_DIR = path.join(TEST_DATA_DIR, 'sessions');
process.env.DATA_DIR = TEST_DATA_DIR;

import {
  updateSessionActivity,
  createSession,
} from '../utils/session.js';

beforeAll(async () => {
  // Set up test data directory
  process.env.DATA_DIR = TEST_DATA_DIR;
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

describe('ENOENT Error Reproduction', () => {
  const testUserId = 'enoent-test-user';
  
  it('should handle missing sessions directory gracefully', async () => {
    const testUser = {
      userId: testUserId,
      username: 'testuser',
      email: 'test@example.com',
    };

    // Remove the sessions directory to simulate the missing directory scenario
    await fs.remove(TEST_SESSIONS_DIR);
    
    // This should recreate the directory and handle gracefully
    await expect(createSession(testUser)).resolves.not.toThrow();
    
    // Verify session was created successfully
    expect(await fs.pathExists(path.join(TEST_SESSIONS_DIR, `${testUserId}.json`))).toBe(true);
  });

  it('should handle session directory removal during update', async () => {
    const testUser = {
      userId: testUserId,
      username: 'testuser',
      email: 'test@example.com',
    };

    // Create a session first
    await createSession(testUser);
    
    // Simulate directory removal between session check and update
    await fs.remove(TEST_SESSIONS_DIR);
    
    // This should handle gracefully and not throw ENOENT
    await expect(updateSessionActivity(testUserId)).resolves.not.toThrow();
  });

  it('should handle parallel session updates without race conditions', async () => {
    const testUser = {
      userId: testUserId,
      username: 'testuser', 
      email: 'test@example.com',
    };

    // Create a session first
    await createSession(testUser);
    
    // Run multiple parallel updates that could cause race conditions
    const promises = Array.from({ length: 10 }, () => 
      updateSessionActivity(testUserId)
    );
    
    // None of these should throw unhandled errors (ENOENT errors are now handled gracefully)
    const results = await Promise.allSettled(promises);
    
    // All promises should resolve (not reject with unhandled errors)
    results.forEach(result => {
      expect(result.status).toBe('fulfilled');
    });
  });

  it('should handle temp file cleanup on write failure', async () => {
    const testUser = {
      userId: testUserId,
      username: 'testuser',
      email: 'test@example.com',
    };

    // Create a session first
    await createSession(testUser);
    
    // Make sessions directory read-only to force write failure
    await fs.chmod(TEST_SESSIONS_DIR, 0o444);
    
    try {
      // This should handle failure gracefully and clean up temp files
      await updateSessionActivity(testUserId);
      
      // Verify no temp files are left behind
      const files = await fs.readdir(TEST_SESSIONS_DIR);
      const tempFiles = files.filter(file => file.endsWith('.tmp'));
      expect(tempFiles).toHaveLength(0);
    } finally {
      // Restore permissions for cleanup
      await fs.chmod(TEST_SESSIONS_DIR, 0o755);
    }
  });
});