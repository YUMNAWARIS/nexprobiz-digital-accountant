/** @type {import('jest').Config} */
const common = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', isolatedModules: true }] },
};
module.exports = {
  projects: [
    { ...common, displayName: 'unit', testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'] },
    {
      ...common,
      displayName: 'integration',
      testMatch: ['<rootDir>/test/**/*.test.ts'],
      globalSetup: '<rootDir>/test/setup/global-setup.ts',
      globalTeardown: '<rootDir>/test/setup/global-teardown.ts',
      setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],
    },
  ],
};
