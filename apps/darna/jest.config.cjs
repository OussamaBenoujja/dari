module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.src.json' }]
  },
  testMatch: ['**/src/tests/**/*.test.ts']
};