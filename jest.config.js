export default {
  collectCoverage: true,
  setupFiles: ['./.jest/env.js'],
  clearMocks: true,
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 63,
    },
  },
}
