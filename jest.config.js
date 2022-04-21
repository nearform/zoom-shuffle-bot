export default {
  collectCoverage: true,
  setupFiles: ['./.jest/env.js', './.jest/mocks.js'],
  clearMocks: true,
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  coverageThreshold: {
    global: {
      branches: 58,
      functions: 63,
    },
  },
}
