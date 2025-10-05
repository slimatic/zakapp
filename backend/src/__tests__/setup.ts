// Global test setup
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { userService } from '../services/userService';

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up test data directories before each test
beforeEach(async () => {
  // Reset userService state to ensure clean state between tests
  userService.reset();
  
  // Clean up all test data directories if they exist
  // This ensures complete test isolation
  const testDataDirs = [
    path.join(process.cwd(), 'data_test'),
    path.join(process.cwd(), 'data_test_zakat'),
    path.join(process.cwd(), 'data_test_auth'),
    path.join(process.cwd(), 'data_test_assets'),
    path.join(process.cwd(), 'data_test_corruption'),
    path.join(process.cwd(), 'data_test_enoent'),
  ];
  
  for (const dir of testDataDirs) {
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
    }
  }
});

// Clean up after all tests complete
afterAll(async () => {
  const testDataDirs = [
    path.join(process.cwd(), 'data_test'),
    path.join(process.cwd(), 'data_test_zakat'),
    path.join(process.cwd(), 'data_test_auth'),
    path.join(process.cwd(), 'data_test_assets'),
    path.join(process.cwd(), 'data_test_corruption'),
    path.join(process.cwd(), 'data_test_enoent'),
  ];
  
  for (const dir of testDataDirs) {
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
    }
  }
});
