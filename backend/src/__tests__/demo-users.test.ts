import request from 'supertest';
import app from '../index.js';
import { userService } from '../services/userService.js';
import fs from 'fs-extra';
import path from 'path';

// Test database cleanup
const TEST_DATA_DIR = path.join(process.cwd(), 'data_test_demo');

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

describe('Demo User Management', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    if (await fs.pathExists(TEST_DATA_DIR)) {
      await fs.remove(TEST_DATA_DIR);
    }
    // Reset userService
    (userService as any).initialized = false;
    (userService as any).userIndex = {};
  });

  describe('Demo User Detection', () => {
    it('should identify demo users correctly', () => {
      expect(userService.isDemoUser('john_doe')).toBe(true);
      expect(userService.isDemoUser('JOHN_DOE')).toBe(true);
      expect(userService.isDemoUser('demo')).toBe(true);
      expect(userService.isDemoUser('demo_user')).toBe(true);
      expect(userService.isDemoUser('test_user')).toBe(true);
      expect(userService.isDemoUser('regular_user')).toBe(false);
      expect(userService.isDemoUser('john')).toBe(false);
    });

    it('should prevent demo user authentication', async () => {
      // Try to authenticate with demo username
      const user = await userService.authenticateUser('john_doe', 'any_password');
      expect(user).toBeNull();
    });
  });

  describe('Demo Status Endpoint', () => {
    it('should return demo status when no demo users exist', async () => {
      const response = await request(app)
        .get('/api/v1/auth/demo-status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasDemoUsers).toBe(false);
      expect(response.body.data.demoUsers).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });

    it('should identify demo users if they exist in the system', async () => {
      // Initialize the service first
      await userService.initialize();
      
      // Manually add a demo user to the index (simulating legacy data)
      (userService as any).userIndex['john_doe'] = 'fake-user-id';
      
      const response = await request(app)
        .get('/api/v1/auth/demo-status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasDemoUsers).toBe(true);
      expect(response.body.data.demoUsers).toContain('john_doe');
      expect(response.body.data.count).toBe(1);
    });
  });

  describe('Demo User Removal', () => {
    it('should handle removal when no demo users exist', async () => {
      const response = await request(app)
        .delete('/api/v1/auth/demo-users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('No demo users found to remove');
      expect(response.body.data.removed).toEqual([]);
      expect(response.body.data.errors).toEqual([]);
    });

    it('should remove demo users from index', async () => {
      // Initialize the service first
      await userService.initialize();
      
      // Manually add demo users to the index
      (userService as any).userIndex['john_doe'] = 'fake-user-id-1';
      (userService as any).userIndex['demo'] = 'fake-user-id-2';
      
      const response = await request(app)
        .delete('/api/v1/auth/demo-users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Removed 2 demo user(s)');
      expect(response.body.data.removed).toEqual(expect.arrayContaining(['john_doe', 'demo']));
      expect(response.body.data.errors).toEqual([]);
    });
  });

  describe('Authentication Prevention', () => {
    it('should prevent login attempts with demo usernames', async () => {
      const demoUsernames = ['john_doe', 'demo', 'demo_user', 'test_user'];
      
      for (const username of demoUsernames) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: username,
            password: 'any_password'
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      }
    });
  });
});