export default {
  setupFiles: ['./.jest/env.js', './.jest/mocks.js'],
  clearMocks: true,
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
}
