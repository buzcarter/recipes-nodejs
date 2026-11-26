const { resolve } = require('path');

module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/**/*.js',
  ],
  coveragePathIgnorePatterns: [
    '/__tests__/',
    '/data/',
  ],
  coverageReporters: [
    'lcov',
    'text',
    'text-summary',
  ],
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 40,
      functions: 40,
      lines: 40,
    },
  },
  rootDir: resolve(__dirname, '../'),
  setupFiles: ['<rootDir>/.jest/jest.setup.cjs'],
  setupFilesAfterEnv: [],
  // run tests as native ES modules, no Babel (`npm test` passes --experimental-vm-modules)
  transform: {},
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.js',
  ],
};
