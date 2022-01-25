// since node-fetch is no longer CJS compliant (see https://github.com/node-fetch/node-fetch#commonjs)
// we can just mock it globally
jest.mock('node-fetch', () => jest.fn())
