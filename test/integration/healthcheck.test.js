import { test, describe } from 'node:test'
import getTestServer from './getTestServer.js'

describe('/healthcheck route', () => {
  test('responds with 200', async t => {
    const server = getTestServer()

    const response = await server.inject('/healthcheck')

    t.assert.strictEqual(response.statusCode, 200)
  })
})
