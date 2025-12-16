// Test setup executed after environment initialization but before tests run
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Increase default timeout for integration tests that may perform DB operations
jest.setTimeout(30000);

// Optionally silence noisy logs during test runs
// e.g., set LOG_LEVEL to warn in test env if desired
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn';

export {};
