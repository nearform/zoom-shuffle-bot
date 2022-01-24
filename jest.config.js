export default {
  setupFiles: ['./.jest/env.js'],
  clearMocks: true,
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
}
