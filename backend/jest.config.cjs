module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/accessibility/', '/tests/e2e/'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@zakapp/shared$': '<rootDir>/../shared/src/index.ts',
    '^uuid$': '<rootDir>/../server/node_modules/uuid/dist/index.js',
  },
  transformIgnorePatterns: ['node_modules/(?!(@zakapp/shared|uuid|@prisma/client)/)'],
  collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testTimeout: 15000,
  maxWorkers: process.env.CI ? '50%' : undefined,
};
