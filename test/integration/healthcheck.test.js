import getTestServer from './getTestServer.js'

describe('/healthcheck route', () => {
  it('responds with 200', async () => {
    const server = getTestServer()

    const response = await server.inject('/healthcheck')

    expect(response.statusCode).toBe(200)
  })
})
