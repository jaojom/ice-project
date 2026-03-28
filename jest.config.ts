import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  testMatch: ['**/tests/(unit|integration)/**/*.test.ts'],
  forceExit: true,
  testTimeout: 15000,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        strict: true,
        esModuleInterop: true,
        rootDir: '.',
      },
    }],
  },
};

export default config;
