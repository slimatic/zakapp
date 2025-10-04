// Mock process.exit to prevent tests from killing Jest
const originalExit = process.exit;

// Store original process.exit and override it
process.exit = ((code) => {
  if (code !== 0) {
    console.error(`process.exit(${code}) was called but prevented in test environment`);
  }
  // Don't actually exit in tests
  return undefined;
}) ;

// Restore console methods if needed
global.console = {
  ...console,
  // Keep console methods working but add test-friendly behavior
  error: jest.fn((...args) => {
    // Still output to stderr in tests if needed
    originalConsole.error(...args);
  }),
};

const originalConsole = { ...console };
