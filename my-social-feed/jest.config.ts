import type { Config } from 'jest';
// Explicit .js: Node 24 loads this file as native ESM (type stripping), which
// needs the real filename since next has no export map for this subpath.
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Files starting with an underscore are shared test helpers, not suites.
  testPathIgnorePatterns: ['/node_modules/', '/\\.next/', '/__tests__/.*/_[^/]+\\.tsx?$'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Phaser's WebGL renderer optionally requires phaser3spectorjs; stub it
    // in tests so importing Phaser doesn't blow up in jsdom.
    '^phaser3spectorjs$': '<rootDir>/__mocks__/phaser3spectorjs.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/app/layout.tsx',
  ],
  // text-summary for the terminal, json-summary for CI's run summary, html to
  // browse locally (coverage/index.html). All under coverage/, gitignored.
  // lcov: read by SonarQube Cloud (sonar-project.properties, item 18).
  coverageReporters: ['text-summary', 'json-summary', 'html', 'lcov'],
  // Floor, not target. Measured 2026-10-05: 88.5 statements / 83.0 branches /
  // 85.1 functions / 90.4 lines. Raise these as coverage grows; never lower
  // them. Each floor sits about a point under the measurement: coverage of a
  // few timer-dependent functions varies slightly between runs.
  coverageThreshold: {
    global: { statements: 87, branches: 82, functions: 84, lines: 89 },
  },
};

export default createJestConfig(config);
