module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: __dirname,
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts?(x)'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  // Apply DB migrations before tests run so integration tests have the expected schema
  globalSetup: '<rootDir>/test/globalSetup.ts',
  // Optionally teardown / cleanup after tests
  globalTeardown: '<rootDir>/test/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  testTimeout: 30000
};
