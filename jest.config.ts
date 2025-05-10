import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  // Specify the test environment as Node
  testEnvironment: 'node',

  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true, // Enable ES Module support
      },
    ],
  },

  // Specify test file patterns to include TypeScript files in src/
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],

  // Ignore compiled output in dist/
  testPathIgnorePatterns: ['/dist/'],

  // Enable ES Modules support
  extensionsToTreatAsEsm: ['.ts'],

  // Optional: Ignore node_modules except for specific packages if needed
  transformIgnorePatterns: ['/node_modules/'],

  // Optional: Ensure module resolution aligns with TypeScript
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Handle .js extensions in imports
  },
}

export default config
