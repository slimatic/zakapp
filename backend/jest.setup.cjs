// Store original console before mocking
const originalConsole = { ...console };

// Mock process.exit to prevent tests from killing Jest
process.exit = ((code) => {
  if (code !== 0) {
    originalConsole.error(`process.exit(${code}) was called but prevented in test environment`);
  }
  // Don't actually exit in tests
  return undefined;
});
